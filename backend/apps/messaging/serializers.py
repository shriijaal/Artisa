from rest_framework import serializers

from apps.messaging.models import Message
from apps.users.serializers import UserSerializer


class MessageSerializer(serializers.ModelSerializer):
    sender = UserSerializer(read_only=True)
    receiver = UserSerializer(read_only=True)
    artwork_title = serializers.CharField(source='artwork.title', read_only=True, default=None)
    is_mine = serializers.SerializerMethodField()

    class Meta:
        model = Message
        fields = (
            'id', 'sender', 'receiver', 'commission', 'artwork', 'artwork_title',
            'body', 'read_at', 'created_at', 'is_mine',
        )
        read_only_fields = fields

    def get_is_mine(self, obj):
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return False
        return obj.sender_id == request.user.id


class MessageCreateSerializer(serializers.Serializer):
    commission_id = serializers.UUIDField(required=False)
    artwork_id = serializers.UUIDField(required=False)
    body = serializers.CharField(max_length=4000, trim_whitespace=True)

    def validate_body(self, value):
        if not value.strip():
            raise serializers.ValidationError('Message cannot be empty.')
        return value.strip()

    def validate(self, data):
        if not data.get('commission_id') and not data.get('artwork_id'):
            raise serializers.ValidationError('Either commission_id or artwork_id is required.')
        return data
