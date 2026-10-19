"""
Management command: evaluate_recommendations

Evaluates recommendation quality using Precision@K and Recall@K
on a held-out interaction test set.

Held-out items are masked out of the user's history (see
RecommendationEngine.get_artwork_recommendations(exclude_from_history=...))
so they become valid candidates without leaking into scoring.

Usage:
    python manage.py evaluate_recommendations
    python manage.py evaluate_recommendations --k 5 --test-ratio 0.2
"""

import random
from collections import defaultdict

from django.core.management.base import BaseCommand

from apps.recs.engine import RecommendationEngine
from apps.recs.models import UserInteraction
from apps.artworks.models import Artwork


class Command(BaseCommand):
    help = 'Evaluate recommendation quality with Precision@K and Recall@K'

    def add_arguments(self, parser):
        parser.add_argument('--k', type=int, default=5, help='Top-K to evaluate')
        parser.add_argument('--test-ratio', type=float, default=0.2, help='Fraction of interactions held out for testing')
        parser.add_argument('--seed', type=int, default=42, help='Random seed for reproducibility')
        parser.add_argument('--min-history', type=int, default=3, help='Minimum interactions per user to evaluate')

    def handle(self, *args, **options):
        k = options['k']
        test_ratio = options['test_ratio']
        seed = options['seed']
        min_history = options['min_history']
        random.seed(seed)

        self.stdout.write(f'Evaluating Precision@{k} and Recall@{k} (test_ratio={test_ratio})')

        # Gather artwork interactions restricted to published artworks
        # (unpublished items can never be recommended, so they must not be test targets)
        published_ids = set(
            Artwork.objects.filter(status=Artwork.Status.PUBLISHED)
            .values_list('id', flat=True)
        )

        interactions = [
            (user_id, target_id)
            for user_id, target_id in UserInteraction.objects.filter(
                target_type='artwork'
            ).values_list('user_id', 'target_id')
            if target_id in published_ids
        ]

        if not interactions:
            self.stdout.write(self.style.WARNING('No interactions found. Seed some data first.'))
            return

        # Group by user
        user_items = defaultdict(set)
        for user_id, target_id in interactions:
            user_items[user_id].add(target_id)

        # Split into train/test per user (keep >= 1 train item).
        # The engine loads history from the DB; masking held-out in the
        # recommendation call is what turns them into valid candidates.
        test_items = defaultdict(set)

        evaluated_candidates = 0
        for user_id, items in user_items.items():
            if len(items) < min_history:
                continue
            evaluated_candidates += 1
            items_list = list(items)
            random.shuffle(items_list)
            n_test = max(1, int(len(items_list) * test_ratio))
            n_test = min(n_test, len(items_list) - 1)
            if n_test < 1:
                continue
            test_items[user_id] = set(items_list[:n_test])

        if not test_items:
            self.stdout.write(self.style.WARNING(
                f'No users with >= {min_history} interactions to evaluate.'
            ))
            return

        engine = RecommendationEngine()

        precisions = []
        recalls = []
        evaluated_users = 0

        for user_id, held_out in test_items.items():
            if not held_out:
                continue

            # Mask held-out items from history so they are scoreable candidates
            try:
                rec_ids = engine.get_artwork_recommendations(
                    user_id=user_id,
                    k=k,
                    exclude_from_history=held_out,
                )
            except Exception:
                continue

            if not rec_ids:
                continue

            rec_set = set(rec_ids[:k])
            hits = rec_set & held_out

            precision = len(hits) / k if k > 0 else 0
            recall = len(hits) / len(held_out) if held_out else 0

            precisions.append(precision)
            recalls.append(recall)
            evaluated_users += 1

        if not precisions:
            self.stdout.write(self.style.WARNING('No users with sufficient data to evaluate.'))
            return

        avg_precision = sum(precisions) / len(precisions)
        avg_recall = sum(recalls) / len(recalls)
        f1 = (
            2 * avg_precision * avg_recall / (avg_precision + avg_recall)
            if (avg_precision + avg_recall) > 0 else 0
        )

        self.stdout.write(self.style.SUCCESS(f'\n--- Evaluation Results (K={k}) ---'))
        self.stdout.write(f'Users evaluated:      {evaluated_users} / {evaluated_candidates} with history >= {min_history}')
        self.stdout.write(f'Precision@{k}:        {avg_precision:.4f}')
        self.stdout.write(f'Recall@{k}:           {avg_recall:.4f}')
        self.stdout.write(f'F1@{k}:               {f1:.4f}')
        self.stdout.write(f'Total interactions:   {len(interactions)} (published artworks only)')
