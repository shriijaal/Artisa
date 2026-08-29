from datetime import timedelta

from django.utils import timezone

INTERACTION_WEIGHTS = {
    'view': 1.0,
    'favorite': 3.0,
    'cart_add': 5.0,
    'purchase': 10.0,
    'commission': 5.0,
    'profile_view': 1.0,
}

DEDUPED_TYPES = {'view', 'profile_view'}
DEDUP_WINDOW = timedelta(hours=1)


def log_interaction(user, target_type, target_id, interaction_type):
    """Create a UserInteraction with correct weight, deduplicating rapid repeat views/profile views."""
    from apps.recs.models import UserInteraction

    weight = INTERACTION_WEIGHTS.get(interaction_type, 1.0)

    if interaction_type in DEDUPED_TYPES:
        cutoff = timezone.now() - DEDUP_WINDOW
        if UserInteraction.objects.filter(
            user=user,
            target_type=target_type,
            target_id=target_id,
            interaction_type=interaction_type,
            created_at__gte=cutoff,
        ).exists():
            return None

    try:
        return UserInteraction.objects.create(
            user=user,
            target_type=target_type,
            target_id=target_id,
            interaction_type=interaction_type,
            weight=weight,
        )
    except Exception:
        return None
