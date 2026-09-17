import uuid

from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils import timezone


class User(AbstractUser):
    class Role(models.TextChoices):
        CUSTOMER = 'customer', 'Customer'
        ADMIN = 'admin', 'Admin'

    role = models.CharField(
        max_length=20,
        choices=Role.choices,
        default=Role.CUSTOMER,
    )
    avatar = models.ImageField(upload_to='users/avatars/', blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.username} ({self.role})"


class ArtistProfile(models.Model):
    class Status(models.TextChoices):
        NONE = 'none', 'None'
        PENDING = 'pending', 'Pending'
        APPROVED = 'approved', 'Approved'
        REJECTED = 'rejected', 'Rejected'

    class Meta:
        db_table = 'artist_profiles'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='artist_profile')
    bio = models.TextField(blank=True)
    cover_image = models.ImageField(upload_to='artists/covers/', blank=True, null=True)
    social_links = models.JSONField(default=dict, blank=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.NONE)
    verified_badge = models.BooleanField(default=False)
    commission_available = models.BooleanField(default=False)
    commission_will_do = models.TextField(blank=True, default='')
    commission_wont_do = models.TextField(blank=True, default='')
    commission_description = models.TextField(blank=True, default='')
    commission_categories = models.JSONField(default=list, blank=True)
    commission_starting_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    commission_estimated_days = models.IntegerField(null=True, blank=True)
    province = models.CharField(max_length=100, blank=True, default='')
    specialties = models.JSONField(default=list, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Artist profile for {self.user.username}"


class ArtistApplication(models.Model):
    class Status(models.TextChoices):
        PENDING = 'pending', 'Pending'
        APPROVED = 'approved', 'Approved'
        REJECTED = 'rejected', 'Rejected'

    class Meta:
        db_table = 'artist_applications'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='artist_applications')
    portfolio_samples = models.JSONField(default=list)
    verification_document = models.FileField(upload_to='artists/verification/', blank=True, null=True)
    reason = models.TextField()
    bio = models.TextField(blank=True, default='')
    specialties = models.JSONField(default=list, blank=True)
    social_links = models.JSONField(default=dict, blank=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    rejection_reason = models.TextField(blank=True)
    reviewed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='reviewed_applications')
    reviewed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Application by {self.user.username} ({self.status})"


class Favorite(models.Model):
    class Meta:
        db_table = 'favorites'
        unique_together = ('user', 'artwork_id')

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='favorites')
    artwork_id = models.UUIDField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username}'s favorite artwork"
