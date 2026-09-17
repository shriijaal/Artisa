from rest_framework import serializers

from apps.messaging.models import Message, MessageReaction
from apps.users.serializers import UserSerializer


class MessageReactionSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)

    class Meta:
        model = MessageReaction
        fields = ('id', 'emoji', 'username', 'created_at')
        read_only_fields = fields


class MessageSerializer(serializers.ModelSerializer):
    sender = UserSerializer(read_only=True)
    receiver = UserSerializer(read_only=True)
    artwork_title = serializers.CharField(source='artwork.title', read_only=True, default=None)
    is_mine = serializers.SerializerMethodField()
    attachment_url = serializers.SerializerMethodField()
    reply_to_object = serializers.SerializerMethodField()
    reactions = serializers.SerializerMethodField()

    class Meta:
        model = Message
        fields = (
            'id', 'sender', 'receiver', 'commission', 'artwork', 'artwork_title',
            'body', 'message_type', 'attachment', 'attachment_url',
            'reply_to', 'reply_to_object', 'reactions',
            'read_at', 'edited_at', 'created_at', 'is_mine',
        )
        read_only_fields = ('id', 'sender', 'receiver', 'read_at', 'edited_at', 'created_at', 'is_mine', 'attachment_url', 'reply_to_object', 'reactions')

    def get_is_mine(self, obj):
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return False
        return obj.sender_id == request.user.id

    def get_attachment_url(self, obj):
        if obj.attachment:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.attachment.url)
            return obj.attachment.url
        return None

    def get_reply_to_object(self, obj):
        if not obj.reply_to:
            return None
        return {
            'id': str(obj.reply_to.id),
            'body': obj.reply_to.body,
            'sender': obj.reply_to.sender.first_name or obj.reply_to.sender.username,
            'message_type': obj.reply_to.message_type,
        }

    def get_reactions(self, obj):
        reactions = obj.reactions.all()
        # Group by emoji
        grouped = {}
        request = self.context.get('request')
        for r in reactions:
            if r.emoji not in grouped:
                grouped[r.emoji] = {'emoji': r.emoji, 'count': 0, 'users': [], 'i_reacted': False}
            grouped[r.emoji]['count'] += 1
            grouped[r.emoji]['users'].append(r.user.username)
            if request and r.user_id == request.user.id:
                grouped[r.emoji]['i_reacted'] = True
        return list(grouped.values())


class MessageCreateSerializer(serializers.Serializer):
    commission_id = serializers.UUIDField(required=False)
    artwork_id = serializers.UUIDField(required=False)
    body = serializers.CharField(max_length=4000, trim_whitespace=True, required=False, default='')
    receiver_id = serializers.UUIDField(required=False)
    attachment = serializers.FileField(required=False)
    reply_to_id = serializers.UUIDField(required=False)

    def validate_attachment(self, value):
        allowed_types = [
            'image/jpeg', 'image/png', 'image/webp', 'image/gif',
            'application/pdf',
            'application/zip', 'application/x-zip-compressed',
        ]
        if value.content_type not in allowed_types:
            raise serializers.ValidationError('File type not allowed. Send images, PDFs, or ZIP files.')
        if value.size > 25 * 1024 * 1024:
            raise serializers.ValidationError('File too large (max 25MB).')
        return value

    def validate(self, data):
        body = data.get('body', '').strip()
        attachment = data.get('attachment')
        if not body and not attachment:
            raise serializers.ValidationError('Message must have text or an attachment.')
        if not data.get('commission_id') and not data.get('artwork_id') and not data.get('receiver_id'):
            raise serializers.ValidationError('Either commission_id, artwork_id, or receiver_id is required.')
        return data
