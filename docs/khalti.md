# Khalti Payment Integration

Artisa uses the Khalti ePayment Gateway (KPG v2) for processing checkout payments.
The system uses server-side API calls (no client SDK) with a redirect-based flow.

## Configuration

All Khalti settings are in `backend/.env`:

```env
# Khalti Payment Gateway
# Sandbox: sign up at https://test-admin.khalti.com/#/join/merchant
# Production: sign up at https://admin.khalti.com
KHALTI_SECRET_KEY=your_live_secret_key_here
KHALTI_BASE_URL=https://dev.khalti.com/api/v2
KHALTI_WEBSITE_URL=http://localhost:5173
```

| Setting | Sandbox | Production |
|---|---|---|
| `KHALTI_BASE_URL` | `https://dev.khalti.com/api/v2` | `https://khalti.com/api/v2` |
| `KHALTI_SECRET_KEY` | Live secret key from test-admin.khalti.com | Live secret key from admin.khalti.com |
| `KHALTI_WEBSITE_URL` | `http://localhost:5173` | Your production domain |

## Sandbox Test Credentials

Use these when redirected to the Khalti checkout page:

- **Khalti ID / Mobile:** `9800000000` (or `9800000001` through `9800000005`)
- **MPIN:** `1111`
- **OTP:** `987654`

Note: E-Banking and debit/credit card payments are not supported in sandbox.

## API Flow

1. **Checkout** — User clicks "Place Order" on `/checkout`.
2. **Order created** — Frontend POSTs to `POST /api/orders/` to create the order.
3. **Initiate payment** — Frontend POSTs to `POST /api/payments/khalti/initiate/` with `order_id`.
   - Backend creates a pending `Payment` record.
   - Backend calls Khalti's `/epayment/initiate/` with amount in paisa, customer info, product details, and a return URL.
   - Khalti returns `pidx` and `payment_url`.
4. **Redirect** — Frontend redirects the browser to Khalti's `payment_url`.
5. **User pays** — User logs in to Khalti and completes payment.
6. **Callback** — Khalti redirects back to `/payment-verify` with `pidx`, `status`, `transaction_id`, etc.
7. **Verify** — Frontend POSTs to `POST /api/payments/khalti/verify/` with `pidx` and `payment_id`.
   - Backend calls Khalti's `/epayment/lookup/` to confirm status.
   - On `Completed`: Payment set to COMPLETED, Order set to PAID.
   - On `Expired`/`User canceled`: Payment set to FAILED.
   - On `Refunded`: Payment set to REFUNDED.

## Secure Digital Downloads

Paid digital artworks are downloaded via time-limited signed tokens:

1. **Request token** — Frontend POSTs to `POST /api/orders/{order_id}/download-token/{item_id}/`.
   - Backend verifies the order is paid and the item is digital.
   - Returns a signed token (HMAC-SHA256, 1-hour expiry) and a download URL.
2. **Download file** — Frontend fetches the signed download URL.
   - Backend verifies the token signature and expiry.
   - Serves the file with `Content-Disposition: attachment`.

The token binds together `order_id`, `artwork_id`, `user_id`, and `expiry`, so it cannot be reused by a different user or after expiration.

## Switching to Production

1. Sign up as a merchant at https://admin.khalti.com
2. Get your `live_secret_key` from the merchant dashboard
3. Update `.env`:
   ```env
   KHALTI_SECRET_KEY=your_live_secret_key
   KHALTI_BASE_URL=https://khalti.com/api/v2
   KHALTI_WEBSITE_URL=https://your-production-domain.com
   ```
4. Complete KYC to remove the NPR 200 per-transaction limit (contact Khalti at 9801890085).

## Key Files

| File | Purpose |
|---|---|
| `backend/apps/payments/khalti.py` | Khalti API client (initiate + lookup) |
| `backend/apps/payments/views.py` | KhaltiInitiateView, KhaltiVerifyView |
| `backend/apps/payments/models.py` | Payment model |
| `backend/apps/orders/views.py` | Download token generation + signed file serving |
| `frontend/src/pages/Checkout.jsx` | Checkout page with address form + Khalti redirect |
| `frontend/src/pages/PaymentVerify.jsx` | Khalti callback handler |
| `frontend/src/pages/OrderHistory.jsx` | Order list with signed download buttons |
