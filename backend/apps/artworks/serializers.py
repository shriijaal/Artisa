from rest_framework import serializers

from apps.artworks.models import Artwork, ArtworkImage, ArtworkTag, DigitalFile, Category
from apps.users.serializers import UserSerializer
from apps.users.utils import validate_image_file, validate_file_type


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ('id', 'name', 'slug', 'parent', 'description')
        read_only_fields = ('id', 'slug')


class ArtworkTagSerializer(serializers.ModelSerializer):
    class Meta:
        model = ArtworkTag
        fields = ('id', 'tag')
        read_only_fields = ('id',)


class ArtworkImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ArtworkImage
        fields = ('id', 'image', 'thumbnail', 'is_primary')
        read_only_fields = ('id', 'thumbnail')

    def validate_image(self, value):
        if value:
            validate_file_type(value)
            validate_image_file(value)
        return value


class DigitalFileSerializer(serializers.ModelSerializer):
    class Meta:
        model = DigitalFile
        fields = ('id', 'file', 'preview_image')
        read_only_fields = ('id',)
        extra_kwargs = {
            'file': {'write_only': True} # Hide from GET responses, only accessible via download endpoint
        }


class ArtworkSerializer(serializers.ModelSerializer):
    artist = UserSerializer(read_only=True)
    category = CategorySerializer(read_only=True)
    images = ArtworkImageSerializer(many=True, read_only=True)
    tags = ArtworkTagSerializer(many=True, read_only=True)
    digital_file = DigitalFileSerializer(read_only=True)
    avg_rating = serializers.SerializerMethodField()
    review_count = serializers.SerializerMethodField()

    class Meta:
        model = Artwork
        fields = (
            'id', 'artist', 'title', 'description', 'price', 'type', 
            'category', 'stock', 'status', 'originality_confirmed',
            'images', 'tags', 'digital_file', 'avg_rating', 'review_count',
            'created_at', 'updated_at'
        )
        read_only_fields = ('id', 'artist', 'status', 'created_at', 'updated_at')

    def get_avg_rating(self, obj):
        from django.db.models import Avg
        stats = obj.reviews.aggregate(avg=Avg('rating'))
        return round(stats['avg'], 1) if stats['avg'] else None

    def get_review_count(self, obj):
        return obj.reviews.count()


class ArtworkCreateSerializer(serializers.ModelSerializer):
    category_id = serializers.UUIDField(write_only=True)
    tags = serializers.ListField(child=serializers.CharField(), write_only=True, required=False)
    originality_declaration = serializers.BooleanField(write_only=True, required=True)

    class Meta:
        model = Artwork
        fields = (
            'title', 'description', 'price', 'type', 'category_id',
            'stock', 'tags', 'originality_declaration'
        )

    def validate_originality_declaration(self, value):
        if not value:
            raise serializers.ValidationError("You must confirm the artwork is original.")
        return value

    def validate_stock(self, value):
        # Stock is only required for physical artworks
        if self.initial_data.get('type') == Artwork.Type.PHYSICAL and (value is None or value < 0):
            raise serializers.ValidationError("Stock is required for physical artworks.")
        return value

    def create(self, validated_data):
        tags_data = validated_data.pop('tags', [])
        validated_data.pop('originality_declaration')
        category_id = validated_data.pop('category_id')
        
        artwork = Artwork.objects.create(
            artist=self.context['request'].user,
            category_id=category_id,
            **validated_data
        )
        
        # Create tags
        for tag in tags_data:
            ArtworkTag.objects.create(artwork=artwork, tag=tag)
        
        return artwork


class ArtworkUpdateSerializer(serializers.ModelSerializer):
    category_id = serializers.UUIDField(write_only=True, required=False)
    tags = serializers.ListField(child=serializers.CharField(), write_only=True, required=False)

    class Meta:
        model = Artwork
        fields = (
            'title', 'description', 'price', 'type', 'category_id',
            'stock', 'tags'
        )

    def validate_stock(self, value):
        if value is not None and value < 0:
            raise serializers.ValidationError("Stock cannot be negative.")
        return value

    def update(self, instance, validated_data):
        tags_data = validated_data.pop('tags', None)
        category_id = validated_data.pop('category_id', None)
        
        if category_id:
            instance.category_id = category_id
        
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        
        instance.save()
        
        # Update tags if provided
        if tags_data is not None:
            instance.tags.all().delete()
            for tag in tags_data:
                ArtworkTag.objects.create(artwork=instance, tag=tag)
        
        return instance


class ArtworkSubmitSerializer(serializers.Serializer):
    originality_declaration = serializers.BooleanField(required=True)

    def validate_originality_declaration(self, value):
        if not value:
            raise serializers.ValidationError("You must confirm the artwork is original.")
        return value
