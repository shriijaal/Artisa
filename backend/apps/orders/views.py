from django.utils import timezone
from decimal import Decimal
import hashlib
import hmac
import time
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.http import FileResponse, Http404
from django.conf import settings

from apps.artworks.models import Artwork, DigitalFile
from apps.users.permissions import IsApprovedArtist
from apps.orders.models import CartItem, ShippingAddress, Order, OrderItem, OrderShipment
from apps.orders.serializers import (
    CartItemSerializer, 
    ShippingAddressSerializer, 
    OrderSerializer, 
    OrderItemSerializer, 
    OrderShipmentSerializer
)
from apps.core.email import (
    send_order_confirmation_email,
    send_payment_confirmation_email,
    send_shipping_notification_email,
    send_delivery_notification_email,
)


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def cart(request):
    if request.method == 'GET':
        cart_items = CartItem.objects.filter(user=request.user)
        serializer = CartItemSerializer(cart_items, many=True)
        return Response(serializer.data)
    
    elif request.method == 'POST':
        serializer = CartItemSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            artwork_id = serializer.validated_data['artwork_id']
            quantity = serializer.validated_data.get('quantity', 1)
            
            # Log cart_add interaction
            from apps.recs.utils import log_interaction
            log_interaction(
                user=request.user,
                target_type='artwork',
                target_id=artwork_id,
                interaction_type='cart_add',
            )
            
            # Get or create cart item
            cart_item, created = CartItem.objects.get_or_create(
                user=request.user,
                artwork_id=artwork_id,
                defaults={'quantity': quantity}
            )
            
            if not created:
                cart_item.quantity += quantity
                cart_item.save()
            
            return Response(CartItemSerializer(cart_item).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
def cart_item_detail(request, item_id):
    try:
        cart_item = CartItem.objects.get(id=item_id, user=request.user)
    except CartItem.DoesNotExist:
        return Response({'error': 'Cart item not found'}, status=status.HTTP_404_NOT_FOUND)
    
    if request.method == 'PUT':
        serializer = CartItemSerializer(cart_item, data=request.data, partial=True, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    elif request.method == 'DELETE':
        cart_item.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def clear_cart(request):
    CartItem.objects.filter(user=request.user).delete()
    return Response(status=status.HTTP_204_NO_CONTENT)


# --- SHIPPING ADDRESS VIEWS ---

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def shipping_addresses(request):
    if request.method == 'GET':
        addresses = ShippingAddress.objects.filter(user=request.user)
        serializer = ShippingAddressSerializer(addresses, many=True)
        return Response(serializer.data)
        
    elif request.method == 'POST':
        serializer = ShippingAddressSerializer(data=request.data)
        if serializer.is_valid():
            if serializer.validated_data.get('is_default', False):
                ShippingAddress.objects.filter(user=request.user).update(is_default=False)
            
            address = serializer.save(user=request.user)
            return Response(ShippingAddressSerializer(address).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
def shipping_address_detail(request, address_id):
    try:
        address = ShippingAddress.objects.get(id=address_id, user=request.user)
    except ShippingAddress.DoesNotExist:
        return Response({'error': 'Address not found'}, status=status.HTTP_404_NOT_FOUND)
        
    if request.method == 'PUT':
        serializer = ShippingAddressSerializer(address, data=request.data, partial=True)
        if serializer.is_valid():
            if serializer.validated_data.get('is_default', False):
                ShippingAddress.objects.filter(user=request.user).exclude(id=address_id).update(is_default=False)
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
    elif request.method == 'DELETE':
        address.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# --- ORDER VIEWS ---

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def orders(request):
    if request.method == 'GET':
        orders_list = Order.objects.filter(customer=request.user).order_by('-created_at')
        serializer = OrderSerializer(orders_list, many=True)
        return Response(serializer.data)
        
    elif request.method == 'POST':
        address_id = request.data.get('shipping_address_id')
        address_obj = None
        
        cart_items = CartItem.objects.filter(user=request.user)
        if not cart_items.exists():
            return Response({'error': 'Your cart is empty'}, status=status.HTTP_400_BAD_REQUEST)
            
        has_physical = any(item.artwork.type == Artwork.Type.PHYSICAL for item in cart_items)
        
        if has_physical:
            if address_id:
                try:
                    address_obj = ShippingAddress.objects.get(id=address_id, user=request.user)
                except ShippingAddress.DoesNotExist:
                    return Response({'error': 'Shipping address not found'}, status=status.HTTP_404_NOT_FOUND)
            else:
                province = request.data.get('province')
                district = request.data.get('district')
                city = request.data.get('city')
                street = request.data.get('street')
                phone = request.data.get('phone')
                if not all([province, district, city, street, phone]):
                    return Response({'error': 'Shipping address details are required for physical items'}, status=status.HTTP_400_BAD_REQUEST)
                
                address_obj = ShippingAddress.objects.create(
                    user=request.user,
                    province=province,
                    district=district,
                    city=city,
                    street=street,
                    phone=phone
                )

        # Check stock for physical items
        for item in cart_items:
            artwork = item.artwork
            if artwork.type == Artwork.Type.PHYSICAL:
                if artwork.stock is not None and artwork.stock < item.quantity:
                    return Response({'error': f"Artwork '{artwork.title}' has insufficient stock. Available: {artwork.stock}"}, status=status.HTTP_400_BAD_REQUEST)

        # Calculate totals
        subtotal = sum(item.artwork.price * item.quantity for item in cart_items)
        shipping_cost = Decimal('150.00') if has_physical else Decimal('0.00')
        total = subtotal + shipping_cost

        # Create Order
        order = Order.objects.create(
            customer=request.user,
            shipping_address=address_obj,
            subtotal=subtotal,
            shipping_cost=shipping_cost,
            total=total,
            status=Order.Status.PENDING,
            payment_status=Order.PaymentStatus.PENDING
        )

        # Create OrderItems and OrderShipments
        for item in cart_items:
            artwork = item.artwork
            order_item = OrderItem.objects.create(
                order=order,
                artwork=artwork,
                artist=artwork.artist,
                price=artwork.price,
                quantity=item.quantity
            )
            OrderShipment.objects.create(
                order_item=order_item,
                status=OrderShipment.Status.PENDING
            )
            # Decrement physical artwork stock
            if artwork.type == Artwork.Type.PHYSICAL and artwork.stock is not None:
                artwork.stock -= item.quantity
                artwork.save()

        # Clear cart
        cart_items.delete()

        send_order_confirmation_email(order)
        return Response(OrderSerializer(order).data, status=status.HTTP_201_CREATED)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def order_detail(request, order_id):
    try:
        order = Order.objects.get(id=order_id, customer=request.user)
    except Order.DoesNotExist:
        # Check if the user is the artist for any item in the order
        if OrderItem.objects.filter(order_id=order_id, artist=request.user).exists():
            try:
                order = Order.objects.get(id=order_id)
            except Order.DoesNotExist:
                return Response({'error': 'Order not found'}, status=status.HTTP_404_NOT_FOUND)
        else:
            return Response({'error': 'Order not found'}, status=status.HTTP_404_NOT_FOUND)
            
    serializer = OrderSerializer(order)
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def mock_pay_order(request, order_id):
    try:
        order = Order.objects.get(id=order_id, customer=request.user)
    except Order.DoesNotExist:
        return Response({'error': 'Order not found'}, status=status.HTTP_404_NOT_FOUND)
        
    if order.payment_status == Order.PaymentStatus.PAID:
        return Response({'message': 'Order is already paid'}, status=status.HTTP_400_BAD_REQUEST)
        
    order.payment_status = Order.PaymentStatus.PAID
    order.status = Order.Status.PROCESSING
    order.save()
    
    send_payment_confirmation_email(order)

    # Log purchase interactions
    from apps.recs.utils import log_interaction
    for item in order.items.all():
        log_interaction(
            user=request.user,
            target_type='artwork',
            target_id=item.artwork.id,
            interaction_type='purchase',
        )
        
    return Response(OrderSerializer(order).data)


# --- ARTIST ORDER FULFILLMENT VIEWS ---

@api_view(['GET'])
@permission_classes([IsAuthenticated, IsApprovedArtist])
def artist_orders(request):
    order_items = OrderItem.objects.filter(artist=request.user).order_by('-created_at')
    serializer = OrderItemSerializer(order_items, many=True)
    return Response(serializer.data)


@api_view(['PUT'])
@permission_classes([IsAuthenticated, IsApprovedArtist])
def update_shipment(request, shipment_id):
    try:
        shipment = OrderShipment.objects.get(id=shipment_id, order_item__artist=request.user)
    except OrderShipment.DoesNotExist:
        return Response({'error': 'Shipment not found'}, status=status.HTTP_404_NOT_FOUND)
        
    tracking_number = request.data.get('tracking_number', shipment.tracking_number)
    shipment_status = request.data.get('status')
    
    if shipment_status not in OrderShipment.Status.values:
        return Response({'error': 'Invalid status'}, status=status.HTTP_400_BAD_REQUEST)
        
    shipment.tracking_number = tracking_number
    shipment.status = shipment_status
    
    if shipment_status == OrderShipment.Status.SHIPPED and not shipment.shipped_at:
        shipment.shipped_at = timezone.now()
    elif shipment_status == OrderShipment.Status.DELIVERED and not shipment.delivered_at:
        shipment.delivered_at = timezone.now()
        
    shipment.save()
    
    # Sync overall order status if applicable
    order = shipment.order_item.order
    order_items = order.items.all()
    shipments = [getattr(item, 'shipment', None) for item in order_items]
    
    if all(s and s.status == OrderShipment.Status.DELIVERED for s in shipments):
        order.status = Order.Status.DELIVERED
        order.save()
        send_delivery_notification_email(order, shipment)
    elif all(s and s.status in [OrderShipment.Status.SHIPPED, OrderShipment.Status.DELIVERED] for s in shipments):
        order.status = Order.Status.SHIPPED
        order.save()
        send_shipping_notification_email(order, shipment)
        
    return Response(OrderShipmentSerializer(shipment).data)


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsApprovedArtist])
def artist_earnings(request):
    sold_items = OrderItem.objects.filter(artist=request.user, order__payment_status=Order.PaymentStatus.PAID)
    
    total_earnings = sum(item.price * item.quantity for item in sold_items)
    sales_count = sum(item.quantity for item in sold_items)
    
    breakdown = []
    for item in sold_items:
        breakdown.append({
            'order_id': item.order.id,
            'created_at': item.order.created_at,
            'artwork_title': item.artwork.title,
            'artwork_type': item.artwork.type,
            'price': float(item.price),
            'quantity': item.quantity,
            'earnings': float(item.price * item.quantity),
            'shipment_status': item.shipment.status if hasattr(item, 'shipment') else 'pending'
        })
        
    return Response({
        'total_earnings': float(total_earnings),
        'sales_count': sales_count,
        'orders': breakdown
    })


# --- SECURE DIGITAL DOWNLOAD VIEWS ---

def _generate_download_token(order_id, artwork_id, user_id):
    """Generate an HMAC-signed, time-limited download token."""
    expiry = int(time.time()) + settings.DOWNLOAD_TOKEN_EXPIRY_SECONDS
    payload = f'{order_id}:{artwork_id}:{user_id}:{expiry}'
    sig = hmac.new(
        settings.DOWNLOAD_TOKEN_SECRET.encode(),
        payload.encode(),
        hashlib.sha256,
    ).hexdigest()
    return f'{expiry}.{sig}'


def _verify_download_token(order_id, artwork_id, user_id, token):
    """Verify a download token. Returns True if valid and not expired."""
    try:
        expiry_str, sig = token.split('.', 1)
        expiry = int(expiry_str)
    except (ValueError, AttributeError):
        return False

    if time.time() > expiry:
        return False

    expected_payload = f'{order_id}:{artwork_id}:{user_id}:{expiry}'
    expected_sig = hmac.new(
        settings.DOWNLOAD_TOKEN_SECRET.encode(),
        expected_payload.encode(),
        hashlib.sha256,
    ).hexdigest()
    return hmac.compare_digest(sig, expected_sig)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def generate_download_token(request, order_id, item_id):
    """Generate a time-limited signed token for downloading a digital artwork."""
    try:
        order = Order.objects.get(id=order_id, customer=request.user)
    except Order.DoesNotExist:
        return Response({'error': 'Order not found'}, status=status.HTTP_404_NOT_FOUND)

    if order.payment_status != Order.PaymentStatus.PAID:
        return Response({'error': 'Order is not paid'}, status=status.HTTP_403_FORBIDDEN)

    try:
        order_item = OrderItem.objects.get(id=item_id, order=order)
    except OrderItem.DoesNotExist:
        return Response({'error': 'Order item not found'}, status=status.HTTP_404_NOT_FOUND)

    if order_item.artwork.type != Artwork.Type.DIGITAL:
        return Response({'error': 'Artwork is not digital'}, status=status.HTTP_400_BAD_REQUEST)

    if not hasattr(order_item.artwork, 'digital_file'):
        return Response({'error': 'No digital file available'}, status=status.HTTP_404_NOT_FOUND)

    token = _generate_download_token(str(order_id), str(order_item.artwork.id), str(request.user.id))

    return Response({
        'token': token,
        'expires_in': settings.DOWNLOAD_TOKEN_EXPIRY_SECONDS,
        'download_url': f'/api/orders/{order_id}/download/{item_id}/?token={token}',
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def download_digital_file_signed(request, order_id, item_id):
    """Serve a digital file using a signed time-limited token."""
    token = request.query_params.get('token')
    if not token:
        return Response({'error': 'Download token is required'}, status=status.HTTP_400_BAD_REQUEST)

    if not _verify_download_token(str(order_id), str(item_id), str(request.user.id), token):
        return Response({'error': 'Invalid or expired download token'}, status=status.HTTP_403_FORBIDDEN)

    try:
        order = Order.objects.get(id=order_id, customer=request.user)
    except Order.DoesNotExist:
        return Response({'error': 'Order not found'}, status=status.HTTP_404_NOT_FOUND)

    if order.payment_status != Order.PaymentStatus.PAID:
        return Response({'error': 'Order is not paid'}, status=status.HTTP_403_FORBIDDEN)

    try:
        order_item = OrderItem.objects.get(id=item_id, order=order)
    except OrderItem.DoesNotExist:
        return Response({'error': 'Order item not found'}, status=status.HTTP_404_NOT_FOUND)

    artwork = order_item.artwork
    if artwork.type != Artwork.Type.DIGITAL:
        return Response({'error': 'Artwork is not digital'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        digital_file = artwork.digital_file
    except DigitalFile.DoesNotExist:
        return Response({'error': 'Digital file not found'}, status=status.HTTP_404_NOT_FOUND)

    if not digital_file.file:
        raise Http404('File not found on server')

    digital_file.download_count += 1
    digital_file.save(update_fields=['download_count'])

    try:
        file_handle = digital_file.file.open('rb')
        filename = digital_file.file.name.split('/')[-1]
        return FileResponse(file_handle, as_attachment=True, filename=filename)
    except Exception:
        return Response({'error': 'Error reading file on server'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
