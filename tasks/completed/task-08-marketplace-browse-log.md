# Task 8 Completion Log — Marketplace Browse

**Completed:** August 19, 2026  
**Phase:** Artists & Marketplace (Weeks 5–8)  
**Status:** Done

---

## Goal

Build public marketplace browsing page with search, filters, sorting, and artwork grid display.

---

## Deliverables Checklist

- [x] Grid/list view; search by title and artist name
- [x] Filter: category, price range, type, verified artist
- [x] Sort: newest, price, rating (rating sort uses seed/review data until Task 17 ships)
- [x] NPR price display

---

## What We Built

### 1. Backend API Enhancements

**File:** `backend/apps/artworks/views.py`

**Updated Endpoint:**

**`GET /api/artworks/published/`**
- Added query parameter filtering
- Search by title and artist username (icontains)
- Filter by category ID
- Filter by artwork type (physical/digital)
- Filter by verified artist only
- Filter by price range (min_price, max_price)
- Sort options: newest, price_asc, price_desc, rating
- Rating sort currently uses newest (placeholder for Task 17)

**Query Parameters:**
- `search` - Search term (title or artist)
- `category` - Category UUID
- `type` - Artwork type (physical/digital)
- `verified` - Boolean (true for verified artists only)
- `min_price` - Minimum price (NPR)
- `max_price` - Maximum price (NPR)
- `sort` - Sort order (newest, price_asc, price_desc, rating)

### 2. Frontend Marketplace Page

**File:** `frontend/src/pages/Marketplace.jsx` (new)

**Features:**
- Search bar for title and artist name
- Filters sidebar with:
  - Category dropdown (fetched from API)
  - Type dropdown (physical/digital)
  - Verified artist checkbox
  - Price range inputs (min/max)
  - Sort dropdown (newest, price, rating)
- Clear all filters button
- Artwork count display
- Responsive grid layout (1-3 columns)
- Artwork cards with:
  - Primary image
  - Title with verified badge
  - Artist username
  - Price in NPR
  - Type indicator
- Click to navigate to artwork detail (placeholder route)
- Empty state with clear filters CTA
- Loading state
- Real-time filter updates (debounced via useEffect)

**File:** `frontend/src/App.jsx`

Added route: `/marketplace` (public, no auth required)
Changed default route from `/dashboard` to `/marketplace`

---

## API Query Examples

**Search:**
```
GET /api/artworks/published/?search=landscape
```

**Filter by category:**
```
GET /api/artworks/published/?category=<uuid>
```

**Filter by type:**
```
GET /api/artworks/published/?type=physical
```

**Verified artists only:**
```
GET /api/artworks/published/?verified=true
```

**Price range:**
```
GET /api/artworks/published/?min_price=1000&max_price=5000
```

**Sort by price:**
```
GET /api/artworks/published/?sort=price_asc
```

**Combined filters:**
```
GET /api/artworks/published/?search=painting&type=physical&verified=true&min_price=500&sort=newest
```

---

## Filter Implementation

### Backend
- Django ORM filtering
- Q objects for OR conditions (search)
- Chained filters for AND conditions
- Order by for sorting

### Frontend
- React state for filter values
- URLSearchParams for query building
- useEffect dependency on filters
- Automatic refetch on filter change

---

## Sorting Options

| Option | Backend Order | Description |
|---|---|---|
| `newest` | `-created_at` | Most recently created |
| `price_asc` | `price` | Lowest price first |
| `price_desc` | `-price` | Highest price first |
| `rating` | `-created_at` | Placeholder (Task 17) |

---

## Files Created/Modified

### Backend
```
apps/artworks/
  views.py (updated published_artworks with filtering/sorting)
```

### Frontend
```
src/
  pages/
    Marketplace.jsx (new)
  App.jsx (added /marketplace route, changed default route)
```

---

## Testing Instructions

### 1. Test Search
1. Navigate to `/marketplace`
2. Type in search bar
3. Results should filter by title or artist name

### 2. Test Category Filter
1. Select a category from dropdown
2. Results should show only that category
3. Clear filters to reset

### 3. Test Type Filter
1. Select "Physical" or "Digital"
2. Results should show only that type

### 4. Test Verified Filter
1. Check "Verified Artists Only"
2. Results should show only artworks by verified artists

### 5. Test Price Range
1. Enter min and/or max price
2. Results should be within range

### 6. Test Sort
1. Change sort dropdown
2. Results should reorder accordingly

### 7. Test Combined Filters
1. Apply multiple filters
2. Results should match all criteria
3. Clear all to reset

---

## Technical Decisions

### Query Parameters
- Standard REST API pattern
- Easy to test in browser
- Cacheable by default
- Shareable URLs

### Client-Side Filtering
- React state management
- Automatic refetch on change
- Simple filter object
- URLSearchParams for clean query building

### Grid Layout
- Responsive (1-3 columns)
- Aspect ratio for images
- Hover effects for interactivity
- Click to navigate (Task 9)

### Default Route Change
- Changed from `/dashboard` to `/marketplace`
- Marketplace is now the landing page
- Public-facing first impression
- Users can browse without login

---

## Next Steps

**Task 9 — Artwork Detail + Favorites/Wishlist:**
- Build artwork detail page
- Add image gallery
- Implement favorites toggle
- Create wishlist page
- Log view interactions

---

## Notes

1. Marketplace is now the default route (landing page)
2. All filters are optional and combinable
3. Search matches title OR artist username
4. Rating sort placeholder until Task 17 (reviews)
5. Verified badge shown on artwork cards
6. Price displayed in NPR
7. Artwork cards clickable (detail page in Task 9)
8. Empty state with clear filters CTA
