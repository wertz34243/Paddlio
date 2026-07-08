# Paddlio 4.1.3 Schema Sync

Version 4.1.3 ergänzt eine zentrale idempotente Supabase-Migration:

`supabase/migrations/0016_schema_sync_413.sql`

## Zweck

Im Beta-Test hat die App optionale Tabellen abgefragt, die in der Live-Supabase-Datenbank teilweise noch nicht existierten. Dadurch entstanden PGRST/404-Fehler und CloudStatus konnte trotz schneller App-Initialisierung eingeschränkt oder falsch wirken.

## Ergaenzte Tabellen

- `club_settings`
- `group_messages`
- `club_posts`
- `club_messages`
- `direct_messages`
- `tasks`
- `club_documents`
- `task_assignments`
- `training_attendance`
- `file_attachments`
- `result_imports`
- `personal_bests`
- `external_training_sessions`
- `beta_readiness_checks`
- `beta_feedback`
- `external_connections`
- `beta_testers`
- `boats`
- `club_material`
- `club_events`
- `smart_coach_recommendations`

## Ergaenzte Spalte

- `competitions.organizer`

## Ausfuehrung

Die Migration ist mehrfach ausfuehrbar und löscht keine bestehenden Daten. Sie nutzt:

- `create table if not exists`
- `alter table add column if not exists`
- `create index if not exists`
- `drop policy if exists` vor neuen Basis-Policies

Fuehre den kompletten Inhalt der Migration im Supabase SQL Editor aus.

## Grenzen

Die Migration stabilisiert die Beta und verhindert fehlende Tabellen/Spalten-Fehler. Die Basis-RLS ist bewusst minimal für eingeloggte Nutzer gehalten und sollte vor produktiver Vereinsnutzung tabellenspezifisch weiter gehärtet werden.
