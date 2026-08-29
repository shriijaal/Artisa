from rest_framework import serializers
from apps.commissions.models import Commission, CommissionDeliverable, CommissionReferenceImage  # noqa: F401 used in create()
from apps.users.serializers import UserSerializer


class CommissionDeliverableSerializer(serializers.ModelSerializer):
    class Meta:
        model = CommissionDeliverable
        fields = ('id', 'file', 'notes', 'revision_number', 'created_at')
        read_only_fields = ('id', 'revision_number', 'created_at')


class CommissionReferenceImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = CommissionReferenceImage
        fields = ('id', 'image', 'created_at')
        read_only_fields = ('id', 'created_at')


class CommissionListSerializer(serializers.ModelSerializer):
    artist = UserSerializer(read_only=True)
    customer = UserSerializer(read_only=True)

    class Meta:
        model = Commission
        fields = (
            'id', 'title', 'description', 'budget_min', 'budget_max',
            'status', 'deadline', 'revision_limit', 'current_revision',
            'artist', 'customer', 'created_at', 'updated_at',
        )
        read_only_fields = fields


class CommissionDetailSerializer(serializers.ModelSerializer):
    artist = UserSerializer(read_only=True)
    customer = UserSerializer(read_only=True)
    deliverables = CommissionDeliverableSerializer(many=True, read_only=True)
    reference_image_objects = CommissionReferenceImageSerializer(many=True, read_only=True)

    class Meta:
        model = Commission
        fields = (
            'id', 'title', 'description', 'budget_min', 'budget_max',
            'reference_images', 'status', 'deadline', 'revision_limit',
            'current_revision', 'rejection_reason', 'response_at',
            'artist', 'customer', 'deliverables', 'reference_image_objects',
            'created_at', 'updated_at',
        )
        read_only_fields = (
            'id', 'status', 'revision_limit', 'current_revision',
            'rejection_reason', 'response_at', 'artist', 'customer',
            'created_at', 'updated_at',
        )


class CommissionCreateSerializer(serializers.ModelSerializer):
    artist_id = serializers.CharField(write_only=True)
    reference_images = serializers.ListField(
        child=serializers.URLField(), required=False, default=list
    )
    reference_image_ids = serializers.ListField(
        child=serializers.CharField(), required=False, default=list, write_only=True
    )

    class Meta:
        model = Commission
        fields = (
            'artist_id', 'title', 'description', 'budget_min', 'budget_max',
            'reference_images', 'reference_image_ids', 'deadline',
        )

    def validate_artist_id(self, value):
        from apps.users.models import User, ArtistProfile
        user = None
        # Try finding by user UUID
        try:
            user = User.objects.filter(id=value).first()
        except Exception:
            pass

        # Try finding by artist profile UUID
        if not user:
            try:
                profile = ArtistProfile.objects.filter(id=value).first()
                if profile:
                    user = profile.user
            except Exception:
                pass

        # Try finding by username
        if not user:
            user = User.objects.filter(username__iexact=str(value)).first()

        if not user:
            raise serializers.ValidationError("Artist not found.")
        if not hasattr(user, 'artist_profile') or user.artist_profile.status != ArtistProfile.Status.APPROVED:
            raise serializers.ValidationError("User is not an approved artist.")
        return user.id

    def validate(self, attrs):
        if attrs.get('budget_min', 0) > attrs.get('budget_max', 0):
            raise serializers.ValidationError({"budget_min": "Min budget must be <= max budget."})
        from datetime import date
        if attrs.get('deadline') and attrs['deadline'] <= date.today():
            raise serializers.ValidationError({"deadline": "Deadline must be in the future."})
        return attrs

    def create(self, validated_data):
        import uuid
        from apps.users.models import User
        artist_id = validated_data.pop('artist_id')
        reference_image_ids = validated_data.pop('reference_image_ids', [])
        validated_data['artist'] = User.objects.get(id=artist_id)
        validated_data['customer'] = self.context['request'].user
        commission = Commission.objects.create(**validated_data)

        # Attach any pre-uploaded reference images that are valid UUIDs
        valid_ref_uuids = []
        for ref_id in reference_image_ids:
            try:
                valid_ref_uuids.append(uuid.UUID(str(ref_id)))
            except (ValueError, TypeError):
                pass

        if valid_ref_uuids:
            CommissionReferenceImage.objects.filter(
                id__in=valid_ref_uuids,
                commission__isnull=True,
            ).update(commission=commission)

        return commission


class CommissionStatusSerializer(serializers.Serializer):
    rejection_reason = serializers.CharField(required=False, allow_blank=True, default='')

    def validate_rejection_reason(self, value):
        if self.context.get('action') == 'decline' and not value:
            raise serializers.ValidationError("Rejection reason is required.")
        return value


class CommissionDeliverableCreateSerializer(serializers.Serializer):
    file = serializers.FileField()
    notes = serializers.CharField(required=False, allow_blank=True, default='')

    def validate_file(self, value):
        allowed = ['application/pdf', 'image/png', 'image/jpeg', 'image/webp',
                    'application/zip', 'application/x-zip-compressed']
        if value.content_type not in allowed:
            raise serializers.ValidationError("File type not allowed.")
        if value.size > 50 * 1024 * 1024:
            raise serializers.ValidationError("File too large (max 50MB).")
        return value


class CommissionReferenceUploadSerializer(serializers.Serializer):
    image = serializers.ImageField()

    def validate_image(self, value):
        from apps.users.utils import validate_image_file, validate_file_type
        validate_file_type(value)
        validate_image_file(value)
        return value

