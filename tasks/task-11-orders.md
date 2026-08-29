# Task 11: Orders + Shipping + Earnings

**Phase:** E-Commerce (Week 9)  
**Depends on:** Task 10  
**Blocks:** Task 12

## Goal

Checkout, multi-vendor orders, Nepal shipping, and artist earnings summary.

## Deliverables

- [ ] Nepal address form: province, district, city, street, phone
- [ ] `POST /api/orders` — create from cart, split items by artist
- [ ] Order status: `pending` → `paid` → `processing` → `shipped` → `delivered`
- [ ] Stock decrement on purchase; block out-of-stock items
- [ ] Artist marks item shipped + tracking number (`OrderShipment`)
- [ ] Customer order history page
- [ ] Artist order management view
- [ ] `GET /api/artist/earnings` — sales total + per-order breakdown
- [ ] Log `purchase` interactions on order completion
