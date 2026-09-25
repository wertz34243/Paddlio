# Paddlio Codex Handoff

## Stand

- Datum/Uhrzeit: 2026-09-25 09:38 CEST
- Aktueller Stabilitaetsblock: DEV-Schema-Abgleich und Wettbewerbsbereich
- Status: Block abgeschlossen und auf `develop` gepusht

## Root Cause

Der Fehler `competitions lesen: 42703` entstand nicht in `competitions`, sondern in der verknuepften Tabelle `competition_results`. Die vorherige DEV-Reconciliation 0043 hatte nur einen Teil der historischen Schema-Erweiterungen aus Migration 0012 nachgezogen. Der aktive `competitionService` las und schrieb zehn weitere Spalten, die auf Supabase DEV fehlten.

## Aenderungen

- Fehlende Wettbewerbsfelder fuer Altersklasse, Ranking, Starterfeld, Zeitabstaende, Quelle, Coach-Notiz und Tombstone ergaenzt.
- Index fuer `competition_results.deleted_at` ergaenzt.
- RLS unveraendert aktiv gelassen.
- PostgREST-Schema neu geladen.
- Produktweite Sync-Inventur um den verifizierten Wettbewerbsfix ergaenzt.
- Alle 60 derzeit verwendeten App-Tabellen per DEV-REST-Smoke-Test geprueft.

## Migrationen

- `supabase/migrations/20260925073000_competition_results_schema_reconciliation.sql`
- Additiv und idempotent durch `add column if not exists` und `create index if not exists`.
- Keine Tabellen oder Nutzdaten geloescht.

## Supabase DEV Ergebnis

- Zielprojekt vor jedem Datenbankbefehl verifiziert: `nlllqsfdhfiwticrcrnp`.
- Migration direkt und erfolgreich auf DEV angewendet.
- Alle zehn erwarteten Spalten sind vorhanden.
- RLS auf `competition_results` ist aktiv.
- Alle 60 aktiven App-Tabellen sind ueber PostgREST erreichbar; keine `PGRST205` im Tabellen-Smoke-Test.
- Die reale verschachtelte Abfrage `competition_results` mit `competitions(...)` antwortet mit HTTP 200 statt `42703`.

## Betroffene Tabellen, Policies und Funktionen

- Tabelle: `public.competition_results`
- Verknuepfte Tabelle: `public.competitions`
- Bestehende Policies bleiben aktiv:
  - `competition_results_select_own_club_admin_0043`
  - `competition_results_write_own_club_admin_0043`
- Bestehende Rollenhelfer bleiben unveraendert:
  - `public.paddlio_is_admin_415()`
  - `public.paddlio_user_has_club_role_0024(...)`

## Tests

- `npm.cmd run build`: erfolgreich
- `npm.cmd run check:beta`: erfolgreich
- `npm.cmd run test`: 117 von 117 Tests erfolgreich
- `git diff --check`: erfolgreich
- DEV-REST-Smoke-Test: 60 Tabellen geprueft, 0 Fehler
- Verschachtelte Wettbewerbsabfrage: HTTP 200

## Commit und Pushstatus

- Implementierungscommit: `d9b95b612522f4eaa277843dc92e044c97f0bc54`
- Pushstatus: erfolgreich auf `origin/develop`
- Diese Datei wird in einem separaten Handoff-Commit auf `develop` versioniert.

## Offene Fehler und Nachweise

- Keine bekannten verbleibenden `PGRST205` fuer die 60 inventarisierten Tabellen.
- Kein bekannter verbleibender `42703` im Wettbewerbs-Lesepfad.
- Rollenbezogene Wettbewerbs-Schreibtests mit echten Admin-, Coach- und Athlete-Sessions stehen noch aus.
- Echter Multi-Geraete-Test steht noch aus.
- Die Remote-Migrationshistorie des DEV-Projekts ist fuer aeltere Migrationen nicht vollstaendig gepflegt; das aktive Schema selbst wurde direkt verifiziert.

## Naechste sinnvolle Aufgabe

Globale Start-Synchronisation rollen- und kontextabhaengig machen. Unnoetige optionale Requests fuer Academy, Beta, Vereinsportal und Analyse reduzieren und danach Realtime-Lebenszyklus sowie Admin-/Coach-/Athlete-Datengrenzen pruefen.

## Blocker

Keine aktuellen technischen Blocker. Fuer echte rollenbezogene Cloud- und Multi-Geraete-Tests werden gueltige DEV-Testkonten beziehungsweise bestehende authentifizierte Sessions benoetigt.

## Sicherheitsbestaetigung

- Ausschliesslich Branch `develop` verwendet.
- Ausschliesslich Supabase DEV `nlllqsfdhfiwticrcrnp` verwendet.
- `main` unveraendert.
- Production Supabase `twlkhfbrrwjwppxinmpn` unveraendert.
