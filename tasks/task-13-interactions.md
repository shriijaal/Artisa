# Task 13: Interaction Tracking

**Phase:** Recommendations (Week 10)  
**Depends on:** Task 12  
**Blocks:** Task 14

## Goal

Capture user behavior signals to power the recommendation engine.

## Deliverables

- [x] `user_interactions` model
- [x] `POST /api/interactions/` — log view, favorite, cart_add, purchase
- [x] Weighted signals: view=1, favorite=3, cart_add=5, purchase=10
- [x] Frontend hooks on detail pages, favorites, cart, checkout
- [x] Rate limiting on interaction endpoint (prevent score manipulation)
- [x] Deduplicate rapid repeat views (e.g. same artwork within 1 hour)
