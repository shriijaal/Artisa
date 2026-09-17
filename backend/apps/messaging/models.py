import uuid

from django.db import models
from django.conf import settings


def message_attachment_path(instance, filename):
    return f'messages/attachments/{instance.sender_id}/{filename}'


class Message(models.Model):
    class MessageType(models.TextChoices):
        TEXT = 'text', 'Text'
        IMAGE = 'image', 'Image'
        FILE = 'file', 'File'

    class Meta:
        db_table = 'messages'
        ordering = ['created_at']

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    sender = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='sent_messages')
    receiver = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='received_messages')
    commission = models.ForeignKey('commissions.Commission', on_delete=models.CASCADE, null=True, blank=True, related_name='messages')
    artwork = models.ForeignKey('artworks.Artwork', on_delete=models.SET_NULL, null=True, blank=True, related_name='inquiries')
    body = models.TextField(blank=True, default='')
    message_type = models.CharField(max_length=10, choices=MessageType.choices, default=MessageType.TEXT)
    attachment = models.FileField(upload_to=message_attachment_path, null=True, blank=True)
    reply_to = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True, related_name='replies')
    read_at = models.DateTimeField(null=True, blank=True)
    edited_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Message from {self.sender.username} to {self.receiver.username}"


class MessageReaction(models.Model):
    class Meta:
        db_table = 'message_reactions'
        unique_together = ('message', 'user')

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    message = models.ForeignKey(Message, on_delete=models.CASCADE, related_name='reactions')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='message_reactions')
    emoji = models.CharField(max_length=8)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} reacted {self.emoji} on {self.message_id}"
