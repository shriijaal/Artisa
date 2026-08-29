# Role & Credential Setup Guide

This guide explains how to set up different user roles and credentials in the Artisa system.

---

## Role Model Overview

Artisa uses a dual-role model with a special artist access pattern:

- **Customer** - Default role for all new registrations
- **Admin** - Administrative access with full system control
- **Artist** - NOT a role; determined by `artist_profile.status == 'approved'`

### Key Concept
Users can be both customers AND artists simultaneously. Artist access is granted through profile approval, not role change.

---

## Creating Admin Users

### Method 1: Django Superuser Command (Recommended)

```bash
cd backend
.\.venv\Scripts\Activate.ps1
python manage.py createsuperuser
```

Follow the prompts:
- Username: Choose your admin username
- Email: Admin email address
- Password: Secure password (will be hidden)
- Password (again): Confirm password

This creates a user with:
- `role = 'admin'`
- `is_staff = True` (can access Django Admin)
- `is_superuser = True` (full permissions)

### Method 2: Django Shell

```bash
cd backend
.\.venv\Scripts\Activate.ps1
python manage.py shell
```

```python
from apps.users.models import User

# Create admin user
admin = User.objects.create_user(
    username='admin',
    email='admin@artisa.com',
    password='YourSecurePassword123!',
    first_name='Admin',
    last_name='User',
    role='admin'
)
admin.is_staff = True
admin.is_superuser = True
admin.save()

print(f"Admin user created: {admin.username}")
```

### Method 3: Update Existing User to Admin

```bash
cd backend
.\.venv\Scripts\Activate.ps1
python manage.py shell
```

```python
from apps.users.models import User

# Get existing user
user = User.objects.get(username='existing_username')

# Promote to admin
user.role = 'admin'
user.is_staff = True
user.is_superuser = True
user.save()

print(f"User {user.username} promoted to admin")
```

---

## Creating Customer Users

### Method 1: Registration Form (User-facing)

1. Navigate to http://localhost:5173/register
2. Fill in the registration form:
   - First name
   - Last name
   - Username
   - Email
   - Password
   - Confirm password
3. Click "Create account"
4. User is created with `role='customer'` (default)

### Method 2: Django Shell

```bash
cd backend
.\.venv\Scripts\Activate.ps1
python manage.py shell
```

```python
from apps.users.models import User

# Create customer user
customer = User.objects.create_user(
    username='customer1',
    email='customer@example.com',
    password='CustomerPassword123!',
    first_name='John',
    last_name='Doe',
    role='customer'  # This is the default, can be omitted
)

print(f"Customer user created: {customer.username}")
```

---

## Artist Access Setup

**Important:** Artist access is NOT a role. It's granted through profile approval.

### Current Status (Task 2)
Artist profiles do not exist yet. They will be implemented in Task 4.

### Future Implementation (Task 4+)
1. User creates artist profile via API
2. Admin reviews application in Django Admin
3. Admin approves/rejects with reason
4. On approval: `artist_profile.status = 'approved'`
5. User gains artist access while keeping `role='customer'`

### Checking Artist Access (Future)
```python
# In permission check
from apps.users.permissions import IsApprovedArtist

# The permission will check:
# hasattr(user, 'artist_profile') and user.artist_profile.status == 'approved'
```

---

## Viewing All Users

### Django Admin
1. Navigate to http://127.0.0.1:8000/admin/
2. Login with admin credentials
3. Go to "Users" section
4. View all users with their roles

### Django Shell
```bash
cd backend
.\.venv\Scripts\Activate.ps1
python manage.py shell
```

```python
from apps.users.models import User

# List all users
users = User.objects.all()
for user in users:
    print(f"{user.username} - {user.email} - Role: {user.role} - Staff: {user.is_staff}")

# Count by role
from django.db.models import Count
role_counts = User.objects.values('role').annotate(count=Count('id'))
print(role_counts)
```

---

## Resetting User Passwords

### Method 1: Django Admin
1. Navigate to http://127.0.0.1:8000/admin/
2. Go to "Users" section
3. Click on user
4. Scroll to "Password" field
5. Enter new password

### Method 2: Django Shell
```bash
cd backend
.\.venv\Scripts\Activate.ps1
python manage.py shell
```

```python
from apps.users.models import User

user = User.objects.get(username='username')
user.set_password('NewPassword123!')
user.save()

print(f"Password reset for {user.username}")
```

### Method 3: Password Reset API (User-facing)
```bash
# Request reset
POST /api/auth/password-reset/
Body: {"email": "user@example.com"}

# Confirm reset (using returned token)
POST /api/auth/password-reset-confirm/
Body: {
  "uid": "...",
  "token": "...",
  "new_password": "NewPassword123!"
}
```

---

## Deleting Users

### Django Admin
1. Navigate to http://127.0.0.1:8000/admin/
2. Go to "Users" section
3. Select user(s)
4. Choose "Delete" from action dropdown
5. Confirm deletion

### Django Shell
```bash
cd backend
.\.venv\Scripts\Activate.ps1
python manage.py shell
```

```python
from apps.users.models import User

user = User.objects.get(username='username')
user.delete()

print(f"User {user.username} deleted")
```

---

## Security Best Practices

1. **Strong Passwords** - Use passwords with:
   - Minimum 8 characters
   - Mix of uppercase and lowercase
   - Numbers and special characters
   - Not similar to username or email

2. **Admin Accounts** - Limit admin access to trusted individuals only

3. **Regular Audits** - Periodically review user list and roles

4. **Password Rotation** - Encourage users to change passwords regularly

5. **Monitor Failed Logins** - Implement rate limiting (future enhancement)

---

## Troubleshooting

### User cannot login
- Verify username and password are correct
- Check if user account is active (`is_active = True`)
- Check if user is staff/superuser if trying to access admin

### User cannot access admin panel
- Verify `is_staff = True`
- Verify user has admin role if needed

### Artist access not working (after Task 4)
- Check if artist_profile exists
- Verify `artist_profile.status = 'approved'`
- Check `IsApprovedArtist` permission implementation

---

## Quick Reference Commands

```bash
# Create superuser
python manage.py createsuperuser

# Open Django shell
python manage.py shell

# Run migrations
python manage.py migrate

# Start development server
python manage.py runserver
```

---

## Test Accounts

For testing purposes, use the test account created during Task 2 verification:

- **Username:** testuser
- **Password:** testpass123
- **Role:** customer

You can create additional test accounts using the methods above.
