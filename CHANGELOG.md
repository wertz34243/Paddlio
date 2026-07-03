# Changelog

## 3.2

- Added role-aware training planning workflows for Coach/Admin and Athlete.
- Added Coach tabs for today, week, month, templates, groups and feedback.
- Added Athlete tabs for today, current week, upcoming sessions, completed sessions and feedback.
- Added group planning overview cards with direct weekly-plan and planning actions.
- Added centralized feedback overview for open and submitted training feedback.
- Improved training template UI encoding and mobile workflow styling.
- Added Supabase migration `0006_training_planning_2_0.sql` with planning indexes and realtime publication preparation.

## 3.1

- Added Supabase-backed club management for Admin users.
- Added Supabase-backed club request review flow.
- Added Supabase-backed member role, status and club/group administration.
- Added Coach/TeamAdmin access paths for own club members and training groups.
- Added Cloud services for clubs, club requests, profile admin fields, training groups and group members.
- Added RLS/FK repair migration `PADDLIO_3_1_CLUB_TEAM_MANAGEMENT.sql`.
- Updated registration rules so new cloud users remain `Athlete` until an Admin changes roles.
- Updated docs for production auth, role management and club/team architecture.
