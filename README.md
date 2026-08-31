# 🎨 Artisa

**Empowering Nepali Artists Through Technology**

A modern, multi-vendor e-commerce platform designed specifically for Nepali artists to showcase their creativity, sell artwork globally, and connect with art collectors — all powered by a hybrid recommendation system.

---

## ✨ Features

### For Artists
- 🎨 **Portfolio Management** — Create stunning portfolios with bio, social links, and artwork galleries
- 💰 **Sell Artwork** — List physical and digital artworks with detailed metadata
- 📝 **Commissions** — Accept custom artwork requests and negotiate with buyers
- ✅ **Verification System** — Build trust with verified artist badges

### For Collectors
- 🛒 **Marketplace** — Browse, search, and filter artworks by category, medium, and price
- 🤝 **Hybrid Recommendations** — Discover artwork tailored to your taste using collaborative and content-based filtering
- ❤️ **Wishlist** — Save and manage favorite artworks
- 💳 **Secure Payments** — Integrated Khalti payment gateway (Nepal)

### Technical Highlights
- 🔐 **JWT Authentication** with role-based access (Collector/Artist)
- 📱 **Responsive Design** — Mobile-first UI with Tailwind CSS
- 🐳 **Docker Support** — One-command PostgreSQL setup
- 🧠 **ML-Powered** — Hybrid recommendation engine with scikit-learn (collaborative + content-based filtering)

---

## 🛠️ Tech Stack

| Layer | Technology |
|--------|-------------|
| **Frontend** | React 19, Vite 6, Tailwind CSS 4, React Router 7 |
| **Backend** | Django 6, Django REST Framework 3.15 |
| **Database** | PostgreSQL 16 (SQLite for development) |
| **Auth** | JWT via djangorestframework-simplejwt |
| **Payments** | Khalti (Nepal payment gateway) |
| **Recommendations** | Hybrid engine: scikit-learn, NumPy, SciPy (collaborative + content-based filtering) |
| **Containerization** | Docker Compose |

---

## 📂 Project Structure

```
artisa/
├── backend/                # Django REST API
│   ├── apps/
│   │   ├── artists/        # Artist profiles & verification
│   │   ├── artworks/       # Artwork listings, images, categories
│   │   ├── auth/           # JWT authentication, roles
│   │   ├── cart/           # Shopping cart
│   │   ├── commissions/    # Commission system
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
├── docs/                   # Setup guides & documentation
├── docker-compose.yml
└── README.md
```

---

## 🚀 Quick Start

### Prerequisites
- **Python 3.12+**
- **Node.js 20+** and npm
- **PostgreSQL 16+** (or use Docker)
- **Git**

### 1. Clone the Repository
```bash
git clone https://github.com/shriijaal/Artisa.git
cd Artisa
```

### 2. Database Setup (PostgreSQL via Docker)
```bash
docker compose up -d
```

<details>
<summary>Database Configuration</summary>

- **Database:** `artisa_db`
- **User:** `postgres`
- **Password:** `postgres`
- **Port:** `5432`

</details>

### 3. Backend Setup
```powershell
cd backend

# Create and activate virtual environment
python -m venv .venv
.\.venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
copy .env.example .env
# Edit .env — set USE_SQLITE=False for PostgreSQL

# Run migrations
python manage.py migrate

# (Optional) Seed demo data
python manage.py seed_demo_data

# Start the server
python manage.py runserver
```

**API:** http://127.0.0.1:8000/  
**Health Check:** http://127.0.0.1:8000/api/health/

### 4. Frontend Setup
```powershell
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

**App:** http://localhost:5173/ (proxies `/api` to Django)

---

## 🔑 Demo Accounts

| Role | Username | Password | Access |
|-------|-----------|----------|--------|
| **Admin** | `admin` | `admin123` | Full admin access |
| **Artist** | `artist1` | `artist123` | Artist dashboard |
| **Buyer** | `buyer1` | `buyer123` | Collector features |

---

## 📡 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|-----------|-------------|
| POST | `/api/auth/register/` | Register a new user |
| POST | `/api/auth/login/` | Login (JWT tokens) |

### Artworks & Artists
| Method | Endpoint | Description |
|--------|-----------|-------------|
| GET | `/api/artworks/` | List all published artworks |
| GET | `/api/artworks/{id}/` | Artwork detail |
| GET | `/api/artists/` | List verified artists |
| GET | `/api/artists/{username}/` | Artist profile |

### Shopping & Orders
| Method | Endpoint | Description |
|--------|-----------|-------------|
| GET/POST | `/api/cart/` | View / add to cart |
| POST | `/api/orders/` | Create order |
| POST | `/api/payments/initiate/` | Initiate Khalti payment |

### Recommendations & Search
| Method | Endpoint | Description |
|--------|-----------|-------------|
| GET | `/api/recs/trending/` | Trending artworks & artists |
| GET | `/api/recs/search/?q=` | Global search |
| GET | `/api/recs/recommendations/` | Personalized hybrid recommendations |

---

## ⚙️ Environment Variables

Create a `.env` file in the `backend/` directory:

```env
# Database
USE_SQLITE=True  # Set to False for PostgreSQL
DB_NAME=artisa_db
DB_USER=postgres
DB_PASSWORD=postgres
DB_HOST=localhost
DB_PORT=5432

# JWT
JWT_SECRET_KEY=your-secret-key

# Khalti (Sandbox)
KHALTI_SECRET_KEY=your-khalti-key
```

---

## 🛠️ Troubleshooting

**Backend won't start:**
- Ensure Python 3.12+ is installed
- Check that all requirements are installed: `pip install -r requirements.txt`
- Verify `.env` file exists in `backend/`

**Frontend can't connect to backend:**
- Ensure backend is running on port 8000
- Check `vite.config.js` proxy settings

**Database connection error:**
- If using Docker, ensure container is running: `docker ps`
- For SQLite, set `USE_SQLITE=True` in `.env`

---

## 📈 Development Workflow

Each feature is built as an isolated task. See:
- [Task List](tasks/) — Full task list
- [Completed Tasks](tasks/completed/) — Completion logs
- [Setup Guides](docs/setup/) — Replicable setup guides

---

## 📄 License

University project — not currently licensed for production use.

---

## 👥 Contributors

- **Shriijaal** — Developer

---

<div align="center">
  <p>Built with ❤️ for Nepali artists</p>
</div>
