import logging
from pathlib import Path

from django.conf import settings
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.utils.html import strip_tags

logger = logging.getLogger(__name__)

BASE_DIR = Path(__file__).resolve().parent.parent.parent
TEMPLATE_DIR = BASE_DIR / 'templates' / 'emails'


def _send(subject, template_name, context, recipient_list):
    """Render an HTML email template and send it. Falls back to plain text."""
    try:
        html_message = render_to_string(f'emails/{template_name}', context)
        plain_message = strip_tags(html_message)
        send_mail(
            subject=subject,
            message=plain_message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=recipient_list,
            html_message=html_message,
            fail_silently=True,
        )
        logger.info(f'Email sent: {subject} -> {recipient_list}')
    except Exception as e:
        logger.error(f'Failed to send email "{subject}" to {recipient_list}: {e}')


# --- Auth emails ---

def send_welcome_email(user):
    _send(
        subject='Welcome to Artisa!',
        template_name='welcome.html',
        context={'user': user, 'site_url': settings.KHALTI_WEBSITE_URL},
        recipient_list=[user.email],
    )


def send_password_reset_email(user, reset_link):
    _send(
        subject='Artisa - Reset Your Password',
        template_name='password_reset.html',
        context={'user': user, 'reset_link': reset_link},
        recipient_list=[user.email],
    )


# --- Artist application emails ---

def send_artist_approved_email(user):
    _send(
        subject='Your Artist Application Has Been Approved!',
        template_name='artist_approved.html',
        context={'user': user, 'site_url': settings.KHALTI_WEBSITE_URL},
        recipient_list=[user.email],
    )


def send_artist_rejected_email(user, reason):
    _send(
        subject='Artist Application Update',
        template_name='artist_rejected.html',
        context={'user': user, 'reason': reason, 'site_url': settings.KHALTI_WEBSITE_URL},
        recipient_list=[user.email],
    )


# --- Order emails ---

def send_order_confirmation_email(order):
    _send(
        subject=f'Artisa - Order #{str(order.id)[:8]} Confirmed',
        template_name='order_confirmation.html',
        context={'order': order, 'site_url': settings.KHALTI_WEBSITE_URL},
        recipient_list=[order.customer.email],
    )


def send_payment_confirmation_email(order):
    _send(
        subject=f'Artisa - Payment Received for Order #{str(order.id)[:8]}',
        template_name='payment_confirmation.html',
        context={'order': order, 'site_url': settings.KHALTI_WEBSITE_URL},
        recipient_list=[order.customer.email],
    )


def send_shipping_notification_email(order, shipment):
    _send(
        subject=f'Artisa - Your Order #{str(order.id)[:8]} Has Shipped',
        template_name='shipping_notification.html',
        context={
            'order': order,
            'shipment': shipment,
            'site_url': settings.KHALTI_WEBSITE_URL,
        },
        recipient_list=[order.customer.email],
    )


def send_delivery_notification_email(order, shipment):
    _send(
        subject=f'Artisa - Order #{str(order.id)[:8]} Delivered',
        template_name='delivery_notification.html',
        context={
            'order': order,
            'shipment': shipment,
            'site_url': settings.KHALTI_WEBSITE_URL,
        },
        recipient_list=[order.customer.email],
    )


# --- Commission emails ---

def send_new_commission_email(commission):
    _send(
        subject=f'Artisa - New Commission Request from {commission.customer.username}',
        template_name='new_commission.html',
        context={'commission': commission, 'site_url': settings.KHALTI_WEBSITE_URL},
        recipient_list=[commission.artist.email],
    )


def send_commission_accepted_email(commission):
    _send(
        subject=f'Artisa - Your Commission Has Been Accepted!',
        template_name='commission_accepted.html',
        context={'commission': commission, 'site_url': settings.KHALTI_WEBSITE_URL},
        recipient_list=[commission.customer.email],
    )


def send_commission_started_email(commission):
    _send(
        subject=f'Artisa - Commission Work Has Started',
        template_name='commission_started.html',
        context={'commission': commission, 'site_url': settings.KHALTI_WEBSITE_URL},
        recipient_list=[commission.customer.email],
    )


def send_commission_declined_email(commission, reason=''):
    _send(
        subject=f'Artisa - Commission Update',
        template_name='commission_declined.html',
        context={
            'commission': commission,
            'reason': reason or commission.rejection_reason,
            'site_url': settings.KHALTI_WEBSITE_URL,
        },
        recipient_list=[commission.customer.email],
    )


def send_commission_delivered_email(commission):
    _send(
        subject=f'Artisa - Your Commission Has Been Delivered',
        template_name='commission_delivered.html',
        context={'commission': commission, 'site_url': settings.KHALTI_WEBSITE_URL},
        recipient_list=[commission.customer.email],
    )


def send_commission_completed_email(commission):
    _send(
        subject=f'Artisa - Commission Completed!',
        template_name='commission_completed.html',
        context={'commission': commission, 'site_url': settings.KHALTI_WEBSITE_URL},
        recipient_list=[commission.artist.email],
    )


def send_commission_revision_email(commission):
    _send(
        subject=f'Artisa - Revision Requested on Commission',
        template_name='commission_revision.html',
        context={'commission': commission, 'site_url': settings.KHALTI_WEBSITE_URL},
        recipient_list=[commission.artist.email],
    )


def send_commission_cancelled_email(commission, cancelled_by=None):
    other_party = commission.artist if cancelled_by == commission.customer else commission.customer
    _send(
        subject=f'Artisa - Commission Cancelled',
        template_name='commission_cancelled.html',
        context={
            'commission': commission,
            'cancelled_by': cancelled_by,
            'site_url': settings.KHALTI_WEBSITE_URL,
        },
        recipient_list=[other_party.email],
    )
