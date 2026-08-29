# Task 12 Completion Log — Khalti Payments + Secure Digital Downloads

**Completed:** August 20, 2026  
**Phase:** E-Commerce (Week 9–10)  
**Status:** Done

---

## Goal

Khalti payment integration and secure delivery of digital artwork files. Completing this task delivers the **minimum demo-ready purchase flow**.

---

## Deliverables Checklist

- [x] Khalti sandbox: `POST /api/payments/khalti/initiate` + `/verify`
- [x] Server-side payment verification (idempotent — no double-credit)
- [x] Update order `payment_status`; store records in `payments` table
- [x] `GET /api/orders/{order_id}/download/{item_id}/` — auth + ownership check + signed token
- [x] Time-limited signed download URLs for digital files
- [x] Separate preview image vs full-resolution digital file
- [x] React checkout flow with Khalti widget/redirect
- [x] Document Khalti sandbox setup in `docs/khalti.md`

---

## What We Built

### 1. Khalti API Client

**File:** `backend/apps/payments/khalti.py`

- `initiate_khalti_payment()` — POSTs to Khalti's `/epayment/initiate/` with:
  - Amount converted from NPR to paisa (x100)
  - Customer info, product details, amount breakdown
  - Configurable `return_url` and `website_url` from settings
  - 10-second request timeout
  - Structured error logging for all failure modes

- `verify_khalti_payment()` — POSTs to Khalti's `/epayment/lookup/` with `pidx`
  - Same timeout and error handling

- Authorization: `Key <secret_key>` header (no double-prefix bug)
- URLs sourced from `settings.KHALTI_BASE_URL` (sandbox vs production)

### 2. Payment Models

**File:** `backend/apps/payments/models.py`

- `Payment` model:
  - UUID primary key
  - `payable_type` (order or commission) + `payable_id` (polymorphic)
  - `khalti_transaction_id` (stores `pidx`)
  - `amount` in NPR
  - `status`: pending / completed / failed / refunded
  - Auto-updated timestamps

### 3. Payment API Endpoints

**File:** `backend/apps/payments/views.py`

**`POST /api/payments/khalti/initiate/`**
- Authenticated users only
- Validates order exists and belongs to user
- Rejects already-paid orders
- Creates pending `Payment` record
- Builds human-readable `purchase_order_name` from order items
- Sends `product_details` and `amount_breakdown` to Khalti
- Returns `payment_url` and `pidx` for browser redirect

**`POST /api/payments/khalti/verify/`**
- Authenticated users only
- Idempotent: returns "Already verified" for already-completed payments
- Calls Khalti lookup API
- Handles all Khalti statuses: Completed, Pending, Expired, User canceled, Refunded, Partially Refunded
- On `Completed`: sets Payment to COMPLETED, Order to PAID
- On failure: sets Payment to FAILED
- Structured logging of all Khalti responses

### 4. Secure Signed Download URLs

**File:** `backend/apps/orders/views.py` (added)

**`POST /api/orders/{order_id}/download-token/{item_id}/`**
- Authenticated users only
- Verifies order is paid and item is digital
- Generates HMAC-SHA256 signed token with 1-hour expiry
- Token binds: order_id + artwork_id + user_id + expiry
- Returns token, expiry seconds, and signed download URL

**`GET /api/orders/{order_id}/download/{item_id}/?token=...`**
- Authenticated users only
- Verifies token signature and expiry
- Re-verifies order is paid
- Increments download count
- Serves file with `Content-Disposition: attachment`

**Settings added:**
- `DOWNLOAD_TOKEN_SECRET` — defaults to Django SECRET_KEY
- `DOWNLOAD_TOKEN_EXPIRY_SECONDS` — defaults to 3600 (1 hour)

### 5. Checkout Flow (Frontend)

**File:** `frontend/src/pages/Checkout.jsx`

- Nepal-specific shipping address form (province/district/city/street/phone)
- Saved addresses or new address option
- Cart items review with quantities
- Order summary with subtotal, shipping (NPR 150 for physical, free for digital), total
- "Place Order" flow:
  1. POST to `/api/orders/` to create order
  2. POST to `/api/payments/khalti/initiate/` to get payment URL
  3. Redirect browser to Khalti payment page

### 6. Payment Verification (Frontend)

**File:** `frontend/src/pages/PaymentVerify.jsx`

- Handles Khalti callback redirect
- Reads `pidx`, `status`, `payment_id`, `order_id` from URL params
- Validates `payment_id` is a valid UUID
- Handles Khalti `status` param: Completed, User canceled, Expired, etc.
- Calls `POST /api/payments/khalti/verify/` to confirm with backend
- Shows success, canceled, or failed UI with appropriate messaging

### 7. Order History with Downloads (Frontend)

**File:** `frontend/src/pages/OrderHistory.jsx`

- Lists all orders with payment and fulfillment status badges
- "Pay with Khalti" button for unpaid orders
- Expandable order details with items, shipping, tracking
- Digital download button (for paid orders):
  1. Requests signed token via POST to download-token endpoint
  2. Fetches file via signed download URL
  3. Triggers browser blob download

### 8. Preview vs Full-Resolution Files

**File:** `backend/apps/artworks/models.py`

- `DigitalFile` model has separate fields:
  - `file` — full-resolution digital artwork (write_only in API, only accessible via download)
  - `preview_image` — lower-resolution preview image (read-only in API, shown in marketplace)
- `DigitalFileSerializer` hides the actual file URL from GET responses

### 9. Documentation

**File:** `docs/khalti.md`

- Complete integration guide with sandbox/production config
- API flow diagram (7 steps)
- Sandbox test credentials
- Secure download token flow
- Production switching instructions
- Key files reference table

---

## API Endpoints Summary

| Endpoint | Method | Auth | Description |
|---|---|---|---|
| `/api/payments/khalti/initiate/` | POST | User | Initiate Khalti payment |
| `/api/payments/khalti/verify/` | POST | User | Verify payment with Khalti |
| `/api/orders/{id}/download-token/{item_id}/` | POST | User | Get signed download token |
| `/api/orders/{id}/download/{item_id}/` | GET | User+token | Download digital file |

---

## Khalti Integration Flow

```
Checkout Page → POST /api/orders/ → Order Created
                ↓
        POST /api/payments/khalti/initiate/
                ↓
        Khalti returns payment_url + pidx
                ↓
        Browser redirects to Khalti
                ↓
        User pays on Khalti
                ↓
        Khalti redirects to /payment-verify
                ↓
        POST /api/payments/khalti/verify/
                ↓
        Payment COMPLETED → Order PAID
                ↓
        Digital downloads unlocked
```

---

## Files Created/Modified

### Backend
```
apps/payments/
  khalti.py (rewritten — correct URLs, auth, timeout, error handling)
  views.py (rewritten — UUID validation, all statuses, logging)
  models.py (unchanged)
  urls.py (unchanged)

apps/orders/
  views.py (added download token + signed download views)
  urls.py (added 2 download URL patterns)

artisa/
  settings.py (added KHALTI_BASE_URL, KHALTI_WEBSITE_URL,
               DOWNLOAD_TOKEN_SECRET, DOWNLOAD_TOKEN_EXPIRY_SECONDS)

.env.example (added KHALTI_BASE_URL, KHALTI_WEBSITE_URL)
```

### Frontend
```
src/pages/
  Checkout.jsx (Khalti redirect flow)
  PaymentVerify.jsx (callback handler with status handling)
  OrderHistory.jsx (signed download token flow)

docs/
  khalti.md (complete integration documentation)
```

---

## Testing Instructions

### Khalti Sandbox Test
1. Add digital and/or physical artworks to cart
2. Go to checkout, fill shipping address (if physical)
3. Click "Place Order"
4. Redirected to Khalti test page
5. Enter test Khalti ID: `9800000000`
6. Enter MPIN: `1111`
7. Enter OTP: `987654`
8. Complete payment
9. Redirected to `/payment-verify` — should show success
10. Order history shows "Payment: PAID"
11. Digital downloads available via signed token

### Signed Download Test
1. Place and pay for an order with digital artwork
2. Go to Order History, expand the order
3. Click "Download" on digital item
4. Frontend requests signed token, then downloads file
5. Token expires after 1 hour
6. Token cannot be reused by different user

---

## Technical Decisions

### HMAC-SHA256 Signed Tokens
- Tokens bind order_id + artwork_id + user_id + expiry
- Cannot be forged, reused, or transferred
- 1-hour expiry by default (configurable)
- Uses Django's settings.SECRET_KEY as default signing key

### Khalti API (Server-Side Only)
- No client SDK — pure REST API calls via `requests`
- Amount in paisa (NPR x 100) per Khalti spec
- Authorization header: `Key <secret_key>`
- Timeout: 10 seconds with structured error logging

### Separate Preview vs Full-Res
- `preview_image` field shown in marketplace (read-only API)
- `file` field hidden from API (write_only)
- Only accessible via authenticated download endpoint

---

## Notes

1. Khalti sandbox test credentials: 9800000000 / MPIN 1111 / OTP 987654
2. Amount must be > 10 NPR (1000 paisa) per Khalti validation
3. Payment link expires in 60 minutes in production
4. KYC required for transactions > NPR 200 (contact Khalti)
5. `mock_pay_order` endpoint still available for dev testing
6. Preview images served from media URL; full files via download endpoint only
