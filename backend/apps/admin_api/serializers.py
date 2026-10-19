from django.db.models import Count
from rest_framework import serializers
from django.contrib.auth import get_user_model
from apps.users.models import User, ArtistProfile, ArtistApplication
from apps.artworks.models import Artwork, Category
from apps.artworks.watermark import artwork_image_url
from apps.artworks.html_sanitizer import clean_rich_text
from apps.orders.models import Order, OrderItem, OrderShipment, ShippingAddress


class AdminUserSerializer(serializers.ModelSerializer):
    artwork_count = serializers.SerializerMethodField()
    is_artist = serializers.SerializerMethodField()
    avatar = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'role', 'is_active', 'date_joined', 'artwork_count', 'is_artist', 'avatar', 'first_name', 'last_name']

    def get_avatar(self, obj):
        return obj.avatar.url if obj.avatar else None

    def get_artwork_count(self, obj):
        return getattr(obj, 'artwork_count', obj.artworks.count()) if hasattr(obj, 'artwork_count') else 0

    def get_is_artist(self, obj):
        return hasattr(obj, 'artist_profile') and obj.artist_profile.status == 'approved'


class AdminArtistProfileSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    email = serializers.CharField(source='user.email', read_only=True)

    class Meta:
        model = ArtistProfile
        fields = ['id', 'username', 'email', 'status', 'verified_badge', 'bio', 'created_at']


class AdminUserDetailSerializer(serializers.ModelSerializer):
    avatar = serializers.SerializerMethodField()
    artwork_count = serializers.SerializerMethodField()
    is_artist = serializers.SerializerMethodField()
    artist_profile = serializers.SerializerMethodField()
    artwork_stats = serializers.SerializerMethodField()
    recent_artworks = serializers.SerializerMethodField()
    order_count = serializers.SerializerMethodField()
    sold_count = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'role', 'is_active', 'date_joined',
            'first_name', 'last_name', 'avatar', 'artwork_count', 'is_artist',
            'artist_profile', 'artwork_stats', 'recent_artworks', 'order_count', 'sold_count',
        ]

    def get_avatar(self, obj):
        return obj.avatar.url if obj.avatar else None

    def get_artwork_count(self, obj):
        return obj.artworks.count()

    def get_is_artist(self, obj):
        return hasattr(obj, 'artist_profile') and obj.artist_profile.status == 'approved'

    def get_artist_profile(self, obj):
        if not hasattr(obj, 'artist_profile'):
            return None
        p = obj.artist_profile
        specialties = p.specialties or []
        resolved = []
        for s in specialties:
            if isinstance(s, str) and len(s) == 36:
                cat = Category.objects.filter(id=s).first()
                resolved.append(cat.name if cat else s)
            else:
                resolved.append(str(s))
        return {
            'status': p.status,
            'verified_badge': p.verified_badge,
            'bio': p.bio,
            'province': p.province,
            'district': p.district,
            'specialties': resolved,
            'commission_available': p.commission_available,
            'commission_starting_price': float(p.commission_starting_price) if p.commission_starting_price else None,
            'commission_estimated_days': p.commission_estimated_days,
            'social_links': p.social_links or {},
            'cover_image': p.cover_image.url if p.cover_image else None,
            'created_at': p.created_at,
        }

    def get_artwork_stats(self, obj):
        qs = obj.artworks.values('status').annotate(c=Count('id'))
        stats = {'total': 0, 'published': 0, 'pending_review': 0, 'draft': 0, 'removed': 0}
        for row in qs:
            stats['total'] += row['c']
            stats[row['status']] = row['c']
        return stats

    def get_recent_artworks(self, obj):
        arts = obj.artworks.prefetch_related('images').order_by('-created_at')[:6]
        result = []
        for a in arts:
            img = a.images.filter(is_primary=True).first() or a.images.first()
            result.append({
                'id': str(a.id),
                'title': a.title,
                'price': float(a.price),
                'type': a.type,
                'status': a.status,
                'primary_image': artwork_image_url(img.id, size='thumb') if img else None,
            })
        return result

    def get_order_count(self, obj):
        return obj.orders.count()

    def get_sold_count(self, obj):
        return OrderItem.objects.filter(artist=obj, order__payment_status='paid').count()


class AdminApplicationSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    email = serializers.CharField(source='user.email', read_only=True)
    reviewed_by = serializers.SerializerMethodField()

    class Meta:
        model = ArtistApplication
        fields = ['id', 'username', 'email', 'status', 'reason', 'bio', 'specialties', 'social_links', 'portfolio_samples', 'rejection_reason',
                  'reviewed_by', 'reviewed_at', 'created_at']

    def get_reviewed_by(self, obj):
        return obj.reviewed_by.username if obj.reviewed_by else None


class AdminArtworkSerializer(serializers.ModelSerializer):
    artist_name = serializers.CharField(source='artist.username', read_only=True)
    category_name = serializers.CharField(source='category.name', read_only=True)
    primary_image = serializers.SerializerMethodField()

    class Meta:
        model = Artwork
        fields = ['id', 'title', 'artist', 'artist_name', 'category', 'category_name',
                  'price', 'type', 'status', 'is_featured', 'primary_image', 'created_at']

    def get_primary_image(self, obj):
        img = obj.images.filter(is_primary=True).first() or obj.images.first()
        return artwork_image_url(img.id, size='thumb') if img else None


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
    customer_email = serializers.CharField(source='customer.email', read_only=True)
    item_count = serializers.SerializerMethodField()
    cancelled_by_name = serializers.SerializerMethodField()

    class Meta:
        model = Order
        fields = ['id', 'customer', 'customer_name', 'customer_email', 'subtotal', 'shipping_cost', 'total',
                  'status', 'payment_status', 'item_count', 'cancellation_reason', 'cancelled_by_name', 'created_at']

    def get_item_count(self, obj):
        return obj.items.count()

    def get_cancelled_by_name(self, obj):
        return obj.cancelled_by.username if obj.cancelled_by else None


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
        img = obj.artwork.images.filter(is_primary=True).first() or obj.artwork.images.first()
        return artwork_image_url(img.id, size='thumb') if img else None

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
    password = serializers.CharField(write_only=True, min_length=6, required=False, allow_blank=True, default='')
    first_name = serializers.CharField(max_length=150, required=False, default='')
    last_name = serializers.CharField(max_length=150, required=False, default='')
    province = serializers.CharField(max_length=100, required=False, default='')
    district = serializers.CharField(max_length=100, required=False, default='')
    bio = serializers.CharField(max_length=10000, required=False, allow_blank=True, default='')
    specialties = serializers.ListField(
        child=serializers.CharField(max_length=255),
        required=False,
        default=list,
    )
    commission_available = serializers.BooleanField(required=False, default=False)
    commission_starting_price = serializers.DecimalField(
        max_digits=10, decimal_places=2, required=False, allow_null=True, default=None
    )

    def validate_username(self, value):
        value = value.strip()
        User = get_user_model()
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError('Username already exists.')
        return value

    def validate_email(self, value):
        value = value.strip().lower()
        User = get_user_model()
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError('Email already exists.')
        return value

    def validate_password(self, value):
        return (value or '').strip()

    def validate_bio(self, value):
        return clean_rich_text(value)

    def validate_province(self, value):
        return (value or '').strip()

    def validate_district(self, value):
        return (value or '').strip()

    def validate_specialties(self, value):
        return [s.strip() for s in value if s and s.strip()]


class AdminOrderDetailSerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(source='customer.username', read_only=True)
    customer_email = serializers.CharField(source='customer.email', read_only=True)
    cancelled_by_name = serializers.SerializerMethodField()
    items = AdminOrderItemSerializer(many=True, read_only=True)
    shipping_address = serializers.SerializerMethodField()

    class Meta:
        model = Order
        fields = ['id', 'customer', 'customer_name', 'customer_email', 'shipping_address',
                  'subtotal', 'shipping_cost', 'total', 'status', 'payment_status',
                  'cancellation_reason', 'cancelled_by_name',
                  'items', 'created_at', 'updated_at']

    def get_cancelled_by_name(self, obj):
        return obj.cancelled_by.username if obj.cancelled_by else None

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
