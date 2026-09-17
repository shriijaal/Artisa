import logging
from datetime import timedelta

from django.utils import timezone

from apps.commissions.models import Commission

logger = logging.getLogger(__name__)

STALE_PENDING_DAYS = 7


def auto_cancel_stale_pending():
    """Auto-cancel pending commissions where deadline + STALE_PENDING_DAYS has passed.

    This is a 'lazy' approach — called when relevant views are accessed,
    so no Celery/scheduler is needed.

    Returns the number of commissions cancelled.
    """
    threshold = timezone.now().date() - timedelta(days=STALE_PENDING_DAYS)
    stale = Commission.objects.filter(
        status=Commission.Status.PENDING,
        deadline__lt=threshold,
    )

    count = 0
    for commission in stale:
        commission.status = Commission.Status.CANCELLED
        commission.rejection_reason = 'Auto-cancelled: artist did not respond within the allowed time.'
        commission.save()
        try:
            from apps.core.email import _send
            from django.conf import settings
            _send(
                subject='Artisa - Commission Auto-Cancelled',
                template_name='commission_cancelled.html',
                context={
                    'commission': commission,
                    'cancelled_by': None,
                    'site_url': settings.KHALTI_WEBSITE_URL,
                },
                recipient_list=[commission.customer.email],
            )
        except Exception:
            logger.warning(f'Failed to send auto-cancel email for commission {commission.id}')
        count += 1

    if count:
        logger.info(f'Auto-cancelled {count} stale pending commissions')

    return count
