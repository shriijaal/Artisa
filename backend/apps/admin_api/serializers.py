from rest_framework import serializers
from apps.users.models import User, ArtistProfile, ArtistApplication
from apps.artworks.models import Artwork, Category
from apps.orders.models import Order


class AdminUserSerializer(serializers.ModelSerializer):
    artwork_count = serializers.SerializerMethodField()
    is_artist = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'role', 'is_active', 'date_joined', 'artwork_count', 'is_artist']

    def get_artwork_count(self, obj):
        return getattr(obj, 'artwork_count', obj.artworks.count()) if hasattr(obj, 'artworks') else 0

    def get_is_artist(self, obj):
        return hasattr(obj, 'artist_profile') and obj.artist_profile.status == 'approved'


class AdminArtistProfileSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    email = serializers.CharField(source='user.email', read_only=True)

    class Meta:
        model = ArtistProfile
        fields = ['id', 'username', 'email', 'status', 'verified_badge', 'bio', 'created_at']


class AdminApplicationSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    email = serializers.CharField(source='user.email', read_only=True)

    class Meta:
        model = ArtistApplication
        fields = ['id', 'username', 'email', 'status', 'reason', 'rejection_reason',
                  'reviewed_by', 'reviewed_at', 'created_at']


class AdminArtworkSerializer(serializers.ModelSerializer):
    artist_name = serializers.CharField(source='artist.username', read_only=True)
    category_name = serializers.CharField(source='category.name', read_only=True)
    primary_image = serializers.SerializerMethodField()

    class Meta:
        model = Artwork
        fields = ['id', 'title', 'artist', 'artist_name', 'category', 'category_name',
                  'price', 'type', 'status', 'is_featured', 'primary_image', 'created_at']

    def get_primary_image(self, obj):
        img = obj.images.filter(is_primary=True).first()
        if img:
            return img.image.url
        img = obj.images.first()
        return img.image.url if img else None


class AdminCategorySerializer(serializers.ModelSerializer):
    artwork_count = serializers.SerializerMethodField()
    children_count = serializers.SerializerMethodField()

    class Meta:
        model = Category
        fields = ['id', 'name', 'slug', 'parent', 'description', 'artwork_count', 'children_count', 'created_at']

    def get_artwork_count(self, obj):
        return obj.artworks.count()

    def get_children_count(self, obj):
        return obj.children.count()


class AdminOrderSerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(source='customer.username', read_only=True)
    item_count = serializers.SerializerMethodField()

    class Meta:
        model = Order
        fields = ['id', 'customer', 'customer_name', 'subtotal', 'shipping_cost', 'total',
                  'status', 'payment_status', 'item_count', 'created_at']

    def get_item_count(self, obj):
        return obj.items.count()
