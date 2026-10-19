import uuid

from django.conf import settings
from django.db import models


class Notification(models.Model):
    class Kind(models.TextChoices):
        COMMISSION_NEW = 'commission_new', 'New commission request'
        COMMISSION_ACCEPTED = 'commission_accepted', 'Commission accepted'
        COMMISSION_STARTED = 'commission_started', 'Commission started'
        COMMISSION_DECLINED = 'commission_declined', 'Commission declined'
        COMMISSION_DELIVERED = 'commission_delivered', 'Commission delivered'
        COMMISSION_COMPLETED = 'commission_completed', 'Commission completed'
        COMMISSION_REVISION = 'commission_revision', 'Revision requested'
        COMMISSION_CANCELLED = 'commission_cancelled', 'Commission cancelled'
        ORDER_NEW = 'order_new', 'New order received'
        ORDER_ACCEPTED = 'order_accepted', 'Order accepted'
        ORDER_REJECTED = 'order_rejected', 'Order rejected'
        ORDER_SHIPPED = 'order_shipped', 'Order shipped'
        ORDER_DELIVERED = 'order_delivered', 'Order delivered'
        ORDER_CANCELLED = 'order_cancelled', 'Order cancelled'
        PAYMENT_CONFIRMED = 'payment_confirmed', 'Payment confirmed'
        APPLICATION_APPROVED = 'application_approved', 'Artist application approved'
        APPLICATION_REJECTED = 'application_rejected', 'Artist application rejected'

    class Meta:
        db_table = 'notifications'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['recipient', 'read_at']),
            models.Index(fields=['recipient', '-created_at']),
        ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    recipient = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='notifications',
    )
    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='notifications_actor',
    )
    kind = models.CharField(max_length=32, choices=Kind.choices)
    title = models.CharField(max_length=120)
    body = models.CharField(max_length=255)
    link = models.CharField(max_length=255)
    read_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    @property
    def is_read(self):
        return self.read_at is not None

    def __str__(self):
        return f'{self.kind} -> {self.recipient.username}'
