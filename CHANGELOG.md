# Changelog

## 3.1

- Added Supabase-backed club management for Admin users.
- Added Supabase-backed club request review flow.
- Added Supabase-backed member role, status and club/group administration.
- Added Coach/TeamAdmin access paths for own club members and training groups.
- Added Cloud services for clubs, club requests, profile admin fields, training groups and group members.
- Added RLS/FK repair migration `PADDLIO_3_1_CLUB_TEAM_MANAGEMENT.sql`.
- Updated registration rules so new cloud users remain `Athlete` until an Admin changes roles.
- Updated docs for production auth, role management and club/team architecture.
