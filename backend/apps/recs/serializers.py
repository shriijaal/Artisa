from rest_framework import serializers
from apps.recs.models import UserInteraction


class InteractionSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserInteraction
        fields = ['id', 'target_type', 'target_id', 'interaction_type', 'created_at']
        read_only_fields = ['id', 'created_at']

    def validate_interaction_type(self, value):
        valid = [c[0] for c in UserInteraction.InteractionType.choices]
        if value not in valid:
            raise serializers.ValidationError(f'Invalid interaction_type. Must be one of: {", ".join(valid)}')
        return value

    def validate_target_type(self, value):
        if value not in ('artwork', 'artist'):
            raise serializers.ValidationError('target_type must be "artwork" or "artist"')
        return value
