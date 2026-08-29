# UML Diagrams

**Artisa E-Commerce Platform**

---

## Overview

This document contains UML diagrams for the Artisa platform, including use case diagrams, activity diagrams, and sequence diagrams for key processes.

---

## Use Case Diagram

### System Level Use Case Diagram

```mermaid
useCaseDiagram
    actor "Guest" as Guest
    actor "Customer" as Customer
    actor "Artist" as Artist
    actor "Admin" as Admin
    
    package "Artisa Platform" {
        usecase "Register" as UC1
        usecase "Login" as UC2
        usecase "Browse Artworks" as UC3
        usecase "Search Artworks" as UC4
        usecase "View Artwork Details" as UC5
        usecase "View Artist Profile" as UC6
        usecase "Add to Cart" as UC7
        usecase "Manage Cart" as UC8
        usecase "Place Order" as UC9
        usecase "Track Order" as UC10
        usecase "Request Commission" as UC11
        usecase "Manage Commissions" as UC12
        usecase "Send Messages" as UC13
        usecase "Write Review" as UC14
        usecase "Manage Favorites" as UC15
        usecase "Apply for Artist" as UC16
        usecase "Manage Artworks" as UC17
        usecase "Process Orders" as UC18
        usecase "Verify Artists" as UC19
        usecase "Moderate Content" as UC20
        usecase "View Analytics" as UC21
        usecase "Manage Categories" as UC22
    }
    
    Guest --> UC1
    Guest --> UC2
    Guest --> UC3
    Guest --> UC4
    Guest --> UC5
    Guest --> UC6
    
    Customer --|> Guest
    Customer --> UC7
    Customer --> UC8
    Customer --> UC9
    Customer --> UC10
    Customer --> UC11
    Customer --> UC13
    Customer --> UC14
    Customer --> UC15
    Customer --> UC16
    
    Artist --|> Customer
    Artist --> UC12
    Artist --> UC17
    Artist --> UC18
    
    Admin --> UC19
    Admin --> UC20
    Admin --> UC21
    Admin --> UC22
    Admin --> UC3
    Admin --> UC5
    Admin --> UC6
    
    UC1 ..> UC2 : <<include>>
    UC9 ..> UC7 : <<include>>
    UC9 ..> UC8 : <<include>>
    UC14 ..> UC9 : <<extend>>
    UC12 ..> UC13 : <<include>>
    UC17 ..> UC16 : <<extend>>
```

### Use Case Descriptions

| Use Case | Actor | Description |
|----------|-------|-------------|
| Register | Guest | Create a new user account with email and password |
| Login | Guest | Authenticate with credentials to access platform |
| Browse Artworks | Guest, Customer, Artist, Admin | View marketplace with all published artworks |
| Search Artworks | Guest, Customer, Artist, Admin | Search artworks by title, artist, category |
| View Artwork Details | Guest, Customer, Artist, Admin | View detailed artwork information and images |
| View Artist Profile | Guest, Customer, Artist, Admin | View artist portfolio, bio, and verified status |
| Add to Cart | Customer | Add artwork to shopping cart |
| Manage Cart | Customer | View, update, or remove items from cart |
| Place Order | Customer | Complete purchase with payment |
| Track Order | Customer | View order status and shipping information |
| Request Commission | Customer | Submit custom artwork commission request |
| Manage Commissions | Artist | Accept, reject, and manage commission requests |
| Send Messages | Customer, Artist | Communicate about orders or commissions |
| Write Review | Customer | Review purchased artwork and artist |
| Manage Favorites | Customer | Add/remove artworks from wishlist |
| Apply for Artist | Customer | Submit artist verification application |
| Manage Artworks | Artist | Create, edit, and manage artwork listings |
| Process Orders | Artist | View and fulfill customer orders |
| Verify Artists | Admin | Review and approve/reject artist applications |
| Moderate Content | Admin | Review and moderate artwork submissions |
| View Analytics | Admin | View platform usage and sales analytics |
| Manage Categories | Admin | Create and manage artwork categories |

---

## Activity Diagrams

### Purchase Activity Diagram

```mermaid
flowchart TD
    Start([Start]) --> Browse[Browse Artworks]
    Browse --> ViewDetails[View Artwork Details]
    ViewDetails --> Decision{Add to Cart?}
    Decision -->|No| Browse
    Decision -->|Yes| AddCart[Add to Cart]
    AddCart --> Continue{Continue Shopping?}
    Continue -->|Yes| Browse
    Continue -->|No| ViewCart[View Cart]
    ViewCart --> Modify{Modify Cart?}
    Modify -->|Yes| UpdateCart[Update Cart Items]
    UpdateCart --> ViewCart
    Modify -->|No| Checkout[Proceed to Checkout]
    Checkout --> LoginCheck{Logged In?}
    LoginCheck -->|No| LoginUser[Login / Register]
    LoginUser --> Checkout
    LoginCheck -->|Yes| Shipping[Enter Shipping Details]
    Shipping --> Payment[Select Payment Method]
    Payment --> Khalti[Redirect to Khalti]
    Khalti --> CompletePayment[Complete Payment]
    CompletePayment --> PaymentSuccess{Payment Successful?}
    PaymentSuccess -->|No| PaymentError[Display Error]
    PaymentError --> Payment
    PaymentSuccess -->|Yes| CreateOrder[Create Order]
    CreateOrder --> ConfirmEmail[Send Confirmation Email]
    ConfirmEmail --> NotifyArtist[Notify Artist]
    NotifyArtist --> OrderSuccess([Order Placed Successfully])
    OrderSuccess --> End([End])
```

### Commission Activity Diagram

```mermaid
flowchart TD
    Start([Start]) --> SubmitRequest[Submit Commission Request]
    SubmitRequest --> Validate[Validate Request Details]
    Validate --> Valid{Valid?}
    Valid -->|No| DisplayError[Display Validation Error]
    DisplayError --> SubmitRequest
    Valid -->|Yes| StoreRequest[Store in Database]
    StoreRequest --> NotifyArtist[Notify Artist]
    NotifyArtist --> WaitResponse[Wait for Artist Response]
    WaitResponse --> ArtistDecision{Artist Decision}
    ArtistDecision -->|Reject| RejectReason[Artist Provides Reason]
    RejectReason --> NotifyCustomer[Notify Customer]
    NotifyCustomer --> CommissionRejected([Commission Rejected])
    ArtistDecision -->|Accept| AcceptCommission[Artist Accepts Commission]
    AcceptCommission --> EnableMessaging[Enable Messaging]
    EnableMessaging --> Discussion[Discussion Phase]
    Discussion --> SubmitDeliverable[Artist Submits Deliverable]
    SubmitDeliverable --> CustomerReview[Customer Reviews Deliverable]
    CustomerReview --> ReviewDecision{Customer Decision}
    ReviewDecision -->|Request Revision| CheckLimit{Revision Limit Reached?}
    CheckLimit -->|No| RevisionRequest[Request Revision]
    RevisionRequest --> SubmitDeliverable
    CheckLimit -->|Yes| LimitReached[Revision Limit Reached]
    LimitReached --> Dispute[Escalate to Dispute]
    ReviewDecision -->|Approve| ProcessPayment[Process Payment]
    ProcessPayment --> NotifyCompletion[Notify Both Parties]
    NotifyCompletion --> CommissionComplete([Commission Complete])
    CommissionRejected --> End([End])
    CommissionComplete --> End
    Dispute --> End
```

### Artist Verification Activity Diagram

```mermaid
flowchart TD
    Start([Start]) --> AccessProfile[Access Profile]
    AccessProfile --> CheckStatus{Already Artist?}
    CheckStatus -->|Yes| ViewProfile([View Artist Profile])
    CheckStatus -->|No| ClickApply[Click Apply for Artist]
    ClickApply --> FillForm[Fill Application Form]
    FillForm --> UploadPortfolio[Upload Portfolio Samples]
    UploadPortfolio --> OptionalDoc{Upload Verification Document?}
    OptionalDoc -->|Yes| UploadDoc[Upload Document]
    OptionalDoc -->|No| SubmitApp
    UploadDoc --> SubmitApp[Submit Application]
    SubmitApp --> ValidateApp[Validate Application]
    ValidateApp --> AppValid{Valid?}
    AppValid -->|No| ShowErrors[Show Validation Errors]
    ShowErrors --> FillForm
    AppValid -->|Yes| StoreApplication[Store in Database]
    StoreApplication --> StatusPending[Set Status to Pending]
    StatusPending --> NotifyAdmin[Notify Admin]
    NotifyAdmin --> WaitReview([Wait for Admin Review])
    
    WaitReview --> AdminReview[Admin Reviews Application]
    AdminReview --> AdminDecision{Admin Decision}
    AdminDecision -->|Reject| AdminReason[Admin Provides Rejection Reason]
    AdminReason --> UpdateRejected[Update Status to Rejected]
    UpdateRejected --> NotifyRejected[Notify User]
    NotifyRejected --> ApplicationRejected([Application Rejected])
    
    AdminDecision -->|Approve| CreateProfile[Create Artist Profile]
    CreateProfile --> UpdateApproved[Update Status to Approved]
    UpdateApproved --> GrantBadge[Grant Verified Badge]
    GrantBadge --> NotifyApproved[Notify User]
    NotifyApproved --> EnableFeatures[Enable Artist Features]
    EnableFeatures --> ApplicationApproved([Application Approved])
    
    ApplicationRejected --> End([End])
    ApplicationApproved --> End
```

---

## Sequence Diagrams

### Purchase Sequence Diagram

```mermaid
sequenceDiagram
    participant Customer
    participant Frontend
    participant API
    participant CartService
    participant OrderService
    participant PaymentService
    participant Khalti
    participant EmailService
    participant Artist
    
    Customer->>Frontend: Browse Artworks
    Frontend->>API: GET /api/artworks
    API-->>Frontend: Artwork List
    Frontend-->>Customer: Display Artworks
    
    Customer->>Frontend: Add to Cart
    Frontend->>API: POST /api/cart/add
    API->>CartService: Add Item to Cart
    CartService-->>API: Success
    API-->>Frontend: Cart Updated
    Frontend-->>Customer: Cart Item Added
    
    Customer->>Frontend: Proceed to Checkout
    Frontend->>API: GET /api/cart
    API->>CartService: Get Cart Items
    CartService-->>API: Cart Data
    API-->>Frontend: Cart Items
    Frontend-->>Customer: Display Cart
    
    Customer->>Frontend: Enter Shipping Details
    Customer->>Frontend: Place Order
    Frontend->>API: POST /api/orders
    API->>OrderService: Create Order
    OrderService->>CartService: Validate Cart
    CartService-->>OrderService: Cart Valid
    OrderService->>OrderService: Check Stock
    OrderService-->>OrderService: Stock Available
    OrderService->>API: Order Created
    API-->>Frontend: Order ID
    Frontend->>PaymentService: Initiate Payment
    PaymentService->>Khalti: Payment Request
    Khalti-->>PaymentService: Payment URL
    PaymentService-->>Frontend: Redirect to Khalti
    
    Customer->>Khalti: Complete Payment
    Khalti-->>Customer: Payment Result
    Customer->>Frontend: Return to App
    Frontend->>PaymentService: Verify Payment
    PaymentService->>Khalti: Verify Transaction
    Khalti-->>PaymentService: Transaction Status
    PaymentService->>PaymentService: Update Payment Status
    PaymentService->>OrderService: Update Order Status
    OrderService-->>PaymentService: Order Updated
    PaymentService-->>Frontend: Payment Success
    Frontend->>EmailService: Send Confirmation Email
    EmailService-->>Customer: Order Confirmation
    OrderService->>Artist: New Order Notification
    Frontend-->>Customer: Order Confirmation Page
```

### Commission Sequence Diagram

```mermaid
sequenceDiagram
    participant Customer
    participant Artist
    participant Frontend
    participant API
    participant CommissionService
    participant MessageService
    participant PaymentService
    participant EmailService
    
    Customer->>Frontend: Browse Artist Profile
    Frontend->>API: GET /api/artists/{id}
    API-->>Frontend: Artist Profile
    Frontend-->>Customer: Display Profile
    
    Customer->>Frontend: Request Commission
    Frontend->>API: POST /api/commissions
    API->>CommissionService: Create Commission Request
    CommissionService-->>API: Commission ID
    API-->>Frontend: Request Created
    Frontend->>EmailService: Notify Artist
    EmailService-->>Artist: New Commission Request
    Frontend-->>Customer: Request Submitted
    
    Artist->>Frontend: View Commission Requests
    Frontend->>API: GET /api/commissions/pending
    API-->>Frontend: Pending Commissions
    Frontend-->>Artist: Display Requests
    
    Artist->>Frontend: Accept Commission
    Frontend->>API: POST /api/commissions/{id}/accept
    API->>CommissionService: Update Status to Accepted
    CommissionService-->>API: Status Updated
    API-->>Frontend: Commission Accepted
    Frontend->>EmailService: Notify Customer
    EmailService-->>Customer: Commission Accepted
    CommissionService->>MessageService: Enable Messaging
    Frontend-->>Artist: Commission Details
    
    Customer->>Frontend: Send Message
    Frontend->>API: POST /api/messages
    API->>MessageService: Store Message
    MessageService-->>API: Message Stored
    API-->>Frontend: Message Sent
    MessageService-->>Artist: New Message Notification
    Frontend-->>Customer: Message Displayed
    
    Artist->>Frontend: Submit Deliverable
    Frontend->>API: POST /api/commissions/{id}/deliverable
    API->>CommissionService: Store Deliverable
    CommissionService-->>API: Deliverable Stored
    API-->>Frontend: Deliverable Submitted
    Frontend->>EmailService: Notify Customer
    EmailService-->>Customer: Deliverable Ready
    Frontend-->>Artist: Submission Confirmed
    
    Customer->>Frontend: Review Deliverable
    Frontend->>API: GET /api/commissions/{id}/deliverables
    API-->>Frontend: Deliverable Data
    Frontend-->>Customer: Display Deliverable
    
    Customer->>Frontend: Approve Deliverable
    Frontend->>API: POST /api/commissions/{id}/approve
    API->>CommissionService: Update Status to Complete
    CommissionService->>PaymentService: Process Payment
    PaymentService-->>CommissionService: Payment Processed
    CommissionService-->>API: Commission Complete
    API-->>Frontend: Approval Confirmed
    Frontend->>EmailService: Notify Both Parties
    EmailService-->>Customer: Completion Confirmation
    EmailService-->>Artist: Payment Confirmation
    Frontend-->>Customer: Commission Complete
```

### Authentication Sequence Diagram

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant API
    participant AuthService
    participant JWTService
    participant Database
    
    User->>Frontend: Enter Credentials
    Frontend->>API: POST /api/auth/login
    API->>AuthService: Validate Credentials
    AuthService->>Database: Query User
    Database-->>AuthService: User Data
    AuthService->>AuthService: Verify Password
    AuthService-->>API: Authentication Result
    
    alt Authentication Successful
        API->>JWTService: Generate Tokens
        JWTService-->>API: Access Token + Refresh Token
        API->>Database: Update Last Login
        API-->>Frontend: Tokens + User Data
        Frontend->>Frontend: Store in localStorage
        Frontend->>API: GET /api/auth/me
        API->>AuthService: Get Current User
        AuthService->>Database: Query User
        Database-->>AuthService: User Data
        AuthService-->>API: User Profile
        API-->>Frontend: User Profile
        Frontend->>Frontend: Update Auth Context
        Frontend-->>User: Redirect to Dashboard
    else Authentication Failed
        API-->>Frontend: Error Response
        Frontend-->>User: Display Error Message
    end
```

### Recommendation Sequence Diagram

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant API
    participant RecEngine
    participant Cache
    participant Database
    
    User->>Frontend: Browse Platform
    Frontend->>API: Log Interaction
    API->>Database: Store Interaction
    Database-->>API: Stored
    API-->>Frontend: Success
    
    User->>Frontend: View Homepage
    Frontend->>API: GET /api/recommendations/artworks
    API->>Cache: Check Cache
    Cache-->>API: Cache Hit/Miss
    
    alt Cache Hit
        Cache-->>API: Cached Recommendations
        API-->>Frontend: Recommendations
    else Cache Miss
        API->>Database: Get User Profile
        Database-->>API: User Data
        API->>Database: Get User Interactions
        Database-->>API: Interaction History
        API->>Database: Get All Artworks
        Database-->>API: Artwork Data
        
        API->>RecEngine: Compute Recommendations
        RecEngine->>RecEngine: Content-Based Filtering
        RecEngine->>RecEngine: Collaborative Filtering
        RecEngine->>RecEngine: Hybrid Merge
        RecEngine-->>API: Ranked Recommendations
        
        API->>Cache: Update Cache
        Cache-->>API: Cache Updated
        API-->>Frontend: Recommendations
    end
    
    Frontend-->>User: Display Recommendations
    
    Note over RecEngine,Cache: Background Job
    RecEngine->>Database: Get All Users
    Database-->>RecEngine: User List
    loop For Each User
        RecEngine->>Database: Get User Data
        Database-->>RecEngine: User Data
        RecEngine->>RecEngine: Compute Recommendations
        RecEngine->>Cache: Update Cache
    end
```

---

## Class Diagram

### Core Classes

```mermaid
classDiagram
    class User {
        +UUID id
        +String username
        +String email
        +String password
        +String firstName
        +String lastName
        +Role role
        +String avatar
        +Boolean isActive
        +DateTime createdAt
        +DateTime updatedAt
        +register()
        +login()
        +logout()
        +updateProfile()
    }
    
    class ArtistProfile {
        +UUID id
        +UUID userId
        +String bio
        +String coverImage
        +JSON socialLinks
        +Status status
        +Boolean verifiedBadge
        +DateTime createdAt
        +DateTime updatedAt
        +updateProfile()
        +uploadPortfolio()
    }
    
    class Artwork {
        +UUID id
        +UUID artistId
        +String title
        +String description
        +Decimal price
        +Type type
        +UUID categoryId
        +Integer stock
        +Status status
        +Boolean originalityConfirmed
        +DateTime createdAt
        +DateTime updatedAt
        +publish()
        +updateStock()
    }
    
    class Order {
        +UUID id
        +UUID customerId
        +Decimal subtotal
        +Decimal shippingCost
        +Decimal total
        +Status status
        +PaymentStatus paymentStatus
        +DateTime createdAt
        +DateTime updatedAt
        +addItem()
        +removeItem()
        +calculateTotal()
    }
    
    class Commission {
        +UUID id
        +UUID customerId
        +UUID artistId
        +String title
        +String description
        +Decimal budget
        +Date deadline
        +Status status
        +Integer revisionLimit
        +Integer currentRevision
        +DateTime createdAt
        +DateTime updatedAt
        +submitDeliverable()
        +requestRevision()
        +approve()
    }
    
    class RecommendationEngine {
        +computeCBF()
        +computeCF()
        +mergeScores()
        +updateCache()
    }
    
    User "1" -- "0..1" ArtistProfile : has
    User "1" -- "0..*" Artwork : creates
    User "1" -- "0..*" Order : places
    User "1" -- "0..*" Commission : requests
    User "1" -- "0..*" Commission : accepts
    Artwork "1" -- "1" Category : belongs to
    Order "1" -- "1..*" OrderItem : contains
    RecommendationEngine ..> User : recommends for
    RecommendationEngine ..> Artwork : recommends
```

---

## State Diagrams

### Order State Diagram

```mermaid
stateDiagram-v2
    [*] --> Pending: Order Created
    Pending --> Processing: Payment Confirmed
    Pending --> Cancelled: Payment Failed / Cancelled
    Processing --> Shipped: Order Shipped
    Shipped --> Delivered: Order Delivered
    Shipped --> Returned: Return Requested
    Delivered --> [*]
    Cancelled --> [*]
    Returned --> [*]
    
    note right of Pending
        Customer can cancel
        before payment
    end note
    
    note right of Processing
        Artist prepares order
        Payment verified
    end note
    
    note right of Shipped
        Tracking active
        Customer can return
    end note
```

### Commission State Diagram

```mermaid
stateDiagram-v2
    [*] --> Pending: Request Submitted
    Pending --> Accepted: Artist Accepts
    Pending --> Rejected: Artist Rejects
    Accepted --> InProgress: Work Started
    InProgress --> Review: Deliverable Submitted
    Review --> InProgress: Revision Requested
    Review --> Completed: Approved
    Review --> Dispute: Dispute Raised
    Completed --> Dispute: Issue Reported
    Rejected --> [*]
    Dispute --> [*]
    Completed --> [*]
    
    note right of Pending
        Customer can cancel
        before acceptance
    end note
    
    note right of InProgress
        Messaging enabled
        Progress updates
    end note
    
    note right of Review
        Customer reviews
        Limited revisions
    end note
```

### Artwork State Diagram

```mermaid
stateDiagram-v2
    [*] --> Draft: Artwork Created
    Draft --> PendingReview: Submit for Review
    PendingReview --> Published: Approved
    PendingReview --> Draft: Rejected
    Published --> Removed: Removed by Artist/Admin
    Removed --> Draft: Re-submitted
    Draft --> [*]: Deleted
    Published --> [*]
    Removed --> [*]
    
    note right of Draft
        Artist edits
        Not visible publicly
    end note
    
    note right of PendingReview
        Admin moderation
        Originality check
    end note
    
    note right of Published
        Visible in marketplace
        Can be purchased
    end note
```

---

## Notes

### Assumptions
1. All users must be authenticated to perform actions except browsing
2. Artists must be verified before listing artworks
3. Payments are processed exclusively through Khalti
4. Recommendations are computed periodically and cached
5. Messages are real-time or near real-time
6. File uploads have size and type restrictions

### Extensions
1. Add more detailed sequence diagrams for error handling
2. Include deployment diagram for system architecture
4. Add component diagram for frontend structure
5. Include package diagram for backend app structure
