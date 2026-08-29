import uuid

from django.db import models
from django.conf import settings


class Commission(models.Model):
    class Status(models.TextChoices):
        PENDING = 'pending', 'Pending'
        ACCEPTED = 'accepted', 'Accepted'
        IN_PROGRESS = 'in_progress', 'In Progress'
        DELIVERED = 'delivered', 'Delivered'
        COMPLETED = 'completed', 'Completed'
        CANCELLED = 'cancelled', 'Cancelled'
        DECLINED = 'declined', 'Declined'

    class Meta:
        db_table = 'commissions'
        ordering = ['-created_at']

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    customer = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='commission_requests')
    artist = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='commission_assignments')
    title = models.CharField(max_length=255)
    description = models.TextField()
    budget_min = models.DecimalField(max_digits=10, decimal_places=2)
    budget_max = models.DecimalField(max_digits=10, decimal_places=2)
    reference_images = models.JSONField(default=list, blank=True)
    deadline = models.DateField()
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    revision_limit = models.IntegerField(default=2)
    current_revision = models.IntegerField(default=0)
    rejection_reason = models.TextField(blank=True)
    response_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Commission: {self.title} ({self.status})"


class CommissionDeliverable(models.Model):
    class Meta:
        db_table = 'commission_deliverables'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    commission = models.ForeignKey(Commission, on_delete=models.CASCADE, related_name='deliverables')
    file = models.FileField(upload_to='commissions/deliverables/')
    notes = models.TextField(blank=True)
    revision_number = models.IntegerField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Deliverable rev{self.revision_number} for {self.commission.title}"


class CommissionReferenceImage(models.Model):
    class Meta:
        db_table = 'commission_reference_images'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    commission = models.ForeignKey(
        Commission,
        on_delete=models.CASCADE,
        related_name='reference_image_objects',
        null=True,
        blank=True,
    )
    image = models.ImageField(upload_to='commissions/references/')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Reference image for {self.commission.title}"

