"""
Generate colorful placeholder images for artworks that don't have images yet.
Run with: python manage.py seed_artwork_images
"""
import random
from io import BytesIO
from django.core.management.base import BaseCommand
from django.core.files.base import ContentFile
from PIL import Image, ImageDraw, ImageFont
from apps.artworks.models import Artwork, ArtworkImage


# Warm, earthy palette inspired by Nepali art
PALETTES = [
    ((139, 69, 19), (210, 180, 140)),    # saddle brown / tan
    ((128, 0, 0), (255, 218, 185)),       # maroon / peach
    ((85, 107, 47), (245, 245, 220)),     # dark olive / beige
    ((72, 61, 139), (230, 230, 250)),     # dark slate blue / lavender
    ((139, 90, 43), (255, 228, 196)),     # brown / bisque
    ((0, 100, 0), (200, 230, 200)),       # dark green / light green
    ((178, 34, 34), (255, 192, 203)),     # firebrick / pink
    ((70, 130, 180), (200, 220, 240)),    # steel blue / light blue
    ((184, 134, 11), (255, 239, 200)),    # dark goldenrod / light gold
    ((128, 128, 0), (245, 245, 200)),     # olive / light yellow
    ((160, 82, 45), (255, 228, 196)),     # sienna / bisque
    ((100, 60, 40), (220, 200, 170)),     # dark brown / warm tan
]


def generate_placeholder_image(title, idx, width=800, height=1000):
    bg_color, fg_color = PALETTES[idx % len(PALETTES)]
    img = Image.new('RGB', (width, height), bg_color)
    draw = ImageDraw.Draw(img)

    # Draw subtle geometric pattern
    overlay = Image.new('RGBA', (width, height), (0, 0, 0, 0))
    odraw = ImageDraw.Draw(overlay)
    for i in range(0, width + height, 60):
        odraw.line([(i, 0), (0, i)], fill=(*fg_color, 40), width=2)
        odraw.line([(i, height), (width, i - height)], fill=(*fg_color, 25), width=1)

    img = Image.alpha_composite(img.convert('RGBA'), overlay).convert('RGB')

    # Add a centered circle with subtle pattern
    cx, cy = width // 2, height // 2
    r = min(width, height) // 4
    draw = ImageDraw.Draw(img)
    draw.ellipse([cx - r, cy - r, cx + r, cy + r], fill=fg_color, outline=bg_color, width=3)

    # Inner pattern
    r2 = r // 2
    draw.ellipse([cx - r2, cy - r2, cx + r2, cy + r2], outline=bg_color, width=2)

    # Title text (truncated)
    try:
        font = ImageFont.truetype("arial.ttf", 28)
    except OSError:
        font = ImageFont.load_default()
    short_title = title[:20] + ('...' if len(title) > 20 else '')
    bbox = draw.textbbox((0, 0), short_title, font=font)
    tw = bbox[2] - bbox[0]
    draw.text(((width - tw) // 2, height - 60), short_title, fill=(255, 255, 255, 200), font=font)

    buf = BytesIO()
    img.save(buf, format='JPEG', quality=85)
    return buf.getvalue()


class Command(BaseCommand):
    help = 'Generate placeholder images for artworks without images'

    def add_arguments(self, parser):
        parser.add_argument('--limit', type=int, default=0, help='Limit number of artworks to process (0=all)')

    def handle(self, *args, **options):
        limit = options['limit']
        artworks_without_images = Artwork.objects.filter(
            status='published',
            images__isnull=True
        ).order_by('created_at')

        if limit:
            artworks_without_images = artworks_without_images[:limit]

        count = artworks_without_images.count()
        self.stdout.write(f'Processing {count} artworks without images...')

        created = 0
        for idx, artwork in enumerate(artworks_without_images):
            img_data = generate_placeholder_image(artwork.title, idx)
            filename = f'artwork_{artwork.id}.jpg'

            img = ArtworkImage(artwork=artwork, is_primary=True)
            img.image.save(filename, ContentFile(img_data), save=True)
            created += 1

            if created % 20 == 0:
                self.stdout.write(f'  Created {created}/{count} images...')

        self.stdout.write(self.style.SUCCESS(f'Done! Created {created} artwork images.'))
