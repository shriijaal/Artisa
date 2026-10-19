from rest_framework import serializers

from apps.notifications.models import Notification


class NotificationSerializer(serializers.ModelSerializer):
    is_read = serializers.SerializerMethodField()
    actor_username = serializers.SerializerMethodField()

    class Meta:
        model = Notification
        fields = [
            'id',
            'kind',
            'title',
            'body',
            'link',
            'is_read',
            'actor_username',
            'read_at',
            'created_at',
        ]
        read_only_fields = fields

    def get_is_read(self, obj):
        return obj.read_at is not None

    def get_actor_username(self, obj):
        return obj.actor.username if obj.actor else None
