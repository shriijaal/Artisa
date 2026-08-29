# Task 4 Completion Log — Core Models + Seed Data

**Completed:** August 19, 2026  
**Phase:** Foundation (Week 4)  
**Status:** Done

---

## Goal

Create Django models for all entities, run migrations against PostgreSQL, and create a management command to seed demo data.

---

## Deliverables Checklist

- [x] Django models for all entities
- [x] Migrations against PostgreSQL
- [x] Management command `seed_demo_data`: admin user, categories, artists, artworks, tags

---

## What We Created

### 1. Django Apps

Created 7 new Django apps in `backend/apps/`:
- `artworks` - Artworks, categories, images, tags, digital files
- `orders` - Cart, orders, order items, shipping, shipments
- `commissions` - Commission requests and deliverables
- `messaging` - User-to-user messages
- `reviews` - Artwork and artist reviews
- `payments` - Payment transactions
- `recs` - User interactions and recommendation cache

### 2. Models Created

**Users App (`apps/users/models.py`):**
- Updated `User` model with `avatar`, `created_at`, `updated_at` fields
- Added `ArtistProfile` model (1:1 with User)
- Added `ArtistApplication` model for artist verification

**Artworks App (`apps/artworks/models.py`):**
- `Category` - Hierarchical categories with parent/child
- `Artwork` - Main artwork model with type, status, stock
- `ArtworkImage` - Multiple images per artwork with thumbnails
- `ArtworkTag` - Tags for categorization
- `DigitalFile` - Digital artwork files with preview

**Orders App (`apps/orders/models.py`):**
- `CartItem` - Shopping cart items
- `Order` - Customer orders with status tracking
- `OrderItem` - Individual items in orders
- `ShippingAddress` - User shipping addresses
- `OrderShipment` - Shipment tracking

**Commissions App (`apps/commissions/models.py`):**
- `Commission` - Custom artwork requests
- `CommissionDeliverable` - Commission deliverables with revision tracking

**Messaging App (`apps/messaging/models.py`):**
- `Message` - User-to-user messages with read status

**Reviews App (`apps/reviews/models.py`):**
- `Review` - Purchase-verified reviews

**Payments App (`apps/payments/models.py`):**
- `Payment` - Payment transactions with Khalti integration

**Recommendations App (`apps/recs/models.py`):**
- `UserInteraction` - User interaction tracking for recommendations
- `RecommendationCache` - Cached recommendation results

### 3. Model Features

- **UUID Primary Keys** - All models use UUID for distributed system compatibility
- **Timestamps** - All models have `created_at` and `updated_at`
- **Status Enums** - Models with status use TextChoices for type safety
- **Indexes** - Performance indexes on frequently queried fields
- **Constraints** - Unique constraints where appropriate (cart items, reviews)
- **JSON Fields** - Flexible data storage (social links, portfolio samples, target_ids)

### 4. Database Migrations

Created and ran migrations for all apps:
- `users` - User model updates + ArtistProfile + ArtistApplication
- `artworks` - All artwork-related models
- `orders` - All order-related models
- `commissions` - Commission models
- `messaging` - Message model
- `reviews` - Review model
- `payments` - Payment model
- `recs` - Interaction and cache models

All migrations applied successfully to PostgreSQL.

### 5. Seed Data Management Command

Created `apps/core/management/commands/seed_demo_data.py`:

**Seeds:**
- Admin user (`admin` / `admin123`)
- 6 categories (Paintings, Sculptures, Digital Art, Photography, Traditional Art, Mixed Media)
- 10 verified artists with approved profiles
- 50 published artworks across all categories
- 153 tags distributed across artworks

**Command Usage:**
```bash
python manage.py seed_demo_data
```

### 6. Verification

Tested seeded data:
- Users: 14 (1 admin + 10 artists + 3 existing)
- Categories: 6
- Artworks: 50
- Artist Profiles: 10

---

## Files Created

```
backend/apps/
  artworks/
    __init__.py
    apps.py
    models.py
    migrations/
      0001_initial.py
  orders/
    __init__.py
    apps.py
    models.py
    migrations/
      0001_initial.py
  commissions/
    __init__.py
    apps.py
    models.py
    migrations/
      0001_initial.py
  messaging/
    __init__.py
    apps.py
    models.py
    migrations/
      0001_initial.py
  reviews/
    __init__.py
    apps.py
    models.py
    migrations/
      0001_initial.py
  payments/
    __init__.py
    apps.py
    models.py
    migrations/
      0001_initial.py
  recs/
    __init__.py
    apps.py
    models.py
    migrations/
      0001_initial.py
  core/
    management/
      __init__.py
      commands/
        __init__.py
        seed_demo_data.py
  users/
    models.py (updated)
    migrations/
      0002_user_avatar_user_created_at_user_updated_at_and_more.py
```

---

## Technical Decisions

### UUID Primary Keys
- Used `uuid.uuid4` for all primary keys
- Better for distributed systems and security
- Prevents enumeration attacks

### App Naming
- Used `recs` instead of `recommendations` to avoid Python module conflicts
- Created apps manually with `mkdir` instead of `startapp` due to conflicts

### Model Organization
- Grouped related models in logical apps
- Followed ERD structure from Task 3
- Maintained foreign key relationships as specified

### Migration Strategy
- Created migrations per app for clarity
- Applied all migrations successfully
- Used one-off default for existing User model fields

### Seed Data
- Created realistic demo data for testing
- Artists have approved profiles with verified badges
- Artworks are published with various types and categories
- Tags provide categorization for recommendations

---

## Issues Fixed

1. **UUID Import Error** - Fixed by adding `import uuid` to all model files
2. **Migration Conflict** - Fixed User model `created_at` field by providing one-off default
3. **App Naming Conflicts** - Used manual app creation with custom names to avoid conflicts

---

## Next Steps

**Task 5 — Artist Application + Verification + Django Admin:**
- Create API endpoints for artist application submission
- Build Django admin interface for artist verification
- Implement approval/rejection workflow with reasons
- On approval: create ArtistProfile and set status to approved

---

## Notes

1. All models follow the ERD specification from Task 3
2. Database indexes added for performance on frequently queried fields
3. Seed data command can be run multiple times safely (uses get_or_create)
4. Admin user credentials: `admin` / `admin123`
5. Artist user credentials: `artist1` through `artist10` / `artist123`
