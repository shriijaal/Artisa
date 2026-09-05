from django.db.models import Q
from django.utils import timezone
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.commissions.models import Commission
from apps.artworks.models import Artwork
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
    """GET/POST /api/messages/ — commission-linked or artwork inquiry threads."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        commission_id = request.query_params.get('commission_id')
        artwork_id = request.query_params.get('artwork_id')

        if commission_id:
            commission, error = _get_participant_commission(request.user, commission_id)
            if error:
                return error
            messages = Message.objects.filter(commission=commission).select_related('sender', 'receiver')
        elif artwork_id:
            messages = Message.objects.filter(artwork_id=artwork_id).select_related('sender', 'receiver')
        else:
            # Return all messages for the user (inquiries + commission messages)
            messages = Message.objects.filter(
                Q(sender=request.user) | Q(receiver=request.user)
            ).select_related('sender', 'receiver', 'artwork')

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

        data = serializer.validated_data

        # Artwork inquiry
        if data.get('artwork_id'):
            try:
                artwork = Artwork.objects.get(id=data['artwork_id'])
            except Artwork.DoesNotExist:
                return Response({'error': 'Artwork not found.'}, status=status.HTTP_404_NOT_FOUND)

            if artwork.artist_id == request.user.id:
                return Response({'error': 'You cannot send an inquiry to yourself.'}, status=status.HTTP_400_BAD_REQUEST)

            message = Message.objects.create(
                sender=request.user,
                receiver=artwork.artist,
                artwork=artwork,
                body=data['body'],
            )
            return Response(
                MessageSerializer(message, context={'request': request}).data,
                status=status.HTTP_201_CREATED,
            )

        # Commission message (existing)
        commission, error = _get_participant_commission(request.user, data['commission_id'])
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
            body=data['body'],
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
