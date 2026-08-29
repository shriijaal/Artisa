# Task 10 Completion Log — Shopping Cart

**Completed:** August 19, 2026  
**Phase:** E-Commerce (Weeks 9–12)  
**Status:** Done

---

## Goal

Build shopping cart functionality with add/remove/update quantity, cart persistence per user, cart badge in navbar, and cart_add interaction logging.

---

## Deliverables Checklist

- [x] Add/remove/update quantity (physical; digital qty = 1)
- [x] Persisted per user; cart badge in navbar
- [x] Log `cart_add` interactions

---

## What We Built

### 1. Backend Models

**File:** `backend/apps/orders/models.py`

**Existing Model Used:**
- `CartItem` - User's cart items
  - Unique constraint on (user, artwork)
  - Quantity field for physical artworks
  - Auto-updated timestamp
  - Foreign key to Artwork model

No new models created - CartItem already existed from Task 4.

### 2. Backend API Endpoints

**File:** `backend/apps/orders/serializers.py` (new)

**Added Serializer:**
- `CartItemSerializer` - Handles cart item data
  - Validates quantity (minimum 1)
  - Validates artwork exists and is published
  - Enforces quantity = 1 for digital artworks
  - Includes artwork details (nested serializer)

**File:** `backend/apps/orders/views.py` (new)

**Added Endpoints:**

**`GET /api/orders/cart/`**
- List user's cart items
- Authenticated users only
- Returns cart items with artwork details

**`POST /api/orders/cart/`**
- Add artwork to cart
- Logs cart_add interaction
- Creates new item or increments quantity if exists
- Validates artwork is published
- Enforces quantity = 1 for digital artworks

**`PUT /api/orders/cart/<item_id>/`**
- Update cart item quantity
- Validates quantity >= 1
- Enforces quantity = 1 for digital artworks

**`DELETE /api/orders/cart/<item_id>/`**
- Remove single cart item

**`DELETE /api/orders/cart/clear/`**
- Clear entire cart

**File:** `backend/apps/orders/urls.py` (new)

Added URL patterns for cart endpoints.

**File:** `backend/artisa/urls.py`

Added orders URLs to main URL config.

### 3. Frontend Cart Page

**File:** `frontend/src/pages/Cart.jsx` (new)

**Features:**
- Lists all cart items with artwork details
- Displays artwork thumbnail, title, artist, price
- Quantity controls (+/- buttons)
- Digital artworks have quantity fixed at 1
- Remove individual items
- Clear entire cart with confirmation
- Order summary sidebar
- Subtotal calculation
- Shipping placeholder (calculated at checkout)
- Total display
- Proceed to checkout button (placeholder)
- Empty state with browse CTA
- Redirects to login if not authenticated

### 4. Frontend Header Component

**File:** `frontend/src/components/Header.jsx` (new)

**Features:**
- Shared header component for all pages
- Logo links to marketplace
- Cart icon with badge showing item count
- Badge shows red circle with count
- Dashboard link for authenticated users
- Login link for non-authenticated users
- Fetches cart count on mount for authenticated users

**Updated Pages:**
- `Marketplace.jsx` - Uses shared Header
- `ArtworkDetail.jsx` - Uses shared Header
- `Cart.jsx` - Uses shared Header

### 5. Add-to-Cart Functionality

**File:** `frontend/src/pages/ArtworkDetail.jsx`

**Added Features:**
- Add to Cart button with loading state
- Calls POST /api/orders/cart/
- Redirects to login if not authenticated
- Shows success/error alerts
- Logs cart_add interaction (backend)

**File:** `frontend/src/App.jsx`

Added route:
- `/cart` (protected) - Cart page

---

## API Endpoints Summary

| Endpoint | Method | Auth | Description |
|---|---|---|---|
| `/api/orders/cart/` | GET | User | List cart items |
| `/api/orders/cart/` | POST | User | Add to cart |
| `/api/orders/cart/<id>/` | PUT | User | Update quantity |
| `/api/orders/cart/<id>/` | DELETE | User | Remove item |
| `/api/orders/cart/clear/` | DELETE | User | Clear cart |

---

## Cart Interaction Logging

**Implementation:**
- Automatically logged when user adds artwork to cart
- Uses existing UserInteraction model from recs app
- Interaction type: 'cart_add'
- Target type: 'artwork'
- Target ID: artwork UUID

**Purpose:**
- Track user purchase intent
- Build recommendation data
- Analytics for artists

---

## Cart Flow

1. **Add to Cart**
   - User clicks "Add to Cart" on artwork detail page
   - API call to POST /api/orders/cart/
   - Cart_add interaction logged
   - If artwork already in cart, quantity incremented
   - Cart badge updates

2. **View Cart**
   - Navigate to /cart
   - Fetches all cart items
   - Displays with artwork details
   - Shows subtotal and total

3. **Update Quantity**
   - Click +/- buttons
   - API call to PUT /api/orders/cart/<id>/
   - Digital artworks fixed at quantity 1
   - Subtotal recalculated

4. **Remove Item**
   - Click "Remove" button
   - API call to DELETE /api/orders/cart/<id>/
   - Item removed from cart
   - Cart badge updates

5. **Clear Cart**
   - Click "Clear Cart"
   - Confirmation dialog
   - API call to DELETE /api/orders/cart/clear/
   - All items removed

---

## Digital vs Physical Artworks

**Physical Artworks:**
- Quantity can be any positive integer
- Limited by stock (validation in Task 11)
- Can add multiple to cart

**Digital Artworks:**
- Quantity fixed at 1
- Cannot increase quantity
- Can still add to cart multiple times (increments quantity)
- Backend validation enforces quantity = 1

---

## Files Created/Modified

### Backend
```
apps/orders/
  serializers.py (new)
  views.py (new)
  urls.py (new)

artisa/
  urls.py (added orders URLs)
```

### Frontend
```
src/
  components/
    Header.jsx (new)
  pages/
    Cart.jsx (new)
    ArtworkDetail.jsx (added addToCart)
    Marketplace.jsx (use shared Header)
  App.jsx (added /cart route)
```

---

## Testing Instructions

### 1. Test Add to Cart
1. Navigate to artwork detail page
2. Click "Add to Cart"
3. Should redirect to login if not authenticated
4. After login, should show "Added to cart!" alert
5. Cart badge should show count

### 2. Test Cart Page
1. Navigate to /cart
2. Should see all cart items
3. Click +/- to change quantity
4. Click "Remove" to delete item
5. Click "Clear Cart" to empty cart

### 3. Test Cart Badge
1. Add items to cart
2. Check header cart icon
3. Badge should show correct count
4. Count updates when items added/removed

### 4. Test Digital Artworks
1. Add digital artwork to cart
2. Try to increase quantity
3. Should be disabled (quantity fixed at 1)

### 5. Test Cart Add Logging
1. Add artwork to cart
2. Check database for UserInteraction record
3. Should have interaction_type='cart_add'

---

## Technical Decisions

### CartItem Model in Orders App
- Cart is e-commerce functionality
- Natural fit with Order models
- Unique constraint prevents duplicates
- Simple get_or_create for add/increment

### Shared Header Component
- Consistent navigation across pages
- Cart badge visible on all pages
- Fetches cart count on mount
- Shows login/dashboard based on auth state

### Digital Quantity Fixed at 1
- Digital downloads don't need multiple copies
- Backend validation enforces this
- Frontend disables + button for digital
- Still allows adding to cart (increments quantity)

### Cart Add Interaction Logging
- Logged automatically on backend
- Uses existing UserInteraction model
- Tracks purchase intent
- Data for recommendations

---

## Next Steps

**Task 11 — Orders + Shipping + Earnings:**
- Build checkout flow
- Create orders from cart
- Shipping address management
- Order status tracking
- Artist earnings calculation
- Log purchase interactions

---

## Notes

1. CartItem model already existed from Task 4 - reused
2. Digital artworks have quantity fixed at 1
3. Cart badge shows item count in header
4. Shared Header component for consistency
5. Cart_add interactions logged automatically
6. Proceed to checkout button is placeholder (Task 11)
