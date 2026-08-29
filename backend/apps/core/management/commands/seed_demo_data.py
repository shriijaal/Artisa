import random
import uuid
from decimal import Decimal
from datetime import date, timedelta

from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.utils import timezone

from apps.artworks.models import Category, Artwork, ArtworkTag, DigitalFile
from apps.users.models import ArtistProfile

User = get_user_model()


class Command(BaseCommand):
    help = 'Seed demo data for testing'

    def handle(self, *args, **options):
        self.stdout.write('Seeding demo data...')

        # Create admin user
        admin = self.create_admin_user()
        self.stdout.write(f'Created admin user: {admin.username}')

        # Create categories
        categories = self.create_categories()
        self.stdout.write(f'Created {len(categories)} categories')

        # Create artists
        artists = self.create_artists(10)
        self.stdout.write(f'Created {len(artists)} artists')

        # Create artworks
        artworks = self.create_artworks(artists, categories, 50)
        self.stdout.write(f'Created {len(artworks)} artworks')

        # Create tags
        tags = self.create_tags(artworks)
        self.stdout.write(f'Created {len(tags)} tags')

        # Create interactions for CF clusters
        interaction_count = self.create_interactions(artists, artworks)
        self.stdout.write(f'Created {interaction_count} interactions')

        self.stdout.write(self.style.SUCCESS('Demo data seeded successfully!'))

    def create_admin_user(self):
        admin, created = User.objects.get_or_create(
            username='admin',
            defaults={
                'email': 'admin@artisa.com',
                'role': User.Role.ADMIN,
                'is_staff': True,
                'is_superuser': True,
            }
        )
        if created:
            admin.set_password('admin123')
            admin.save()
        return admin

    def create_categories(self):
        category_data = [
            ('Paintings', 'paintings'),
            ('Sculptures', 'sculptures'),
            ('Digital Art', 'digital-art'),
            ('Photography', 'photography'),
            ('Traditional Art', 'traditional-art'),
            ('Mixed Media', 'mixed-media'),
        ]

        categories = []
        for name, slug in category_data:
            category, created = Category.objects.get_or_create(
                slug=slug,
                defaults={'name': name}
            )
            categories.append(category)

        return categories

    def create_artists(self, count):
        artists = []
        for i in range(count):
            username = f'artist{i+1}'
            user, created = User.objects.get_or_create(
                username=username,
                defaults={
                    'email': f'{username}@artisa.com',
                    'role': User.Role.CUSTOMER,
                    'first_name': f'Artist{i+1}',
                    'last_name': f'Name{i+1}',
                }
            )
            if created:
                user.set_password('artist123')
                user.save()

            # Create artist profile
            profile, created = ArtistProfile.objects.get_or_create(
                user=user,
                defaults={
                    'bio': f'Talented artist specializing in various art forms.',
                    'status': ArtistProfile.Status.APPROVED,
                    'verified_badge': True,
                }
            )
            artists.append(user)

        return artists

    def create_artworks(self, artists, categories, count):
        artworks = []
        artwork_titles = [
            'Mountain Sunrise', 'City Lights', 'Forest Dreams', 'Ocean Waves',
            'Desert Sunset', 'Urban Jungle', 'Rural Life', 'Abstract Thoughts',
            'Portrait of Nature', 'Modern Times', 'Ancient Wisdom', 'Future Vision',
            'Colorful Chaos', 'Peaceful Moment', 'Dynamic Energy', 'Silent Reflection',
            'Bold Expression', 'Soft Whispers', 'Loud Colors', 'Quiet Harmony',
        ]

        for i in range(count):
            artist = random.choice(artists)
            category = random.choice(categories)
            title = artwork_titles[i % len(artwork_titles)] + f' {i+1}'
            
            is_digital = random.choice([True, False])
            artwork_type = Artwork.Type.DIGITAL if is_digital else Artwork.Type.PHYSICAL
            
            artwork = Artwork.objects.create(
                artist=artist,
                title=title,
                description=f'A beautiful {category.name.lower()} piece created with passion.',
                price=Decimal(random.randint(1000, 50000)),
                type=artwork_type,
                category=category,
                stock=random.randint(1, 10) if not is_digital else None,
                status=Artwork.Status.PUBLISHED,
                originality_confirmed=True,
            )
            artworks.append(artwork)

        return artworks

    def create_tags(self, artworks):
        tag_list = [
            'nature', 'landscape', 'portrait', 'abstract', 'modern',
            'traditional', 'colorful', 'minimalist', 'realistic', 'surreal',
            'digital', 'oil', 'watercolor', 'acrylic', 'sketch',
        ]

        tags = []
        for artwork in artworks:
            # Add 2-4 random tags per artwork
            artwork_tags = random.sample(tag_list, random.randint(2, 4))
            for tag_name in artwork_tags:
                tag, created = ArtworkTag.objects.get_or_create(
                    artwork=artwork,
                    tag=tag_name
                )
                tags.append(tag)

        return tags

    def create_interactions(self, artists, artworks):
        """Create realistic interaction clusters for collaborative filtering."""
        from apps.recs.models import UserInteraction

        # Create buyer/customer users
        customers = []
        for i in range(5):
            username = f'buyer{i+1}'
            user, created = User.objects.get_or_create(
                username=username,
                defaults={
                    'email': f'{username}@artisa.com',
                    'role': User.Role.CUSTOMER,
                    'first_name': f'Buyer{i+1}',
                }
            )
            if created:
                user.set_password('buyer123')
                user.save()
            customers.append(user)

        # Create category preference clusters for CF
        cat_groups = [
            [0, 1],       # Cluster 0: paintings + sculptures
            [2, 3],       # Cluster 1: digital + photography
            [0, 2],       # Cluster 2: paintings + digital (shared with cluster 0)
            [4, 5],       # Cluster 3: traditional + mixed media
        ]

        interaction_count = 0
        interaction_types = ['view', 'favorite', 'cart_add', 'purchase']
        weights = {'view': 1.0, 'favorite': 3.0, 'cart_add': 5.0, 'purchase': 10.0}

        for ci, customer in enumerate(customers):
            cluster = ci % len(cat_groups)
            preferred_cats = cat_groups[cluster]

            # Get artworks in preferred categories
            preferred = [a for a in artworks if a.category_id and any(
                a.category_id == artists[j].id if False else True
                for j in range(len(artists))
            )]
            # Actually filter by category
            cat_ids = set()
            for a in artworks:
                if hasattr(a, 'category_id') and a.category_id:
                    cat_ids.add(a.category_id)

            # Build category to artworks mapping
            cat_artworks = {}
            for a in artworks:
                cat_id = getattr(a, 'category_id', None)
                if cat_id:
                    cat_artworks.setdefault(cat_id, []).append(a)

            preferred_artworks = []
            for cat_id in preferred_cats:
                cat_num = cat_id + 1 if isinstance(cat_id, int) else 0
                # Map preference index to actual category objects
                pass

            # Simpler approach: use category index from seed order
            all_cats = list(set(getattr(a, 'category_id', None) for a in artworks if getattr(a, 'category_id', None)))
            all_cats.sort()
            pref_cat_ids = [all_cats[i % len(all_cats)] for i in preferred_cats if i < len(all_cats)]

            preferred_artworks = [a for a in artworks if getattr(a, 'category_id', None) in pref_cat_ids]

            if not preferred_artworks:
                preferred_artworks = artworks

            # Create 8-15 interactions per customer, clustered in preferred categories
            n_interactions = random.randint(8, 15)
            sampled = random.sample(preferred_artworks, min(n_interactions, len(preferred_artworks)))

            for artwork in sampled:
                itype = random.choices(
                    interaction_types,
                    weights=[0.5, 0.3, 0.15, 0.05],
                    k=1
                )[0]
                UserInteraction.objects.create(
                    user=customer,
                    target_type='artwork',
                    target_id=artwork.id,
                    interaction_type=itype,
                    weight=weights[itype],
                )
                interaction_count += 1

        return interaction_count
