# Task 2 Completion Log — Auth System

**Completed:** August 18, 2026  
**Phase:** Foundation (Week 1–2)  
**Status:** Done

---

## Goal

JWT authentication with dual-role model and password reset.

---

## Deliverables Checklist

- [x] Custom `User` model: `role` = `customer` | `admin`
- [x] `POST /api/auth/register`, `/login`, `/logout`, `/refresh`, `/me`
- [x] Password reset request + confirm endpoints
- [x] DRF permissions: `IsAdmin`, `IsApprovedArtist`
- [x] React auth context with JWT storage
- [x] Protected routes in React Router
- [x] Login and Register pages

---

## What We Did

### Backend Implementation

#### 1. Custom User Model (`apps/users/models.py`)
- Created custom User model extending AbstractUser
- Added `role` field with choices: `customer` (default), `admin`
- Renamed app from `auth` to `users` to avoid conflict with `django.contrib.auth`
- Configured `AUTH_USER_MODEL = 'users.User'` in settings

#### 2. Auth Endpoints (`apps/users/views.py`)
- **POST /api/auth/register/** - User registration with password confirmation
- **POST /api/auth/login/** - JWT token generation with custom serializer
- **POST /api/auth/logout/** - Token blacklisting for secure logout
- **POST /api/auth/refresh/** - JWT token refresh
- **GET /api/auth/me/** - Get current user profile
- **POST /api/auth/password-reset/** - Request password reset (returns link in dev)
- **POST /api/auth/password-reset-confirm/** - Confirm password reset with token

#### 3. Serializers (`apps/users/serializers.py`)
- `UserSerializer` - User data serialization
- `RegisterSerializer` - Registration with password confirmation validation
- `CustomTokenObtainPairSerializer` - JWT token with user data and role in payload

#### 4. Permissions (`apps/users/permissions.py`)
- `IsAdmin` - Checks if user.role == 'admin'
- `IsApprovedArtist` - Checks if user has approved artist_profile (placeholder for Task 4)

#### 5. Configuration Updates
- Added `apps.users` to INSTALLED_APPS
- Added `rest_framework_simplejwt.token_blacklist` for logout functionality
- Configured JWT settings (30 min access, 7 day refresh, token rotation)

### Frontend Implementation

#### 1. Auth Context (`src/contexts/AuthContext.jsx`)
- JWT token storage in localStorage
- `login()`, `register()`, `logout()`, `refreshAccessToken()` functions
- `isAuthenticated` state
- Auto-fetch user profile on mount if token exists

#### 2. Protected Routes (`src/components/ProtectedRoute.jsx`)
- Route wrapper that redirects to /login if not authenticated
- Loading state while checking authentication

#### 3. Pages
- **Login page** (`src/pages/Login.jsx`) - Username/password form
- **Register page** (`src/pages/Register.jsx`) - Full registration form with password confirmation
- **Dashboard page** (`src/pages/Dashboard.jsx`) - Protected page showing user profile

#### 4. Router Setup (`src/App.jsx`)
- React Router with BrowserRouter
- Routes: /login, /register, /dashboard (protected)
- Default redirect to /dashboard

---

## Validations in Place

### Backend Validations
1. **Password Confirmation** - RegisterSerializer validates passwords match
2. **Django Password Validators** (configured in settings.py):
   - UserAttributeSimilarityValidator - Checks password similarity to user info
   - MinimumLengthValidator - Enforces minimum password length
   - CommonPasswordValidator - Prevents common passwords
   - NumericPasswordValidator - Prevents all-numeric passwords
3. **Required Fields** - DRF serializers enforce required fields
4. **Email Validation** - Django's EmailField validation
5. **Username Uniqueness** - Django's built-in username uniqueness

### Frontend Validations
1. **Password Confirmation** - Client-side check before API call
2. **Required Fields** - HTML5 required attribute
3. **Form Error Display** - Shows backend validation errors

---

## 2FA Status

**NOT IMPLEMENTED** - Two-factor authentication is not included in the current implementation.

**Current Security:**
- JWT tokens with expiration (30 min access, 7 day refresh)
- Token blacklisting on logout
- Token rotation enabled
- HTTPS recommended for production

**Future Enhancement:**
- 2FA could be added using TOTP (Time-based One-Time Password) or SMS verification
- Would require additional fields on User model (e.g., `totp_secret`, `is_2fa_enabled`)

---

## Role & Credential Setup

### Role Model Explained

The system uses a dual-role model:
- **Customer** - Default role for all new registrations
- **Admin** - Administrative access (manually assigned)
- **Artist** - Not a role; determined by `artist_profile.status == 'approved'` (Task 4)

### Creating Admin Users

#### Method 1: Django Admin
```bash
cd backend
.\.venv\Scripts\python.exe manage.py createsuperuser
```
Follow prompts to create a superuser with admin access.

#### Method 2: Django Shell
```bash
cd backend
.\.venv\Scripts\python.exe manage.py shell
```
```python
from apps.users.models import User
admin = User.objects.create_user(
    username='admin',
    email='admin@artisa.com',
    password='your_secure_password',
    first_name='Admin',
    last_name='User',
    role='admin'
)
admin.is_staff = True
admin.is_superuser = True
admin.save()
```

#### Method 3: Update Existing User
```python
from apps.users.models import User
user = User.objects.get(username='existing_user')
user.role = 'admin'
user.is_staff = True
user.save()
```

### Creating Customer Users

Customers are created automatically through the registration flow:
- Navigate to http://localhost:5173/register
- Fill in the registration form
- User is created with `role='customer'` (default)

### Artist Access

Artist access is **not** a role change. It's determined by:
1. User creates an artist profile (Task 4)
2. Artist profile status is set to 'approved' by admin
3. `IsApprovedArtist` permission checks `user.artist_profile.status == 'approved'`

This separation allows:
- Users to be both customers and artists
- Admin approval workflow for artist verification
- Clear separation of concerns

---

## Testing Results

### Backend API Tests
```powershell
# Register test
$body = @{username="testuser"; email="test@example.com"; password="testpass123"; password_confirm="testpass123"; first_name="Test"; last_name="User"} | ConvertTo-Json
Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/auth/register/" -Method POST -Body $body -ContentType "application/json"
# Result: User registered successfully

# Login test
$body = @{username="testuser"; password="testpass123"} | ConvertTo-Json
Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/auth/login/" -Method POST -Body $body -ContentType "application/json"
# Result: JWT tokens returned with user data
```

### Frontend Tests
- Frontend loads at http://localhost:5173
- Login page accessible at /login
- Register page accessible at /register
- Protected route redirects to /login when not authenticated
- Dashboard accessible after login

---

## Files Created/Modified

### Backend
```
apps/users/
  models.py          - Custom User model
  admin.py           - User admin configuration
  serializers.py     - Auth serializers
  views.py           - Auth endpoints
  urls.py            - Auth URL routes
  permissions.py     - Custom permissions
  apps.py            - App configuration

artisa/settings.py   - Added users app, token_blacklist, AUTH_USER_MODEL
artisa/urls.py       - Added auth URLs
```

### Frontend
```
src/contexts/AuthContext.jsx    - Auth state management
src/components/ProtectedRoute.jsx - Route protection
src/pages/Login.jsx             - Login page
src/pages/Register.jsx          - Register page
src/pages/Dashboard.jsx         - Protected dashboard
src/App.jsx                     - Router setup
```

---

## Known Limitations

1. **No 2FA** - Two-factor authentication not implemented
2. **Password Reset** - Currently returns reset link in response (dev only); email sending needed for production
3. **Email Verification** - No email verification on registration
4. **Rate Limiting** - No rate limiting on auth endpoints
5. **Session Management** - Uses localStorage (vulnerable to XSS); consider httpOnly cookies for production

---

## Security Notes

### Current Security Measures
- Password hashing via Django's PBKDF2
- JWT token expiration
- Token blacklisting on logout
- Token rotation enabled
- CORS configured for allowed origins

### Production Recommendations
1. Use HTTPS for all API calls
2. Store JWT in httpOnly cookies instead of localStorage
3. Add rate limiting to auth endpoints
4. Implement email verification
5. Add proper email sending for password reset
6. Consider adding 2FA for sensitive operations
7. Set secure cookie flags
8. Implement CSRF protection for cookie-based auth

---

## Next Task

**Task 3 — Design System:** Create design tokens, component library, and design system documentation.

---

## API Endpoints Summary

| Method | Endpoint | Auth Required | Description |
|--------|----------|---------------|-------------|
| POST | /api/auth/register/ | No | Register new user |
| POST | /api/auth/login/ | No | Login and get JWT tokens |
| POST | /api/auth/logout/ | Yes | Logout and blacklist token |
| POST | /api/auth/refresh/ | No | Refresh access token |
| GET | /api/auth/me/ | Yes | Get current user profile |
| POST | /api/auth/password-reset/ | No | Request password reset |
| POST | /api/auth/password-reset-confirm/ | No | Confirm password reset |
