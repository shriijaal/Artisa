# Task 15: Commissions + Deliverables

**Phase:** Commissions (Week 11)  
**Depends on:** Task 5  
**Blocks:** Task 16

## Goal

Fiverr-style commission workflow with deliverable upload and revision support.

## Deliverables

- [x] `POST /api/commissions` — title, brief, budget (NPR), deadline, reference images
- [x] Artist accept/decline
- [x] Status flow: `requested` → `accepted` → `in_progress` → `delivered` → `completed` / `cancelled`
- [x] `POST /api/commissions/{id}/deliverables/` — artist uploads work
- [x] Customer approves or requests revision (limit: 2 revisions)
- [x] Optional Khalti deposit on acceptance (stretch)
- [x] React: commission request form, artist inbox, deliverable review UI
