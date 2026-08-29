# Task 14: Hybrid Recommendation Engine

**Phase:** Recommendations (Week 10–11)  
**Depends on:** Task 13  
**Blocks:** Task 20

## Goal

Personalized artwork and artist recommendations using hybrid content-based + collaborative filtering.

## Deliverables

- [x] Content-based: TF-IDF or feature-vector cosine similarity (tags, category, price band, type)
- [x] Collaborative: item-based CF from interaction matrix (fallback to CBF + trending when sparse)
- [x] Hybrid merge: `final_score = α × CBF + (1 − α) × CF` (α = 0.6 default)
- [x] `GET /api/recommendations/artworks`, `/artists`, `/similar/{id}`
- [x] `python manage.py compute_recommendations` — precompute + cache
- [x] `recommendation_cache` table
- [x] React `RecommendedCarousel` on home, marketplace, artwork detail, artist profile
- [x] Cold-start fallback: trending + category-based for guests
- [x] Evaluation documented: Precision@K, Recall@K on seeded data in `docs/recommendations.md`
