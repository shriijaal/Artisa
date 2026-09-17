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
        user_id = request.query_params.get('user_id')

        if commission_id:
            commission, error = _get_participant_commission(request.user, commission_id)
            if error:
                return error
            messages = Message.objects.filter(commission=commission).select_related('sender', 'receiver')
        elif artwork_id:
            # Permission check: user must be the artist or have messages in this thread
            try:
                artwork = Artwork.objects.get(id=artwork_id)
            except Artwork.DoesNotExist:
                return Response({'error': 'Artwork not found.'}, status=status.HTTP_404_NOT_FOUND)

            is_artist = artwork.artist_id == request.user.id
            has_messages = Message.objects.filter(artwork_id=artwork_id, sender=request.user).exists()
            if not is_artist and not has_messages:
                return Response({'error': 'You do not have access to this conversation.'}, status=status.HTTP_403_FORBIDDEN)

            messages = Message.objects.filter(artwork_id=artwork_id).select_related('sender', 'receiver')
        elif user_id:
            # Return all messages between current user and specified user (commission + inquiry)
            messages = Message.objects.filter(
                Q(sender=request.user, receiver_id=user_id) |
                Q(sender_id=user_id, receiver=request.user)
            ).select_related('sender', 'receiver', 'artwork')
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
        body = data.get('body', '').strip()
        attachment = data.get('attachment')

        # Determine message type
        if attachment:
            content_type = getattr(attachment, 'content_type', '')
            if content_type.startswith('image/'):
                message_type = 'image'
            else:
                message_type = 'file'
        else:
            message_type = 'text'

        # Direct message via receiver_id (for merged conversations)
        if data.get('receiver_id') and not data.get('artwork_id') and not data.get('commission_id'):
            from apps.users.models import User
            try:
                receiver = User.objects.get(id=data['receiver_id'])
            except User.DoesNotExist:
                return Response({'error': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)

            message = Message.objects.create(
                sender=request.user,
                receiver=receiver,
                body=body,
                message_type=message_type,
                attachment=attachment,
            )
            return Response(
                MessageSerializer(message, context={'request': request}).data,
                status=status.HTTP_201_CREATED,
            )

        # Artwork inquiry
        if data.get('artwork_id'):
            try:
                artwork = Artwork.objects.get(id=data['artwork_id'])
            except Artwork.DoesNotExist:
                return Response({'error': 'Artwork not found.'}, status=status.HTTP_404_NOT_FOUND)

            if artwork.artist_id == request.user.id:
                last_msg = (
                    Message.objects
                    .filter(artwork=artwork)
                    .exclude(sender=request.user)
                    .order_by('-created_at')
                    .first()
                )
                if not last_msg:
                    return Response({'error': 'You cannot start an inquiry on your own artwork.'}, status=status.HTTP_400_BAD_REQUEST)
                receiver = last_msg.sender
            else:
                receiver = artwork.artist

            message = Message.objects.create(
                sender=request.user,
                receiver=receiver,
                artwork=artwork,
                body=body,
                message_type=message_type,
                attachment=attachment,
            )
            return Response(
                MessageSerializer(message, context={'request': request}).data,
                status=status.HTTP_201_CREATED,
            )

        # Commission message
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
            body=body,
            message_type=message_type,
            attachment=attachment,
        )

        # Attach reply_to if provided
        reply_to_id = data.get('reply_to_id')
        if reply_to_id:
            try:
                reply_msg = Message.objects.get(id=reply_to_id)
                message.reply_to = reply_msg
                message.save(update_fields=['reply_to'])
            except Message.DoesNotExist:
                pass

        return Response(
            MessageSerializer(message, context={'request': request}).data,
            status=status.HTTP_201_CREATED,
        )

    def put(self, request):
        """Edit a message (only own messages)."""
        message_id = request.data.get('id') or request.query_params.get('message_id')
        if not message_id:
            return Response({'error': 'message_id is required.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            message = Message.objects.get(id=message_id)
        except Message.DoesNotExist:
            return Response({'error': 'Message not found.'}, status=status.HTTP_404_NOT_FOUND)

        if message.sender_id != request.user.id:
            return Response({'error': 'You can only edit your own messages.'}, status=status.HTTP_403_FORBIDDEN)

        new_body = request.data.get('body', '').strip()
        if not new_body:
            return Response({'error': 'Message body cannot be empty.'}, status=status.HTTP_400_BAD_REQUEST)

        message.body = new_body
        message.edited_at = timezone.now()
        message.save(update_fields=['body', 'edited_at'])

        return Response(MessageSerializer(message, context={'request': request}).data)

    def delete(self, request):
        """Delete a message (only own messages)."""
        message_id = request.query_params.get('message_id')
        if not message_id:
            return Response({'error': 'message_id is required.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            message = Message.objects.get(id=message_id)
        except Message.DoesNotExist:
            return Response({'error': 'Message not found.'}, status=status.HTTP_404_NOT_FOUND)

        if message.sender_id != request.user.id:
            return Response({'error': 'You can only delete your own messages.'}, status=status.HTTP_403_FORBIDDEN)

        message.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class UnreadCountView(APIView):
    """GET /api/messages/unread/ — unread message count for the current user."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        unread = Message.objects.filter(receiver=request.user, read_at__isnull=True)

        # Only count unread messages that belong to valid threads
        unread_commissions = unread.filter(commission__isnull=False)
        unread_artworks = unread.filter(artwork__isnull=False)

        # Auto-mark orphaned messages (no commission, no artwork) as read
        orphaned = unread.filter(commission__isnull=True, artwork__isnull=True)
        if orphaned.exists():
            orphaned.update(read_at=timezone.now())

        # Auto-mark messages pointing to deleted commissions/artworks as read
        from apps.commissions.models import Commission
        from apps.artworks.models import Artwork
        invalid_commissions = unread_commissions.exclude(
            commission__in=Commission.objects.all()
        )
        if invalid_commissions.exists():
            invalid_commissions.update(read_at=timezone.now())
            unread_commissions = unread_commissions.filter(commission__in=Commission.objects.all())

        invalid_artworks = unread_artworks.exclude(
            artwork__in=Artwork.objects.all()
        )
        if invalid_artworks.exists():
            invalid_artworks.update(read_at=timezone.now())
            unread_artworks = unread_artworks.filter(artwork__in=Artwork.objects.all())

        count = unread_commissions.count() + unread_artworks.count()

        commission_threads = (
            unread_commissions
            .values_list('commission_id', flat=True)
            .distinct()
        )

        artwork_threads = (
            unread_artworks
            .values_list('artwork_id', flat=True)
            .distinct()
        )

        return Response({
            'unread_count': count,
            'unread_commission_ids': [str(cid) for cid in commission_threads],
            'unread_artwork_ids': [str(aid) for aid in artwork_threads],
        })


class MarkAllReadView(APIView):
    """POST /api/messages/mark-all-read/ — mark all unread messages as read."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        updated = Message.objects.filter(
            receiver=request.user,
            read_at__isnull=True,
        ).update(read_at=timezone.now())
        return Response({'marked_read': updated})


class InquiryListView(APIView):
    """GET /api/messages/inquiries/ — list artwork inquiry threads for the current user."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from django.db.models import Max
        from apps.users.serializers import UserSerializer

        messages = Message.objects.filter(
            Q(receiver=request.user, artwork__isnull=False) |
            Q(sender=request.user, artwork__isnull=False)
        ).select_related('sender', 'receiver', 'artwork').prefetch_related('artwork__images')

        threads = (
            messages.values('artwork_id')
            .annotate(last_message_at=Max('created_at'))
            .order_by('-last_message_at')
        )

        result = []
        for thread in threads:
            artwork_id = thread['artwork_id']
            last_msg = messages.filter(artwork_id=artwork_id).order_by('-created_at').first()
            unread_count = messages.filter(
                artwork_id=artwork_id,
                receiver=request.user,
                read_at__isnull=True
            ).count()

            other_party = (
                last_msg.sender if last_msg.receiver_id == request.user.id
                else last_msg.receiver
            )

            artwork_data = None
            if last_msg and last_msg.artwork:
                primary_image = last_msg.artwork.images.filter(is_primary=True).first()
                if not primary_image:
                    primary_image = last_msg.artwork.images.first()
                artwork_data = {
                    'id': str(last_msg.artwork.id),
                    'title': last_msg.artwork.title,
                    'image': primary_image.image.url if primary_image and primary_image.image else None,
                }

            result.append({
                'artwork_id': str(artwork_id),
                'artwork': artwork_data,
                'other_party': UserSerializer(other_party, context={'request': request}).data,
                'last_message': last_msg.body if last_msg else '',
                'last_message_sender': last_msg.sender_id if last_msg else None,
                'last_message_at': last_msg.created_at.isoformat() if last_msg else None,
                'unread_count': unread_count,
            })

        return Response(result)


class MessageReactionView(APIView):
    """POST/DELETE /api/messages/<uuid>/react/ — toggle reaction on a message."""
    permission_classes = [IsAuthenticated]

    def post(self, request, message_id):
        from apps.messaging.models import MessageReaction

        try:
            message = Message.objects.get(id=message_id)
        except Message.DoesNotExist:
            return Response({'error': 'Message not found.'}, status=status.HTTP_404_NOT_FOUND)

        emoji = request.data.get('emoji', '').strip()
        if not emoji:
            return Response({'error': 'Emoji is required.'}, status=status.HTTP_400_BAD_REQUEST)

        reaction, created = MessageReaction.objects.get_or_create(
            message=message,
            user=request.user,
            defaults={'emoji': emoji},
        )

        if not created:
            if reaction.emoji == emoji:
                # Same emoji — toggle off (remove)
                reaction.delete()
                return Response({'action': 'removed', 'emoji': emoji})
            else:
                # Different emoji — update
                reaction.emoji = emoji
                reaction.save(update_fields=['emoji'])
                return Response({'action': 'updated', 'emoji': emoji})

        return Response({'action': 'added', 'emoji': emoji}, status=status.HTTP_201_CREATED)

    def delete(self, request, message_id):
        from apps.messaging.models import MessageReaction

        emoji = request.query_params.get('emoji', '').strip()
        if not emoji:
            return Response({'error': 'Emoji query param is required.'}, status=status.HTTP_400_BAD_REQUEST)

        deleted, _ = MessageReaction.objects.filter(
            message_id=message_id,
            user=request.user,
            emoji=emoji,
        ).delete()

        if deleted:
            return Response({'action': 'removed', 'emoji': emoji})
        return Response({'error': 'Reaction not found.'}, status=status.HTTP_404_NOT_FOUND)
