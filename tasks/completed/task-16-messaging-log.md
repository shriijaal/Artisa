# Task 16: In-App Messaging — Completion Log

**Completed:** 2026-09-01  
**Status:** All deliverables implemented

---

## Deliverables

### ✅ `GET/POST /api/messages/` — commission-linked threads

- `MessageListCreateView` at `backend/apps/messaging/views.py:27`
- **GET** `/api/messages/?commission_id={id}` — returns all messages for a commission thread
- **POST** `/api/messages/` with `{ commission_id, body }` — sends a new message
- Supports `after` query param for polling (fetch only newer messages)

### ✅ Polling for new messages

- `CommissionChat.jsx:64` polls every 6 seconds via `setInterval`
- Uses `after` param to avoid re-fetching entire thread
- Skips re-render if message count hasn't changed (optimization)

### ✅ Unread message count indicator

- `UnreadCountView` at `GET /api/messages/unread/`
- Returns `{ unread_count, unread_commission_ids }`
- Frontend badge on Messages tab in `CommissionDetail.jsx:368`
- Auto-marks messages as read when Messages tab is opened

### ✅ React messaging UI within commission detail page

- `CommissionChat.jsx` — full-featured chat component:
  - Date-separated message groups
  - Read receipts (✓ sent, ✓✓ read)
  - Auto-scroll to newest message
  - Auto-resize textarea
  - Enter to send, Shift+Enter for newline
  - Empty state with prompt to start conversation
  - Closed commission state (no input)
  - Other party avatar and role label
- Integrated into `CommissionDetail.jsx` via tab system (Details | Messages)

### ✅ IDOR protection

- `_get_participant_commission()` at `backend/apps/messaging/views.py:13`
- Checks `user.id in (commission.customer_id, commission.artist_id)`
- Returns 403 Forbidden if not a participant
- Applied to both GET and POST endpoints

---

## Architecture

```
CommissionDetail.jsx
├── Tab: Details & Actions (status, parties, brief, actions)
└── Tab: Messages
    └── CommissionChat.jsx
        ├── GET /api/messages/?commission_id=X (polls every 6s)
        └── POST /api/messages/ (send new message)
```

## Files

- `backend/apps/messaging/models.py` — Message model
- `backend/apps/messaging/views.py` — API views with IDOR protection
- `backend/apps/messaging/serializers.py` — Message + Create serializers
- `backend/apps/messaging/urls.py` — URL routing
- `frontend/src/components/CommissionChat.jsx` — Chat UI component
- `frontend/src/pages/CommissionDetail.jsx` — Commission detail with Messages tab
