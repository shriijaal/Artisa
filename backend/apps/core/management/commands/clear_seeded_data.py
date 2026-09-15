"""
Clear all seeded/demo data from the database.
Keeps: admin user, categories.
Deletes: all other users, artworks, orders, reviews, commissions, messages, etc.
"""
import os
from django.core.management.base import BaseCommand
from django.db import connection


class Command(BaseCommand):
    help = 'Clear all seeded data (keeps admin user and categories)'

    def add_arguments(self, parser):
        parser.add_argument('--dry-run', action='store_true', help='Show what would be deleted without deleting')

    def handle(self, *args, **options):
        dry_run = options['dry_run']

        if dry_run:
            self.stdout.write(self.style.WARNING('DRY RUN — no changes will be made'))
            self._show_counts()
            return

        self.stdout.write('Clearing seeded data...')

        with connection.cursor() as cursor:
            # Order matters — delete children before parents
            tables = [
                'order_shipments',
                'reviews',
                'order_items',
                'orders',
                'shipping_addresses',
                'cart_items',
                'commission_deliverables',
                'commission_reference_images',
                'messages',
                'commissions',
                'artwork_images',
                'artwork_tags',
                'digital_files',
                'artworks',
                'favorites',
                'user_interactions',
                'recommendation_cache',
                'artist_applications',
                'artist_profiles',
                'payments',
            ]

            for table in tables:
                try:
                    cursor.execute(f'SELECT COUNT(*) FROM {table}')
                    count = cursor.fetchone()[0]
                    if count > 0:
                        cursor.execute(f'TRUNCATE TABLE {table} CASCADE')
                        self.stdout.write(f'  Cleared {count} from {table}')
                except Exception as e:
                    self.stdout.write(f'  Skipped {table}: {e}')

            # Clear token blacklist before deleting users
            try:
                cursor.execute('TRUNCATE TABLE token_blacklist_outstandingtoken CASCADE')
                cursor.execute('TRUNCATE TABLE token_blacklist_blacklistedtoken CASCADE')
                self.stdout.write('  Cleared token blacklist tables')
            except Exception:
                pass

            # Delete all users except admin
            cursor.execute("DELETE FROM users_user WHERE role != 'admin'")
            deleted_users = cursor.rowcount
            self.stdout.write(f'  Deleted {deleted_users} users (kept admin)')

        self.stdout.write(self.style.SUCCESS('Done — database cleared (admin and categories preserved)'))

    def _show_counts(self):
        from django.db import connection
        with connection.cursor() as cursor:
            tables = [
                'users_user', 'artist_profiles', 'artist_applications',
                'artworks', 'artwork_images', 'artwork_tags', 'digital_files',
                'cart_items', 'orders', 'order_items', 'order_shipments',
                'shipping_addresses', 'commissions', 'commission_deliverables',
                'commission_reference_images', 'messages', 'reviews',
                'favorites', 'user_interactions', 'recommendation_cache',
                'payments', 'categories',
            ]
            for table in tables:
                try:
                    cursor.execute(f'SELECT COUNT(*) FROM {table}')
                    count = cursor.fetchone()[0]
                    if count > 0:
                        self.stdout.write(f'  {table}: {count} rows')
                except Exception:
                    pass
