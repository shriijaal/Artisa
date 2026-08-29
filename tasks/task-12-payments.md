# Task 12: Khalti Payments + Secure Digital Downloads

**Phase:** E-Commerce (Week 9–10)  
**Depends on:** Task 11  
**Blocks:** Task 13

## Goal

Khalti payment integration and secure delivery of digital artwork files.

## Deliverables

- [x] Khalti sandbox: `POST /api/payments/khalti/initiate` + `/verify`
- [x] Server-side payment verification (idempotent — no double-credit)
- [x] Update order `payment_status`; store records in `payments` table
- [x] `GET /api/orders/{id}/download/{item_id}` — auth + ownership check
- [x] Time-limited signed download URLs for digital files
- [x] Separate preview image vs full-resolution digital file
- [x] React checkout flow with Khalti widget/redirect
- [x] Document Khalti sandbox setup in `docs/`

## MVP milestone

Completing this task delivers the **minimum demo-ready purchase flow**.
