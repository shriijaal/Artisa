import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.utils import timezone


class ChatConsumer(AsyncWebsocketConsumer):
    """
    WebSocket consumer for real-time messaging.

    Each user connects to ws://HOST/ws/messages/<user_id>/
    Messages are broadcast to all connected clients for the same user.
    This allows multiple tabs/devices to stay in sync.
    """

    async def connect(self):
        self.user = self.scope.get('user')
        if not self.user or self.user.is_anonymous:
            await self.close()
            return

        self.user_id = str(self.user.id)
        self.room_group_name = f'user_{self.user_id}'

        # Join the user's personal group
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name,
        )
        await self.accept()

        # Mark user as online
        await self.set_user_online(True)
        await self.broadcast_presence()

    async def disconnect(self, close_code):
        if hasattr(self, 'room_group_name'):
            await self.channel_layer.group_discard(
                self.room_group_name,
                self.channel_name,
            )
        # Mark user as offline
        if hasattr(self, 'user') and self.user and not self.user.is_anonymous:
            await self.set_user_online(False)
            await self.broadcast_presence()

    async def receive(self, text_data):
        try:
            data = json.loads(text_data)
        except json.JSONDecodeError:
            return

        msg_type = data.get('type')

        if msg_type == 'chat_message':
            # Incoming message from client — persist and broadcast
            message_data = data.get('message', {})
            message = await self.save_message(message_data)
            if message:
                await self.channel_layer.group_send(
                    self.room_group_name,
                    {
                        'type': 'chat_message',
                        'message': message,
                    }
                )

        elif msg_type == 'typing':
            # Typing indicator
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'typing_indicator',
                    'user_id': self.user_id,
                    'username': self.user.username,
                    'is_typing': data.get('is_typing', False),
                }
            )

        elif msg_type == 'message_read':
            # Mark messages as read
            message_ids = data.get('message_ids', [])
            if message_ids:
                await self.mark_messages_read(message_ids)
                await self.channel_layer.group_send(
                    self.room_group_name,
                    {
                        'type': 'messages_read',
                        'message_ids': message_ids,
                        'reader_id': self.user_id,
                    }
                )

    # --- Group message handlers ---

    async def chat_message(self, event):
        """Send new message to WebSocket client."""
        await self.send(text_data=json.dumps({
            'type': 'chat_message',
            'message': event['message'],
        }))

    async def typing_indicator(self, event):
        """Send typing indicator to WebSocket client."""
        # Don't send typing indicator back to the same user
        if event['user_id'] != self.user_id:
            await self.send(text_data=json.dumps({
                'type': 'typing',
                'user_id': event['user_id'],
                'username': event['username'],
                'is_typing': event['is_typing'],
            }))

    async def messages_read(self, event):
        """Send read receipts to WebSocket client."""
        await self.send(text_data=json.dumps({
            'type': 'message_read',
            'message_ids': event['message_ids'],
            'reader_id': event['reader_id'],
        }))

    async def presence_update(self, event):
        """Send presence update to WebSocket client."""
        await self.send(text_data=json.dumps({
            'type': 'presence',
            'user_id': event['user_id'],
            'online': event['online'],
        }))

    # --- Database operations ---

    @database_sync_to_async
    def save_message(self, data):
        from apps.messaging.models import Message
        from apps.users.models import User

        sender_id = data.get('sender_id')
        receiver_id = data.get('receiver_id')
        body = data.get('body', '').strip()
        commission_id = data.get('commission_id')
        artwork_id = data.get('artwork_id')
        reply_to_id = data.get('reply_to_id')
        message_type = data.get('message_type', 'text')

        if not body or not receiver_id:
            return None

        try:
            receiver = User.objects.get(id=receiver_id)
        except User.DoesNotExist:
            return None

        from apps.commissions.models import Commission
        from apps.artworks.models import Artwork

        commission = None
        if commission_id:
            try:
                commission = Commission.objects.get(id=commission_id)
            except Commission.DoesNotExist:
                pass

        artwork = None
        if artwork_id:
            try:
                artwork = Artwork.objects.get(id=artwork_id)
            except Artwork.DoesNotExist:
                pass

        reply_to = None
        if reply_to_id:
            try:
                reply_to = Message.objects.get(id=reply_to_id)
            except Message.DoesNotExist:
                pass

        message = Message.objects.create(
            sender_id=sender_id,
            receiver=receiver,
            commission=commission,
            artwork=artwork,
            body=body,
            message_type=message_type,
            reply_to=reply_to,
        )

        from apps.messaging.serializers import MessageSerializer
        from django.http import HttpRequest
        # Build a minimal request-like context for serializer
        return MessageSerializer(message).data

    @database_sync_to_async
    def mark_messages_read(self, message_ids):
        from apps.messaging.models import Message
        Message.objects.filter(
            id__in=message_ids,
            receiver=self.user,
            read_at__isnull=True,
        ).update(read_at=timezone.now())

    @database_sync_to_async
    def set_user_online(self, online):
        # Store online status in channel layer cache
        from channels.layers import get_channel_layer
        channel_layer = get_channel_layer()
        if online:
            channel_layer._cache[f'online_{self.user_id}'] = True
        else:
            channel_layer._cache.pop(f'online_{self.user_id}', None)

    async def broadcast_presence(self):
        """Broadcast online/offline status to all connected clients."""
        is_online = await self.check_online()
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'presence_update',
                'user_id': self.user_id,
                'online': is_online,
            }
        )

    @database_sync_to_async
    def check_online(self):
        from channels.layers import get_channel_layer
        channel_layer = get_channel_layer()
        return channel_layer._cache.get(f'online_{self.user_id}', False)
