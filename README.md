# Artisa

A multi-vendor e-commerce platform for Nepali artists to showcase portfolios, sell artwork, accept commissions, and receive AI-powered personalized recommendations.

## Features

- **Artist Portfolios** — Customizable profile pages with bio, social links, and artwork galleries
- **Artwork Marketplace** — Browse, search, and filter physical and digital artworks by category, medium, and price
- **Shopping Cart & Checkout** — Full cart management with Khalti (Nepali payment gateway) integration
- **Commissions System** — Buyers can request custom artwork; artists accept, negotiate, and track commissions
- **Collaborative Filtering Recommendations** — Hybrid recommendation engine using scikit-learn for personalized artwork suggestions
- **User Roles** — Collector and Artist roles with an application flow to become a verified artist
- **Wishlist** — Save and manage favorite artworks
- **Responsive Design** — Mobile-first UI built with Tailwind CSS

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite 6, Tailwind CSS 4, React Router 7 |
| Backend | Django 6, Django REST Framework 3.15 |
| Database | PostgreSQL 16 (SQLite for local development) |
| Auth | JWT via djangorestframework-simplejwt |
| Payments | Khalti (Nepal) |
| Recommendations | scikit-learn, NumPy, SciPy (collaborative filtering) |
| Containerization | Docker Compose (PostgreSQL) |

## Project Structure

```
artisa/
├── backend/                # Django REST API
│   ├── apps/
│   │   ├── artists/        # Artist profiles & verification
│   │   ├── artworks/       # Artwork listings, images, categories
│   │   ├── auth/           # JWT authentication, roles
│   │   ├── cart/           # Shopping cart
│   │   ├── core/           # Shared utilities, seed data
│   │   ├── orders/         # Orders & order items
│   │   ├── payments/       # Khalti payment integration
│   │   ├── recs/           # Recommendation engine
│   │   └── wishlist/       # Wishlist management
│   ├── artisa/             # Django project settings
│   ├── media/              # User-uploaded files
│   ├── requirements.txt
│   └── manage.py
├── frontend/               # React SPA
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Route-level page components
│   │   ├── contexts/       # React context (Auth)
│   │   └── assets/         # Static assets
│   ├── package.json
│   └── vite.config.js
├── docs/                   # Setup guides
├── plan/                   # Project plan
├── tasks/                  # Task briefs and completion logs
├── proposal/               # University proposal
├── sample images for ui-ux/  # UI/UX design references
├── docker-compose.yml
└── .gitignore
```

## Getting Started

### Prerequisites

- **Python 3.12+**
- **Node.js 20+** and npm
- **PostgreSQL 16+** (or use Docker below)
- **Git**

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/artisa.git
cd artisa
```

### 2. Database (PostgreSQL via Docker)

```bash
docker compose up -d
```

This starts PostgreSQL on `localhost:5432` with:
- Database: `artisa_db`
- User: `postgres`
- Password: `postgres`

### 3. Backend Setup

```powershell
cd backend

# Create and activate virtual environment
python -m venv .venv
.\.venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
copy .env.example .env
# Edit .env — set USE_SQLITE=False for PostgreSQL, or leave True for SQLite

# Run migrations
python manage.py migrate

# Seed demo data (optional — creates 10 artists, 100 artworks, sample buyers)
python manage.py seed_demo_data

# Start the server
python manage.py runserver
```

API runs at **http://127.0.0.1:8000/**
Health check: http://127.0.0.1:8000/api/health/

### 4. Frontend Setup

```powershell
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

App runs at **http://localhost:5173/** (proxies `/api` to Django on port 8000).

### Demo Accounts

| Role | Username | Password |
|---|---|---|
| Admin | `admin` | `admin123` |
| Artist | `artist1` | `artist123` |
| Buyer | `buyer1` | `buyer123` |

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register/` | Register a new user |
| POST | `/api/auth/login/` | Login (JWT tokens) |
| GET | `/api/artworks/` | List all published artworks |
| GET | `/api/artworks/{id}/` | Artwork detail |
| GET | `/api/artists/` | List verified artists |
| GET | `/api/artists/{username}/` | Artist profile |
| GET/POST | `/api/cart/` | View / add to cart |
| POST | `/api/orders/` | Create order |
| POST | `/api/payments/initiate/` | Initiate Khalti payment |
| GET | `/api/wishlist/` | View wishlist |
| GET | `/api/recs/trending/` | Trending artworks & artists |
| GET | `/api/recs/search/?q=` | Global search |

## Development Workflow

Each feature is built as an isolated task. See [tasks/](tasks/) for the full task list and [tasks/completed/](tasks/completed/) for completion logs.

## License

University project — not currently licensed for production use.
