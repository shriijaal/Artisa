# Task 1 Setup Guide — Project Scaffolding

This guide walks you through setting up the Artisa monorepo from scratch. Follow these steps on any machine to replicate the Task 1 environment.

**Time required:** ~20–30 minutes  
**Result:** Django API on port 8000, React app on port 5173, health check working end-to-end.

---

## Prerequisites

Install the following before starting:

| Tool | Version | Download |
|---|---|---|
| Python | 3.12 or newer | https://www.python.org/downloads/ |
| Node.js | 20 LTS or newer | https://nodejs.org/ |
| Git | Latest | https://git-scm.com/ |
| PostgreSQL | 16+ | https://www.postgresql.org/download/ |
| pgAdmin | Latest | https://www.pgadmin.org/ *(installed with PostgreSQL)* |
| HeidiSQL *(optional)* | Latest | https://www.heidisql.com/ *(lightweight alternative)* |
| Docker Desktop *(optional)* | Latest | https://www.docker.com/products/docker-desktop/ |

Verify installations:

```powershell
python --version
node --version
npm --version
git --version
```

---

## Step 1 — Clone or open the repository

```powershell
cd "d:\6th Semester Summer Project\artisa"
```

If starting from scratch on a new machine, clone from your Git remote after pushing.

---

## Step 2 — Start PostgreSQL

Choose **one** option:

### Option A — Local PostgreSQL install (Recommended)

1. Install PostgreSQL 16+ from https://www.postgresql.org/download/
2. During installation, note your `postgres` password (default: `postgres`)
3. Verify the service is running:

```powershell
Get-Service postgresql*
```

4. Open pgAdmin (installed with PostgreSQL) or HeidiSQL and create the database:

```sql
CREATE DATABASE artisa_db;
```

### Option B — Docker (Optional)

Only use this if you have Docker installed and prefer a containerized database:

```powershell
docker compose up -d
```

This starts PostgreSQL with:
- Database: `artisa_db`
- User: `postgres`
- Password: `postgres`
- Port: `5432`

### Option C — SQLite (quick test only)

Skip PostgreSQL and set `USE_SQLITE=True` in `backend/.env`.  
**Not recommended for production or later tasks** — use PostgreSQL for the full project.

### Database Management (Optional but Recommended)

Visual GUI tools make it easier to browse tables, run queries, and manage data.

#### pgAdmin (Primary — Already Installed with PostgreSQL)

1. Open **pgAdmin** from the Start Menu
2. Enter your **pgAdmin master password** (set during PostgreSQL installation)
3. Right-click **Servers → Create → Server**
4. Fill in the **General** tab:
   - **Name:** `Artisa Local`
5. Switch to the **Connection** tab:
   - **Host name/address:** `localhost`
   - **Port:** `5432`
   - **Maintenance database:** `postgres`
   - **Username:** `postgres`
   - **Password:** `postgres`
6. Click **Save**
7. Navigate to: `Databases → artisa_db → Schemas → public → Tables`

See [Database Management Guide](database-management.md) for detailed instructions, screenshots, and common queries.

#### HeidiSQL (Lightweight Alternative)

- **Download:** https://www.heidisql.com/
- **Connection settings:**
  - Network type: `PostgreSQL`
  - Hostname: `localhost`
  - Port: `5432`
  - User: `postgres`
  - Password: `postgres`
  - Database: `artisa_db`
- Click **Open** to connect

See [Database Management Guide](database-management.md) for detailed instructions, screenshots, and common queries.

---

## Step 3 — Backend setup

```powershell
cd backend

# Create virtual environment
python -m venv .venv

# Activate (Windows PowerShell)
.\.venv\Scripts\Activate.ps1

# Install dependencies
pip install -r requirements.txt

# Create environment file
copy .env.example .env
```

Edit `backend/.env`:

```env
# For PostgreSQL (Option A or B):
USE_SQLITE=False
DB_NAME=artisa_db
DB_USER=postgres
DB_PASSWORD=postgres
DB_HOST=localhost
DB_PORT=5432

# For SQLite quick test (Option C):
# USE_SQLITE=True
```

Run migrations and start the server:

```powershell
python manage.py migrate
python manage.py runserver
```

**Verify:** Open http://127.0.0.1:8000/api/health/

Expected response:

```json
{
  "status": "ok",
  "service": "artisa-api",
  "message": "Artisa backend is running"
}
```

---

## Step 4 — Frontend setup

Open a **new terminal**:

```powershell
cd frontend

npm install

# Optional — copy env template
copy .env.example .env

npm run dev
```

**Verify:** Open http://localhost:5173/

The page should show "Project scaffolding ready" and the API health JSON from the backend.

The Vite dev server proxies `/api` requests to Django on port 8000 (configured in `frontend/vite.config.js`).

---

## Step 5 — Verify end-to-end

| Check | How | Expected |
|---|---|---|
| Backend health | http://127.0.0.1:8000/api/health/ | JSON `status: ok` |
| Frontend loads | http://localhost:5173/ | Artisa scaffold page |
| Proxy works | Health JSON shown on frontend page | Same JSON as backend |
| Django admin | http://127.0.0.1:8000/admin/ | Login page (no superuser yet) |

Test proxy from terminal:

```powershell
Invoke-RestMethod -Uri "http://localhost:5173/api/health/"
```

---

## Environment variables reference

### Backend (`backend/.env`)

| Variable | Default | Description |
|---|---|---|
| `DJANGO_SECRET_KEY` | — | Django secret key (change in production) |
| `DJANGO_DEBUG` | `True` | Debug mode |
| `DJANGO_ALLOWED_HOSTS` | `localhost,127.0.0.1` | Allowed hostnames |
| `DB_NAME` | `artisa_db` | PostgreSQL database name |
| `DB_USER` | `postgres` | PostgreSQL user |
| `DB_PASSWORD` | `postgres` | PostgreSQL password |
| `DB_HOST` | `localhost` | PostgreSQL host |
| `DB_PORT` | `5432` | PostgreSQL port |
| `USE_SQLITE` | `False` | Use SQLite instead of PostgreSQL |
| `CORS_ALLOWED_ORIGINS` | `http://localhost:5173,...` | Frontend origins |
| `JWT_ACCESS_MINUTES` | `30` | JWT access token lifetime (Task 2) |
| `JWT_REFRESH_DAYS` | `7` | JWT refresh token lifetime (Task 2) |

### Frontend (`frontend/.env`)

| Variable | Default | Description |
|---|---|---|
| `VITE_API_BASE_URL` | *(empty)* | API base URL; leave empty in dev (uses Vite proxy) |

---

## Project structure after Task 1

```
artisa/
├── backend/
│   ├── artisa/              # Django project settings
│   ├── apps/
│   │   └── core/            # Health check endpoint
│   ├── media/               # Local file uploads (future tasks)
│   ├── .env                 # Local secrets (gitignored)
│   ├── .env.example
│   ├── requirements.txt
│   └── manage.py
├── frontend/
│   ├── src/
│   │   ├── services/api.js  # API helper
│   │   ├── App.jsx          # Scaffold page + health check
│   │   └── index.css        # Tailwind
│   ├── .env.example
│   ├── package.json
│   └── vite.config.js       # Proxy to Django
├── docs/setup/              # This guide
├── plan/artisa.md           # Master plan
├── tasks/                   # Task briefs + logs
├── docker-compose.yml       # PostgreSQL container
├── .gitignore
└── README.md
```

---

## Troubleshooting

### `connection to server at localhost:5432 failed`

PostgreSQL is not running. Start your local PostgreSQL service or Docker container. Or set `USE_SQLITE=True` temporarily.

```powershell
# Check if PostgreSQL is running
Get-Service postgresql*

# Start it if stopped
Start-Service postgresql-x64-18
```

### `ModuleNotFoundError` for Django packages

Activate the virtual environment:

```powershell
cd backend
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

### Frontend shows "Backend unreachable"

1. Confirm Django is running on port 8000
2. Check `CORS_ALLOWED_ORIGINS` includes `http://localhost:5173`
3. Restart both servers

### Vite Rolldown panic (Vite 8)

Task 1 uses **Vite 6** for stability. If you see Rolldown errors:

```powershell
cd frontend
npm install vite@6 @vitejs/plugin-react@4
```

### PowerShell cannot run Activate.ps1

```powershell
Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
```

---

## Next step

Proceed to **Task 2 — Auth system**. Setup additions for Task 2 will be documented in `docs/setup/task-02-setup-guide.md` after that task is complete.
