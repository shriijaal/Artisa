import logging

from django.utils import timezone
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.commissions.models import Commission, CommissionDeliverable, CommissionReferenceImage
from apps.commissions.serializers import (
    CommissionCreateSerializer,
    CommissionDetailSerializer,
    CommissionDeliverableCreateSerializer,
    CommissionDeliverableSerializer,
    CommissionListSerializer,
    CommissionReferenceUploadSerializer,
    CommissionStatusSerializer,
)
from apps.core.email import (
    send_new_commission_email,
    send_commission_accepted_email,
    send_commission_started_email,
    send_commission_declined_email,
    send_commission_delivered_email,
    send_commission_completed_email,
    send_commission_revision_email,
    send_commission_cancelled_email,
)

logger = logging.getLogger(__name__)


class CommissionCreateView(APIView):
    """POST /api/commissions/ — Customer creates a commission request."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = CommissionCreateSerializer(data=request.data, context={'request': request})
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        commission = serializer.save()

        # Log commission interaction for the artist being commissioned
        try:
            from apps.recs.utils import log_interaction
            log_interaction(
                user=request.user,
                target_type='artist',
                target_id=commission.artist_id,
                interaction_type='commission',
            )
        except Exception:
            pass  # Never block commission creation on tracking failure

        send_new_commission_email(commission)
        return Response(
            CommissionDetailSerializer(commission).data,
            status=status.HTTP_201_CREATED,
        )



class CommissionReferenceUploadView(APIView):
    """POST /api/commissions/upload-ref/ — Upload a reference image."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = CommissionReferenceUploadSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        ref = CommissionReferenceImage.objects.create(
            commission=None,
            image=serializer.validated_data['image'],
        )
        return Response({'id': str(ref.id), 'url': ref.image.url}, status=status.HTTP_201_CREATED)


class MyCommissionsView(APIView):
    """GET /api/commissions/mine/ — Customer's sent commissions."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        commissions = Commission.objects.filter(
            customer=request.user
        ).select_related('artist', 'artist__artist_profile')
        return Response(CommissionListSerializer(commissions, many=True).data)


class CommissionInboxView(APIView):
    """GET /api/commissions/inbox/ — Artist's incoming commissions."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not hasattr(request.user, 'artist_profile'):
            return Response(
                {'error': 'Artist profile required'},
                status=status.HTTP_403_FORBIDDEN,
            )
        commissions = Commission.objects.filter(
            artist=request.user
        ).select_related('customer')
        return Response(CommissionListSerializer(commissions, many=True).data)


class CommissionDetailView(APIView):
    """GET /api/commissions/<uuid>/ — Commission detail (either party)."""
    permission_classes = [IsAuthenticated]

    def get(self, request, commission_id):
        try:
            commission = Commission.objects.select_related(
                'artist', 'customer'
            ).prefetch_related('deliverables', 'reference_image_objects').get(id=commission_id)
        except Commission.DoesNotExist:
            return Response({'error': 'Commission not found'}, status=status.HTTP_404_NOT_FOUND)

        if request.user != commission.artist and request.user != commission.customer:
            return Response({'error': 'Not authorized'}, status=status.HTTP_403_FORBIDDEN)

        return Response(CommissionDetailSerializer(commission).data)


class CommissionAcceptView(APIView):
    """POST /api/commissions/<uuid>/accept/ — Artist accepts commission."""
    permission_classes = [IsAuthenticated]

    def post(self, request, commission_id):
        try:
            commission = Commission.objects.get(id=commission_id)
        except Commission.DoesNotExist:
            return Response({'error': 'Commission not found'}, status=status.HTTP_404_NOT_FOUND)

        if request.user != commission.artist:
            return Response({'error': 'Only the artist can accept'}, status=status.HTTP_403_FORBIDDEN)

        if commission.status != Commission.Status.PENDING:
            return Response({'error': f'Cannot accept commission in {commission.status} status'},
                            status=status.HTTP_400_BAD_REQUEST)

        commission.status = Commission.Status.ACCEPTED
        commission.response_at = timezone.now()
        commission.save()
        send_commission_accepted_email(commission)
        return Response(CommissionDetailSerializer(commission).data)


class CommissionStartView(APIView):
    """POST /api/commissions/<uuid>/start/ — Artist marks commission as in_progress."""
    permission_classes = [IsAuthenticated]

    def post(self, request, commission_id):
        try:
            commission = Commission.objects.get(id=commission_id)
        except Commission.DoesNotExist:
            return Response({'error': 'Commission not found'}, status=status.HTTP_404_NOT_FOUND)

        if request.user != commission.artist:
            return Response({'error': 'Only the artist can start work'}, status=status.HTTP_403_FORBIDDEN)

        if commission.status != Commission.Status.ACCEPTED:
            return Response(
                {'error': f'Cannot start commission in {commission.status} status'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        commission.status = Commission.Status.IN_PROGRESS
        commission.save()
        send_commission_started_email(commission)
        return Response(CommissionDetailSerializer(commission).data)


class CommissionDeclineView(APIView):
    """POST /api/commissions/<uuid>/decline/ — Artist declines commission."""
    permission_classes = [IsAuthenticated]

    def post(self, request, commission_id):
        try:
            commission = Commission.objects.get(id=commission_id)
        except Commission.DoesNotExist:
            return Response({'error': 'Commission not found'}, status=status.HTTP_404_NOT_FOUND)

        if request.user != commission.artist:
            return Response({'error': 'Only the artist can decline'}, status=status.HTTP_403_FORBIDDEN)

        if commission.status != Commission.Status.PENDING:
            return Response({'error': f'Cannot decline commission in {commission.status} status'},
                            status=status.HTTP_400_BAD_REQUEST)

        serializer = CommissionStatusSerializer(
            data=request.data,
            context={'action': 'decline'},
        )
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        commission.status = Commission.Status.DECLINED
        commission.rejection_reason = serializer.validated_data['rejection_reason']
        commission.response_at = timezone.now()
        commission.save()
        send_commission_declined_email(commission)
        return Response(CommissionDetailSerializer(commission).data)


class CommissionDeliverView(APIView):
    """POST /api/commissions/<uuid>/deliver/ — Artist uploads deliverable."""
    permission_classes = [IsAuthenticated]

    def post(self, request, commission_id):
        try:
            commission = Commission.objects.get(id=commission_id)
        except Commission.DoesNotExist:
            return Response({'error': 'Commission not found'}, status=status.HTTP_404_NOT_FOUND)

        if request.user != commission.artist:
            return Response({'error': 'Only the artist can deliver'}, status=status.HTTP_403_FORBIDDEN)

        if commission.status not in [Commission.Status.ACCEPTED, Commission.Status.IN_PROGRESS]:
            return Response(
                {'error': f'Cannot deliver in {commission.status} status'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = CommissionDeliverableCreateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        commission.current_revision += 1
        commission.status = Commission.Status.DELIVERED
        commission.save()

        deliverable = CommissionDeliverable.objects.create(
            commission=commission,
            file=serializer.validated_data['file'],
            notes=serializer.validated_data['notes'],
            revision_number=commission.current_revision,
        )

        send_commission_delivered_email(commission)
        return Response(
            CommissionDeliverableSerializer(deliverable).data,
            status=status.HTTP_201_CREATED,
        )


class CommissionApproveView(APIView):
    """POST /api/commissions/<uuid>/approve/ — Customer approves delivered work."""
    permission_classes = [IsAuthenticated]

    def post(self, request, commission_id):
        try:
            commission = Commission.objects.get(id=commission_id)
        except Commission.DoesNotExist:
            return Response({'error': 'Commission not found'}, status=status.HTTP_404_NOT_FOUND)

        if request.user != commission.customer:
            return Response({'error': 'Only the customer can approve'}, status=status.HTTP_403_FORBIDDEN)

        if commission.status != Commission.Status.DELIVERED:
            return Response(
                {'error': f'Cannot approve in {commission.status} status'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        commission.status = Commission.Status.COMPLETED
        commission.save()
        send_commission_completed_email(commission)
        return Response(CommissionDetailSerializer(commission).data)


class CommissionRevisionView(APIView):
    """POST /api/commissions/<uuid>/revision/ — Customer requests revision."""
    permission_classes = [IsAuthenticated]

    def post(self, request, commission_id):
        try:
            commission = Commission.objects.get(id=commission_id)
        except Commission.DoesNotExist:
            return Response({'error': 'Commission not found'}, status=status.HTTP_404_NOT_FOUND)

        if request.user != commission.customer:
            return Response({'error': 'Only the customer can request revision'},
                            status=status.HTTP_403_FORBIDDEN)

        if commission.status != Commission.Status.DELIVERED:
            return Response(
                {'error': f'Cannot request revision in {commission.status} status'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if commission.current_revision >= commission.revision_limit:
            return Response(
                {'error': f'Revision limit reached ({commission.revision_limit})'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        commission.status = Commission.Status.IN_PROGRESS
        commission.save()
        send_commission_revision_email(commission)
        return Response(CommissionDetailSerializer(commission).data)


class CommissionCancelView(APIView):
    """POST /api/commissions/<uuid>/cancel/ — Either party cancels commission."""
    permission_classes = [IsAuthenticated]

    def post(self, request, commission_id):
        try:
            commission = Commission.objects.get(id=commission_id)
        except Commission.DoesNotExist:
            return Response({'error': 'Commission not found'}, status=status.HTTP_404_NOT_FOUND)

        if request.user != commission.artist and request.user != commission.customer:
            return Response({'error': 'Not authorized'}, status=status.HTTP_403_FORBIDDEN)

        if commission.status in [Commission.Status.COMPLETED, Commission.Status.CANCELLED]:
            return Response(
                {'error': f'Cannot cancel commission in {commission.status} status'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if commission.status == Commission.Status.DELIVERED:
            return Response(
                {'error': 'Cannot cancel after delivery. Use approve or revision.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        commission.status = Commission.Status.CANCELLED
        commission.save()
        send_commission_cancelled_email(commission, cancelled_by=request.user)
        return Response(CommissionDetailSerializer(commission).data)
