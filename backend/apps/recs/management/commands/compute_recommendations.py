"""
Management command: compute_recommendations

Precomputes and caches recommendations for all active users.

Usage:
    python manage.py compute_recommendations
    python manage.py compute_recommendations --force
"""

import logging

from django.core.management.base import BaseCommand
from django.utils import timezone

from apps.recs.engine import RecommendationEngine
from apps.recs.models import RecommendationCache
from apps.users.models import User

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = 'Precompute and cache artwork + artist recommendations for all users'

    def add_arguments(self, parser):
        parser.add_argument(
            '--force',
            action='store_true',
            help='Recompute even if cache exists and is recent',
        )

    def handle(self, *args, **options):
        force = options['force']
        self.stdout.write('Building recommendation engine...')
        engine = RecommendationEngine()

        users = User.objects.filter(is_active=True).select_related()
        total = users.count()
        self.stdout.write(f'Computing recommendations for {total} users...')

        created, updated, skipped = 0, 0, 0

        for user in users:
            # Artwork recommendations
            artwork_ids = engine.get_artwork_recommendations(user_id=user.id, k=20)
            cache, was_created = RecommendationCache.objects.update_or_create(
                user=user,
                target_type='artwork',
                defaults={
                    'target_ids': [str(aid) for aid in artwork_ids],
                    'computed_at': timezone.now(),
                },
            )
            if was_created:
                created += 1
            else:
                updated += 1

            # Artist recommendations (stored in same model)
            artist_ids = engine.get_artist_recommendations(user_id=user.id, k=10)
            RecommendationCache.objects.update_or_create(
                user=user,
                target_type='artist',
                defaults={
                    'target_ids': [str(aid) for aid in artist_ids],
                    'computed_at': timezone.now(),
                },
            )

        self.stdout.write(self.style.SUCCESS(
            f'Done. {created} new caches, {updated} updated, {skipped} skipped.'
        ))
