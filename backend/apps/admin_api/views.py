from datetime import timedelta

from django.contrib.auth import get_user_model
from django.db.models import Q, Sum, Count, Avg
from django.db.models.functions import TruncDate
from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.users.models import ArtistProfile, ArtistApplication
from apps.artworks.models import Artwork, Category, DigitalFile
from apps.orders.models import Order, OrderItem
from apps.commissions.models import Commission
from apps.reviews.models import Review
from apps.users.permissions import IsAdmin

from .serializers import (
    AdminApplicationSerializer,
    AdminArtworkSerializer,
    AdminCategorySerializer,
    AdminCreateVendorSerializer,
    AdminOrderSerializer,
    AdminOrderDetailSerializer,
    AdminUserDetailSerializer,
    AdminUserSerializer,
)

User = get_user_model()


# ─── Stats ───────────────────────────────────────────────────────────────

@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdmin])
def admin_stats(request):
    total_users = User.objects.count()
    total_artists = User.objects.filter(artist_profile__status='approved').count()
    total_orders = Order.objects.exclude(status='cancelled').count()

    # Net revenue: money still held (paid, not cancelled). Refunded is already
    # a separate payment_status, so it never appears in this set.
    paid_qs = Order.objects.filter(payment_status='paid').exclude(status='cancelled')
    revenue_gross = paid_qs.aggregate(total=Sum('total'))['total'] or 0
    refunded_all = Order.objects.filter(payment_status='refunded').aggregate(total=Sum('total'))['total'] or 0
    cancelled_paid_total = (
        Order.objects.filter(payment_status='paid', status='cancelled').aggregate(total=Sum('total'))['total'] or 0
    )
    revenue = revenue_gross

    pending_applications = ArtistApplication.objects.filter(status='pending').count()
    pending_artworks = Artwork.objects.filter(status='pending_review').count()
    total_artworks = Artwork.objects.count()
    published_artworks = Artwork.objects.filter(status='published').count()
    total_categories = Category.objects.count()

    orders_by_status = {
        row['status']: row['c']
        for row in Order.objects.values('status').annotate(c=Count('id'))
    }

    recent_orders = AdminOrderSerializer(
        Order.objects.exclude(status='cancelled').select_related('customer').order_by('-created_at')[:8], many=True
    ).data

    recent_applications = AdminApplicationSerializer(
        ArtistApplication.objects.select_related('user').order_by('-created_at')[:5], many=True
    ).data

    week_ago = timezone.now() - timedelta(days=7)
    prev_week_start = week_ago - timedelta(days=7)
    new_users_7d = User.objects.filter(created_at__gte=week_ago).count()
    prev_users_7d = User.objects.filter(created_at__gte=prev_week_start, created_at__lt=week_ago).count()
    new_orders_7d = Order.objects.filter(created_at__gte=week_ago).count()
    prev_orders_7d = Order.objects.filter(created_at__gte=prev_week_start, created_at__lt=week_ago).count()
    revenue_7d = (
        paid_qs.filter(created_at__gte=week_ago).aggregate(total=Sum('total'))['total'] or 0
    )
    prev_revenue_7d = (
        paid_qs.filter(created_at__gte=prev_week_start, created_at__lt=week_ago).aggregate(total=Sum('total'))['total']
        or 0
    )

    def _pct(current, previous):
        current = float(current or 0)
        previous = float(previous or 0)
        if previous == 0:
            return None if current == 0 else 100.0
        return round(((current - previous) / previous) * 100.0, 1)

    deltas = {
        'users': {'current': new_users_7d, 'previous': prev_users_7d, 'pct': _pct(new_users_7d, prev_users_7d)},
        'orders': {'current': new_orders_7d, 'previous': prev_orders_7d, 'pct': _pct(new_orders_7d, prev_orders_7d)},
        'revenue': {
            'current': float(revenue_7d),
            'previous': float(prev_revenue_7d),
            'pct': _pct(revenue_7d, prev_revenue_7d),
        },
    }

    # 14-day daily trends (all orders by day + paid revenue by day)
    trend_start = timezone.now().date() - timedelta(days=13)
    day_map = {trend_start + timedelta(days=i): True for i in range(14)}
    orders_by_day = {
        r['day']: r['c']
        for r in Order.objects.filter(created_at__date__gte=trend_start)
        .annotate(day=TruncDate('created_at'))
        .values('day')
        .annotate(c=Count('id'))
    }
    revenue_by_day = {
        r['day']: float(r['rev'] or 0)
        for r in paid_qs.filter(created_at__date__gte=trend_start)
        .annotate(day=TruncDate('created_at'))
        .values('day')
        .annotate(rev=Sum('total'))
    }
    trends = [
        {
            'date': day.isoformat(),
            'orders': orders_by_day.get(day, 0),
            'revenue': revenue_by_day.get(day, 0.0),
        }
        for day in sorted(day_map.keys())
    ]

    # Payments by status (count + total)
    payments_by_status = {
        row['payment_status']: {
            'count': row['c'],
            'total': float(row['rev'] or 0),
        }
        for row in Order.objects.values('payment_status')
        .annotate(c=Count('id'), rev=Sum('total'))
    }

    month_ago = timezone.now() - timedelta(days=30)
    refund_row = Order.objects.filter(payment_status='refunded', created_at__gte=month_ago).aggregate(
        c=Count('id'), rev=Sum('total')
    )
    refunds_30d = {'count': refund_row['c'] or 0, 'total': float(refund_row['rev'] or 0)}

    commissions_by_status = {
        row['status']: row['c']
        for row in Commission.objects.values('status').annotate(c=Count('id'))
    }
    open_commission_statuses = ['pending', 'accepted', 'in_progress', 'delivered']
    open_commissions = Commission.objects.filter(status__in=open_commission_statuses).count()

    # Unified activity feed: merge recent events from several tables
    activity = []

    for o in Order.objects.select_related('customer').order_by('-created_at')[:6]:
        activity.append({
            'type': 'order',
            'title': f"Order #{str(o.id)[:8]}",
            'subtitle': f"{o.customer.username} · NPR {float(o.total):,.0f}",
            'status': o.status,
            'href': '/admin/orders',
            'created_at': o.created_at,
        })

    for a in ArtistApplication.objects.select_related('user').order_by('-created_at')[:5]:
        activity.append({
            'type': 'application',
            'title': f"Application · {a.user.username}",
            'subtitle': a.reason[:80] if a.reason else 'Artist application submitted',
            'status': a.status,
            'href': '/admin/applications',
            'created_at': a.created_at,
        })

    for w in Artwork.objects.select_related('artist').filter(status='pending_review').order_by('-created_at')[:5]:
        activity.append({
            'type': 'artwork',
            'title': w.title,
            'subtitle': f"by {w.artist.username} · pending review",
            'status': 'pending',
            'href': '/admin/artworks',
            'created_at': w.created_at,
        })

    for c in Commission.objects.select_related('customer', 'artist').order_by('-created_at')[:5]:
        activity.append({
            'type': 'commission',
            'title': c.title,
            'subtitle': f"{c.customer.username} → {c.artist.username}",
            'status': c.status,
            'href': None,
            'created_at': c.created_at,
        })

    for r in Review.objects.select_related('reviewer', 'artwork').order_by('-created_at')[:3]:
        activity.append({
            'type': 'review',
            'title': f"{r.rating}/5 review",
            'subtitle': f"{r.reviewer.username} on {r.artwork.title}" if r.artwork else r.reviewer.username,
            'status': None,
            'href': None,
            'created_at': r.created_at,
        })

    activity.sort(key=lambda x: x['created_at'], reverse=True)
    activity = activity[:14]
    for item in activity:
        item['created_at'] = item['created_at'].isoformat()

    return Response({
        'total_users': total_users,
        'total_artists': total_artists,
        'total_orders': total_orders,
        'revenue': float(revenue),
        'revenue_gross': float(revenue_gross),
        'revenue_refunded': float(refunded_all),
        'cancelled_paid_total': float(cancelled_paid_total),
        'pending_applications': pending_applications,
        'pending_artworks': pending_artworks,
        'total_artworks': total_artworks,
        'published_artworks': published_artworks,
        'total_categories': total_categories,
        'orders_by_status': orders_by_status,
        'new_users_7d': new_users_7d,
        'new_orders_7d': new_orders_7d,
        'recent_orders': recent_orders,
        'recent_applications': recent_applications,
        'deltas': deltas,
        'trends': trends,
        'payments_by_status': payments_by_status,
        'refunds_30d': refunds_30d,
        'commissions_by_status': commissions_by_status,
        'open_commissions': open_commissions,
        'activity': activity,
    })


# ─── Applications ────────────────────────────────────────────────────────

@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdmin])
def admin_applications_list(request):
    q = request.query_params.get('q', '')
    status_filter = request.query_params.get('status', '')

    qs = ArtistApplication.objects.select_related('user', 'reviewed_by').order_by('-created_at')
    if q:
        qs = qs.filter(Q(user__username__icontains=q) | Q(user__email__icontains=q))
    if status_filter:
        qs = qs.filter(status=status_filter)

    return Response(AdminApplicationSerializer(qs, many=True).data)


@api_view(['PUT'])
@permission_classes([IsAuthenticated, IsAdmin])
def admin_application_action(request, application_id):
    try:
        application = ArtistApplication.objects.get(id=application_id)
    except ArtistApplication.DoesNotExist:
        return Response({'error': 'Application not found'}, status=status.HTTP_404_NOT_FOUND)

    action = request.data.get('action')
    rejection_reason = request.data.get('rejection_reason', '')

    if action == 'approve':
        application.status = ArtistApplication.Status.APPROVED
        application.reviewed_by = request.user
        application.reviewed_at = timezone.now()
        application.save()

        profile, created = ArtistProfile.objects.get_or_create(
            user=application.user,
            defaults={
                'status': ArtistProfile.Status.APPROVED,
                'verified_badge': True,
                'bio': application.bio or '',
                'specialties': application.specialties or [],
                'social_links': application.social_links or {},
            }
        )
        if not created:
            profile.status = ArtistProfile.Status.APPROVED
            profile.verified_badge = True
            if application.bio:
                profile.bio = application.bio
            if application.specialties:
                profile.specialties = application.specialties
            if application.social_links:
                profile.social_links = application.social_links
            profile.save()

        from apps.core.email import send_artist_approved_email
        send_artist_approved_email(application.user)

        from apps.notifications.models import Notification
        from apps.notifications.utils import create_notification
        create_notification(
            recipient=application.user,
            actor=request.user,
            kind=Notification.Kind.APPLICATION_APPROVED,
            title='Artist application approved',
            body='Congratulations! Your artist application has been approved',
            link='/artist-application',
        )

        return Response({'message': 'Application approved'})

    elif action == 'reject':
        application.status = ArtistApplication.Status.REJECTED
        application.rejection_reason = rejection_reason
        application.reviewed_by = request.user
        application.reviewed_at = timezone.now()
        application.save()

        from apps.core.email import send_artist_rejected_email
        send_artist_rejected_email(application.user, rejection_reason)

        from apps.notifications.models import Notification
        from apps.notifications.utils import create_notification
        create_notification(
            recipient=application.user,
            actor=request.user,
            kind=Notification.Kind.APPLICATION_REJECTED,
            title='Artist application rejected',
            body=f'Your artist application was rejected: {rejection_reason or "no reason given"}',
            link='/artist-application',
        )

        return Response({'message': 'Application rejected'})

    return Response({'error': 'Invalid action'}, status=status.HTTP_400_BAD_REQUEST)


# ─── Artworks ────────────────────────────────────────────────────────────

@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdmin])
def admin_artworks_list(request):
    q = request.query_params.get('q', '')
    status_filter = request.query_params.get('status', '')
    type_filter = request.query_params.get('type', '')

    qs = Artwork.objects.select_related('artist', 'category').prefetch_related('images').order_by('-created_at')
    if q:
        qs = qs.filter(Q(title__icontains=q) | Q(artist__username__icontains=q))
    if status_filter:
        qs = qs.filter(status=status_filter)
    if type_filter:
        qs = qs.filter(type=type_filter)

    return Response(AdminArtworkSerializer(qs, many=True).data)


@api_view(['PUT'])
@permission_classes([IsAuthenticated, IsAdmin])
def admin_artwork_publish(request, artwork_id):
    try:
        artwork = Artwork.objects.get(id=artwork_id)
    except Artwork.DoesNotExist:
        return Response({'error': 'Artwork not found'}, status=status.HTTP_404_NOT_FOUND)

    if artwork.type == Artwork.Type.DIGITAL and not DigitalFile.objects.filter(artwork=artwork).exists():
        return Response(
            {'error': 'Cannot publish: digital file is missing. Ask the artist to upload it first.'},
            status=status.HTTP_400_BAD_REQUEST
        )

    artwork.status = Artwork.Status.PUBLISHED
    artwork.save()
    return Response({'message': 'Artwork published'})


@api_view(['PUT'])
@permission_classes([IsAuthenticated, IsAdmin])
def admin_artwork_reject(request, artwork_id):
    try:
        artwork = Artwork.objects.get(id=artwork_id)
    except Artwork.DoesNotExist:
        return Response({'error': 'Artwork not found'}, status=status.HTTP_404_NOT_FOUND)

    reason = request.data.get('reason', '').strip()
    if not reason:
        return Response({'error': 'Rejection reason is required'}, status=status.HTTP_400_BAD_REQUEST)

    artwork.status = Artwork.Status.DRAFT
    artwork.rejection_reason = reason
    artwork.save()
    return Response({'message': 'Artwork rejected'})


@api_view(['PUT'])
@permission_classes([IsAuthenticated, IsAdmin])
def admin_artwork_remove(request, artwork_id):
    try:
        artwork = Artwork.objects.get(id=artwork_id)
    except Artwork.DoesNotExist:
        return Response({'error': 'Artwork not found'}, status=status.HTTP_404_NOT_FOUND)

    artwork.status = Artwork.Status.REMOVED
    artwork.save()
    return Response({'message': 'Artwork removed'})


@api_view(['PUT'])
@permission_classes([IsAuthenticated, IsAdmin])
def admin_artwork_restore(request, artwork_id):
    try:
        artwork = Artwork.objects.get(id=artwork_id)
    except Artwork.DoesNotExist:
        return Response({'error': 'Artwork not found'}, status=status.HTTP_404_NOT_FOUND)

    artwork.status = Artwork.Status.PUBLISHED
    artwork.save()
    return Response({'message': 'Artwork restored'})


# ─── Categories ──────────────────────────────────────────────────────────

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated, IsAdmin])
def admin_categories_list(request):
    if request.method == 'GET':
        q = request.query_params.get('q', '')
        qs = Category.objects.prefetch_related('children', 'artworks').order_by('name')
        if q:
            qs = qs.filter(Q(name__icontains=q) | Q(slug__icontains=q))
        return Response(AdminCategorySerializer(qs, many=True).data)

    serializer = AdminCategorySerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['PUT', 'DELETE'])
@permission_classes([IsAuthenticated, IsAdmin])
def admin_category_detail(request, category_id):
    try:
        category = Category.objects.get(id=category_id)
    except Category.DoesNotExist:
        return Response({'error': 'Category not found'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'PUT':
        serializer = AdminCategorySerializer(category, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    elif request.method == 'DELETE':
        category.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# ─── Users ───────────────────────────────────────────────────────────────

@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdmin])
def admin_users_list(request):
    q = request.query_params.get('q', '')
    role_filter = request.query_params.get('role', '')

    qs = User.objects.annotate(artwork_count=Count('artworks')).order_by('-date_joined')
    if q:
        qs = qs.filter(Q(username__icontains=q) | Q(email__icontains=q))
    if role_filter:
        qs = qs.filter(role=role_filter)

    return Response(AdminUserSerializer(qs, many=True).data)


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdmin])
def admin_user_detail(request, user_id):
    try:
        user = User.objects.select_related('artist_profile').get(id=user_id)
    except User.DoesNotExist:
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
    return Response(AdminUserDetailSerializer(user).data)


@api_view(['PUT'])
@permission_classes([IsAuthenticated, IsAdmin])
def admin_user_deactivate(request, user_id):
    try:
        target_user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

    if target_user.role == User.Role.ADMIN:
        return Response({'error': 'Cannot deactivate admin users'}, status=status.HTTP_400_BAD_REQUEST)

    target_user.is_active = not target_user.is_active
    target_user.save()
    status_text = 'activated' if target_user.is_active else 'deactivated'
    return Response({'message': f'User {status_text}', 'is_active': target_user.is_active})


# ─── Orders ──────────────────────────────────────────────────────────────

@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdmin])
def admin_orders_list(request):
    q = request.query_params.get('q', '')
    status_filter = request.query_params.get('status', '')
    payment_status_filter = request.query_params.get('payment_status', '')

    qs = Order.objects.select_related('customer').order_by('-created_at')
    if q:
        qs = qs.filter(
            Q(customer__username__icontains=q) |
            Q(customer__email__icontains=q) |
            Q(id__icontains=q)
        )
    if status_filter:
        qs = qs.filter(status=status_filter)
    if payment_status_filter:
        qs = qs.filter(payment_status=payment_status_filter)

    return Response(AdminOrderSerializer(qs, many=True).data)


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdmin])
def admin_order_detail(request, order_id):
    try:
        order = Order.objects.select_related('customer', 'shipping_address').prefetch_related('items__artwork__images', 'items__shipment').get(id=order_id)
    except Order.DoesNotExist:
        return Response({'error': 'Order not found'}, status=status.HTTP_404_NOT_FOUND)
    return Response(AdminOrderDetailSerializer(order).data)


@api_view(['PUT'])
@permission_classes([IsAuthenticated, IsAdmin])
def admin_order_update(request, order_id):
    try:
        order = Order.objects.get(id=order_id)
    except Order.DoesNotExist:
        return Response({'error': 'Order not found'}, status=status.HTTP_404_NOT_FOUND)

    new_status = request.data.get('status')
    new_payment_status = request.data.get('payment_status')

    if new_status and new_status not in Order.Status.values:
        return Response({'error': 'Invalid order status'}, status=status.HTTP_400_BAD_REQUEST)

    if new_payment_status and new_payment_status not in Order.PaymentStatus.values:
        return Response({'error': 'Invalid payment status'}, status=status.HTTP_400_BAD_REQUEST)

    if new_status:
        order.status = new_status
    if new_payment_status:
        order.payment_status = new_payment_status

    order.save()
    return Response(AdminOrderDetailSerializer(order).data)


# ─── Vendor Management ────────────────────────────────────────────────────

import secrets
import string

from django.contrib.auth.hashers import make_password
from django.db import transaction
from apps.core.email import send_welcome_email
from .serializers import AdminCreateVendorSerializer


def _generate_password(length=14):
    alphabet = string.ascii_letters + string.digits + '!@#$%^&*'
    while True:
        pwd = ''.join(secrets.choice(alphabet) for _ in range(length))
        if (any(c.islower() for c in pwd)
                and any(c.isupper() for c in pwd)
                and any(c.isdigit() for c in pwd)
                and any(c in '!@#$%^&*' for c in pwd)):
            return pwd


@api_view(['POST'])
@permission_classes([IsAuthenticated, IsAdmin])
def admin_create_vendor(request):
    serializer = AdminCreateVendorSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    data = serializer.validated_data

    password = data.get('password') or ''
    temporary_password = None
    if not password:
        password = _generate_password()
        temporary_password = password

    with transaction.atomic():
        user = User.objects.create(
            username=data['username'],
            email=data['email'],
            password=make_password(password),
            first_name=data.get('first_name', ''),
            last_name=data.get('last_name', ''),
            role=User.Role.CUSTOMER,
        )

        ArtistProfile.objects.create(
            user=user,
            status=ArtistProfile.Status.APPROVED,
            verified_badge=True,
            bio=data.get('bio', ''),
            province=data.get('province', ''),
            district=data.get('district', ''),
            specialties=data.get('specialties') or [],
            commission_available=data.get('commission_available', False),
            commission_starting_price=data.get('commission_starting_price'),
        )

    send_welcome_email(user)

    payload = AdminUserSerializer(user).data
    if temporary_password:
        payload['temporary_password'] = temporary_password
    return Response(payload, status=status.HTTP_201_CREATED)
