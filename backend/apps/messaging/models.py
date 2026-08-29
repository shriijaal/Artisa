import uuid

from django.db import models
from django.conf import settings


class Message(models.Model):
    class Meta:
        db_table = 'messages'
        ordering = ['created_at']

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    sender = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='sent_messages')
    receiver = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='received_messages')
    commission = models.ForeignKey('commissions.Commission', on_delete=models.CASCADE, null=True, blank=True, related_name='messages')
    body = models.TextField()
    read_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Message from {self.sender.username} to {self.receiver.username}"
