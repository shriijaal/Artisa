"""
Create real user accounts for Artisa.
Run after clear_seeded_data to set up production-ready accounts.
"""
from django.core.management.base import BaseCommand
from django.db import transaction
from apps.users.models import User, ArtistProfile


ARTISTS = [
    {
        'username': 'razeechan',
        'first_name': 'Razee',
        'last_name': '',
        'email': 'razee@artisa.com',
        'password': 'razeechan123',
    },
    {
        'username': 'artxsia_',
        'first_name': 'Arsia',
        'last_name': 'Manandhar',
        'email': 'arsia@artisa.com',
        'password': 'artxsia123',
    },
    {
        'username': 'ashruology_',
        'first_name': 'Ash',
        'last_name': '',
        'email': 'ashruology@artisa.com',
        'password': 'ashruology123',
    },
    {
        'username': 'tangledillustration',
        'first_name': 'Jeshika',
        'last_name': '',
        'email': 'jeshika@artisa.com',
        'password': 'tangledillustration123',
    },
    {
        'username': '_ojesh_tuchhen_',
        'first_name': 'Ojesh',
        'last_name': 'Tuchhen',
        'email': 'ojesh@artisa.com',
        'password': 'ojeshtuchhen123',
    },
    {
        'username': 'nikki_arts_',
        'first_name': 'Nikki',
        'last_name': '',
        'email': 'nikki@artisa.com',
        'password': 'nikkiarts123',
    },
]

BUYERS = [
    {
        'username': 'sita_buyer',
        'first_name': 'Sita',
        'last_name': 'Thapa',
        'email': 'sita@artisa.com',
        'password': 'sitabuyer123',
    },
    {
        'username': 'ram_customer',
        'first_name': 'Ram',
        'last_name': 'Shrestha',
        'email': 'ram@artisa.com',
        'password': 'ramcustomer123',
    },
    {
        'username': 'gita_shop',
        'first_name': 'Gita',
        'last_name': 'Maharjan',
        'email': 'gita@artisa.com',
        'password': 'gitashop123',
    },
]


class Command(BaseCommand):
    help = 'Create real user accounts (artists + buyers)'

    def add_arguments(self, parser):
        parser.add_argument('--dry-run', action='store_true', help='Show what would be created without creating')

    def handle(self, *args, **options):
        dry_run = options['dry_run']

        if dry_run:
            self.stdout.write(self.style.WARNING('DRY RUN — no accounts will be created'))
            self._show_plan()
            return

        with transaction.atomic():
            created_artists = self._create_artists()
            created_buyers = self._create_buyers()

        self.stdout.write(self.style.SUCCESS(
            f'Created {created_artists} artists and {created_buyers} buyers'
        ))

    def _create_artists(self):
        count = 0
        for data in ARTISTS:
            user, created = User.objects.get_or_create(
                username=data['username'],
                defaults={
                    'first_name': data['first_name'],
                    'last_name': data['last_name'],
                    'email': data['email'],
                    'role': User.Role.CUSTOMER,
                    'is_active': True,
                },
            )
            if created:
                user.set_password(data['password'])
                user.save()
                # Create approved artist profile
                ArtistProfile.objects.get_or_create(
                    user=user,
                    defaults={
                        'status': ArtistProfile.Status.APPROVED,
                        'verified_badge': True,
                        'bio': '',
                    },
                )
                self.stdout.write(f'  Created artist: {data["username"]}')
                count += 1
            else:
                self.stdout.write(f'  Artist already exists: {data["username"]}')
        return count

    def _create_buyers(self):
        count = 0
        for data in BUYERS:
            user, created = User.objects.get_or_create(
                username=data['username'],
                defaults={
                    'first_name': data['first_name'],
                    'last_name': data['last_name'],
                    'email': data['email'],
                    'role': User.Role.CUSTOMER,
                    'is_active': True,
                },
            )
            if created:
                user.set_password(data['password'])
                user.save()
                self.stdout.write(f'  Created buyer: {data["username"]}')
                count += 1
            else:
                self.stdout.write(f'  Buyer already exists: {data["username"]}')
        return count

    def _show_plan(self):
        self.stdout.write('\nArtists to create:')
        for a in ARTISTS:
            self.stdout.write(f'  {a["username"]} ({a["first_name"]} {a["last_name"]}) — {a["email"]}')
        self.stdout.write('\nBuyers to create:')
        for b in BUYERS:
            self.stdout.write(f'  {b["username"]} ({b["first_name"]} {b["last_name"]}) — {b["email"]}')
