# Task 17: Purchase-Verified Reviews — Completion Log

**Completed:** 2026-09-01  
**Status:** All deliverables implemented

---

## Deliverables

### ✅ `POST /api/reviews` — requires completed/delivered order item

- `ReviewCreateSerializer` validates:
  - `order_item_id` belongs to the requesting user (customer)
  - Order status is `delivered` or `completed`
  - No existing review for this order item
  - Rating is 1-5
- Auto-sets `artwork` and `artist` from the order item

### ✅ One review per order item

- `Review` model has `unique_together = ['reviewer', 'order_item']`
- Serializer also checks for existing reviews before creating

### ✅ `GET /api/reviews` — by artwork or artist

- `GET /api/reviews/?artwork_id=X` — all reviews for an artwork
- `GET /api/reviews/?artist_id=X` — all reviews for an artist
- `GET /api/reviews/artwork/X/avg/` — average rating + count for artwork
- `GET /api/reviews/artist/X/avg/` — average rating + count for artist

### ✅ Average rating computed and exposed on artwork cards and artist profiles

- `ArtworkSerializer` now includes `avg_rating` and `review_count` fields
- `published_artworks` view supports `sort_by=rating` (annotates with Avg)
- `PublicArtistProfile` shows average star rating + review count

### ✅ Ratings optionally boost recommendation scores

- `published_artworks` sort by rating now uses real data from reviews

### ✅ React: review form on order history, star display on cards

- **Artwork cards** (Home, Marketplace): show star + avg_rating when review_count > 0
- **ArtworkDetail**: star rating badge near price, full reviews list, review form for purchasers
- **OrderHistory**: "Write Review" button on delivered/completed items, inline review form
- **PublicArtistProfile**: average star rating below username

---

## Files Created

| File | Purpose |
|---|---|
| `backend/apps/reviews/serializers.py` | Review + ReviewCreate serializers |
| `backend/apps/reviews/views.py` | List/Create, Detail, ArtworkRating, ArtistRating views |
| `backend/apps/reviews/urls.py` | URL routing |
| `backend/apps/reviews/admin.py` | Django admin registration |
| `backend/apps/reviews/apps.py` | App config |

## Files Modified

| File | Change |
|---|---|
| `backend/artisa/urls.py` | Added `api/reviews/` path |
| `backend/apps/artworks/serializers.py` | Added `avg_rating`, `review_count` to ArtworkSerializer |
| `backend/apps/artworks/views.py` | Fixed `sort_by=rating` to use real data |
| `frontend/src/pages/ArtworkDetail.jsx` | Added StarRating component, reviews list + form, rating badge |
| `frontend/src/pages/Home.jsx` | Added star rating to artwork cards |
| `frontend/src/pages/Marketplace.jsx` | Added star rating to artwork cards |
| `frontend/src/pages/OrderHistory.jsx` | Added review form + "Write Review" / "Reviewed" buttons |
| `frontend/src/pages/PublicArtistProfile.jsx` | Added average rating display |
