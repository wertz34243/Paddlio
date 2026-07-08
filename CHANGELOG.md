# Changelog

## 3.8

- Added communication module under Mehr with direct messages, group chats, club news, tasks, attendance and file attachment preparation.
- Added dashboard cards for unread messages, group activity, open tasks, pending attendance and latest club news.
- Added Supabase migration `0011_communication_team_system.sql` for messages, posts, tasks, attendance, attachments, RLS and storage bucket preparation.
- Added communication service layer with offline queue fallback.
- Extended realtime subscriptions for communication and team tables.
- Documented communication architecture in `docs/communication-system.md`.

## 3.7

- Added main navigation area `Verein` with Dashboard, members, trainers, groups, material, boats, calendar, documents, messages and settings.
- Added ClubAdmin role preparation across local and cloud role mapping.
- Added club portal domain models and Supabase service layer for organization data.
- Added Supabase migration `0010_club_management_portal.sql` for club material, boats, events, documents, messages, settings and RLS.
- Added realtime subscriptions and offline queue support for club portal tables.
- Documented club management architecture in `docs/club-management.md`.

## 3.6

- Added Smart Coach as a rule-based recommendation center in Analytics and on the Athlete dashboard.
- Added recommendation categories, priorities, reasons, suggested actions, done/dismissed states and notes.
- Added Coach-facing recommendations for athletes without weekly training, high load, open feedback and risky goals.
- Added Supabase table migration `0009_smart_coach_recommendations.sql` with RLS policies for Athlete, Coach and Admin.
- Added cloud service, offline queue support and realtime subscriptions for Smart Coach recommendations.
- Documented rule logic, data sources, role rights and limitations in `docs/smart-coach.md`.

## 3.5

- Added Analytics Center with overview, training, competition, goals, load, Coach and Admin analysis views.
- Added time range filters for 7, 30, 90 days, season, year and custom dates.
- Added rule-based load analysis using duration, intensity, feedback, hard sessions and regeneration.
- Added goal analysis with progress bars, status counts and overall goal quote.
- Added Coach athlete analytics and Admin platform overview.
- Documented metrics, data sources, roles and KI-Coach preparation in `docs/analytics-center.md`.

## 3.4

- Expanded Wettkampf into a competition portal with races, results, best times, season statistics and Coach/Admin views.
- Added competition metadata for name, organizer, course, level, starter field and import preparation.
- Added automatic result summaries for run totals, best total, penalty average and trend versus previous result.
- Added Supabase migration `0008_competition_portal_results.sql` for portal fields, indexes and realtime publication.
- Prepared import metadata for future canoeslalom.net integrations.

## 3.3

- Added central Supabase realtime service for trainings, feedback, goals, notifications, groups, group members and profiles.
- Added offline queue service with insert/update/delete operations, retry count and pending sync status.
- Added Notification Center under Mehr/Updates with unread-first cards and mark-as-read actions.
- Added notification creation for assigned trainings and incoming feedback.
- Extended CloudStatus with pending changes and last-sync information for Admin users.
- Added Supabase migration `0007_realtime_notifications_offline_sync.sql`.
- Documented realtime, notification and offline queue architecture in `docs/realtime-and-offline-sync.md`.

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
