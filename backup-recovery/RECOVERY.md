# Recovery Guide

If your laptop crashes, follow these steps to restore the project on a new machine.

## Prerequisites

- Python 3.12+
- Node.js 18+
- Git
- PostgreSQL 18+ (for database restore)

## Steps

### 1. Clone the repo

```bash
git clone https://github.com/shriijaal/Artisa.git
cd Artisa
```

### 2. Restore the database

**Option A — From PostgreSQL dump (recommended — this is the active database):**

```bash
# Create the database first
psql -U postgres -c "CREATE DATABASE artisa_db;"

# Restore from dump
psql -U postgres -d artisa_db -f backup_postgres.sql
```

**Option B — From Django JSON fixture:**

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate    # Windows
# source .venv/bin/activate  # Mac/Linux
pip install django djangorestframework ...
python manage.py migrate
python manage.py loaddata ../backup_database.json
```

**Option C — From raw SQLite file (fallback):**

```bash
copy backup_db.sqlite3 backend\db.sqlite3
```

### 3. Restore media files (uploaded images)

```bash
Expand-Archive -Path backup_media.zip -DestinationPath backend\media -Force
# Or on Mac/Linux: unzip backup_media.zip -d backend/media/
```

### 4. Set up the frontend

```bash
cd frontend
npm install
npm run dev
```

### 5. Run the backend

```bash
cd backend
python manage.py runserver
```

## Backup Files

- `backup_postgres.sql` — PostgreSQL dump (active database, use this)
- `backup_database.json` — Django fixture dump (all tables, data)
- `backup_db.sqlite3` — Raw SQLite database file (stale, kept for reference)
- `backup_media.zip` — All uploaded artwork/artist images (184 files, ~10MB)
