# Task 5: Artist Application + Verification + Django Admin

**Phase:** Artists (Week 5)  
**Depends on:** Task 4  
**Blocks:** Task 6

## Goal

Artist onboarding with admin approval and Django Admin for platform management.

## Deliverables

- [ ] `POST /api/artist/apply` — portfolio samples, reason
- [ ] Admin approves/rejects with `rejection_reason`
- [ ] On approval: `artist_profile.status = approved` (user stays `customer`)
- [ ] Verified badge flag in artist API response
- [ ] All models registered in Django Admin
- [ ] Admin can manage: applications, categories, artwork moderation, users
- [ ] React: "Become an Artist" application form

## Notes

Django Admin is the MVP admin panel — custom React admin is Task 19 (stretch).
