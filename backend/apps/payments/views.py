import logging
import uuid as uuid_lib
from django.conf import settings
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from django.db import transaction

from apps.orders.models import Order, OrderItem
from apps.payments.models import Payment
from apps.payments.khalti import initiate_khalti_payment, verify_khalti_payment

logger = logging.getLogger(__name__)

# Khalti statuses that indicate the user should NOT receive service
KHALTI_FAILED_STATUSES = {'Expired', 'User canceled', 'Pending', 'Initiated'}


class KhaltiInitiateView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        order_id = request.data.get('order_id')

        if not order_id:
            return Response({'error': 'order_id is required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            order_uuid = uuid_lib.UUID(str(order_id))
        except (ValueError, AttributeError):
            return Response({'error': 'Invalid order_id format'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            order = Order.objects.get(id=order_uuid, customer=request.user)
        except Order.DoesNotExist:
            return Response({'error': 'Order not found'}, status=status.HTTP_404_NOT_FOUND)

        if order.payment_status == Order.PaymentStatus.PAID:
            return Response({'error': 'Order is already paid'}, status=status.HTTP_400_BAD_REQUEST)

        # Build a human-readable purchase order name from order items
        order_items = OrderItem.objects.filter(order=order).select_related('artwork')
        if order_items.exists():
            first_title = order_items.first().artwork.title
            item_count = order_items.count()
            purchase_order_name = first_title if item_count == 1 else f"{first_title} +{item_count - 1} more"
        else:
            purchase_order_name = f'Order {str(order.id)[:8]}'

        # Build product details for Khalti
        product_details = []
        for item in order_items:
            product_details.append({
                'identity': str(item.artwork.id),
                'name': item.artwork.title,
                'total_price': int(float(item.price) * item.quantity * 100),
                'quantity': item.quantity,
                'unit_price': int(float(item.price) * 100),
            })

        # Build amount breakdown
        amount_breakdown = [
            {'label': 'Subtotal', 'amount': int(float(order.subtotal) * 100)},
        ]
        if order.shipping_cost > 0:
            amount_breakdown.append({'label': 'Shipping', 'amount': int(float(order.shipping_cost) * 100)})

        # Create a Pending Payment Record
        payment = Payment.objects.create(
            payable_type='order',
            payable_id=order.id,
            amount=order.total,
            status=Payment.Status.PENDING,
        )

        customer_info = {
            'name': f'{request.user.first_name} {request.user.last_name}'.strip() or request.user.username,
            'email': request.user.email or '',
            'phone': getattr(request.user, 'phone_number', '') or '',
        }

        # Construct the return URL for Khalti callback
        frontend_origin = settings.KHALTI_WEBSITE_URL
        return_url = f'{frontend_origin}/payment-verify?order_id={order.id}&payment_id={payment.id}'

        # Call Khalti
        khalti_res = initiate_khalti_payment(
            order_id=order.id,
            amount_in_rs=order.total,
            purchase_order_name=purchase_order_name,
            customer_info=customer_info,
            return_url=return_url,
            product_details=product_details if product_details else None,
        )

        if 'pidx' in khalti_res and 'payment_url' in khalti_res:
            payment.khalti_transaction_id = khalti_res['pidx']
            payment.save(update_fields=['khalti_transaction_id'])
            return Response({
                'payment_url': khalti_res['payment_url'],
                'pidx': khalti_res['pidx'],
            })
        else:
            logger.error('Khalti initiate failed for order %s: %s', order.id, khalti_res)
            error_detail = khalti_res.get('detail', 'Failed to initiate payment')
            return Response(
                {'error': 'Failed to initiate payment', 'details': khalti_res},
                status=status.HTTP_502_BAD_GATEWAY,
            )


class KhaltiVerifyView(APIView):
    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def post(self, request):
        pidx = request.data.get('pidx')
        payment_id = request.data.get('payment_id')

        if not pidx or not payment_id:
            return Response({'error': 'pidx and payment_id are required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            payment_uuid = uuid_lib.UUID(str(payment_id))
        except (ValueError, AttributeError):
            return Response({'error': 'Invalid payment_id format'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            payment = Payment.objects.get(id=payment_uuid, khalti_transaction_id=pidx)
        except Payment.DoesNotExist:
            return Response({'error': 'Payment record not found'}, status=status.HTTP_404_NOT_FOUND)

        if payment.status == Payment.Status.COMPLETED:
            return Response({'status': 'Already verified'})

        # Verify with Khalti
        khalti_res = verify_khalti_payment(pidx)

        if 'error_key' in khalti_res:
            logger.error('Khalti lookup error for pidx %s: %s', pidx, khalti_res)
            return Response(
                {'error': 'Could not reach Khalti API', 'details': khalti_res},
                status=status.HTTP_502_BAD_GATEWAY,
            )

        khalti_status = khalti_res.get('status')
        logger.info('Khalti verify response for pidx %s: status=%s', pidx, khalti_status)

        if khalti_status == 'Completed':
            payment.status = Payment.Status.COMPLETED
            payment.save(update_fields=['status'])

            if payment.payable_type == 'order':
                try:
                    order = Order.objects.get(id=payment.payable_id)
                    order.payment_status = Order.PaymentStatus.PAID
                    order.save(update_fields=['payment_status'])

                    from apps.recs.utils import log_interaction
                    for item in order.items.all():
                        log_interaction(
                            user=request.user,
                            target_type='artwork',
                            target_id=item.artwork.id,
                            interaction_type='purchase',
                        )
                except Order.DoesNotExist:
                    logger.error('Order %s not found during payment verification', payment.payable_id)

            return Response({'status': 'Payment verified successfully'})

        elif khalti_status == 'Refunded':
            payment.status = Payment.Status.REFUNDED
            payment.save(update_fields=['status'])
            return Response({'status': 'Payment was refunded'}, status=status.HTTP_400_BAD_REQUEST)

        elif khalti_status in ('Expired', 'User canceled'):
            payment.status = Payment.Status.FAILED
            payment.save(update_fields=['status'])
            return Response(
                {'error': f'Payment {khalti_status.lower()}', 'khalti_status': khalti_status},
                status=status.HTTP_400_BAD_REQUEST,
            )

        else:
            # Pending, Initiated, Partially Refunded, or unknown
            return Response(
                {'error': 'Payment not yet confirmed', 'khalti_status': khalti_status, 'details': khalti_res},
                status=status.HTTP_400_BAD_REQUEST,
            )
