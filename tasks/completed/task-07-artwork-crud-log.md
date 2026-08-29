# Task 7 Completion Log — Artwork CRUD + Moderation + Originality

**Completed:** August 19, 2026  
**Phase:** Artists & Marketplace (Weeks 5–8)  
**Status:** Done

---

## Goal

Implement artwork creation, editing, submission workflow with originality declaration, multiple image support, and admin moderation.

---

## Deliverables Checklist

- [x] Artist creates artwork: draft → submit for review → published
- [x] Originality declaration required on submit
- [x] Multiple images per artwork; tags; physical stock or digital file
- [x] Admin moderates via Django Admin
- [x] Only `published` artworks in public API

---

## What We Built

### 1. Backend Serializers

**File:** `backend/apps/artworks/serializers.py` (new)

**Serializers:**
- `CategorySerializer` - Category data
- `ArtworkTagSerializer` - Tag data
- `ArtworkImageSerializer` - Artwork images with validation
- `DigitalFileSerializer` - Digital file data
- `ArtworkSerializer` - Full artwork data (read-only)
- `ArtworkCreateSerializer` - Create artwork with originality declaration
- `ArtworkUpdateSerializer` - Update draft artworks only
- `ArtworkSubmitSerializer` - Submit for review with originality confirmation

**Validation:**
- Originality declaration required on create/submit
- Stock required for physical artworks
- Image validation using existing utils (5MB limit, format check)
- Stock cannot be negative

### 2. Backend API Endpoints

**File:** `backend/apps/artworks/views.py` (new)

**Endpoints:**

**`GET /api/artworks/categories/`**
- List all categories (public)

**`GET /api/artworks/my-artworks/`**
- List authenticated user's artworks

**`POST /api/artworks/my-artworks/`**
- Create new artwork (draft status)
- Requires originality declaration
- Creates tags automatically

**`GET /api/artworks/my-artworks/<id>/`**
- Get artwork details (owner only)

**`PUT /api/artworks/my-artworks/<id>/`**
- Update artwork (draft only)
- Cannot edit published/pending artworks

**`DELETE /api/artworks/my-artworks/<id>/`**
- Delete artwork (draft only)

**`POST /api/artworks/my-artworks/<id>/submit/`**
- Submit artwork for review
- Requires originality declaration
- Changes status to `pending_review`

**`POST /api/artworks/my-artworks/<id>/images/`**
- Add image to artwork (draft only)
- Supports setting primary image

**`DELETE /api/artworks/my-artworks/<id>/images/<image_id>/`**
- Delete image (draft only)

**`POST /api/artworks/my-artworks/<id>/images/<image_id>/set-primary/`**
- Set primary image (draft only)

**`POST /api/artworks/my-artworks/<id>/digital-file/`**
- Add digital file (digital artworks only, draft only)

**`GET /api/artworks/published/`**
- List all published artworks (public)

**`GET /api/artworks/published/<id>/`**
- Get published artwork details (public)

**File:** `backend/apps/artworks/urls.py` (new)

URL patterns for all artwork endpoints.

**File:** `backend/artisa/urls.py`

Added artworks URL include.

### 3. Django Admin Configuration

**File:** `backend/apps/artworks/admin.py` (new)

**Registered Models:**
- `Category` - With slug prepopulation
- `Artwork` - With inline images/tags, bulk publish/reject actions
- `ArtworkImage` - Image management
- `ArtworkTag` - Tag management
- `DigitalFile` - Digital file management

**Admin Actions:**
- `publish_artworks` - Bulk publish pending artworks
- `reject_artworks` - Bulk reject (return to draft)

### 4. Frontend Artwork Creation Page

**File:** `frontend/src/pages/CreateArtwork.jsx` (new)

**Features:**
- Fetches categories dropdown
- Form fields: title, description, price, type, category, stock (physical only), tags
- Multiple image upload
- Digital file upload (digital artworks only)
- Preview image upload (digital artworks only)
- Originality declaration checkbox (required)
- FormData handling for file uploads
- Sequential upload: artwork → images → digital file
- Error handling and loading states
- Navigation back to dashboard

### 5. Frontend My Artworks Page

**File:** `frontend/src/pages/MyArtworks.jsx` (new)

**Features:**
- Lists user's artworks with status badges
- Shows artwork thumbnail, title, price, type
- Color-coded status (draft/pending/published)
- Submit for review button (draft only)
- Delete button (draft only)
- Status messages for pending/published
- Empty state with CTA to create artwork
- Navigation to create artwork page

**File:** `frontend/src/App.jsx`

Added routes: `/artworks/create` and `/my-artworks` (protected)

**File:** `frontend/src/pages/Dashboard.jsx`

Added "Create Artwork" and "My Artworks" cards.

---

## Workflow

### Artist Creation Flow

1. **Create Draft**
   - Fill in artwork details
   - Upload images (first image becomes primary)
   - Upload digital file (if digital)
   - Confirm originality declaration
   - Artwork saved as `draft`

2. **Edit Draft**
   - Can modify any field
   - Can add/remove images
   - Can change primary image
   - Can update digital file

3. **Submit for Review**
   - Click "Submit for Review"
   - Confirm originality declaration
   - Status changes to `pending_review`
   - Cannot edit after submission

4. **Admin Review**
   - Admin views in Django Admin
   - Can publish or reject
   - Publish → status `published`
   - Reject → status `draft`

5. **Published**
   - Visible in public API
   - Cannot be edited by artist
   - Available for purchase

---

## API Endpoints Summary

| Endpoint | Method | Auth | Description |
|---|---|---|---|
| `/api/artworks/categories/` | GET | None | List categories |
| `/api/artworks/my-artworks/` | GET | User | List my artworks |
| `/api/artworks/my-artworks/` | POST | User | Create artwork |
| `/api/artworks/my-artworks/<id>/` | GET | User | Get artwork |
| `/api/artworks/my-artworks/<id>/` | PUT | User | Update artwork (draft) |
| `/api/artworks/my-artworks/<id>/` | DELETE | User | Delete artwork (draft) |
| `/api/artworks/my-artworks/<id>/submit/` | POST | User | Submit for review |
| `/api/artworks/my-artworks/<id>/images/` | POST | User | Add image |
| `/api/artworks/my-artworks/<id>/images/<img_id>/` | DELETE | User | Delete image |
| `/api/artworks/my-artworks/<id>/images/<img_id>/set-primary/` | POST | User | Set primary image |
| `/api/artworks/my-artworks/<id>/digital-file/` | POST | User | Add digital file |
| `/api/artworks/published/` | GET | None | List published artworks |
| `/api/artworks/published/<id>/` | GET | None | Get published artwork |

---

## Originality Declaration

**Required On:**
- Artwork creation
- Submission for review

**Validation:**
- Checkbox must be checked
- Serializer validates boolean is True
- Error message if not confirmed

**Purpose:**
- Legal protection for platform
- Artist confirms ownership
- Prevents copyright disputes

---

## Image Handling

**Multiple Images:**
- First image automatically set as primary
- Can change primary image later
- Can delete images (draft only)
- Images validated (5MB limit, format check)

**Primary Image:**
- Used for thumbnails/previews
- Displayed in artwork lists
- Only one primary per artwork

**Digital Artworks:**
- Separate file for download
- Optional preview image
- Preview shown instead of full file

---

## Files Created/Modified

### Backend
```
apps/artworks/
  serializers.py (new - all artwork serializers)
  views.py (new - all artwork endpoints)
  urls.py (new - URL patterns)
  admin.py (new - Django admin config)

artisa/urls.py (added artworks include)
```

### Frontend
```
src/
  pages/
    CreateArtwork.jsx (new)
    MyArtworks.jsx (new)
  App.jsx (added /artworks/create and /my-artworks routes)
  pages/
    Dashboard.jsx (added artwork cards)
```

---

## Testing Instructions

### 1. Test Artwork Creation

1. Login as artist user
2. Navigate to `/artworks/create`
3. Fill in all required fields
4. Upload at least one image
5. Confirm originality declaration
6. Submit
7. Should redirect to `/my-artworks` with draft status

### 2. Test Submission

1. On `/my-artworks` page
2. Click "Submit for Review"
3. Confirm originality declaration
4. Status should change to "Pending Review"
5. Submit button should disappear

### 3. Test Admin Moderation

1. Login as admin
2. Go to Django Admin → Artworks
3. Find pending artwork
4. Use "Publish selected artworks" action
5. Status should change to "Published"

### 4. Test Public API

1. Call `GET /api/artworks/published/`
2. Should only return published artworks
3. Draft and pending artworks not visible

---

## Technical Decisions

### Draft-Only Editing
- Artists can only edit draft artworks
- Prevents changes after submission
- Maintains review integrity

### Separate Image Endpoints
- Allows adding images after creation
- Supports multiple images
- Primary image management

### Originality on Submit
- Required twice (create + submit)
- Ensures artist confirms before review
- Legal protection for platform

### Digital File Separate
- Stored separately from images
- Preview image for display
- Full file for download (Task 12)

### Public API Filter
- Only published artworks visible
- Drafts and pending hidden
- Clean marketplace experience

---

## Next Steps

**Task 8 — Marketplace Browse:**
- Build public artwork browsing page
- Implement filters (category, price, type, verified)
- Add search functionality
- Create artwork detail pages
- Build homepage with featured artworks

---

## Notes

1. Artwork status workflow: draft → pending_review → published
2. Originality declaration required at create and submit
3. Multiple images supported with primary image concept
4. Physical artworks require stock quantity
5. Digital artworks require digital file upload
6. Admin moderation via Django Admin with bulk actions
7. Public API only shows published artworks
8. Artists cannot edit published artworks
