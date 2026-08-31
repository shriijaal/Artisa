# Database Management Guide

This guide explains how to manage the Artisa PostgreSQL database using GUI tools: **pgAdmin** (primary) and **HeidiSQL** (lightweight alternative).

---

## Overview

Artisa uses **PostgreSQL** as its primary database. You can manage it using:

| Tool               | Platform                        | Recommended For                                    |
| ------------------ | ------------------------------- | -------------------------------------------------- |
| **pgAdmin**  | Windows, Mac, Linux (Web-based) | Primary choice - already installed with PostgreSQL |
| **HeidiSQL** | Windows only                    | Lightweight alternative - faster, simpler UI       |

Both tools connect to the same PostgreSQL server running on `localhost:5432`.

---

## Option 1: pgAdmin (Primary - Recommended)

pgAdmin is automatically installed with PostgreSQL on Windows. It's a full-featured web-based administration tool.

### 1. Opening pgAdmin

1. Press **Windows Key** and type `pgAdmin`
2. Click **pgAdmin 4** from the search results
3. A browser window will open (served locally at `http://127.0.0.1:5050`)
4. Enter your **pgAdmin master password** (set during PostgreSQL installation)

<!-- SCREENSHOT PLACEHOLDER: pgAdmin login screen -->

### 2. Creating a Server Connection

If this is your first time, you need to connect pgAdmin to your local PostgreSQL server:

1. In the **Browser** panel (left side), right-click on **Servers**
2. Select **Create → Server...**
3. Fill in the **General** tab:
   - **Name:** `Artisa Local`
4. Switch to the **Connection** tab:
   - **Host name/address:** `localhost`
   - **Port:** `5432`
   - **Maintenance database:** `postgres`
   - **Username:** `postgres`
   - **Password:** `postgres` (or your PostgreSQL password)
   - Check **Save password?**
5. Click **Save**

<!-- SCREENSHOT PLACEHOLDER: pgAdmin new server dialog with connection settings -->

### 3. Browsing Artisa Tables

Once connected, navigate to the Artisa database:

1. In the Browser panel, expand: **Servers → Artisa Local → Databases → artisa_db → Schemas → public → Tables**
2. You'll see all Artisa tables:

   - `auth_user` — User accounts (Collectors & Artists)
   - `artworks_artwork` — Artwork listings
   - `orders_order` — Customer orders
   - `orders_orderitem` — Items in each order
   - `artists_artist` — Artist profiles
   - `wishlist_wishlist` — Saved artworks
   - And more...
3. Right-click any table and select **View/Edit Data → All Rows** to see the data

<!-- SCREENSHOT PLACEHOLDER: pgAdmin table browser showing Artisa tables -->

### 4. Running SQL Queries

pgAdmin has a built-in SQL query tool:

1. Click the **SQL** icon (top toolbar) or press **Alt+Shift+Q**
2. A new query tab opens
3. Type your SQL query
4. Click the **Execute/Refresh** button (▶️ icon) or press **F5**

**Example query:**

```sql
-- List all users and their roles
SELECT 
    u.username, 
    u.email, 
    u.is_staff,
    a.is_verified
FROM auth_user u
LEFT JOIN artists_artist a ON a.user_id = u.id
LIMIT 20;
```

<!-- SCREENSHOT PLACEHOLDER: pgAdmin SQL query editor with results -->

### 5. Common Artisa Queries

Save these queries for quick reference:

**List all users:**

```sql
SELECT id, username, email, is_staff, is_active 
FROM auth_user 
ORDER BY id;
```

**List artworks with artist names:**

```sql
SELECT 
    a.id,
    a.title, 
    u.username AS artist,
    a.price,
    a.status,
    a.is_featured
FROM artworks_artwork a
JOIN auth_user u ON a.artist_id = u.id
ORDER BY a.created_at DESC
LIMIT 50;
```

**Check order totals:**

```sql
SELECT 
    COUNT(*) AS total_orders,
    SUM(total) AS total_revenue,
    AVG(total) AS average_order_value
FROM orders_order
WHERE status = 'completed';
```

**Find most wishlisted artworks:**

```sql
SELECT 
    a.title,
    COUNT(w.id) AS wishlist_count
FROM wishlist_wishlist w
JOIN artworks_artwork a ON w.artwork_id = a.id
GROUP BY a.id, a.title
ORDER BY wishlist_count DESC
LIMIT 10;
```

**View recent commissions:**

```sql
SELECT 
    c.id,
    u1.username AS buyer,
    u2.username AS artist,
    c.status,
    c.budget,
    c.created_at
FROM commissions_commission c
JOIN auth_user u1 ON c.buyer_id = u1.id
JOIN auth_user u2 ON c.artist_id = u2.id
ORDER BY c.created_at DESC
LIMIT 20;
```

---

## Option 2: HeidiSQL (Lightweight Alternative)

HeidiSQL is a fast, Windows-only GUI client for PostgreSQL and MySQL. It's simpler and more responsive than pgAdmin.

### 1. Download & Installation

1. Visit: https://www.heidisql.com/
2. Click **Download** (latest version)
3. Run the installer (or download the portable version - no installation needed)
4. Launch HeidiSQL

<!-- SCREENSHOT PLACEHOLDER: HeidiSQL download page -->

### 2. Creating a Session

When you open HeidiSQL, you need to create a session to connect to PostgreSQL:

1. Click **New** button (top-left)
2. In the session settings:
   - **Network type:** `PostgreSQL`
   - **Hostname / IP:** `localhost`
   - **User:** `postgres`
   - **Password:** `postgres` (or your PostgreSQL password)
   - **Port:** `5432`
   - **Database:** `artisa_db` (select from dropdown after connecting)
3. Click **Open** to connect/mode

<!-- SCREENSHOT PLACEHOLDER: HeidiSQL session settings dialog -->

### 3. Browsing Tables and Data

Once connected:

1. The left panel shows all databases and tables
2. Expand: **artisa_db → public → tables**
3. Double-click any table to view its data
4. Use the **Data** tab to see rows, **Structure** tab to see columns

<!-- SCREENSHOT PLACEHOLDER: HeidiSQL connected view showing tables -->

### 4. Running Queries in HeidiSQL

HeidiSQL has a powerful query editor:

1. Click the **Query** tab (top)
2. Type your SQL query
3. Click **Run** (▶️ button) or press **F9**
4. Results appear in the bottom panel

**Example:**

```sql
-- Find expensive artworks
SELECT title, price, u.username
FROM artworks_artwork a
JOIN auth_user u ON a.artist_id = u.id
WHERE a.price > 10000
ORDER BY a.price DESC;
```

<!-- SCREENSHOT PLACEHOLDER: HeidiSQL query editor with results -->

### 5. HeidiSQL Tips

- **Export data:** Right-click table → **Export**
- **Import data:** Right-click table → **Import**
- **Quick filter:** Use the filter bar above the data grid
- **Multiple tabs:** Open multiple query tabs for different tasks
- **Session manager:** Save multiple connections (e.g., local, production)

---

## Troubleshooting

### Connection Refused (Windows)

**Error:** `Could not connect to server: Connection refused`

**Solution:**

1. Check if PostgreSQL is running:
   ```powershell
   Get-Service postgresql*
   ```
2. If stopped, start it:
   ```powershell
   Start-Service postgresql-x64-18
   ```
3. Or via Services app: Press `Win+R` → type `services.msc` → find `postgresql-x64-18` → Right-click → **Start**

<!-- SCREENSHOT PLACEHOLDER: Windows Services showing PostgreSQL running -->

### Wrong Credentials

**Error:** `password authentication failed for user "postgres"`

**Solution:**

1. Check your `backend/.env` file:
   ```env
   DB_USER=postgres
   DB_PASSWORD=postgres
   ```
2. Ensure the password matches what you set during PostgreSQL installation
3. If forgotten, reset the password via pgAdmin or psql

### Database Doesn't Exist

**Error:** `database "artisa_db" does not exist`

**Solution:**

1. Open pgAdmin or HeidiSQL
2. Run this SQL:
   ```sql
   CREATE DATABASE artisa_db;
   ```
3. Verify it was created by refreshing the database list

### Port Already in Use

**Error:** `address already in use` or `port 5432 already allocated`

**Solution:**

1. Check what's using port 5432:
   ```powershell
   netstat -ano | findstr :5432
   ```
2. Stop the conflicting service, or change PostgreSQL port in `postgresql.conf`

---

## Adding Screenshots to This Guide

To make this guide more helpful, add screenshots:

1. **Create folder:** `docs/setup/images/database/`
2. **Take screenshots** of each step (use Windows Snipping Tool or Snip & Sketch)
3. **Save images** with descriptive names:
   - `pgadmin-login.png`
   - `pgadmin-new-server.png`
   - `pgadmin-tables.png`
   - `heidisql-session.png`
   - `heidisql-connected.png`
4. **Update this markdown file** to replace placeholders with actual images:
   ```markdown
   ![pgAdmin Login](images/database/pgadmin-login.png)
   ```

---

## Next Steps

- Read the [Task 1 Setup Guide](task-01-setup-guide.md) to set up PostgreSQL
- See the [How to Run Guide](how-to-run.md) for starting the backend and frontend
- Check the [Environment Variables Reference](task-01-setup-guide.md#environment-variables-reference) for database configuration

---

<div align="center">
  <p><strong>Need help?</strong> Check the <a href="../README.md">main README</a> or open an issue on GitHub.</p>
</div>
