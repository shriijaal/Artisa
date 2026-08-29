# Task 1: Project Scaffolding

**Phase:** Foundation (Week 1)  
**Depends on:** —  
**Blocks:** Task 2

## Goal

Set up the monorepo with Django backend, React frontend, PostgreSQL, and shared config.

## Deliverables

- [x] Git repo initialized with `.gitignore`
- [x] `backend/` — Django project with DRF, `django-cors-headers`, `psycopg2`, `djangorestframework-simplejwt`, `Pillow`
- [x] `frontend/` — Vite + React + Tailwind CSS
- [x] PostgreSQL connection configured
- [x] CORS, JWT settings, `MEDIA_ROOT`/`MEDIA_URL`
- [x] `.env.example` for backend and frontend
- [x] `GET /api/health/` endpoint returns 200
- [x] Frontend successfully calls health endpoint
- [x] Root `README.md` with setup instructions

**Completion log:** [tasks/completed/task-01-scaffold-log.md](completed/task-01-scaffold-log.md)  
**Setup guide:** [docs/setup/task-01-setup-guide.md](../docs/setup/task-01-setup-guide.md)

## Notes

- Use `backend/apps/` structure from the start
- Do not implement auth yet — just scaffold
