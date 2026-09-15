# Recovery Guide

If your laptop crashes, follow these steps to restore the project on a new machine.

## Prerequisites
- Python 3.12+
- Node.js 18+
- Git

## Steps

### 1. Clone the repo
```bash
git clone https://github.com/shriijaal/Artisa.git
cd Artisa
```

### 2. Restore the database
**Option A — From JSON dump (recommended):**
```bash
cd backend
python -m venv .venv
.venv\Scripts\activate    # Windows
# source .venv/bin/activate  # Mac/Linux
pip install django djangorestframework ...
python manage.py migrate
python manage.py loaddata ../backup_database.json
```

**Option B — From raw SQLite file:**
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
- `backup_database.json` — Django fixture dump (all tables, data)
- `backup_db.sqlite3` — Raw SQLite database file
- `backup_media.zip` — All uploaded artwork/artist images (184 files, ~10MB)
