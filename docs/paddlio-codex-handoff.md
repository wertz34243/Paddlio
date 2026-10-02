# Paddlio Codex Handoff

## Stand

- Datum/Uhrzeit: 2026-10-02 12:10 CEST
- Stabilitaetsblock: Stabile Inhalte bei lokalen Aenderungen, Cloud-Refresh und Realtime
- Status: IMPLEMENTIERT, AUF SUPABASE DEV ANGEWENDET, REGRESSION GRUEN

## Root Cause

- `AuthProvider.refreshCloudData()` veroeffentlichte waehrend eines laufenden Cloud-Refreshs zwei unvollstaendige Zwischenstaende. Dabei wurden noch nicht geladene Gruppen, Mitglieder und Nachrichten als erfolgreiche leere Cloud-Antwort behandelt. Sichtbare Daten wechselten deshalb kurzzeitig oder dauerhaft auf leere Zustaende.
- Realtime-Ereignisse waehrend eines laufenden Refreshs wurden verworfen. Ausserdem konnte eine aeltere asynchrone Cloud-Antwort einen neueren optimistischen lokalen Stand ueberschreiben.
- Die bestehende `profiles`-RLS liefert nicht fuer jede berechtigte Chatbeziehung ein vollstaendiges Gegenprofil. Nach Verlust des lokalen Identitaetscaches blieb deshalb nur ein generischer Kontaktname.
- Auf kleinen Phone-Viewports lag die sticky Nachrichtenleiste zu nah an der unteren Navigation.

## Aenderungen

- Der bestehende aktuelle Account-Snapshot bleibt sichtbar, bis ein vollstaendiger Refresh vorliegt. Erfolgreich leere Cloud-Antworten bleiben weiterhin gueltige Wahrheit; nur noch nicht geladene bzw. fehlgeschlagene Bereiche verwenden den Cache.
- Lokale Datenrevisionen verhindern, dass aeltere Cloud-Antworten neuere lokale Aenderungen ueberschreiben.
- Realtime-Ereignisse waehrend eines Refreshs werden vorgemerkt und unmittelbar danach durch einen neuen Refresh verarbeitet.
- Ein minimales, autorisiertes Kontaktverzeichnis liefert fuer eigene Chatpartner und gemeinsame Gruppen stabile Namen und Rollen, ohne E-Mail oder erweiterte Profildaten offenzulegen.
- Die mobile Chatleiste besitzt Safe-Area- und Bottom-Navigation-Abstand.
- Neue Unit- und E2E-Regressionen pruefen Accountwechsel, konkurrierende lokale/Cloud-Staende, stabile Kontakt-/Gruppennamen nach Reload und die mobile Chatleiste.

## Migration

- Neu: `supabase/migrations/20261002061219_stable_realtime_content_state.sql`.
- Erstellt `public.paddlio_visible_contact_profiles_20261002()` als eingeschraenkten `SECURITY DEFINER` RPC mit leerem `search_path`.
- Ausfuehrung nur fuer `authenticated`; `anon` und `public` sind entzogen.
- Additiver partieller Index fuer aktive Gruppenmitgliedschaften.
- PostgREST-Schema-Reload enthalten.
- Keine Tabellen gedroppt und keine Nutzdaten geloescht.

## Supabase DEV Ergebnis

- Vor jedem SQL-Schritt geprueftes Ziel: ausschliesslich `nlllqsfdhfiwticrcrnp` (`paddlio-dev`, linked, ACTIVE_HEALTHY).
- Production `twlkhfbrrwjwppxinmpn` war nicht verknuepft und wurde nicht verwendet.
- Migration gezielt als einzelne SQL-Datei auf DEV angewendet; kein unsicherer historischer `db push`.
- Verifiziert: Funktion vorhanden, `SECURITY DEFINER = true`, `search_path = ''`, `authenticated_execute = true`, `anon_execute = false`.
- Verifiziert: Index `idx_group_memberships_user_group_active_20261002` vorhanden.

## Betroffene Dateien

- `src/auth/AuthProvider.tsx`
- `src/services/cloudReadState.ts`
- `src/services/profileService.ts`
- `src/services/profileService.test.ts`
- `src/services/syncInfrastructure.test.ts`
- `src/styles.css`
- `tests/e2e/mobile-layout.spec.ts`
- `supabase/migrations/20261002061219_stable_realtime_content_state.sql`

## Tests

- `npm.cmd run test`: 26 Dateien, 148/148 Tests bestanden.
- `npm.cmd run build`: erfolgreich, 186 Module; nur bestehender Chunk-Hinweis.
- `npm.cmd run check:beta`: Encoding, RLS, Security, Bundle, A11y und Beta-Blocker bestanden.
- Neuer Mobile-Kommunikationstest: bestanden; keine DEV-Daten erzeugt oder geloescht.
- `npm.cmd run test:e2e`: 43 bestanden, 25 vorgesehene Projekt-/Viewport-Skips, 0 Fehler.
- `npm.cmd run test:e2e:roles`: 9 bestanden, 1 vorgesehener Mobile-Projekt-Skip, 0 Fehler.
- Der erste Gesamtlauf hatte einmalig einen bestehenden Tablet-Builder-Screenshot-Timeout. Der isolierte Test und der komplette Wiederholungslauf waren gruen.

## Offene Punkte

- Der konkrete urspruengliche iPhone-Ablauf sollte nach dem DEV-Deploy einmal manuell wiederholt werden: Gruppennachricht senden, Seite offen lassen, Direktkontakte beobachten und anschliessend neu laden.
- Ein echter Safari-Test auf physischem iPhone/iPad ist automatisiert nicht moeglich; der Playwright-Mobile-Test deckt Layout, Reload und stabilen Datenstand ab.
- Keine bekannten blockierenden Code-, Schema-, Sync- oder RLS-Fehler aus diesem Block.

## Naechste sinnvolle Aufgabe

- Manueller DEV-Praxistest auf iPhone und iPad fuer Gruppenchat/Direktnachrichten; danach nur bei einem reproduzierbaren Restbefund weiterarbeiten.

## Sicherheitsbestaetigung

- Ausschliesslich Branch `develop` verwendet.
- Ausschliesslich Supabase DEV `nlllqsfdhfiwticrcrnp` veraendert.
- `main` unveraendert.
- Production Supabase `twlkhfbrrwjwppxinmpn` unveraendert.

## Commit und Pushstatus

- Implementierungscommit: `dbc29d8` (`Stabilize realtime content refreshes`).
- Pushstatus: erfolgreich auf `origin/develop`.
- Dieser finale Handoff-Stand folgt in einem separaten Dokumentationscommit.
