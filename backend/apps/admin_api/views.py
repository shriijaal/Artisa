from django.contrib.auth import get_user_model
from django.db.models import Q, Sum, Count, Avg
from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.users.models import ArtistProfile, ArtistApplication
from apps.artworks.models import Artwork, Category
from apps.orders.models import Order, OrderItem
from apps.users.permissions import IsAdmin

from .serializers import (
    AdminApplicationSerializer,
    AdminArtworkSerializer,
    AdminCategorySerializer,
    AdminOrderSerializer,
    AdminUserSerializer,
)

User = get_user_model()


# ─── Stats ───────────────────────────────────────────────────────────────

@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdmin])
def admin_stats(request):
    total_users = User.objects.count()
    total_artists = User.objects.filter(artist_profile__status='approved').count()
    total_orders = Order.objects.count()
    revenue = Order.objects.filter(payment_status='paid').aggregate(total=Sum('total'))['total'] or 0
    pending_applications = ArtistApplication.objects.filter(status='pending').count()
    pending_artworks = Artwork.objects.filter(status='pending_review').count()
    total_artworks = Artwork.objects.count()
    total_categories = Category.objects.count()

    recent_orders = AdminOrderSerializer(
        Order.objects.order_by('-created_at')[:5], many=True
    ).data

    return Response({
        'total_users': total_users,
        'total_artists': total_artists,
        'total_orders': total_orders,
        'revenue': float(revenue),
        'pending_applications': pending_applications,
        'pending_artworks': pending_artworks,
        'total_artworks': total_artworks,
        'total_categories': total_categories,
        'recent_orders': recent_orders,
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
            defaults={'status': ArtistProfile.Status.APPROVED, 'verified_badge': True}
        )
        if not created:
            profile.status = ArtistProfile.Status.APPROVED
            profile.verified_badge = True
            profile.save()

        from apps.core.email import send_artist_approved_email
        send_artist_approved_email(application.user)

        return Response({'message': 'Application approved'})

    elif action == 'reject':
        application.status = ArtistApplication.Status.REJECTED
        application.rejection_reason = rejection_reason
        application.reviewed_by = request.user
        application.reviewed_at = timezone.now()
        application.save()

        from apps.core.email import send_artist_rejected_email
        send_artist_rejected_email(application.user, rejection_reason)

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

    artwork.status = Artwork.Status.DRAFT
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

    qs = Order.objects.select_related('customer').order_by('-created_at')
    if q:
        qs = qs.filter(
            Q(customer__username__icontains=q) |
            Q(customer__email__icontains=q) |
            Q(id__icontains=q)
        )
    if status_filter:
        qs = qs.filter(status=status_filter)

    return Response(AdminOrderSerializer(qs, many=True).data)
