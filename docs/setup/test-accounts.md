# Test Accounts

This file contains test account credentials for the Artisa application.

---

## Test Account 1 (Created August 18, 2026)

**Username:** artisatest2178  
**Password:** Test2178!  
**Email:** artisatest2178@example.com  
**Role:** customer  
**Status:** Active

---

## Test Account 2 (Created during Task 2 verification)

**Username:** testuser  
**Password:** testpass123  
**Email:** test@example.com  
**Role:** customer  
**Status:** Active

---

## Seeded Accounts (Created August 19, 2026 - Task 4)

### Admin Account

**Username:** admin  
**Password:** admin123  
**Email:** admin@artisa.com  
**Role:** admin  
**Status:** Active

### Artist Accounts (1-10)

**Username:** artist1  
**Password:** artist123  
**Email:** artist1@artisa.com  
**Role:** customer (with approved artist profile)  
**Status:** Active

**Username:** artist2  
**Password:** artist123  
**Email:** artist2@artisa.com  
**Role:** customer (with approved artist profile)  
**Status:** Active
9
**Username:** artist3  
**Password:** artist123  
**Email:** artist3@artisa.com  
**Role:** customer (with approved artist profile)  
**Status:** Active

**Username:** artist4  
**Password:** artist123  
**Email:** artist4@artisa.com  
**Role:** customer (with approved artist profile)  
**Status:** Active

**Username:** artist5  
**Password:** artist123  
**Email:** artist5@artisa.com  
**Role:** customer (with approved artist profile)  
**Status:** Active

**Username:** artist6  
**Password:** artist123  
**Email:** artist6@artisa.com  
**Role:** customer (with approved artist profile)  
**Status:** Active

**Username:** artist7  
**Password:** artist123  
**Email:** artist7@artisa.com  
**Role:** customer (with approved artist profile)  
**Status:** Active

**Username:** artist8  
**Password:** artist123  
**Email:** artist8@artisa.com  
**Role:** customer (with approved artist profile)  
**Status:** Active

**Username:** artist9  
**Password:** artist123  
**Email:** artist9@artisa.com  
**Role:** customer (with approved artist profile)  
**Status:** Active

**Username:** artist10  
**Password:** artist123  
**Email:** artist10@artisa.com  
**Role:** customer (with approved artist profile)  
**Status:** Active

---

## Admin Account Setup

To create an admin account, use:

```bash
cd backend
.\.venv\Scripts\Activate.ps1
python manage.py createsuperuser
```

---

## Notes

- All test accounts have customer role by default
- Artist access requires profile approval (Task 4)
- Admin access requires superuser creation
- Password reset available via API endpoints

---

## Last Updated

August 18, 2026
