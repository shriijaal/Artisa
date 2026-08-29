import uuid

from django.db import models
from django.conf import settings


class UserInteraction(models.Model):
    class InteractionType(models.TextChoices):
        VIEW = 'view', 'View'
        FAVORITE = 'favorite', 'Favorite'
        CART_ADD = 'cart_add', 'Cart Add'
        PURCHASE = 'purchase', 'Purchase'
        COMMISSION = 'commission', 'Commission'
        PROFILE_VIEW = 'profile_view', 'Profile View'

    class Meta:
        db_table = 'user_interactions'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user']),
            models.Index(fields=['target_type', 'target_id']),
            models.Index(fields=['interaction_type']),
            models.Index(fields=['created_at']),
        ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='interactions')
    target_type = models.CharField(max_length=20)  # 'artwork' or 'artist'
    target_id = models.UUIDField()
    interaction_type = models.CharField(max_length=20, choices=InteractionType.choices)
    weight = models.FloatField(default=1.0)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} {self.interaction_type} on {self.target_type} {self.target_id}"


class RecommendationCache(models.Model):
    class Meta:
        db_table = 'recommendation_cache'
        unique_together = ['user', 'target_type']

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='recommendation_caches')
    target_type = models.CharField(max_length=20)  # 'artwork' or 'artist'
    target_ids = models.JSONField(default=list)  # List of UUIDs
    computed_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Recommendations for {self.user.username} ({self.target_type})"
