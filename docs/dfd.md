# Data Flow Diagram (DFD)

**Artisa E-Commerce Platform**

---

## Overview

This document describes the data flow through the Artisa platform for key processes: user management, orders, commissions, payments, and recommendations.

---

## Level 0 Context Diagram

```mermaid
flowchart TD
    User[User / Customer / Artist / Admin]
    System[Artisa System]
    Khalti[Khalti Payment Gateway]
    Email[Email Service]
    
    User -->|Register/Login| System
    User -->|Browse Artworks| System
    User -->|Place Order| System
    User -->|Request Commission| System
    User -->|Send Messages| System
    User -->|Write Reviews| System
    
    System -->|Display Recommendations| User
    System -->|Order Confirmations| User
    System -->|Commission Updates| User
    System -->|Messages| User
    
    System -->|Payment Request| Khalti
    Khalti -->|Payment Response| System
    
    System -->|Notifications| Email
    Email -->|Delivery Status| System
```

---

## Level 1 DFD - User Management

```mermaid
flowchart TD
    User[User]
    Auth[Auth Service]
    UserDB[(User Database)]
    ArtistProfile[Artist Profile Service]
    ArtistDB[(Artist Database)]
    Email[Email Service]
    
    User -->|Register Data| Auth
    Auth -->|Validate| Auth
    Auth -->|Store User| UserDB
    UserDB -->|Confirmation| Auth
    Auth -->|Send Welcome Email| Email
    Auth -->|Success Response| User
    
    User -->|Login Credentials| Auth
    Auth -->|Verify| UserDB
    UserDB -->|User Data| Auth
    Auth -->|JWT Token| User
    
    User -->|Artist Application| ArtistProfile
    ArtistProfile -->|Store Application| ArtistDB
    ArtistDB -->|Application Status| ArtistProfile
    ArtistProfile -->|Status Update| User
    
    User -->|Profile Update| ArtistProfile
    ArtistProfile -->|Update Profile| ArtistDB
    ArtistDB -->|Confirmation| ArtistProfile
    ArtistProfile -->|Success| User
```

---

## Level 1 DFD - Order Processing

```mermaid
flowchart TD
    Customer[Customer]
    Cart[Cart Service]
    CartDB[(Cart Database)]
    Order[Order Service]
    OrderDB[(Order Database)]
    Inventory[Inventory Service]
    ArtworkDB[(Artwork Database)]
    Khalti[Khalti Payment Gateway]
    Payment[Payment Service]
    PaymentDB[(Payment Database)]
    Email[Email Service]
    Artist[Artist]
    
    Customer -->|Add to Cart| Cart
    Cart -->|Store Item| CartDB
    CartDB -->|Confirmation| Cart
    Cart -->|Updated Cart| Customer
    
    Customer -->|Checkout| Order
    Order -->|Get Cart Items| CartDB
    CartDB -->|Cart Data| Order
    Order -->|Check Stock| Inventory
    Inventory -->|Stock Status| ArtworkDB
    ArtworkDB -->|Availability| Inventory
    Inventory -->|Stock Info| Order
    
    Order -->|Create Order| OrderDB
    OrderDB -->|Order ID| Order
    Order -->|Initiate Payment| Payment
    Payment -->|Payment Request| Khalti
    Khalti -->|Payment Response| Payment
    Payment -->|Store Transaction| PaymentDB
    PaymentDB -->|Payment Status| Payment
    Payment -->|Payment Result| Order
    
    Order -->|Update Order Status| OrderDB
    OrderDB -->|Order Confirmation| Order
    Order -->|Send Confirmation Email| Email
    Order -->|Order Details| Customer
    Order -->|New Order Notification| Artist
```

---

## Level 1 DFD - Commission Workflow

```mermaid
flowchart TD
    Customer[Customer]
    Commission[Commission Service]
    CommissionDB[(Commission Database)]
    Artist[Artist]
    Message[Messaging Service]
    MessageDB[(Message Database)]
    Deliverable[Deliverable Service]
    FileDB[(File Database)]
    Payment[Payment Service]
    PaymentDB[(Payment Database)]
    Khalti[Khalti Payment Gateway]
    Email[Email Service]
    
    Customer -->|Submit Request| Commission
    Commission -->|Store Request| CommissionDB
    CommissionDB -->|Request ID| Commission
    Commission -->|Notification| Artist
    Commission -->|Request Confirmation| Customer
    
    Artist -->|Accept/Reject| Commission
    Commission -->|Update Status| CommissionDB
    CommissionDB -->|Status Update| Commission
    Commission -->|Status Notification| Customer
    
    Customer -->|Send Message| Message
    Artist -->|Send Message| Message
    Message -->|Store Message| MessageDB
    MessageDB -->|Message Confirmation| Message
    Message -->|New Message| Customer
    Message -->|New Message| Artist
    
    Artist -->|Submit Deliverable| Deliverable
    Deliverable -->|Store File| FileDB
    Deliverable -->|Link to Commission| CommissionDB
    Deliverable -->|Deliverable Notification| Customer
    
    Customer -->|Approve Deliverable| Commission
    Commission -->|Update Status| CommissionDB
    Commission -->|Initiate Payment| Payment
    Payment -->|Payment Request| Khalti
    Khalti -->|Payment Response| Payment
    Payment -->|Store Transaction| PaymentDB
    PaymentDB -->|Payment Status| Payment
    Payment -->|Payment Confirmation| Commission
    Commission -->|Payment Notification| Artist
    Commission -->|Completion Email| Email
```

---

## Level 1 DFD - Payment Processing

```mermaid
flowchart TD
    User[User]
    Order[Order Service]
    OrderDB[(Order Database)]
    Payment[Payment Service]
    PaymentDB[(Payment Database)]
    Khalti[Khalti Payment Gateway]
    Bank[Bank / Khalti System]
    Email[Email Service]
    
    Order -->|Payment Initiation| Payment
    Payment -->|Create Payment Record| PaymentDB
    PaymentDB -->|Payment ID| Payment
    Payment -->|Redirect to Khalti| User
    
    User -->|Payment Details| Khalti
    Khalti -->|Process Payment| Bank
    Bank -->|Bank Response| Khalti
    Khalti -->|Payment Result| User
    
    User -->|Return to App| Payment
    Payment -->|Verify Transaction| Khalti
    Khalti -->|Transaction Status| Payment
    Payment -->|Update Payment Status| PaymentDB
    PaymentDB -->|Status Confirmation| Payment
    
    Payment -->|Update Order Status| OrderDB
    OrderDB -->|Order Update| Payment
    Payment -->|Send Receipt Email| Email
    Payment -->|Payment Confirmation| Order
    Order -->|Order Status| User
```

---

## Level 1 DFD - Recommendation System

```mermaid
flowchart TD
    User[User]
    Frontend[React Frontend]
    API[Django REST API]
    Interaction[Interaction Service]
    InteractionDB[(Interaction Database)]
    RecEngine[Recommendation Engine]
    RecCache[(Recommendation Cache)]
    ArtworkDB[(Artwork Database)]
    UserDB[(User Database)]
    
    User -->|Browse / View / Favorite| Frontend
    Frontend -->|Log Interaction| API
    API -->|Store Interaction| Interaction
    Interaction -->|Write to DB| InteractionDB
    InteractionDB -->|Confirmation| Interaction
    Interaction -->|Success| API
    API -->|Continue| Frontend
    
    User -->|Request Recommendations| Frontend
    Frontend -->|Get Recommendations| API
    API -->|Check Cache| RecCache
    RecCache -->|Cache Hit/Miss| API
    
    API -->|Fetch User Data| UserDB
    UserDB -->|User Profile| API
    API -->|Fetch Interaction History| InteractionDB
    InteractionDB -->|User Interactions| API
    API -->|Fetch Artwork Data| ArtworkDB
    ArtworkDB -->|Artwork Metadata| API
    
    API -->|Compute Recommendations| RecEngine
    RecEngine -->|CBF Score Calculation| RecEngine
    RecEngine -->|CF Score Calculation| RecEngine
    RecEngine -->|Hybrid Merge| RecEngine
    RecEngine -->|Ranked Recommendations| API
    
    API -->|Update Cache| RecCache
    RecCache -->|Cached Results| API
    API -->|Recommendations| Frontend
    Frontend -->|Display Recommendations| User
    
    API -->|Schedule Recomputation| RecEngine
    RecEngine -->|Background Job| RecEngine
    RecEngine -->|Update All Caches| RecCache
```

---

## Data Dictionary

### Data Stores

| Data Store | Description | Key Fields |
|------------|-------------|------------|
| User Database | Stores user accounts, profiles, authentication data | user_id, username, email, role, artist_profile |
| Artist Database | Stores artist profiles, applications, verification data | artist_id, user_id, status, portfolio_samples |
| Cart Database | Stores user shopping cart items | cart_item_id, user_id, artwork_id, quantity |
| Order Database | Stores orders, order items, shipping info | order_id, customer_id, status, total |
| Artwork Database | Stores artworks, categories, tags, images | artwork_id, artist_id, title, price, status |
| Payment Database | Stores payment transactions, Khalti integration | payment_id, transaction_id, amount, status |
| Commission Database | Stores commission requests, deliverables | commission_id, customer_id, artist_id, status |
| Message Database | Stores user-to-user messages | message_id, sender_id, receiver_id, body |
| Interaction Database | Stores user interaction data for recommendations | interaction_id, user_id, target_type, interaction_type |
| Recommendation Cache | Stores pre-computed recommendations | cache_id, user_id, target_ids, computed_at |
| File Database | Stores uploaded files (images, digital files) | file_id, artwork_id, file_path, file_type |

### Data Flows

| Data Flow | Source | Destination | Description |
|-----------|--------|-------------|-------------|
| Register Data | User | Auth Service | User registration information |
| JWT Token | Auth Service | User | Authentication token |
| Cart Data | Cart Database | Order Service | Items to be purchased |
| Payment Request | Payment Service | Khalti | Initiate payment transaction |
| Payment Response | Khalti | Payment Service | Payment completion status |
| Order Confirmation | Order Service | User | Order details and status |
| Commission Request | Customer | Commission Service | New commission request details |
| Deliverable File | Artist | Deliverable Service | Commission deliverable file |
| Recommendation Data | Recommendation Engine | API | Ranked list of recommended items |
| Interaction Log | Frontend | Interaction Service | User activity for recommendations |

---

## Process Descriptions

### User Management Process
1. User submits registration data
2. Auth service validates input
3. User stored in database
4. Welcome email sent
5. JWT token generated and returned
6. For artist application: profile created, stored, status tracked

### Order Processing Process
1. User adds items to cart
2. Cart service stores items
3. User initiates checkout
4. Order service validates stock
5. Order created in database
6. Payment initiated with Khalti
7. Payment processed and verified
8. Order status updated
9. Confirmation email sent
10. Artist notified of new order

### Commission Workflow Process
1. Customer submits commission request
2. Commission stored in database
3. Artist notified of request
4. Artist accepts/rejects commission
5. Messaging enabled between parties
6. Artist submits deliverables
7. Customer reviews and approves
8. Payment processed
9. Commission marked complete
10. Artist paid

### Payment Processing Process
1. Order service initiates payment
2. Payment record created
3. User redirected to Khalti
4. User completes payment
5. Khalti processes with bank
6. Payment result returned
7. Transaction verified
8. Payment status updated
9. Order status updated
10. Receipt email sent

### Recommendation Process
1. User interacts with platform (view, favorite, purchase)
2. Interaction logged to database
3. User requests recommendations
4. System checks cache
5. If cache miss: fetch user data, interactions, artwork data
6. Compute CBF scores (content-based)
7. Compute CF scores (collaborative filtering)
8. Merge scores with hybrid algorithm
9. Update cache with results
10. Return recommendations to user
11. Background job periodically recomputes for all users

---

## Security Considerations

### Data Flow Security
- All API calls authenticated via JWT
- Sensitive data encrypted in transit (HTTPS)
- Payment data handled by Khalti (PCI compliance)
- User passwords hashed before storage
- File uploads validated for type and size

### Access Control
- Role-based access control (RBAC)
- Artist-specific data protected
- Admin-only access to verification documents
- Customer data isolation
- Commission privacy between parties

---

## Performance Considerations

### Caching Strategy
- Recommendation cache pre-computed
- Artwork data cached for marketplace
- User session data cached
- Static assets CDN cached

### Database Optimization
- Indexes on frequently queried fields
- Connection pooling
- Query optimization for recommendations
- Separate read replicas for heavy read operations

### Background Processing
- Recommendation computation as background job
- Email sending via queue
- File processing (thumbnails) async
- Payment verification async

---

## Error Handling

### Data Flow Errors
- Payment failures: retry logic, user notification
- Stock shortages: real-time validation, user notification
- API failures: graceful degradation, error logging
- Cache failures: fallback to database computation
- File upload failures: validation, user feedback

### Recovery Mechanisms
- Transaction rollback on payment failure
- Order status reconciliation
- Interaction data replay for recommendations
- Message delivery confirmation
- Email retry on failure
