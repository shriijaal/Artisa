# Task 15: Commissions + Deliverables — Completion Log

**Completed:** 2026-08-27

## What was built

### Backend

| File | Change |
|---|---|
| `apps/commissions/models.py` | Models for `Commission`, `CommissionDeliverable`, and `CommissionReferenceImage` with status lifecycle and revision controls |
| `apps/commissions/serializers.py` | Serializers for commission creation, listing, detail, status updates, deliverables, and reference image uploads |
| `apps/commissions/views.py` | Views for creation, reference upload, my-commissions, artist inbox, detail, accept, start, decline, deliver, approve, revision, cancel |
| `apps/commissions/urls.py` | API routing for `/api/commissions/*` |
| `artisa/urls.py` | Mounted commissions endpoint at `/api/commissions/` |

### Frontend

| File | Change |
|---|---|
| `src/pages/CommissionRequest.jsx` | Form for requesting custom artwork with reference image upload and budget validation |
| `src/pages/ArtistCommissions.jsx` | Artist inbox with status filtering, accept/decline action modals, and quick navigation |
| `src/pages/MyCommissions.jsx` | Customer commission tracker dashboard |
| `src/pages/CommissionDetail.jsx` | Full commission lifecycle view with deliverables viewer, approve/revision request modal, and cancel flow |
| `src/services/api.js` | Full suite of commission API integration functions |

## Status Lifecycle

```
requested (pending) ──► accepted ──► in_progress ──► delivered ──► completed
         │                  │             │              │
         ▼                  ▼             ▼              ▼
      declined          cancelled     cancelled     revision (up to 2) -> in_progress
```

## Deliverables & Revisions
- Deliverables allow artists to submit completed works (images/PDFs/ZIPs up to 50MB) with notes.
- Customer can approve (transitions to `completed`) or request revisions (up to 2 revisions limit).
