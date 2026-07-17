# Changelog

## 5.0.0

- Added Polar AccessLink integration under `Mehr -> Integrationen -> Polar`.
- Added server-side Polar OAuth endpoints for connect, callback, status, sync and disconnect.
- Added encrypted token storage via Supabase-backed `polar_accounts`, without exposing Polar tokens to the frontend.
- Added idempotent Supabase migration `0028_polar_integration.sql` for Polar accounts, OAuth state, sync jobs, training imports and device connections.
- Added Polar training import into `external_training_sessions`, with duplicate prevention by Polar activity id.
- Added Polar UI for connection status, manual sync, imported training metrics, heart-rate chart, Paddlio zone summary and prepared future device adapters.
- Documented required Vercel environment variables in `docs/polar-integration.md`.
- Introduced a new Apple Fitness / Polar Flow inspired design direction.
- Reduced the Heute dashboard to the essential daily information: greeting, date, today's training, weekly goal, last session, trainer messages and feedback.
- Added central 5.0 design tokens for spacing, typography, colors, 22px cards, shadows, buttons, tab bars, bottom navigation and CloudStatus toast behavior.
- Made the mobile bottom navigation larger and clearer while keeping the existing five main areas.
- Restyled the mobile `Mehr` area into an Apple Settings style grouped list.
- Updated visible app version, package version and service-worker cache to `5.0.0`.
- No SQL migration required.

## 4.1.5

- Renamed the visible bottom navigation item `Kommunikation` to `Team` while keeping existing internal routes stable.
- Added role-based primary actions at the top of the Heute screen for athletes, coaches and admins.
- Routed admin Heute actions directly to Beta-Check, Feedback and Admin user management instead of the last opened Mehr tab.
- Reworked the mobile `Mehr` area into grouped cards for account, sport, club/team and beta areas.
- Refined CloudStatus wording to show synchronized, syncing, pending and unsynchronized states without implying data loss.
- Updated Team, PWA manifest, offline page and service worker cache labels to the current 4.1.5 state.
- Added contextual aria labels for additional Coach/Admin and Goals action buttons.
- Hardened Cloud profile merging so Supabase identity, role and club overwrite stale local profile cache after login.
- Added `CHECK_BETA_PROFILE_ROLE_STATE.sql` and `RESET_BETA_TEST_USERS_415.sql` for safe Supabase profile/role audits and targeted beta-account repair.
- Improved the profile hero meta line so club and sport profile values no longer run together.
- Added cloud persistence and Realtime coverage for training journal entries via `training_journal_entries`.
- Replaced unsupported password-reset `prompt()` with an inline reset form on the login screen.
- Translated communication task/news enum values for user-facing German labels.
- Fixed additional visible UTF-8 text issues reported during the 4.1.5 beta test.
- Fixed cross-device role synchronization so Supabase profile roles override stale local cache roles.
- Added Supabase migration `0018_role_sync_profile_normalization.sql` for lower-case profile e-mails and canonical admin role normalization.
- Protected e-mail display in Updates, Coach/Admin lists and Beta feedback surfaces.
- Restricted non-coach profile sync to the current user's own profile snapshot.
- Hardened Admin/Beta visibility so systemwide tester data remains Admin-only.
- Improved CloudStatus wording for connected, limited, offline and error states.
- Added contextual aria labels for notifications, Smart Coach notes, tasks and attendance actions.
- Added overflow guards for Updates, beta rows, chat bubbles and technical strings.
- Smoothed remaining visible German UI text issues for the external beta.
- Set version to `4.1.5`.

## 4.1.4

- Stabilized external beta readiness without adding new product features.
- Added idempotent Supabase migration `0017_external_beta_readiness_414.sql`.
- Added `competitions.course` and kept expected competition metadata columns compatible.
- Hardened authenticated profile self-read, insert and update policies for Supabase RLS.
- Made profile creation avoid overwriting existing role data during login sync.
- Improved mobile access to all `Mehr` areas with a card list on small viewports.
- Improved contextual aria labels for navigation, training, templates and Smart Coach actions.
- Cleaned remaining visible German text encoding issues.
- Set version to `4.1.4`.

## 4.1.3

- Added idempotent Supabase schema sync migration `0016_schema_sync_413.sql`.
- Covered missing beta/communication/club/results/external tables and `competitions.organizer`.
- Added safer CloudStatus handling for optional module sync failures.
- Kept app usable with local cache when optional Supabase modules fail.
- Set version to `4.1.3`.
- Verified production build.

## 4.1.2

- Improved profile sync fallback: profile timeouts now keep the app usable with local cache instead of forcing a hard Cloud error.
- Added `limited` CloudStatus state for "Cloud eingeschränkt" when the profile cannot be confirmed but the app remains usable.
- Added Supabase migration `0015_profile_sync_rls_hotfix.sql` so authenticated users can select, insert and update their own `profiles` row.
- Added explicit bottom-navigation aria labels.
- Set app version to `4.1.2`.
- Verified production build.

## 4.1.1

- Stabilized startup by showing cached user data immediately after session restore and guarding cloud/profile loading with timeouts.
- Added idempotent Supabase repair migration `0014_beta_stabilization_hotfix.sql` for optional beta, communication, club portal, task, attendance, attachment and Smart Coach tables.
- Fixed pure date weekday handling for Europe/Berlin to avoid UTC date shifts.
- Added mobile/tablet/desktop overflow guards for analysis, charts, result rows, grids and tables.
- Updated Heute accessibility with one visible `h1`.
- Added clearer aria labels for repeated dashboard action buttons.
- Cleaned visible German umlaut text while keeping stable internal data IDs.

## 4.1.0

- Introduced Dark Water Performance Design as the current visual direction.
- Updated central design tokens for darker water surfaces, cyan accents, calmer borders and softer shadows.
- Refined mobile bottom navigation for a flatter, more app-like iPhone/iPad feel.
- Improved Heute dashboard hierarchy with quieter hero, cards, motivation, training and communication surfaces.
- Unified card, button, badge, empty, error, offline and chat styling across existing views.
- Improved communication, training, analysis, results, profile and admin/beta surfaces through shared CSS rules.
- Updated PWA theme colors for the darker app shell.
- Added `docs/design-system.md` and `docs/dark-water-performance-design.md`.

## 4.0.0-beta

- Set version to `4.0.0-beta` and added visible Paddlio Beta hints.
- Reduced mobile bottom navigation to Heute, Training, Analyse, Kommunikation and Mehr.
- Added Beta feedback system with user-facing submission, own feedback list and Admin status workflow.
- Added Beta tester management for Admin users.
- Expanded Beta-Check with system, role, feature, mobile, feedback, documentation and RLS checkpoints.
- Added Beta test guide and known limitations in app and docs.
- Added Supabase migration `0013_beta_test_release.sql` for `beta_feedback` and `beta_testers` with RLS.
- Added cloud service, AuthProvider sync, migration sync and realtime hooks for Beta feedback/testers.
- Kept 4.0 as feature-freeze stabilization without Polar OAuth, Excel import, video analysis or redesign.

## 3.9

- Expanded competition results with richer run, source, ranking, gap and coach-note fields.
- Added result intelligence view for personal bests, boat-class distribution, penalty averages and beta-safe season comparison basics.
- Added import preparation for CSV, Excel, PDF, web and manual result sources through `result_imports`.
- Added Polar/external integration preparation with explicit no-frontend-secret architecture.
- Added external training sessions and basic load comparison in Analytics.
- Extended Smart Coach rules for race-week tapering context, result improvements, stale results, unlinked external sessions and load jumps.
- Added Admin Beta-Check with automatic/manual readiness items.
- Added Supabase migration `0012_results_polar_beta_readiness.sql`.
- Documented 3.9 in `docs/results-polar-beta-readiness.md`.

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
