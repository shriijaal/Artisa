import logging

from apps.notifications.models import Notification

logger = logging.getLogger(__name__)


def create_notification(*, recipient, actor, kind, title, body, link, allow_self=False):
    """Best-effort in-app notification.

    Never raises: a failed notification must not break the business flow
    (same posture as the fail-silent emails, but failures are logged).
    Skips self-notifications unless allow_self=True (receipts such as
    "payment confirmed", where the actor is the recipient).
    """
    try:
        if recipient is None or not recipient.is_active:
            return None
        if recipient == actor and not allow_self:
            return None
        return Notification.objects.create(
            recipient=recipient,
            actor=actor,
            kind=kind,
            title=title[:120],
            body=body[:255],
            link=link[:255],
        )
    except Exception:
        logger.exception(
            'Failed to create notification (%s -> %s)',
            kind,
            getattr(recipient, 'username', recipient),
        )
        return None
