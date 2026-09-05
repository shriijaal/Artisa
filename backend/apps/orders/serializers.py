from rest_framework import serializers

from apps.artworks.serializers import ArtworkSerializer
from apps.orders.models import CartItem, ShippingAddress, Order, OrderItem, OrderShipment


class CartItemSerializer(serializers.ModelSerializer):
    artwork = ArtworkSerializer(read_only=True)
    artwork_id = serializers.UUIDField(write_only=True)
    
    class Meta:
        model = CartItem
        fields = ('id', 'artwork', 'artwork_id', 'quantity', 'created_at', 'updated_at')
        read_only_fields = ('id', 'created_at', 'updated_at')

    def validate_quantity(self, value):
        if value < 1:
            raise serializers.ValidationError("Quantity must be at least 1")
        return value

    def validate(self, data):
        # Check if artwork exists and is published
        artwork_id = data.get('artwork_id')
        if artwork_id:
            from apps.artworks.models import Artwork
            try:
                artwork = Artwork.objects.get(id=artwork_id, status=Artwork.Status.PUBLISHED)
            except Artwork.DoesNotExist:
                raise serializers.ValidationError({"artwork_id": "Artwork not found or not published"})
            
            # For digital artworks, quantity must be 1
            if artwork.type == Artwork.Type.DIGITAL and data.get('quantity', 1) > 1:
                raise serializers.ValidationError({"quantity": "Digital artworks can only have quantity of 1"})
        
        return data


class ShippingAddressSerializer(serializers.ModelSerializer):
    class Meta:
        model = ShippingAddress
        fields = ('id', 'user', 'recipient_name', 'province', 'district', 'city', 'street', 'landmark', 'phone', 'is_default')
        read_only_fields = ('id', 'user')


class OrderShipmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderShipment
        fields = ('id', 'tracking_number', 'status', 'shipped_at', 'delivered_at', 'created_at', 'updated_at')
        read_only_fields = ('id', 'created_at', 'updated_at')


class OrderItemSerializer(serializers.ModelSerializer):
    artwork = ArtworkSerializer(read_only=True)
    shipment = OrderShipmentSerializer(read_only=True)
    customer_username = serializers.CharField(source='order.customer.username', read_only=True)
    order_status = serializers.CharField(source='order.status', read_only=True)
    order_payment_status = serializers.CharField(source='order.payment_status', read_only=True)
    order_id = serializers.UUIDField(source='order.id', read_only=True)

    class Meta:
        model = OrderItem
        fields = (
            'id', 'order_id', 'artwork', 'artist', 'price', 'quantity', 
            'shipment', 'customer_username', 'order_status', 'order_payment_status', 'created_at'
        )
        read_only_fields = (
            'id', 'order_id', 'artwork', 'artist', 'price', 'quantity', 
            'shipment', 'customer_username', 'order_status', 'order_payment_status', 'created_at'
        )


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    shipping_address = ShippingAddressSerializer(read_only=True)
    customer_username = serializers.CharField(source='customer.username', read_only=True)

    class Meta:
        model = Order
        fields = (
            'id', 'customer', 'customer_username', 'shipping_address', 'subtotal', 'shipping_cost', 
            'total', 'status', 'payment_status', 'items', 'created_at', 'updated_at'
        )
        read_only_fields = ('id', 'customer', 'subtotal', 'shipping_cost', 'total', 'status', 'payment_status', 'created_at', 'updated_at')
