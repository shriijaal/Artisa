# Task 2: Auth System

**Phase:** Foundation (Week 1–2)  
**Depends on:** Task 1  
**Blocks:** Task 4

## Goal

JWT authentication with dual-role model and password reset.

## Deliverables

- [ ] Custom `User` model: `role` = `customer` | `admin`
- [ ] `POST /api/auth/register`, `/login`, `/logout`, `/refresh`
- [ ] `GET /api/auth/me`
- [ ] Password reset request + confirm endpoints
- [ ] DRF permissions: `IsAdmin`, `IsApprovedArtist` (checks `artist_profile.status`)
- [ ] React auth context with JWT storage
- [ ] Protected routes in React Router
- [ ] Login and Register pages

## Role model

- All users register as `customer`
- Artist access comes from `artist_profile.status == approved`, not a role change
- Admin is `user.role == admin`
