# Task 3 Completion Log — Design Artifacts

**Completed:** August 18, 2026  
**Phase:** Design (Weeks 3–4)  
**Status:** Done

---

## Goal

Create comprehensive design artifacts including ERD, DFD, UML diagrams, recommendations documentation, and Figma wireframes.

---

## Deliverables Checklist

- [x] ERD (all entities) in `docs/erd.md`
- [x] DFD (user management, orders, commissions, payments, recommendations) in `docs/dfd.md`
- [x] UML: use case, activity (purchase, commission, verification), sequence diagrams in `docs/uml.md`
- [x] `docs/recommendations.md` — algorithm, signals, evaluation plan
- [x] Figma wireframes: home, marketplace, artwork detail, artist profile, cart, checkout, dashboards in `docs/wireframes.md`

---

## What We Created

### 1. Entity Relationship Diagram (ERD)
**File:** `docs/erd.md`

**Contents:**
- Complete Mermaid ERD diagram showing all entities and relationships
- 18 entities defined with detailed field specifications
- Key relationships: 1:1, 1:N, N:M clearly documented
- Performance indexes specified
- Constraints (unique, foreign key, check) documented
- Notes on soft deletes, timestamps, UUID primary keys

**Entities Covered:**
- Users & Authentication (User, ArtistProfile, ArtistApplication)
- Artworks & Categories (Category, Artwork, ArtworkImage, ArtworkTag, DigitalFile)
- Orders & Payments (CartItem, Order, OrderItem, ShippingAddress, OrderShipment, Payment)
- Commissions (Commission, CommissionDeliverable)
- Messaging & Reviews (Message, Review)
- Interactions & Recommendations (UserInteraction, RecommendationCache)

---

### 2. Data Flow Diagram (DFD)
**File:** `docs/dfd.md`

**Contents:**
- Level 0 Context Diagram (system boundaries)
- Level 1 DFD for User Management
- Level 1 DFD for Order Processing
- Level 1 DFD for Commission Workflow
- Level 1 DFD for Payment Processing
- Level 1 DFD for Recommendation System
- Data dictionary with all data stores and flows
- Process descriptions for each major workflow
- Security considerations
- Performance considerations
- Error handling strategies

**Key Processes Documented:**
- User registration and authentication
- Artist application and verification
- Order placement and fulfillment
- Commission request and delivery
- Payment processing with Khalti
- Recommendation computation and caching

---

### 3. UML Diagrams
**File:** `docs/uml.md`

**Contents:**

**Use Case Diagram:**
- System-level use case diagram
- 22 use cases defined
- Actors: Guest, Customer, Artist, Admin
- Include and extend relationships
- Detailed use case descriptions table

**Activity Diagrams:**
- Purchase workflow (browse → cart → checkout → payment)
- Commission workflow (request → acceptance → deliverables → approval)
- Artist verification workflow (application → review → approval/rejection)

**Sequence Diagrams:**
- Purchase sequence (customer → frontend → API → payment → artist)
- Commission sequence (customer → artist → messaging → deliverables → payment)
- Authentication sequence (user → frontend → API → JWT → database)
- Recommendation sequence (user → frontend → API → cache → engine → database)

**Class Diagram:**
- Core classes with attributes and methods
- Relationships between classes
- User, ArtistProfile, Artwork, Order, Commission, RecommendationEngine

**State Diagrams:**
- Order state transitions (pending → processing → shipped → delivered)
- Commission state transitions (pending → accepted → in_progress → review → complete)
- Artwork state transitions (draft → pending_review → published → removed)

---

### 4. Recommendations Documentation
**File:** `docs/recommendations.md`

**Contents:**

**Algorithm Architecture:**
- Hybrid approach: `final_score = α × CBF + (1 − α) × CF`
- Phase A: Content-based filtering (ship first)
- Phase B: Collaborative filtering (add when data exists)
- Phase C: Evaluation (for university report)

**Content-Based Filtering:**
- Feature extraction (category, tags, price band, type, artist style)
- Price band discretization
- Cosine similarity calculation
- Artist style extraction from portfolio

**Collaborative Filtering:**
- Implicit feedback matrix construction
- Interaction weights (view=1.0, favorite=3.0, cart_add=5.0, purchase=10.0)
- Item-based collaborative filtering
- User preference prediction

**Hybrid Scoring:**
- Score combination formula
- Dynamic alpha adjustment based on user interaction count
- Cold-start handling

**Caching Strategy:**
- Pre-computation via management command
- Cache invalidation on significant interactions
- Cache TTL (24h for artworks, 48h for artists)

**API Endpoints:**
- GET /api/recommendations/artworks/
- GET /api/recommendations/artists/
- POST /api/interactions/

**Evaluation Metrics:**
- Precision@K
- Recall@K
- Click-through rate (CTR)

**Demo Scenarios:**
- Cold start (new user)
- Category browsing
- Purchase behavior
- Artist discovery

**Data Seeding:**
- Management command for realistic interaction data
- Interaction generation logic
- Batch processing

**Performance Optimization:**
- Database indexes
- Batch processing
- Rate limiting

---

### 5. Figma Wireframes
**File:** `docs/wireframes.md`

**Contents:**

**Design System:**
- Color palette (primary, secondary, accent, neutral, status)
- Typography (font family, sizes, weights)
- Spacing scale
- Component styles (buttons, cards, inputs)

**Page Wireframes:**

1. **Homepage**
   - Header with search and navigation
   - Hero section with CTAs
   - Featured artworks carousel
   - "For You" recommendations grid
   - Trending artists section
   - Categories grid
   - Footer

2. **Marketplace Page**
   - Filters sidebar (category, price, type, verified)
   - Search bar with sort dropdown
   - Artwork grid (3-4 columns)
   - Pagination

3. **Artwork Detail Page**
   - Image gallery with thumbnails
   - Artist info with verified badge
   - Action buttons (cart, favorite, commission)
   - Artwork details (title, price, description, tags)
   - Similar works section
   - Reviews section with rating distribution

4. **Artist Profile Page**
   - Cover image with profile header
   - Artist stats (artworks, sales, rating)
   - Tabs (artworks, reviews, about)
   - Artworks grid
   - Similar artists section

5. **Cart Page**
   - Cart items list with quantity controls
   - Order summary (subtotal, shipping, total)
   - Empty cart state

6. **Checkout Page**
   - Shipping address form
   - Saved addresses
   - Order summary
   - Payment method (Khalti)
   - Place order button

7. **Customer Dashboard**
   - Sidebar navigation
   - Quick stats (orders, wishlist, reviews)
   - Recent orders list

8. **Artist Dashboard**
   - Sidebar navigation
   - Quick stats (artworks, orders, revenue, rating)
   - Commission requests
   - Recent orders to process

**Responsive Design:**
- Breakpoints (mobile, tablet, desktop)
- Mobile adaptations for each page

**Accessibility:**
- WCAG 2.1 compliance guidelines
- Keyboard navigation
- Color contrast requirements
- ARIA labels

**Animation Guidelines:**
- Micro-interactions
- Page transitions
- Loading states

**Figma Implementation Notes:**
- Component library structure
- Naming conventions
- Auto layout guidelines
- Variants documentation

---

## Files Created

```
docs/
  erd.md                    # Entity Relationship Diagram
  dfd.md                    # Data Flow Diagram
  uml.md                    # UML Diagrams
  recommendations.md        # Recommendation System Documentation
  wireframes.md             # Figma Wireframes Documentation
```

---

## Technical Decisions

### ERD
- UUID primary keys for distributed system compatibility
- Soft delete pattern with `deleted_at` timestamp
- JSON fields for flexible data (social_links, portfolio_samples)
- Comprehensive indexing for performance

### DFD
- Separated concerns into distinct processes
- Included Khalti payment gateway integration
- Added email service for notifications
- Background processing for recommendations

### UML
- Used Mermaid for all diagrams (Git-friendly)
- Included state diagrams for complex workflows
- Sequence diagrams show error handling paths
- Activity diagrams include decision points

### Recommendations
- Hybrid approach balances cold-start and personalization
- Phased implementation allows incremental value
- Caching strategy ensures performance
- Evaluation metrics align with academic requirements

### Wireframes
- Stone color palette for professional, artistic feel
- Mobile-first responsive design
- Accessibility built-in from start
- Component-based architecture for reusability

---

## Next Steps

**Task 4 — Core Models + Seed Data:**
- Implement Django models based on ERD
- Create migrations for PostgreSQL
- Build management command `seed_demo_data`
- Seed admin user, categories, artists, artworks, tags, sample interactions

---

## Notes

1. All diagrams use Mermaid syntax for easy rendering in Markdown
2. Design system follows Tailwind CSS conventions for easy implementation
3. Recommendation system is designed for academic evaluation with measurable metrics
4. Wireframes include both desktop and mobile layouts
5. Accessibility considerations integrated throughout
