# How to Run the Artisa Website

This guide explains how to start the backend and frontend servers and access the website.

---

## Prerequisites

- Python 3.12+ installed
- Node.js 20+ installed
- PostgreSQL running (or SQLite fallback)
- pgAdmin or HeidiSQL (optional, for database management)

---

## Database Management (Optional)

### Using pgAdmin (Primary)

1. Open pgAdmin from the Start Menu
2. Enter your master password
3. Connect to: `localhost:5432`, user: `postgres`
4. Browse: `Databases → artisa_db → Schemas → public → Tables`

### Using HeidiSQL (Alternative)

1. Download and install from [heidisql.com](https://www.heidisql.com/)
2. Create a new session:
   - Network type: `PostgreSQL`
   - Hostname: `localhost`
   - Port: `5432`
   - User: `postgres`
   - Password: `postgres`
   - Database: `artisa_db`
3. Click **Open** to connect
4. See [Database Management Guide](database-management.md) for detailed instructions

### Alternative Tools (Mac/Linux)

- **pgAdmin:** https://www.pgadmin.org/
- **DBeaver:** https://dbeaver.io/ (cross-platform)

---

## Starting the Backend

### 1. Navigate to Backend Directory

```bash
cd backend
```

### 2. Activate Virtual Environment

**Windows (PowerShell):**
```bash
.\.venv\Scripts\Activate.ps1
```

**Windows (CMD):**
```bash
.\venv\Scripts\activate.bat
```

### 3. Start Django Server

```bash
python manage.py runserver
```

The backend will start on `http://127.0.0.1:8000`

**Keep this terminal open** - the backend server must be running.

---

## Starting the Frontend

### 1. Open a New Terminal

Open a new terminal window (keep the backend terminal open).

### 2. Navigate to Frontend Directory

```bash
cd frontend
```

### 3. Install Dependencies (First Time Only)

```bash
npm install
```

### 4. Start Vite Dev Server

```bash
npm run dev
```

The frontend will start on `http://localhost:5173`

**Keep this terminal open** - the frontend server must be running.

---

## Accessing the Website

### Open in Browser

1. Open your web browser
2. Navigate to: `http://localhost:5173`

You should see the Artisa homepage.

---

## Using Test Accounts

### Login

1. Click "Login" on the homepage
2. Use one of the test accounts from `docs/setup/test-accounts.md`:

**Admin Account:**
- Username: `admin`
- Password: `admin123`

**Artist Account:**
- Username: `artist1`
- Password: `artist123`

**Customer Account:**
- Username: `artisatest2178`
- Password: `Test2178!`

### Django Admin Panel

To access the Django admin panel:

1. Navigate to: `http://127.0.0.1:8000/admin`
2. Login with admin credentials:
   - Username: `admin`
   - Password: `admin123`

---

## Stopping the Servers

### Stop Backend
- Go to the backend terminal
- Press `Ctrl + C`

### Stop Frontend
- Go to the frontend terminal
- Press `Ctrl + C`

---

## Troubleshooting

### Backend Won't Start

**Issue:** Port 8000 already in use

**Solution:** Use a different port:
```bash
python manage.py runserver 8001
```

**Issue:** Database connection error

**Solution:** Check your `.env` file has correct database settings, or use SQLite by setting `USE_SQLITE=True` in `.env`

### Frontend Won't Start

**Issue:** Port 5173 already in use

**Solution:** Vite will automatically use the next available port (5174, 5175, etc.)

**Issue:** Dependencies not found

**Solution:** Run `npm install` in the frontend directory

### Login Fails

**Issue:** "Login failed" error

**Solution:**
1. Ensure backend server is running
2. Check browser console for errors (F12)
3. Verify credentials are correct
4. Try clearing browser localStorage

---

## Quick Start Summary

```bash
# Terminal 1 - Backend
cd backend
.\.venv\Scripts\Activate.ps1
python manage.py runserver

# Terminal 2 - Frontend
cd frontend
npm run dev

# Browser
# Open http://localhost:5173
```

---

## API Endpoints

While the backend is running, you can access API endpoints:

- Health Check: `http://127.0.0.1:8000/api/health/`
- Auth: `http://127.0.0.1:8000/api/auth/`
- Admin: `http://127.0.0.1:8000/admin/`

---

## Notes

- The frontend proxies API requests to the backend via Vite's proxy configuration
- Both servers must be running for the application to work
- Changes to backend code may require server restart
- Changes to frontend code hot-reload automatically
