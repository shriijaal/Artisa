# Artisa Project - Complete Page List

This document lists all pages that need to be built for the Artisa platform, organized by user type and functionality.

---

## Public Pages (No Authentication Required)

### 1. Homepage
- Hero section with CTAs
- Featured artworks carousel
- "For You" recommendations
- Trending artists section
- Categories grid
- Footer with links

### 2. Marketplace / Browse Artworks
- Filters sidebar (category, price, type, verified)
- Search bar
- Sort options (newest, price, popularity)
- Artwork grid (3-4 columns)
- Pagination

### 3. Artwork Detail Page
- Image gallery with thumbnails
- Artist info (avatar, name, verified badge)
- Action buttons (add to cart, favorite, commission)
- Artwork details (title, price, description, tags)
- Similar works section
- Reviews section with rating distribution

### 4. Artist Profile Page
- Cover image
- Profile header (avatar, name, verified badge, stats)
- Bio and social links
- Tabs: Artworks, Reviews, About
- Artworks grid
- Similar artists section

### 5. About Page
- Platform overview
- Mission and vision
- Team information

### 6. Contact Page
- Contact form
- FAQ section

---

## Authentication Pages

### 7. Login Page
- Username/email and password fields
- Remember me checkbox
- Forgot password link
- Link to registration
- Social login (optional)

### 8. Register Page
- Username, email, password fields
- Password confirmation
- First name, last name
- Role selection (customer only - artist via application)
- Terms and conditions checkbox

### 9. Forgot Password Page
- Email input
- Submit button
- Instructions

### 10. Reset Password Page
- New password input
- Password confirmation
- Submit button

---

## Customer Pages (Authentication Required)

### 11. Customer Dashboard
- Welcome message
- Quick stats (orders, wishlist, reviews)
- Recent orders list
- Quick actions

### 12. Wishlist Page
- Grid of favorited artworks
- Remove from wishlist
- Add to cart
- Filter/sort options

### 13. Cart Page
- Cart items list with quantity controls
- Item details (image, title, artist, price)
- Order summary (subtotal, shipping, total)
- Continue shopping button
- Proceed to checkout button
- Empty cart state

### 14. Checkout Page
- Shipping address form
- Saved addresses selection
- Add new address
- Order summary
- Payment method selection (Khalti)
- Place order button
- Terms and conditions

### 15. Order History Page
- List of all orders
- Order status badges
- Order details (items, total, date)
- Track order button
- Reorder button
- Filter by status

### 16. Order Detail Page
- Order information (number, date, status)
- Items list with artwork details
- Shipping address
- Payment information
- Tracking information
- Actions (cancel, return if applicable)

### 17. Commission Request Page
- Artist selection (from artist profile)
- Title input
- Description textarea
- Budget input
- Deadline date picker
- Revision limit selector
- Submit button

### 18. Commission History Page
- List of all commission requests
- Status badges
- Commission details
- View messages button
- Filter by status

### 19. Commission Detail Page
- Commission information
- Artist information
- Status timeline
- Deliverables section
- Messages section
- Actions (accept/reject, submit deliverable, approve)

### 20. Messages Page
- Conversation list
- Search messages
- Filter by commission
- Message thread view
- Send message input

### 21. Profile Settings Page
- Personal information form
- Avatar upload
- Change password
- Email preferences
- Delete account

### 22. Shipping Addresses Page
- List of saved addresses
- Add new address form
- Edit address
- Set default address
- Delete address

---

## Artist Pages (Authentication Required + Approved Artist Profile)

### 23. Artist Dashboard
- Welcome message with verified badge
- Quick stats (artworks, orders, revenue, rating)
- Commission requests section
- Recent orders to process
- Quick actions

### 24. Artist Application Page
- Application form
- Portfolio samples upload
- Verification document upload (optional)
- Reason textarea
- Submit button
- Application status display

### 25. My Artworks Page
- List of artist's artworks
- Status badges (draft, pending, published, removed)
- Filter by status
- Add new artwork button
- Edit artwork
- Delete artwork

### 26. Create/Edit Artwork Page
- Title input
- Description textarea
- Price input
- Type selection (physical/digital)
- Category selection
- Stock input (for physical)
- Image upload (multiple)
- Primary image selection
- Tags input
- Originality confirmation checkbox
- Save as draft / Submit for review buttons

### 27. Artist Orders Page
- List of received orders
- Order status
- Customer information
- Items to fulfill
- Process order button
- Mark as shipped button
- Add tracking number

### 28. Artist Commissions Page
- List of commission requests
- Status badges
- Customer information
- Budget and deadline
- Accept/Reject buttons
- Submit deliverable button

### 29. Artist Profile Settings Page
- Bio textarea
- Cover image upload
- Social links (Instagram, Facebook, etc.)
- Save button

---

## Admin Pages (Authentication Required + Admin Role)

### 30. Admin Dashboard
- Platform statistics (users, artworks, orders, revenue)
- Recent activity
- Quick actions
- Reports overview

### 31. User Management Page
- List of all users
- Filter by role
- Search users
- View user details
- Edit user
- Ban/unban user
- Delete user

### 32. Artist Applications Page
- List of pending applications
- Application details
- Portfolio samples
- Verification document (admin-only)
- Approve button
- Reject button with reason
- Application history

### 33. Artwork Moderation Page
- List of pending artworks
- Artwork details
- Images
- Approve button
- Reject button with reason
- Published artworks list
- Removed artworks list

### 34. Category Management Page
- List of categories
- Add new category
- Edit category
- Delete category
- Category hierarchy

### 35. Order Management Page
- List of all orders
- Filter by status
- View order details
- Update order status
- Refund order

### 36. Commission Management Page
- List of all commissions
- Filter by status
- View commission details
- Escalate disputes

### 37. Payment Management Page
- List of all payments
- Filter by status
- View payment details
- Refund payment
- Transaction reports

### 38. Content Moderation Page
- Flagged content
- Reviews to moderate
- Comments to moderate
- Approve/reject actions

### 39. Analytics Page
- User growth chart
- Sales chart
- Revenue chart
- Popular artworks
- Top artists
- Commission statistics

### 40. Settings Page
- Platform settings
- Email configuration
- Payment settings
- Notification settings
- Maintenance mode

---

## Error Pages

### 41. 404 Not Found Page
- Friendly error message
- Return to homepage button
- Search bar

### 42. 500 Server Error Page
- Apology message
- Contact support link
- Return to homepage button

### 43. 403 Forbidden Page
- Access denied message
- Login prompt
- Return to previous page

---

## Modal/Overlay Pages

### 44. Quick View Modal
- Artwork image
- Basic details
- Add to cart button
- View full details link

### 45. Commission Request Modal
- Pre-filled with artist info
- Quick commission form
- Submit button

### 46. Share Modal
- Social sharing buttons
- Copy link button
- Email share

### 47. Image Lightbox
- Full-size image view
- Previous/next navigation
- Close button
- Download button (if applicable)

---

## Summary by Category

**Public:** 6 pages
**Authentication:** 4 pages
**Customer:** 12 pages
**Artist:** 7 pages
**Admin:** 11 pages
**Error:** 3 pages
**Modals:** 4 pages

**Total: 47 pages/modals**

---

## Implementation Priority

**Phase 1 (Foundation):**
- Authentication pages (7-10)
- Homepage (1)
- Marketplace (2)
- Artwork Detail (3)
- Artist Profile (4)

**Phase 2 (Core Features):**
- Customer Dashboard (11)
- Cart (13)
- Checkout (14)
- Order History (15)
- Artist Application (24)
- Artist Dashboard (23)

**Phase 3 (Advanced Features):**
- Wishlist (12)
- Commissions (17-19, 28)
- Messages (20)
- Profile Settings (21-22)
- Admin Dashboard (30-40)

**Phase 4 (Polish):**
- Error pages (41-43)
- Modals (44-47)
- About/Contact (5-6)
