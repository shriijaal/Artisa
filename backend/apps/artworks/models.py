import uuid

from django.db import models
from django.conf import settings


class Category(models.Model):
    class Meta:
        db_table = 'categories'
        verbose_name_plural = 'Categories'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    slug = models.SlugField(max_length=255, unique=True)
    parent = models.ForeignKey('self', on_delete=models.CASCADE, null=True, blank=True, related_name='children')
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name


class Artwork(models.Model):
    class Type(models.TextChoices):
        PHYSICAL = 'physical', 'Physical'
        DIGITAL = 'digital', 'Digital'

    class Status(models.TextChoices):
        DRAFT = 'draft', 'Draft'
        PENDING_REVIEW = 'pending_review', 'Pending Review'
        PUBLISHED = 'published', 'Published'
        REMOVED = 'removed', 'Removed'

    class StockStatus(models.TextChoices):
        IN_STOCK = 'in_stock', 'In Stock'
        LOW_STOCK = 'low_stock', 'Low Stock'
        SOLD_OUT = 'sold_out', 'Sold Out'
        PRE_ORDER = 'pre_order', 'Pre-order'
        MADE_TO_ORDER = 'made_to_order', 'Made to Order'
        RESERVED = 'reserved', 'Reserved'
        COMING_SOON = 'coming_soon', 'Coming Soon'

    class Meta:
        db_table = 'artworks'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['status']),
            models.Index(fields=['category']),
            models.Index(fields=['artist']),
            models.Index(fields=['type']),
        ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    artist = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='artworks')
    title = models.CharField(max_length=255)
    description = models.TextField()
    price = models.DecimalField(max_digits=10, decimal_places=2)
    type = models.CharField(max_length=20, choices=Type.choices)
    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name='artworks')
    stock = models.IntegerField(null=True, blank=True)  # null for digital
    stock_status = models.CharField(max_length=20, choices=StockStatus.choices, default=StockStatus.IN_STOCK, null=True, blank=True)
    width = models.FloatField(null=True, blank=True, help_text='Width in cm')
    height = models.FloatField(null=True, blank=True, help_text='Height in cm')
    depth = models.FloatField(null=True, blank=True, help_text='Depth in cm (for 3D artworks)')
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.DRAFT)
    originality_confirmed = models.BooleanField(default=False)
    is_featured = models.BooleanField(default=False)  # For featured badge
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.title} by {self.artist.username}"


class ArtworkImage(models.Model):
    class Meta:
        db_table = 'artwork_images'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    artwork = models.ForeignKey(Artwork, on_delete=models.CASCADE, related_name='images')
    image = models.ImageField(upload_to='artworks/images/')
    thumbnail = models.ImageField(upload_to='artworks/thumbnails/', blank=True)
    is_primary = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Image for {self.artwork.title}"


class ArtworkTag(models.Model):
    class Meta:
        db_table = 'artwork_tags'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    artwork = models.ForeignKey(Artwork, on_delete=models.CASCADE, related_name='tags')
    tag = models.CharField(max_length=100)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.tag} for {self.artwork.title}"


class DigitalFile(models.Model):
    class Meta:
        db_table = 'digital_files'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    artwork = models.OneToOneField(Artwork, on_delete=models.CASCADE, related_name='digital_file')
    file = models.FileField(upload_to='artworks/digital/')
    preview_image = models.ImageField(upload_to='artworks/previews/', blank=True)
    download_count = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Digital file for {self.artwork.title}"
