# Task 4: Core Models + Seed Data

**Phase:** Design (Week 3–4)  
**Depends on:** Task 2, Task 3  
**Blocks:** Task 5

## Goal

Implement all Django models and seed realistic demo data.

## Deliverables

- [ ] Models for all entities (see `plan/artisa.md` ERD)
- [ ] Migrations run against PostgreSQL
- [ ] `python manage.py seed_demo_data` — admin, categories, artists, artworks, tags, sample interactions
- [ ] NPR price fields use `DecimalField`

## Key models

`User`, `ArtistProfile`, `ArtistApplication`, `Category`, `Artwork`, `ArtworkImage`, `ArtworkTag`, `DigitalFile`, `Favorite`, `CartItem`, `Order`, `OrderItem`, `ShippingAddress`, `OrderShipment`, `Commission`, `CommissionDeliverable`, `Message`, `Review`, `Payment`, `UserInteraction`, `RecommendationCache`
