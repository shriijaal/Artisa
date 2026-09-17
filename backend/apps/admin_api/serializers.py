from rest_framework import serializers
from django.contrib.auth import get_user_model
from apps.users.models import User, ArtistProfile, ArtistApplication
from apps.artworks.models import Artwork, Category
from apps.orders.models import Order, OrderItem, OrderShipment, ShippingAddress


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
        fields = ['id', 'username', 'email', 'status', 'reason', 'bio', 'specialties', 'social_links', 'rejection_reason',
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
    children_names = serializers.SerializerMethodField()

    class Meta:
        model = Category
        fields = ['id', 'name', 'slug', 'parent', 'description', 'artwork_count', 'children_count', 'children_names', 'created_at']

    def get_artwork_count(self, obj):
        return obj.artworks.count()

    def get_children_count(self, obj):
        return obj.children.count()

    def get_children_names(self, obj):
        return list(obj.children.values_list('name', flat=True).order_by('name'))


class AdminOrderSerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(source='customer.username', read_only=True)
    item_count = serializers.SerializerMethodField()
    cancelled_by_name = serializers.CharField(source='cancelled_by.username', read_only=True, default=None)

    class Meta:
        model = Order
        fields = ['id', 'customer', 'customer_name', 'subtotal', 'shipping_cost', 'total',
                  'status', 'payment_status', 'item_count', 'cancellation_reason', 'cancelled_by_name', 'created_at']

    def get_item_count(self, obj):
        return obj.items.count()


class AdminOrderItemSerializer(serializers.ModelSerializer):
    artwork_title = serializers.CharField(source='artwork.title', read_only=True)
    artwork_type = serializers.CharField(source='artwork.type', read_only=True)
    artist_name = serializers.CharField(source='artist.username', read_only=True)
    primary_image = serializers.SerializerMethodField()
    shipment = serializers.SerializerMethodField()

    class Meta:
        model = OrderItem
        fields = ['id', 'artwork_title', 'artwork_type', 'artist_name', 'primary_image',
                  'price', 'quantity', 'shipment']

    def get_primary_image(self, obj):
        img = obj.artwork.images.filter(is_primary=True).first()
        if img:
            return img.image.url
        img = obj.artwork.images.first()
        return img.image.url if img else None

    def get_shipment(self, obj):
        try:
            s = obj.shipment
            return {
                'id': str(s.id),
                'tracking_number': s.tracking_number,
                'status': s.status,
                'shipped_at': s.shipped_at,
                'delivered_at': s.delivered_at,
            }
        except OrderShipment.DoesNotExist:
            return None


class AdminCreateVendorSerializer(serializers.Serializer):
    username = serializers.CharField(max_length=150)
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, min_length=6)
    first_name = serializers.CharField(max_length=150, required=False, default='')
    last_name = serializers.CharField(max_length=150, required=False, default='')

    def validate_username(self, value):
        User = get_user_model()
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError('Username already exists.')
        return value

    def validate_email(self, value):
        User = get_user_model()
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError('Email already exists.')
        return value


class AdminOrderDetailSerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(source='customer.username', read_only=True)
    customer_email = serializers.CharField(source='customer.email', read_only=True)
    cancelled_by_name = serializers.CharField(source='cancelled_by.username', read_only=True, default=None)
    items = AdminOrderItemSerializer(many=True, read_only=True)
    shipping_address = serializers.SerializerMethodField()

    class Meta:
        model = Order
        fields = ['id', 'customer', 'customer_name', 'customer_email', 'shipping_address',
                  'subtotal', 'shipping_cost', 'total', 'status', 'payment_status',
                  'cancellation_reason', 'cancelled_by_name',
                  'items', 'created_at', 'updated_at']

    def get_shipping_address(self, obj):
        if not obj.shipping_address:
            return None
        sa = obj.shipping_address
        return {
            'recipient_name': sa.recipient_name,
            'province': sa.province,
            'district': sa.district,
            'city': sa.city,
            'street': sa.street,
            'landmark': sa.landmark,
            'phone': sa.phone,
        }
