# Task 14: Hybrid Recommendation Engine — Completion Log

**Completed:** 2026-08-20

## What was built

### Backend

| File | Change |
|---|---|
| `requirements.txt` | Added `scikit-learn>=1.3.0`, `numpy>=1.24.0`, `scipy>=1.10.0` |
| `apps/recs/engine.py` | **NEW** — `RecommendationEngine` class with CBF + CF + hybrid scoring |
| `apps/recs/views.py` | Added `RecommendationArtworksView`, `RecommendationArtistsView`, `SimilarArtworksView`; rewrote `HomepageView` to use engine |
| `apps/recs/urls.py` | Added 3 new endpoints: `artworks/`, `artists/`, `similar/<uuid>/` |
| `apps/recs/management/commands/compute_recommendations.py` | **NEW** — precomputes + caches recs for all users |
| `apps/recs/management/commands/evaluate_recommendations.py` | **NEW** — Precision@K, Recall@K, F1 evaluation |

### Frontend

| File | Change |
|---|---|
| `frontend/src/components/RecommendedCarousel.jsx` | **NEW** — horizontal scroll carousel with nav buttons |
| `frontend/src/pages/ArtworkDetail.jsx` | Added "Similar Works" carousel section |

## Algorithm

### Content-Based Filtering (CBF)
- **TF-IDF** on artwork tags (unigram tokenization)
- **One-hot encoding**: category, artwork type (physical/digital), price band (budget/mid_range/premium/luxury)
- Cosine similarity matrix between all published artworks

### Collaborative Filtering (CF)
- **Item-based CF** from user-item interaction matrix (last 90 days)
- Interaction weights: view=1, favorite=3, cart_add=5, purchase=10
- Item-item cosine similarity matrix

### Hybrid Scoring
```
final_score = α × CBF_score + (1 − α) × CF_score
```
- Dynamic α based on user's interaction count:
  - < 10 interactions: α = 1.0 (pure CBF)
  - < 50: α = 0.8
  - < 100: α = 0.6
  - 100+: α = 0.4 (more CF)

### Cold-Start Fallback
- **Guests**: trending artworks (most interacted in last 30 days)
- **New users**: CBF only (α = 1.0)
- **Fallback**: if engine fails, fall back to most recent published artworks

## API Endpoints

```
GET /api/recs/artworks/?k=8
GET /api/recs/artists/?k=4
GET /api/recs/similar/<artwork_id>/?k=4
GET /api/recs/homepage/  (rewritten to use engine)
```

All return serialized data, with cache check first for authenticated users.

## Management Commands

```bash
python manage.py compute_recommendations        # precompute for all users
python manage.py compute_recommendations --force # recompute even if recent
python manage.py evaluate_recommendations        # Precision@K, Recall@K
python manage.py evaluate_recommendations --k 10 --test-ratio 0.3
```

## Key Design Decisions

- **scikit-learn over custom**: used `TfidfVectorizer` for tags and `cosine_similarity` for matrices — reliable, fast, well-tested
- **Item-based CF over user-based**: more stable with sparse data, works better when user count > item count
- **90-day window for CF**: limits computation to recent behavior, avoids stale signals
- **Dynamic α**: more new users get pure CBF, experienced users get more CF influence
- **Cache-first**: API checks `RecommendationCache` before computing fresh; `compute_recommendations` command pre-warms cache
- **Engine instantiated per-request**: stateless, loads data fresh each time (acceptable for MVP; production would use Celery + Redis)
