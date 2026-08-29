"""
Hybrid recommendation engine combining Content-Based Filtering (CBF)
and Collaborative Filtering (CF) for Artisa artworks and artists.

Usage:
    engine = RecommendationEngine()
    artwork_ids = engine.get_artwork_recommendations(user_id, k=8)
    artist_ids = engine.get_artist_recommendations(user_id, k=4)
    similar_ids = engine.get_similar_artworks(artwork_id, k=4)
"""

import logging
import threading
import time
from datetime import timedelta

import numpy as np
from scipy.sparse import csr_matrix
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

from django.db.models import Count
from django.utils import timezone

logger = logging.getLogger(__name__)

# Module-level singleton with TTL-based cache
_engine_instance = None
_engine_lock = threading.Lock()
_engine_loaded_at = 0
ENGINE_TTL_SECONDS = 300  # 5 minutes


def get_recommendation_engine(alpha=0.6):
    """Return a cached RecommendationEngine singleton, rebuilding if stale."""
    global _engine_instance, _engine_loaded_at
    now = time.monotonic()
    if _engine_instance is None or (now - _engine_loaded_at) > ENGINE_TTL_SECONDS:
        with _engine_lock:
            if _engine_instance is None or (time.monotonic() - _engine_loaded_at) > ENGINE_TTL_SECONDS:
                _engine_instance = RecommendationEngine(alpha=alpha)
                _engine_loaded_at = time.monotonic()
                logger.info('RecommendationEngine rebuilt (age=0s)')
    return _engine_instance


def _discretize_price(price):
    """Map price NPR to a band string."""
    p = float(price)
    if p < 1000:
        return 'budget'
    elif p < 5000:
        return 'mid_range'
    elif p < 15000:
        return 'premium'
    else:
        return 'luxury'


class RecommendationEngine:
    """Stateless engine that computes recommendations on the fly from DB data."""

    def __init__(self, alpha=0.6):
        self.alpha = alpha
        self._load_data()

    def _load_data(self):
        """Load artworks, interactions, and build matrices."""
        from apps.artworks.models import Artwork, ArtworkTag
        from apps.users.models import User
        from apps.recs.models import UserInteraction

        self.artworks = list(
            Artwork.objects.filter(status=Artwork.Status.PUBLISHED)
            .select_related('category', 'artist')
            .prefetch_related('tags')
        )
        self.artwork_ids = [a.id for a in self.artworks]
        self.artwork_idx = {aid: i for i, aid in enumerate(self.artwork_ids)}

        # Tag corpus for TF-IDF
        self.tag_corpus = []
        for artwork in self.artworks:
            tags = list(artwork.tags.values_list('tag', flat=True))
            self.tag_corpus.append(' '.join(tags) if tags else '')

        # Category vocabulary
        self.categories = sorted(set(
            str(a.category_id) for a in self.artworks if a.category_id
        ))
        self.cat_idx = {c: i for i, c in enumerate(self.categories)}

        # Type vocabulary
        self.types = ['physical', 'digital']
        self.type_idx = {t: i for i, t in enumerate(self.types)}

        # Price band vocabulary
        self.price_bands = ['budget', 'mid_range', 'premium', 'luxury']
        self.pb_idx = {pb: i for i, pb in enumerate(self.price_bands)}

        # Build CBF feature matrix
        self._build_cbf_matrix()

        # Load interactions
        cutoff = timezone.now() - timedelta(days=90)
        self.interactions = list(
            UserInteraction.objects.filter(
                target_type='artwork',
                created_at__gte=cutoff,
            ).values_list('user_id', 'target_id', 'weight')
        )

        # Build interaction matrix for CF
        self._build_cf_matrices()

    def _build_cbf_matrix(self):
        """Build artwork feature matrix for content-based filtering."""
        n = len(self.artworks)
        if n == 0:
            self.cbf_matrix = csr_matrix((0, 0))
            return

        # TF-IDF on tags
        tfidf = TfidfVectorizer(stop_words=None, token_pattern=r'(?u)\b\w+\b')
        tag_matrix = tfidf.fit_transform(self.tag_corpus) if self.tag_corpus else csr_matrix((n, 0))

        # One-hot: category
        cat_dim = max(len(self.categories), 1)
        cat_features = np.zeros((n, cat_dim))
        for i, artwork in enumerate(self.artworks):
            if artwork.category_id:
                key = str(artwork.category_id)
                if key in self.cat_idx:
                    cat_features[i, self.cat_idx[key]] = 1.0

        # One-hot: type
        type_features = np.zeros((n, len(self.types)))
        for i, artwork in enumerate(self.artworks):
            if artwork.type in self.type_idx:
                type_features[i, self.type_idx[artwork.type]] = 1.0

        # One-hot: price band
        pb_features = np.zeros((n, len(self.price_bands)))
        for i, artwork in enumerate(self.artworks):
            band = _discretize_price(artwork.price)
            pb_features[i, self.pb_idx[band]] = 1.0

        # Combine all features
        self.cbf_matrix = csr_matrix(np.hstack([
            tag_matrix.toarray() if hasattr(tag_matrix, 'toarray') else tag_matrix,
            cat_features,
            type_features,
            pb_features,
        ]))

        # Precompute artwork-artwork CBF similarity
        if self.cbf_matrix.shape[0] > 1:
            self.cbf_sim = cosine_similarity(self.cbf_matrix)
        else:
            self.cbf_sim = np.ones((1, 1))

    def _build_cf_matrices(self):
        """Build user-item interaction matrices for collaborative filtering."""
        if not self.interactions:
            self.cf_sim = None
            self.user_interactions = None
            return

        user_ids = sorted(set(row[0] for row in self.interactions))
        self.user_idx = {uid: i for i, uid in enumerate(user_ids)}

        n_users = len(user_ids)
        n_items = len(self.artwork_ids)

        if n_users == 0 or n_items == 0:
            self.cf_sim = None
            self.user_interactions = None
            return

        rows, cols, data = [], [], []
        for user_id, target_id, weight in self.interactions:
            if target_id in self.artwork_idx:
                rows.append(self.user_idx[user_id])
                cols.append(self.artwork_idx[target_id])
                data.append(weight)

        if not data:
            self.cf_sim = None
            self.user_interactions = None
            return

        self.user_interactions = csr_matrix(
            (data, (rows, cols)), shape=(n_users, n_items)
        )

        # Item-item cosine similarity for CF
        if n_items > 1:
            item_matrix = self.user_interactions.T.toarray()
            self.cf_sim = cosine_similarity(item_matrix)
        else:
            self.cf_sim = np.ones((1, 1))

    def get_dynamic_alpha(self, user_id):
        """Adjust alpha based on user interaction count (more data → more CF)."""
        from apps.recs.models import UserInteraction
        count = UserInteraction.objects.filter(user_id=user_id).count()
        if count < 10:
            return 1.0
        elif count < 50:
            return 0.8
        elif count < 100:
            return 0.6
        else:
            return 0.4

    def _get_user_interacted_ids(self, user_id):
        """Get artwork IDs the user has already interacted with."""
        return set(
            row[1] for row in self.interactions if row[0] == user_id
        )

    def get_artwork_recommendations(self, user_id=None, k=8):
        """
        Get top-k artwork recommendations.
        For authenticated users: hybrid CBF + CF.
        For guests: trending (most interacted).
        Returns list of artwork UUIDs.
        """
        if not self.artwork_ids:
            return []

        if user_id is None:
            return self._get_trending_artworks(k)

        interacted = self._get_user_interacted_ids(user_id)

        # Build user profile vector from interactions
        if user_id in self.user_idx and self.user_interactions is not None:
            user_row = self.user_interactions[self.user_idx[user_id]].toarray().flatten()
            alpha = self.get_dynamic_alpha(user_id)
        else:
            user_row = None
            alpha = 1.0  # Pure CBF for users with no interaction matrix row

        scores = np.zeros(len(self.artwork_ids))

        for i, artwork_id in enumerate(self.artwork_ids):
            if artwork_id in interacted:
                continue

            # CBF score: average similarity to user's interacted items
            cbf_score = 0.0
            if user_row is not None:
                # Weight by user's interaction strengths
                weighted_sims = self.cbf_sim[i] * user_row
                total_weight = user_row.sum()
                if total_weight > 0:
                    cbf_score = weighted_sims.sum() / total_weight
            elif interacted:
                # Fallback: average CBF sim to interacted items
                sim_sum = sum(
                    self.cbf_sim[i, self.artwork_idx[jid]]
                    for jid in interacted if jid in self.artwork_idx
                )
                cbf_score = sim_sum / len(interacted) if interacted else 0.0

            # CF score
            cf_score = 0.0
            if user_row is not None and self.cf_sim is not None:
                cf_scores_for_item = self.cf_sim[i] * user_row
                total_weight = user_row.sum()
                if total_weight > 0:
                    cf_score = cf_scores_for_item.sum() / total_weight

            # Hybrid score
            scores[i] = alpha * cbf_score + (1 - alpha) * cf_score

        # Get top-k indices (excluding interacted)
        ranked = np.argsort(scores)[::-1]
        result = []
        for idx in ranked:
            if self.artwork_ids[idx] not in interacted:
                result.append(self.artwork_ids[idx])
            if len(result) >= k:
                break

        # If not enough recommendations, fill with trending
        if len(result) < k:
            trending = self._get_trending_artworks(k - len(result))
            existing = set(result)
            for tid in trending:
                if tid not in existing and tid not in interacted:
                    result.append(tid)
                if len(result) >= k:
                    break

        return result

    def get_artist_recommendations(self, user_id=None, k=4):
        """
        Get top-k artist recommendations.
        Based on category overlap + interaction patterns.
        Returns list of user IDs (artists).
        """
        from apps.users.models import User, ArtistProfile
        from apps.recs.models import UserInteraction

        approved_artists = User.objects.filter(
            artist_profile__status='approved'
        ).values_list('id', flat=True)

        if not approved_artists:
            return []

        interacted_artwork_ids = self._get_user_interacted_ids(user_id) if user_id else set()

        if not interacted_artwork_ids:
            # For guests: return most active artists
            return list(
                UserInteraction.objects.filter(
                    target_type='artwork',
                    interaction_type__in=['view', 'favorite'],
                ).values('target_id')
                .annotate(cnt=Count('id'))
                .order_by('-cnt')[:k * 3]
            )[:k] if False else list(approved_artists[:k])

        # Find artists whose artworks the user interacted with
        from apps.artworks.models import Artwork
        interacted_artworks = Artwork.objects.filter(id__in=interacted_artwork_ids)
        interacted_artist_ids = set(interacted_artworks.values_list('artist_id', flat=True))

        # Find categories the user likes
        liked_categories = set(interacted_artworks.values_list('category_id', flat=True))

        # Score other artists by category overlap + interaction count
        artist_scores = {}
        for artist_id in approved_artists:
            if artist_id in interacted_artist_ids:
                continue
            artist_artworks = Artwork.objects.filter(
                artist_id=artist_id, status=Artwork.Status.PUBLISHED
            )
            artist_cats = set(artist_artworks.values_list('category_id', flat=True))
            overlap = len(artist_cats & liked_categories)
            artist_scores[artist_id] = overlap

        ranked = sorted(artist_scores.items(), key=lambda x: x[1], reverse=True)
        return [aid for aid, _ in ranked[:k]]

    def get_similar_artworks(self, artwork_id, k=4):
        """Get top-k artworks similar to a given artwork using CBF."""
        if artwork_id not in self.artwork_idx:
            return []

        idx = self.artwork_idx[artwork_id]
        sims = self.cbf_sim[idx]
        ranked = np.argsort(sims)[::-1]

        result = []
        for i in ranked:
            if i != idx and self.artwork_ids[i] != artwork_id:
                result.append(self.artwork_ids[i])
            if len(result) >= k:
                break
        return result

    def _get_trending_artworks(self, k=8):
        """Fallback: most-interacted artworks in last 30 days."""
        from apps.recs.models import UserInteraction
        cutoff = timezone.now() - timedelta(days=30)

        trending = (
            UserInteraction.objects.filter(
                target_type='artwork',
                created_at__gte=cutoff,
            )
            .values('target_id')
            .annotate(total_weight=Count('id'))
            .order_by('-total_weight')[:k]
        )

        result = [row['target_id'] for row in trending]
        # Fill with most recent if not enough
        if len(result) < k:
            existing = set(result)
            for a in self.artworks:
                if a.id not in existing:
                    result.append(a.id)
                if len(result) >= k:
                    break

        return result[:k]
