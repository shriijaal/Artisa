# Task 18: Email Notifications — Completion Log

**Completed:** 2026-09-01  
**Status:** All deliverables implemented

---

## Deliverables

### ✅ Django email configured (console backend in dev)
- `EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'` (already existed)
- Added `DEFAULT_FROM_EMAIL = 'Artisa <noreply@artisa.com>'`
- Added `TEMPLATES DIRS` pointing to `backend/templates/`

### ✅ Welcome email on registration
- Hooked into `apps/users/views.py` `register` view after `serializer.save()`
- Template: `emails/welcome.html`

### ✅ Artist application approved/rejected email
- Approved: `emails/artist_approved.html` — sent after profile creation
- Rejected: `emails/artist_rejected.html` — includes rejection reason

### ✅ Order confirmation email
- Hooked into `orders/views.py` after cart is cleared
- Template: `emails/order_confirmation.html` — includes item list, prices, total

### ✅ Payment confirmation email
- Hooked into `mock_pay_order` after order status updated
- Template: `emails/payment_confirmation.html`

### ✅ Shipping/delivery notification emails
- Shipping: `emails/shipping_notification.html` — includes tracking number
- Delivery: `emails/delivery_notification.html`

### ✅ Commission status change emails (all 8)
| Status | Template | Recipient |
|---|---|---|
| Created | `new_commission.html` | Artist |
| Accepted | `commission_accepted.html` | Customer |
| Started | `commission_started.html` | Customer |
| Declined | `commission_declined.html` | Customer (includes reason) |
| Delivered | `commission_delivered.html` | Customer |
| Completed | `commission_completed.html` | Artist |
| Revision | `commission_revision.html` | Artist (includes revision count) |
| Cancelled | `commission_cancelled.html` | The other party |

### ✅ Email templates in `backend/templates/emails/`
17 HTML templates total (1 base + 16 event-specific), all extending `base.html`.

---

## Files Created

| File | Purpose |
|---|---|
| `backend/apps/core/email.py` | Centralized email utility — 16 helper functions |
| `backend/templates/emails/base.html` | Shared email layout (header, footer) |
| `backend/templates/emails/welcome.html` | Registration |
| `backend/templates/emails/password_reset.html` | Password reset |
| `backend/templates/emails/artist_approved.html` | Application approved |
| `backend/templates/emails/artist_rejected.html` | Application rejected |
| `backend/templates/emails/order_confirmation.html` | Order placed |
| `backend/templates/emails/payment_confirmation.html` | Payment received |
| `backend/templates/emails/shipping_notification.html` | Shipment shipped |
| `backend/templates/emails/delivery_notification.html` | Shipment delivered |
| `backend/templates/emails/new_commission.html` | Commission request |
| `backend/templates/emails/commission_accepted.html` | Commission accepted |
| `backend/templates/emails/commission_started.html` | Work started |
| `backend/templates/emails/commission_declined.html` | Commission declined |
| `backend/templates/emails/commission_delivered.html` | Work delivered |
| `backend/templates/emails/commission_completed.html` | Commission completed |
| `backend/templates/emails/commission_revision.html` | Revision requested |
| `backend/templates/emails/commission_cancelled.html` | Commission cancelled |

## Files Modified

| File | Change |
|---|---|
| `backend/artisa/settings.py` | Added TEMPLATES DIRS, DEFAULT_FROM_EMAIL |
| `backend/apps/users/views.py` | Added email imports + 4 email hooks (register, password reset, approve, reject) |
| `backend/apps/orders/views.py` | Added email imports + 4 email hooks (order confirm, payment, shipping, delivery) |
| `backend/apps/commissions/views.py` | Added email imports + 8 email hooks (all commission status changes) |
