"""
Import real artwork images from the Artworks folder into the database.
Creates artwork entries with proper titles, descriptions, categories, and prices.
"""
import os
import shutil
from django.core.management.base import BaseCommand
from django.core.files import File
from django.conf import settings
from django.db import transaction
from apps.users.models import User
from apps.artworks.models import Artwork, ArtworkImage, ArtworkTag, Category


# Artwork definitions: (filename, title, description, category_slug, price, art_type, tags)
NIKKI_ARTWORKS = [
    (
        'nikki_arts___3970162149484109563.jpg',
        'Mountain Village',
        'A detailed pen and ink drawing of a traditional Nepali mountain village with snow-capped peaks in the background. The piece captures the rugged beauty of rural Nepal with intricate linework showing wooden houses, stone paths, and the majestic Himalayan landscape.',
        'traditional-art',
        4500,
        'physical',
        ['pen-ink', 'landscape', 'nepal', 'mountains', 'village', 'himalayan'],
    ),
    (
        'nikki_arts___3973699054808903089.jpg',
        'Temple Guardians',
        'A striking pen and ink illustration of a Nepali temple entrance flanked by traditional guardian statues — elephants, lions, and warrior figures. A woman in a sari walks through the ancient gateway, adding a sense of scale and life to the architectural study.',
        'traditional-art',
        5000,
        'physical',
        ['pen-ink', 'temple', 'architecture', 'nepal', 'culture', 'heritage'],
    ),
    (
        'nikki_arts___3759133938569460169.jpg',
        'Cosmic Mandala',
        'A mesmerizing framed mandala painting in deep blue and gold tones. The intricate circular design features layers of detailed patterns, metallic accents, and symbolic motifs radiating from a central point. A meditative piece that draws the viewer inward.',
        'traditional-art',
        12000,
        'physical',
        ['mandala', 'meditation', 'gold', 'blue', 'decorative', 'spiritual'],
    ),
]

RAZEECHAN_ARTWORKS = [
    (
        'razeechan_3859672783488370954.jpg',
        'Moonlit Balcony',
        'An impressionist oil painting of a serene balcony overlooking a moonlit landscape. Warm golden light spills from a doorway onto ornate wrought-iron furniture while a full moon illuminates the distant hills and water below. Rich blues and yellows create a dreamy nocturnal atmosphere.',
        'paintings',
        15000,
        'physical',
        ['oil-painting', 'impressionist', 'moonlight', 'landscape', 'nocturnal', 'balcony'],
    ),
    (
        'razeechan_3671539518604669181.jpg',
        'Gaze',
        'A hauntingly beautiful charcoal and watercolor portrait of a young woman with short dark hair. The monochromatic palette captures deep emotion through her expressive eyes, while watercolor washes add atmospheric depth. A study in light, shadow, and introspection.',
        'paintings',
        8000,
        'physical',
        ['portrait', 'charcoal', 'watercolor', 'monochrome', 'expressive', 'figure'],
    ),
    (
        'razeechan_3555493643891220703.jpg',
        'Hillside Cottage',
        'A vibrant oil painting of a charming white cottage with a terracotta roof nestled in rolling green hills. Lush gardens burst with wildflowers around a quaint garden table, while golden sunlight bathes the entire pastoral scene. Painted on canvas, displayed on an easel.',
        'paintings',
        18000,
        'physical',
        ['oil-painting', 'landscape', 'cottage', 'garden', 'pastoral', 'vibrant'],
    ),
    (
        'razeechan_3054758991296650603.jpg',
        'Forest Light',
        'A luminous oil painting capturing sunlight streaming through a dense forest canopy. Brilliant rays of golden light pierce through layers of green foliage, illuminating delicate leaves and branches. A celebration of nature\'s cathedral of light.',
        'paintings',
        16000,
        'physical',
        ['oil-painting', 'nature', 'forest', 'sunlight', 'green', 'atmospheric'],
    ),
]

OJESH_ARTWORKS = [
    (
        '_ojesh_tuchhen__2580704748041887453.jpg',
        'Midnight Wanderer',
        'A minimalist painting of a black cat silhouette against cool blue and white tones. The cat peers around a corner with one glowing eye visible, creating a mysterious and contemplative mood. A study in negative space and subtle contrast.',
        'paintings',
        6000,
        'physical',
        ['painting', 'cat', 'minimalist', 'silhouette', 'blue', 'contemporary'],
    ),
    (
        '_ojesh_tuchhen__2259600128876493796.jpg',
        'Solitary Shade',
        'A striking minimalist ink wash painting of a lone figure standing beneath an impossibly tall, slender tree. The vast white space emphasizes the relationship between human and nature — small yet connected. A meditative composition with beautiful tonal gradations.',
        'traditional-art',
        7000,
        'physical',
        ['ink-wash', 'minimalist', 'tree', 'figure', 'landscape', 'contemplative'],
    ),
    (
        '_ojesh_tuchhen__3907018858416841371.jpg',
        'The Old Homestead',
        'A stylized digital illustration of a rustic farmhouse with an orange corrugated roof beside a massive, twisted ancient tree. A winding dirt road leads to the door under a dramatic textured sky. Rich warm tones and painterly textures evoke rural Nepali life.',
        'digital-art',
        5000,
        'digital',
        ['digital-illustration', 'landscape', 'rural', 'nepal', 'house', 'tree'],
    ),
    (
        '_ojesh_tuchhen__2596537742258244272.jpg',
        'Golden Hour Friends',
        'A warm digital illustration of three friends sitting on a brick wall at sunset, gazing at a distant horizon. Their relaxed postures and casual school clothes evoke nostalgia for youthful summer evenings. A bicycle leans against the wall nearby.',
        'digital-art',
        5500,
        'digital',
        ['digital-illustration', 'friendship', 'sunset', 'nostalgia', 'youth', 'warm-tones'],
    ),
]

JESHIKA_ARTWORKS = [
    (
        'tangledillustration_3889667275170549757.jpg',
        'Pride of Nepal',
        'A majestic digital illustration of the Nepali flag fluttering atop an ornate iron gate against a luminous golden sky. Clouds and light particles create an ethereal, patriotic atmosphere. A tribute to Nepal\'s unique identity and spirit.',
        'digital-art',
        4000,
        'digital',
        ['digital-illustration', 'nepal', 'flag', 'patriotic', 'golden', 'majestic'],
    ),
    (
        'tangledillustration_3859244801564107264.jpg',
        'The Lotus Bearer',
        'A stunning oil painting of a Nepali woman in traditional black and red sari, adorned with gold jewelry, holding a delicate pink lotus flower. Her serene expression and elegant posture convey grace and cultural pride. Gallery exhibition piece.',
        'paintings',
        25000,
        'physical',
        ['oil-painting', 'portrait', 'nepal', 'traditional', 'woman', 'lotus', 'cultural'],
    ),
    (
        'tangledillustration_3834601373229580646.jpg',
        'Hearthside Tales',
        'A rich watercolor painting depicting a traditional Nepali kitchen scene. An elderly woman tends to clay pots and utensils in a warmly lit interior. Earthy tones and loose brushwork capture the intimate atmosphere of domestic life.',
        'paintings',
        9000,
        'physical',
        ['watercolor', 'interior', 'nepal', 'traditional', 'kitchen', 'cultural', 'storytelling'],
    ),
    (
        'tangledillustration_3788192171397718684.jpg',
        'Afternoon Companions',
        'A charming digital illustration of a young girl with braided hair leaning down to greet a small cat against a vibrant yellow wall. Warm afternoon light creates long shadows. A tender moment of connection between human and animal.',
        'digital-art',
        4500,
        'digital',
        ['digital-illustration', 'cat', 'girl', 'yellow', 'warm', 'gentle', 'afternoon'],
    ),
    (
        'tangledillustration_3788192171288672725.jpg',
        'Midnight Petals',
        'A luminous digital painting of three delicate pink lilies with golden stamens against a deep blue textured background. Petals catch soft light, revealing subtle color gradations from cream to blush pink. Botanical elegance captured in digital medium.',
        'digital-art',
        3500,
        'digital',
        ['digital-illustration', 'floral', 'lilies', 'pink', 'blue', 'botanical', 'elegant'],
    ),
    (
        'tangledillustration_3756302164416049524.jpg',
        'Sacred Waters',
        'A breathtaking digital painting of colorful prayer flags stretching across a mirror-still mountain lake. The water perfectly reflects snow-capped Himalayan peaks, a lone tree, and the vibrant flags. Clouds drift across a brilliant blue sky. A quintessential Nepali highland scene.',
        'digital-art',
        5500,
        'digital',
        ['digital-illustration', 'prayer-flags', 'lake', 'mountains', 'nepal', 'reflection', 'himalayan'],
    ),
    (
        'tangledillustration_3721497088565165505.jpg',
        'Monsoon Reflections',
        'A moody digital illustration of a woman in traditional dress sitting in an arched doorway during a rainstorm, a small white cat keeping her company. Rain streaks catch the dim light while the aged green walls and ornate lotus carving above the door tell stories of time. Atmospheric and cinematic.',
        'digital-art',
        5000,
        'digital',
        ['digital-illustration', 'rain', 'monsoon', 'cat', 'traditional', 'atmospheric', 'nepal'],
    ),
]

SOURCE_DIR = r'D:\6th Semester Summer Project\artisa\Artworks'


class Command(BaseCommand):
    help = 'Import artwork images from the Artworks folder into the database'

    def add_arguments(self, parser):
        parser.add_argument('--dry-run', action='store_true', help='Show what would be imported without importing')

    def handle(self, *args, **options):
        dry_run = options['dry_run']

        if dry_run:
            self.stdout.write(self.style.WARNING('DRY RUN — no artworks will be created'))
            self._show_plan()
            return

        self.stdout.write('Importing artworks...')

        media_artworks = os.path.join(settings.MEDIA_ROOT, 'artworks', 'images')
        os.makedirs(media_artworks, exist_ok=True)

        with transaction.atomic():
            count = self._import_artist('nikki_arts_', NIKKI_ARTWORKS, media_artworks, folder='nikki_arts__')
            count += self._import_artist('razeechan', RAZEECHAN_ARTWORKS, media_artworks)
            count += self._import_artist('_ojesh_tuchhen_', OJESH_ARTWORKS, media_artworks)
            count += self._import_artist('tangledillustration', JESHIKA_ARTWORKS, media_artworks)

        self.stdout.write(self.style.SUCCESS(f'Imported {count} artworks'))

    def _import_artist(self, username, artworks, media_dir, folder=None):
        user = User.objects.get(username=username)
        folder_name = folder or username
        category_map = {c.slug: c for c in Category.objects.all()}
        count = 0

        for filename, title, description, cat_slug, price, art_type, tags in artworks:
            # Source path
            artist_dir = os.path.join(SOURCE_DIR, folder_name)
            src = os.path.join(artist_dir, filename)

            if not os.path.exists(src):
                self.stdout.write(self.style.WARNING(f'  Skipped (file not found): {filename}'))
                continue

            # Create artwork
            artwork = Artwork.objects.create(
                artist=user,
                title=title,
                description=description,
                price=price,
                type=art_type,
                category=category_map[cat_slug],
                status=Artwork.Status.PUBLISHED,
                originality_confirmed=True,
                is_featured=False,
            )

            # Copy image to media
            dst_filename = f'{username}_{filename}'
            dst = os.path.join(media_dir, dst_filename)
            shutil.copy2(src, dst)

            # Create artwork image
            ArtworkImage.objects.create(
                artwork=artwork,
                image=f'artworks/images/{dst_filename}',
                is_primary=True,
            )

            # Create tags
            for tag in tags:
                ArtworkTag.objects.create(artwork=artwork, tag=tag)

            self.stdout.write(f'  Created: {title} ({username})')
            count += 1

        return count

    def _show_plan(self):
        all_artworks = [
            ('nikki_arts_', NIKKI_ARTWORKS),
            ('razeechan', RAZEECHAN_ARTWORKS),
            ('_ojesh_tuchhen_', OJESH_ARTWORKS),
            ('tangledillustration', JESHIKA_ARTWORKS),
        ]
        total = 0
        for username, artworks in all_artworks:
            self.stdout.write(f'\n{username}:')
            for _, title, _, cat, price, _, _ in artworks:
                self.stdout.write(f'  {title} — Rs {price:,} ({cat})')
                total += 1
        self.stdout.write(f'\nTotal: {total} artworks')
