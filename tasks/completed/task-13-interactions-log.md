# Task 13: Interaction Tracking — Completion Log

**Completed:** 2026-08-20

## What was built

### Backend

| File | Change |
|---|---|
| `apps/recs/utils.py` | **NEW** — `log_interaction()` helper with weights + 1-hour view dedup |
| `apps/recs/serializers.py` | **NEW** — `InteractionSerializer` with field validation |
| `apps/recs/views.py` | Added `InteractionCreateView` for `POST /api/recs/interactions/` |
| `apps/recs/urls.py` | Wired `interactions/` route |
| `apps/artworks/views.py` | Replaced inline `UserInteraction.objects.create` with `log_interaction()` |
| `apps/orders/views.py` | Replaced inline `UserInteraction.objects.create` (cart_add + mock purchase) with `log_interaction()` |
| `apps/users/views.py` | Added `favorite` interaction logging on `POST /api/auth/favorites/` |
| `apps/payments/views.py` | Added `purchase` interaction logging in `KhaltiVerifyView.post()` on success |
| `artisa/settings.py` | Added DRF throttle config: 120/min per user + anon |

### Frontend

| File | Change |
|---|---|
| `frontend/src/services/api.js` | Added `trackInteraction()` fire-and-forget helper |
| `frontend/src/pages/ArtworkDetail.jsx` | Added `trackInteraction('artwork', id, 'favorite')` on favorite add |
| `frontend/src/pages/Wishlist.jsx` | Added `trackInteraction('artwork', id, 'cart_add')` on add-to-cart |

## Interaction weights

| Type | Weight |
|---|---|
| view | 1.0 |
| favorite | 3.0 |
| cart_add | 5.0 |
| purchase | 10.0 |
| commission | 5.0 |
| profile_view | 1.0 |

## Key design decisions

- **DRF built-in throttling** over `django-ratelimit` — no extra dependency needed, sufficient for this use case
- **View deduplication**: same artwork+user within 1 hour is ignored (prevents score inflation from page refreshes)
- **Server-side logging is primary**: all interactions logged via backend views; frontend `trackInteraction()` is a redundant fire-and-forget fallback
- **`log_interaction()` returns `None`** on dedup, which the API endpoint translates to `204 No Content`
- Weights are set on creation, not on read — simpler queries for the recommendation engine

## API

```
POST /api/recs/interactions/
Authorization: Bearer <token>
Content-Type: application/json

{
  "target_type": "artwork",
  "target_id": "<uuid>",
  "interaction_type": "favorite"
}

# 201 Created (interaction logged)
# 204 No Content (deduplicated view)
# 400 Bad Request (validation error)
# 429 Too Many Requests (throttled)
```
