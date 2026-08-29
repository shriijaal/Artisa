# Task 1 Completion Log — Project Scaffolding

**Completed:** August 17, 2026  
**Phase:** Foundation (Week 1)  
**Status:** Done

---

## What we did

Set up the Artisa monorepo with a Django REST API backend, React + Vite + Tailwind frontend, PostgreSQL configuration, JWT-ready settings, and a working health-check flow between frontend and backend.

---

## How we did it

### 1. Repository structure

- Created `backend/` and `frontend/` directories
- Added root `.gitignore` (Python venv, node_modules, `.env`, media files)
- Added `docker-compose.yml` for PostgreSQL 16
- Initialized git repository

### 2. Django backend

**Created with:**
```powershell
python -m venv backend\.venv
pip install Django djangorestframework django-cors-headers djangorestframework-simplejwt psycopg2-binary Pillow python-dotenv
django-admin startproject artisa backend/
python manage.py startapp core apps\core
```

**Key files configured:**

| File | Purpose |
|---|---|
| `backend/artisa/settings.py` | DRF, CORS, JWT (simplejwt), PostgreSQL from env, `MEDIA_ROOT`, timezone `Asia/Kathmandu` |
| `backend/artisa/urls.py` | Routes `/admin/` and `/api/` |
| `backend/apps/core/views.py` | `GET /api/health/` endpoint |
| `backend/apps/core/urls.py` | Health route |
| `backend/requirements.txt` | Pinned dependencies |
| `backend/.env.example` | Template for all env vars |

**Database:** PostgreSQL via environment variables. Optional `USE_SQLITE=True` for machines without PostgreSQL during scaffold testing.

**Health endpoint response:**
```json
{
  "status": "ok",
  "service": "artisa-api",
  "message": "Artisa backend is running"
}
```

### 3. React frontend

**Created with:**
```powershell
npm create vite@latest frontend -- --template react
npm install
npm install -D tailwindcss @tailwindcss/vite vite@6 @vitejs/plugin-react@4
```

> **Note:** Vite 8 caused a Rolldown panic on this machine. Pinned to **Vite 6.4** for stability.

**Key files configured:**

| File | Purpose |
|---|---|
| `frontend/vite.config.js` | Tailwind plugin, proxy `/api` and `/media` to `http://127.0.0.1:8000` |
| `frontend/src/index.css` | Tailwind import |
| `frontend/src/services/api.js` | `checkHealth()` fetch helper |
| `frontend/src/App.jsx` | Scaffold landing page with live health check display |
| `frontend/.env.example` | `VITE_API_BASE_URL` template |

### 4. Verification

| Test | Result |
|---|---|
| `python manage.py check` | Passed |
| `python manage.py migrate` | Passed (SQLite fallback on dev machine) |
| `GET http://127.0.0.1:8000/api/health/` | `200 OK` |
| `GET http://localhost:5173/api/health/` via proxy | `200 OK` |
| Frontend page loads health JSON | Passed |

### 5. Documentation created

| File | Purpose |
|---|---|
| `README.md` | Project overview and quick start |
| `docs/setup/task-01-setup-guide.md` | Full replicable setup guide |
| `docs/setup/README.md` | Index of setup guides |
| `tasks/completed/task-01-scaffold-log.md` | This file |

---

## Deliverables checklist

- [x] Git repo initialized with `.gitignore`
- [x] `backend/` — Django + DRF + cors-headers + simplejwt + psycopg2 + Pillow
- [x] `frontend/` — Vite + React + Tailwind CSS
- [x] PostgreSQL connection configured (with SQLite dev fallback)
- [x] CORS, JWT settings, `MEDIA_ROOT`/`MEDIA_URL`
- [x] `.env.example` for backend and frontend
- [x] `GET /api/health/` returns 200
- [x] Frontend calls health endpoint successfully (via Vite proxy)
- [x] Root `README.md` with setup instructions
- [x] Replicable setup guide in `docs/setup/`

---

## Decisions made

1. **Dual database support** — PostgreSQL is the target database per plan; `USE_SQLITE` env flag allows scaffold verification without PostgreSQL installed.
2. **Docker Compose** — Added for easy PostgreSQL replication across machines.
3. **Vite 6 over Vite 8** — Rolldown in Vite 8 failed on Windows with insufficient resources error.
4. **JWT pre-configured** — simplejwt settings in place; actual auth endpoints come in Task 2.
5. **`apps/` package structure** — Core app at `apps.core` from the start, matching the master plan.

---

## Files created (summary)

```
backend/
  artisa/          settings.py, urls.py, wsgi.py, asgi.py
  apps/core/       views.py, urls.py, apps.py
  media/.gitkeep
  manage.py
  requirements.txt
  .env.example

frontend/
  src/App.jsx, main.jsx, index.css
  src/services/api.js
  vite.config.js, package.json
  .env.example

docs/setup/task-01-setup-guide.md
tasks/completed/task-01-scaffold-log.md
docker-compose.yml
.gitignore
README.md
```

---

## Known limitations (Task 1 scope)

- No authentication endpoints yet (Task 2)
- No custom User model yet (Task 2)
- PostgreSQL not verified on this machine (used SQLite fallback); Docker/local PostgreSQL documented in setup guide
- Default Django `User` model used for admin migrations only

---

## Next task

**Task 2 — Auth system:** Custom User model with roles, register/login/logout/refresh, password reset, JWT wired to React auth context.

Setup additions will be documented in `docs/setup/task-02-setup-guide.md`.
