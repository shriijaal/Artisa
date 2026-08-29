from django.db.models import Q
from django.utils import timezone
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.commissions.models import Commission
from apps.messaging.models import Message
from apps.messaging.serializers import MessageCreateSerializer, MessageSerializer


def _get_participant_commission(user, commission_id):
    try:
        commission = Commission.objects.get(id=commission_id)
    except Commission.DoesNotExist:
        return None, Response({'error': 'Commission not found.'}, status=status.HTTP_404_NOT_FOUND)

    if user.id not in (commission.customer_id, commission.artist_id):
        return None, Response(
            {'error': 'You are not a participant in this commission.'},
            status=status.HTTP_403_FORBIDDEN,
        )
    return commission, None


class MessageListCreateView(APIView):
    """GET/POST /api/messages/ — commission-linked thread."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        commission_id = request.query_params.get('commission_id')
        if not commission_id:
            return Response(
                {'error': 'commission_id query parameter is required.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        commission, error = _get_participant_commission(request.user, commission_id)
        if error:
            return error

        messages = Message.objects.filter(commission=commission).select_related('sender', 'receiver')

        after = request.query_params.get('after')
        if after:
            messages = messages.filter(created_at__gt=after)

        unread = messages.filter(receiver=request.user, read_at__isnull=True)
        unread.update(read_at=timezone.now())

        serializer = MessageSerializer(messages, many=True, context={'request': request})
        return Response(serializer.data)

    def post(self, request):
        serializer = MessageCreateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        commission, error = _get_participant_commission(
            request.user,
            serializer.validated_data['commission_id'],
        )
        if error:
            return error

        if commission.status in ('cancelled', 'declined'):
            return Response(
                {'error': 'Cannot message on a cancelled or declined commission.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        receiver = commission.artist if request.user.id == commission.customer_id else commission.customer
        message = Message.objects.create(
            sender=request.user,
            receiver=receiver,
            commission=commission,
            body=serializer.validated_data['body'],
        )
        return Response(
            MessageSerializer(message, context={'request': request}).data,
            status=status.HTTP_201_CREATED,
        )


class UnreadCountView(APIView):
    """GET /api/messages/unread/ — unread message count for the current user."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        count = Message.objects.filter(receiver=request.user, read_at__isnull=True).count()
        threads = (
            Message.objects.filter(receiver=request.user, read_at__isnull=True)
            .exclude(commission__isnull=True)
            .values_list('commission_id', flat=True)
            .distinct()
        )
        return Response({
            'unread_count': count,
            'unread_commission_ids': [str(cid) for cid in threads],
        })
