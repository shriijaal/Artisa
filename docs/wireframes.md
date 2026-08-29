# Figma Wireframes Documentation

**Artisa E-Commerce Platform**

---

## Overview

This document describes the wireframe designs for key pages in the Artisa platform. These wireframes serve as blueprints for the UI/UX implementation in Figma.

---

## Design System

### Color Palette

```css
/* Primary Colors */
--color-primary: #1c1917;      /* stone-900 */
--color-primary-hover: #292524; /* stone-800 */
--color-secondary: #78716c;    /* stone-500 */

/* Accent Colors */
--color-accent: #ea580c;       /* orange-600 */
--color-accent-hover: #c2410c; /* orange-700 */

/* Neutral Colors */
--color-bg: #fafaf9;            /* stone-50 */
--color-surface: #ffffff;       /* white */
--color-border: #e7e5e4;        /* stone-200 */

/* Text Colors */
--color-text-primary: #1c1917;  /* stone-900 */
--color-text-secondary: #57534e; /* stone-600 */
--color-text-muted: #a8a29e;     /* stone-400 */

/* Status Colors */
--color-success: #16a34a;       /* green-600 */
--color-warning: #ca8a04;       /* yellow-600 */
--color-error: #dc2626;         /* red-600 */
```

### Typography

```css
/* Font Family */
--font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;

/* Font Sizes */
--text-xs: 0.75rem;      /* 12px */
--text-sm: 0.875rem;     /* 14px */
--text-base: 1rem;       /* 16px */
--text-lg: 1.125rem;     /* 18px */
--text-xl: 1.25rem;      /* 20px */
--text-2xl: 1.5rem;      /* 24px */
--text-3xl: 1.875rem;    /* 30px */
--text-4xl: 2.25rem;     /* 36px */

/* Font Weights */
--font-normal: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;
```

### Spacing

```css
--spacing-xs: 0.5rem;      /* 8px */
--spacing-sm: 0.75rem;     /* 12px */
--spacing-md: 1rem;        /* 16px */
--spacing-lg: 1.5rem;      /* 24px */
--spacing-xl: 2rem;        /* 32px */
--spacing-2xl: 3rem;       /* 48px */
--spacing-3xl: 4rem;       /* 64px */
```

### Components

#### Buttons
```css
/* Primary Button */
.btn-primary {
  background: var(--color-primary);
  color: white;
  padding: 0.625rem 1.25rem;
  border-radius: 0.5rem;
  font-weight: var(--font-medium);
  transition: background 0.2s;
}

.btn-primary:hover {
  background: var(--color-primary-hover);
}

/* Secondary Button */
.btn-secondary {
  background: white;
  color: var(--color-primary);
  border: 1px solid var(--color-border);
  padding: 0.625rem 1.25rem;
  border-radius: 0.5rem;
  font-weight: var(--font-medium);
}

/* Accent Button */
.btn-accent {
  background: var(--color-accent);
  color: white;
  padding: 0.625rem 1.25rem;
  border-radius: 0.5rem;
  font-weight: var(--font-medium);
}
```

#### Cards
```css
.card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 1rem;
  padding: var(--spacing-lg);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}
```

#### Inputs
```css
.input {
  width: 100%;
  padding: 0.625rem 1rem;
  border: 1px solid var(--color-border);
  border-radius: 0.5rem;
  font-size: var(--text-base);
  transition: border-color 0.2s;
}

.input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(28, 25, 23, 0.1);
}
```

---

## Page Wireframes

### 1. Homepage

#### Layout Structure
```
┌─────────────────────────────────────────────────────────────┐
│ Header: Logo | Search | Nav Links | Auth Buttons          │
├─────────────────────────────────────────────────────────────┤
│ Hero Section: Welcome + CTA                                │
├─────────────────────────────────────────────────────────────┤
│ Featured Artworks Carousel (Horizontal Scroll)              │
├─────────────────────────────────────────────────────────────┤
│ "For You" Recommendations (Grid)                           │
├─────────────────────────────────────────────────────────────┤
│ "Trending Artists" Section (Horizontal Scroll)             │
├─────────────────────────────────────────────────────────────┤
│ Categories Section (Grid)                                  │
├─────────────────────────────────────────────────────────────┤
│ Footer: Links | Social | Copyright                         │
└─────────────────────────────────────────────────────────────┘
```

#### Components

**Header**
- Logo (left)
- Search bar (center)
- Navigation: Marketplace, Artists, Commissions
- Auth: Login/Register (guest) or User Menu (authenticated)

**Hero Section**
- Headline: "Discover Authentic Nepali Art"
- Subtext: "Connect with verified artists and purchase original artwork"
- CTA Buttons: "Browse Artworks" (primary), "Become an Artist" (secondary)

**Featured Artworks Carousel**
- 4-6 featured artworks
- Large card layout with artwork image
- Artist name, title, price
- Verified badge for artists
- Navigation arrows

**"For You" Recommendations**
- Grid layout (3-4 columns)
- Personalized artwork cards
- Image, title, artist, price
- Favorite button
- Hover: quick view

**Trending Artists**
- Horizontal scroll of artist cards
- Avatar, name, verified badge
- Artwork count, rating
- "View Profile" button

**Categories**
- Grid of category cards with icons
- Paintings, Sculptures, Digital Art, Photography, etc.
- Artwork count per category

---

### 2. Marketplace Page

#### Layout Structure
```
┌─────────────────────────────────────────────────────────────┐
│ Header: Logo | Search | Nav Links | Auth Buttons          │
├─────────────────────────────────────────────────────────────┤
│ Filters Sidebar: Category, Price, Type, Verified           │
├──────────┬──────────────────────────────────────────────────┤
│          │ Search Bar + Sort Dropdown                      │
│          ├──────────────────────────────────────────────────┤
│          │ Artwork Grid (3-4 columns)                      │
│          │ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐            │
│          │ │ Card │ │ Card │ │ Card │ │ Card │            │
│          │ └──────┘ └──────┘ └──────┘ └──────┘            │
│          │ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐            │
│          │ │ Card │ │ Card │ │ Card │ │ Card │            │
│          │ └──────┘ └──────┘ └──────┘ └──────┘            │
│          ├──────────────────────────────────────────────────┤
│          │ Pagination                                       │
└──────────┴──────────────────────────────────────────────────┘
```

#### Components

**Filters Sidebar**
- Category dropdown (multi-select)
- Price range slider
- Type: Physical/Digital (checkboxes)
- Verified Artists Only (toggle)
- Apply Filters button

**Artwork Card**
- Image (aspect ratio 4:3)
- Artist avatar + name (small)
- Artwork title
- Price (NPR)
- Verified badge (if applicable)
- Favorite button (heart icon)
- Hover: "Quick View" button

**Sort Options**
- Newest First
- Price: Low to High
- Price: High to Low
- Most Popular
- Rating

---

### 3. Artwork Detail Page

#### Layout Structure
```
┌─────────────────────────────────────────────────────────────┐
│ Header: Logo | Search | Nav Links | Auth Buttons          │
├─────────────────────────────────────────────────────────────┤
│ Breadcrumb: Home > Marketplace > Category > Artwork         │
├─────────────────────────────────────────────────────────────┤
│ ┌──────────────────┬──────────────────────────────────────┐ │
│ │                  │ Artwork Title                         │ │
│ │  Main Image      │ Artist: [Avatar] Name [Verified]     │ │
│ │  Gallery         │ Price: NPR 15,000                    │ │
│ │                  │ ┌─────────────────────────────────┐   │ │
│ │  Thumbnails     │ │ Add to Cart (Primary)          │   │ │
│ │  (Horizontal)    │ │ Add to Favorites (Secondary)    │   │ │
│ │                  │ │ Commission Artist (Accent)      │   │ │
│ │                  │ └─────────────────────────────────┘   │ │
│ │                  │ Description                           │ │
│ │                  │ Category: [Badge]                     │ │
│ │                  │ Type: [Badge]                         │ │
│ │                  │ Tags: [Tag] [Tag] [Tag]               │ │
│ │                  │                                      │ │
│ │                  │ Similar Works (Grid)                  │ │
│ │                  │ ┌────┐ ┌────┐ ┌────┐                 │ │
│ │                  │ │Card│ │Card│ │Card│                 │ │
│ │                  │ └────┘ └────┘ └────┘                 │ │
│ └──────────────────┴──────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│ Reviews Section                                            │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Rating Summary: 4.5/5 (23 reviews)                     │ │
│ │ Rating Distribution (Bar Chart)                         │ │
│ │ Review List (Cards)                                     │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

#### Components

**Image Gallery**
- Main image (large)
- Thumbnail strip (horizontal scroll)
- Click thumbnail to change main image
- Zoom on hover

**Artist Info**
- Avatar (circular)
- Name (clickable → profile)
- Verified badge (green checkmark)
- "View Profile" link

**Action Buttons**
- Add to Cart (primary, large)
- Add to Favorites (secondary, heart icon)
- Commission Artist (accent, for custom work)

**Artwork Details**
- Title (heading)
- Price (large, prominent)
- Description (paragraph)
- Category badge
- Type badge (Physical/Digital)
- Tags (clickable)

**Similar Works**
- Grid of 3-6 similar artworks
- Based on category, tags, artist style
- "View All Similar" link

**Reviews Section**
- Overall rating (large number + stars)
- Rating distribution (5 stars bar chart)
- Review cards with:
  - User avatar + name
  - Rating (stars)
  - Date
  - Comment
  - Helpful buttons

---

### 4. Artist Profile Page

#### Layout Structure
```
┌─────────────────────────────────────────────────────────────┐
│ Header: Logo | Search | Nav Links | Auth Buttons          │
├─────────────────────────────────────────────────────────────┤
│ ┌──────────────────────────────────────────────────────────┐ │
│ │ Cover Image (Full Width)                                 │ │
│ │ ┌──────────┐                                            │ │
│ │ │ Avatar   │  Artist Name [Verified Badge]              │ │
│ │ │ (Circle) │  @username | Location                      │ │
│ │ │          │  [Follow Button] [Message Button]          │ │
│ │ └──────────┘  Bio: Lorem ipsum dolor sit amet...          │ │
│ │              Social Links: [Icon] [Icon] [Icon]          │ │
│ │              Stats: 150 Artworks | 1.2k Sales | 4.8★    │ │
│ └──────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│ Tabs: Artworks | Reviews | About                          │
├─────────────────────────────────────────────────────────────┤
│ Artworks Grid (3-4 columns)                                │
│ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐                      │
│ │ Card │ │ Card │ │ Card │ │ Card │                      │
│ └──────┘ └──────┘ └──────┘ └──────┘                      │
│ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐                      │
│ │ Card │ │ Card │ │ Card │ │ Card │                      │
│ └──────┘ └──────┘ └──────┘ └──────┘                      │
├─────────────────────────────────────────────────────────────┤
│ Similar Artists (Horizontal Scroll)                        │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐                   │
│ │ Artist    │ │ Artist    │    │ Artist    │                   │
│ │ Card      │ │ Card      │    │ Card      │                   │
│ └──────────┘ └──────────┘    └──────────┘                   │
└─────────────────────────────────────────────────────────────┘
```

#### Components

**Cover Image**
- Full-width banner
- Artist's featured artwork or custom cover
- Height: 300px

**Profile Header**
- Avatar (circular, overlapping cover)
- Artist name (large heading)
- Verified badge (green checkmark)
- Username (gray text)
- Location (gray text)
- Follow button (primary)
- Message button (secondary)
- Bio (paragraph, max 3 lines with "Read More")
- Social media icons (Instagram, Facebook, etc.)
- Stats row: Artworks count, Sales count, Rating

**Tabs**
- Artworks (default, active)
- Reviews
- About

**Artworks Grid**
- Same as marketplace grid
- Filter by: All, Physical, Digital
- Sort options

**Similar Artists**
- Horizontal scroll
- Artist cards with avatar, name, verified badge
- "View Profile" button

---

### 5. Cart Page

#### Layout Structure
```
┌─────────────────────────────────────────────────────────────┐
│ Header: Logo | Search | Nav Links | Auth Buttons          │
├─────────────────────────────────────────────────────────────┤
│ Breadcrumb: Home > Cart                                     │
├─────────────────────────────────────────────────────────────┤
│ Page Title: Shopping Cart (3 items)                         │
├─────────────────────────────────────────────────────────────┤
│ ┌──────────────────────────────────────────────────────────┐ │
│ │ Cart Items List                                          │ │
│ │ ┌────────────────────────────────────────────────────┐   │ │
│ │ │ [Image] Artwork Title                              │   │ │
│ │ │        Artist Name                                  │   │ │
│ │ │        NPR 15,000      [Qty -] 1 [Qty +]  [Remove] │   │ │
│ │ └────────────────────────────────────────────────────┘   │ │
│ │ ┌────────────────────────────────────────────────────┐   │ │
│ │ │ [Image] Artwork Title                              │   │ │
│ │ │        Artist Name                                  │   │ │
│ │ │        NPR 8,000       [Qty -] 1 [Qty +]  [Remove] │   │ │
│ │ └────────────────────────────────────────────────────┘   │ │
│ │ ┌────────────────────────────────────────────────────┐   │ │
│ │ │ [Image] Artwork Title                              │   │ │
│ │ │        Artist Name                                  │   │ │
│ │ │        NPR 12,000      [Qty -] 1 [Qty +]  [Remove] │   │ │
│ │ └────────────────────────────────────────────────────┘   │ │
│ └──────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│ ┌──────────────────────────┬────────────────────────────────┐ │
│ │                          │ Subtotal: NPR 35,000          │ │
│ │ Continue Shopping       │ Shipping: NPR 500            │ │
│ │                          │ Total: NPR 35,500            │ │
│ │                          │ ┌──────────────────────────┐  │ │
│ │                          │ │ Proceed to Checkout      │  │ │
│ │                          │ └──────────────────────────┘  │ │
│ └──────────────────────────┴────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

#### Components

**Cart Item Card**
- Thumbnail image (left)
- Artwork title (link to detail)
- Artist name (link to profile)
- Price (right)
- Quantity controls: [-] [1] [+]
- Remove button (text, red)
- Stock availability indicator

**Order Summary**
- Subtotal (item prices × quantities)
- Shipping cost (calculated based on location)
- Total (bold, large)
- "Proceed to Checkout" button (primary, full width)

**Empty Cart State**
- Illustration or icon
- "Your cart is empty" message
- "Continue Shopping" button (primary)

---

### 6. Checkout Page

#### Layout Structure
```
┌─────────────────────────────────────────────────────────────┐
│ Header: Logo | Search | Nav Links | Auth Buttons          │
├─────────────────────────────────────────────────────────────┤
│ Breadcrumb: Home > Cart > Checkout                          │
├─────────────────────────────────────────────────────────────┤
│ Page Title: Checkout                                        │
├─────────────────────────────────────────────────────────────┤
│ ┌──────────────────────────┬────────────────────────────────┐ │
│ │ Shipping Address         │ Order Summary                  │ │
│ │ ┌──────────────────────┐ │ ┌──────────────────────────┐  │ │
│ │ │ [Saved Addresses]    │ │ │ Items (3)                │  │ │
│ │ │ [Add New Address]    │ │ │ ┌──────────────────────┐ │  │ │
│ │ │                      │ │ │ │ Item 1 - NPR 15,000  │ │  │ │
│ │ │ Form Fields:         │ │ │ │ Item 2 - NPR 8,000   │ │  │ │
│ │ │ Full Name            │ │ │ │ Item 3 - NPR 12,000  │ │  │ │
│ │ │ Phone                │ │ │ └──────────────────────┘ │  │ │
│ │ │ Province             │ │ │ Subtotal: NPR 35,000    │  │ │
│ │ │ District             │ │ │ │ Shipping: NPR 500      │  │ │
│ │ │ City                 │ │ │ │ Total: NPR 35,500      │  │ │
│ │ │ Street Address       │ │ └──────────────────────────┘  │ │
│ │ │ [Save as Default]    │ │                                │ │
│ │ │                      │ │ Payment Method                 │ │
│ │ │ [Continue] Button    │ │ ┌──────────────────────────┐  │ │
│ │ └──────────────────────┘ │ │ [Khalti Logo]             │  │ │
│ │                          │ │ Pay with Khalti            │  │ │
│ │                          │ │ ┌──────────────────────────┐ │  │ │
│ │                          │ │ │ Place Order (NPR 35,500)│ │  │ │
│ │                          │ │ └──────────────────────────┘ │  │ │
│ │                          │ │                                │ │
│ │                          │ │ Terms & Conditions Checkbox   │ │
│ └──────────────────────────┴────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

#### Components

**Shipping Address Section**
- Saved addresses dropdown (if any)
- "Add New Address" button
- Form fields:
  - Full Name
  - Phone Number
  - Province (dropdown)
  - District (dropdown)
  - City
  - Street Address
- "Save as Default" checkbox
- "Continue" button

**Order Summary**
- Collapsible item list
- Subtotal
- Shipping cost
- Total (bold, large)

**Payment Section**
- Khalti logo
- "Pay with Khalti" radio button (selected)
- "Place Order" button (primary, large)
- Total amount in button
- Terms & Conditions checkbox (required)

---

### 7. Customer Dashboard

#### Layout Structure
```
┌─────────────────────────────────────────────────────────────┐
│ Header: Logo | Search | Nav Links | User Menu              │
├─────────────────────────────────────────────────────────────┤
│ ┌──────────────┬──────────────────────────────────────────┐ │
│ │ Sidebar      │ Main Content Area                        │ │
│ │              │                                          │ │
│ │ [Avatar]     │ Welcome, [Username]!                     │ │
│ │ [Username]   │                                          │ │
│ │              │ Quick Stats:                             │ │
│ │ Dashboard    │ ┌────────┐ ┌────────┐ ┌────────┐          │ │
│ │ Orders       │ │ Orders │ │ Wishlist│ │ Reviews│          │ │
│ │ Wishlist     │ │   5    │ │   12   │ │   8    │          │ │
│ │ Reviews      │ └────────┘ └────────┘ └────────┘          │ │
│ │ Profile      │                                          │ │
│ │ Settings     │ Recent Orders                            │ │
│ │              │ ┌──────────────────────────────────────┐ │ │
│ │              │ │ Order #1234 - Delivered              │ │ │
│ │              │ │ 3 items - NPR 35,500                 │ │ │
│ │              │ │ [View Details] [Reorder]              │ │ │
│ │              │ └──────────────────────────────────────┘ │ │
│ │              │ ┌──────────────────────────────────────┐ │ │
│ │              │ │ Order #1233 - Shipped                │ │ │
│ │              │ │ 2 items - NPR 20,000                 │ │ │
│ │              │ │ [Track Order] [View Details]         │ │ │
│ │              │ └──────────────────────────────────────┘ │ │
│ └──────────────┴──────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

#### Components

**Sidebar**
- User avatar (circular)
- Username
- Navigation links:
  - Dashboard (active)
  - Orders
  - Wishlist
  - Reviews
  - Profile
  - Settings

**Quick Stats**
- 3 stat cards:
  - Orders (count)
  - Wishlist (count)
  - Reviews (count)

**Recent Orders**
- List of recent orders (max 5)
- Each card shows:
  - Order number
  - Status (badge)
  - Item count
  - Total
  - Action buttons (View Details, Track, Reorder)

---

### 8. Artist Dashboard

#### Layout Structure
```
┌─────────────────────────────────────────────────────────────┐
│ Header: Logo | Search | Nav Links | User Menu              │
├─────────────────────────────────────────────────────────────┤
│ ┌──────────────┬──────────────────────────────────────────┐ │
│ │ Sidebar      │ Main Content Area                        │ │
│ │              │                                          │ │
│ │ [Avatar]     │ Welcome, [Username]!                     │ │
│ │ [Username]   │ [Verified Badge]                          │ │
│ │              │                                          │ │
│ │ Dashboard    │ Quick Stats:                             │ │
│ │ Artworks     │ ┌────────┐ ┌────────┐ ┌────────┐          │ │
│ │ Orders       │ │Artworks│ │ Orders │ │ Revenue│          │ │
│ │ Commissions  │ │   25   │ │   18   │ │ NPR 150k│          │ │
│ │ Messages     │ └────────┘ └────────┘ └────────┘          │ │
│ │ Profile      │                                          │ │
│ │ Settings     │ Commission Requests                      │ │
│ │              │ ┌──────────────────────────────────────┐ │ │
│ │              │ │ Request #1 - Pending                  │ │ │
│ │              │ │ Budget: NPR 20,000                   │ │ │
│ │              │ │ [Accept] [Reject] [View Details]       │ │ │
│ │              │ └──────────────────────────────────────┘ │ │
│ │              │ ┌──────────────────────────────────────┐ │ │
│ │              │ │ Request #2 - Accepted                │ │ │
│ │              │ │ Budget: NPR 15,000                   │ │ │
│ │              │ │ [Submit Deliverable] [Message]      │ │ │
│ │              │ └──────────────────────────────────────┘ │ │
│ │              │                                          │ │
│ │              │ Recent Orders                           │ │
│ │              │ ┌──────────────────────────────────────┐ │ │
│ │              │ │ Order #1234 - New Order              │ │ │
│ │              │ │ 2 items - NPR 18,000                 │ │ │
│ │              │ │ [Process Order] [View Details]       │ │
│ │              │ └──────────────────────────────────────┘ │ │
│ └──────────────┴──────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

#### Components

**Sidebar**
- User avatar (circular)
- Username
- Verified badge (green)
- Navigation links:
  - Dashboard (active)
  - Artworks
  - Orders
  - Commissions
  - Messages
  - Profile
  - Settings

**Quick Stats**
- 4 stat cards:
  - Artworks (count)
  - Orders (count)
  - Revenue (NPR)
  - Rating (stars)

**Commission Requests**
- List of pending/active commissions
- Each card shows:
  - Request number
  - Status (badge)
  - Budget
  - Deadline
  - Action buttons (Accept, Reject, Submit, Message)

**Recent Orders**
- List of new orders to process
- Each card shows:
  - Order number
  - Status
  - Item count
  - Total
  - Action buttons (Process, View)

---

## Responsive Design

### Breakpoints

```css
/* Mobile */
@media (max-width: 640px) {
  /* Single column layouts */
  /* Stacked components */
  /* Bottom navigation for mobile */
}

/* Tablet */
@media (min-width: 641px) and (max-width: 1024px) {
  /* 2-column layouts */
  /* Adjusted spacing */
}

/* Desktop */
@media (min-width: 1025px) {
  /* Multi-column layouts */
  /* Full feature set */
}
```

 Mobile Adaptations

**Homepage**
- Hero: Stacked layout
- Carousels: Single column, horizontal scroll
- Grid: 1-2 columns
- Header: Hamburger menu

**Marketplace**
- Filters: Collapsible drawer
- Grid: 1-2 columns
- Sort: Dropdown

**Artwork Detail**
- Stacked layout (image above details)
- Thumbnails: Horizontal scroll
- Reviews: Stacked cards

**Cart/Checkout**
- Single column layout
- Order summary: Sticky bottom on mobile

**Dashboards**
- Sidebar: Bottom navigation or hamburger menu
- Stats: Horizontal scroll
- Lists: Single column

---

## Accessibility

### WCAG 2.1 Compliance

- **Color Contrast**: Minimum 4.5:1 for text, 3:1 for large text
- **Keyboard Navigation**: All interactive elements accessible via keyboard
- **Focus Indicators**: Clear focus states on all interactive elements
- **Alt Text**: Descriptive alt text for all images
- **ARIA Labels**: Proper ARIA labels for screen readers
- **Form Labels**: All form inputs have associated labels
- **Error Messages**: Clear, descriptive error messages
- **Skip Links**: Skip to main content link

### Keyboard Shortcuts

- `Tab`: Navigate through interactive elements
- `Shift + Tab`: Navigate backward
- `Enter/Space`: Activate buttons/links
- `Escape`: Close modals/dropdowns

---

## Animation Guidelines

### Micro-interactions

- **Button Hover**: Scale 1.05, transition 0.2s
- **Card Hover**: Lift effect (translateY -4px), shadow increase
- **Favorite**: Heart animation (scale 1.2 → 1.0)
- **Add to Cart**: Button pulse effect
- **Loading**: Skeleton screens with shimmer effect

### Page Transitions

- **Route Change**: Fade in/out (0.3s)
- **Modal**: Scale up from center (0.2s)
- **Dropdown**: Slide down (0.2s)
- **Sidebar**: Slide from left (0.3s)

---

## Figma Implementation Notes

### Component Library Structure

```
Artisa Design System
├── Colors
│   ├── Primary
│   ├── Secondary
│   ├── Accent
│   └── Status
├── Typography
│   ├── Headings
│   ├── Body
│   └── Labels
├── Components
│   ├── Buttons
│   ├── Inputs
│   ├── Cards
│   ├── Badges
│   ├── Modals
│   └── Navigation
├── Icons
│   ├── Navigation
│   ├── Actions
│   └── Status
└── Templates
    ├── Homepage
    ├── Marketplace
    ├── Artwork Detail
    ├── Artist Profile
    ├── Cart
    ├── Checkout
    └── Dashboards
```

### Naming Convention

- **Pages**: `page_[name]` (e.g., `page_homepage`)
- **Components**: `comp_[name]` (e.g., `comp_button_primary`)
- **Atoms**: `atom_[name]` (e.g., `atom_icon_heart`)
- **Layouts**: `layout_[name]` (e.g., `layout_grid_3col`)

### Auto Layout

- Use Auto Layout for all components
- Set appropriate constraints (left/right, top/bottom)
- Use responsive resizing
- Maintain consistent spacing

### Variants

- **Buttons**: Primary, Secondary, Accent, Ghost, Link
- **Inputs**: Default, Error, Success, Disabled
- **Cards**: Default, Hover, Selected
- **Badges**: Default, Success, Warning, Error

---

## Next Steps

1. **Create Figma File**: Set up project with design system
2. **Build Components**: Create reusable component library
3. **Design Pages**: Implement wireframes as high-fidelity designs
4. **Prototype**: Add interactions and transitions
5. **Handoff**: Export assets and specifications for development
6. **Documentation**: Maintain design system documentation
