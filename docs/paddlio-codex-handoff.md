# Paddlio Codex Handoff

## Stand

- Datum/Uhrzeit: 2026-10-03 09:45 CEST
- Stabilitaetsblock: Zuverlaessige Persistenz fuer Ziele, persoenliches Material und Profil
- Status: IMPLEMENTIERT, AUF SUPABASE DEV ANGEWENDET, DEV-CLOUD-ROUNDTRIP UND REGRESSION GRUEN

## Root Cause

- Ziele wurden in `App.tsx` nur in den lokalen React-/PWA-Datenbestand geschrieben. `upsertCloudGoal()` wurde im sichtbaren Formularpfad nie aufgerufen; trotzdem meldete das Formular sofort `Ziel erstellt`.
- Persoenliches Material hatte denselben Fehler: Der App-Callback aktualisierte nur lokal und rief `upsertCloudMaterial()` nicht auf. Nach einem Cloud-Refresh war der Eintrag deshalb wieder verschwunden.
- Das Profil schrieb zwar die Kernspalten, DEV besass aber keine Spalte `profiles.profile_data`. Der Service fing den Schemafehler ab, wiederholte den Write ohne `profile_data` und meldete Erfolg. Dadurch gingen alle erweiterten Felder nach Reload verloren.
- `season_goals` besass nicht alle vom Formular verwendeten Spalten. Kategorie, Metrik, Richtung, Prioritaet, Startdatum und Notizen konnten daher nicht vollstaendig rundlaufen.
- Formulare unterschieden bislang nicht zwischen bestaetigtem Cloudwrite, sicher eingereihtem Offline-Write und nicht wiederholbarem Fehler.

## Aenderungen

- Ziele und Material schreiben jetzt vor der sichtbaren Erfolgsmeldung ueber die vorhandene user-scoped Cloud-/Offline-Queue-Architektur.
- Bei bestaetigtem Cloudwrite wird `synced`, bei Offline-/transientem Fehler `queued` geliefert. Nicht wiederholbare Fehler werden an das Formular weitergereicht; Eingaben bleiben stehen und es erscheint eine verstaendliche Meldung.
- Lokale Listen werden erst nach bestaetigtem Write oder erfolgreichem Queueing aktualisiert. Delete nutzt denselben Vertrag.
- Ziel-Cloudmapping speichert und liest alle sichtbaren Formularfelder.
- Profilwrites speichern das vollstaendige `UserProfile` in der geschuetzten eigenen Profilzeile und verschlucken fehlende Schemafelder nicht mehr still.
- Die separate Einstellungen-Seite wartet ebenfalls auf den bestaetigten Profilwrite und zeigt bei Fehlern keine falsche Erfolgsmeldung mehr.
- `athlete_id` fuer persoenliche Ziele und Material stammt aus dem aktiven Auth-Konto. Vereinsmaterial bleibt weiterhin im getrennten `club_material`-Bereich.
- Der Vereinsname aus `club_id` bleibt beim Laden kanonisch; ein Profilformular kann die sichere Club-Zuordnung nicht durch Freitext ersetzen.
- Mobile Formulare erhalten sichere Abstaende zu Appbar und Bottom-Navigation, vollbreite Controls und einen oberhalb der Bottom-Navigation haftenden Profil-Speicherbereich.

## Migration

- Neu: `supabase/migrations/20261003071613_reliable_goals_material_profile_persistence.sql`.
- Additiv hinzugefuegt: `profiles.profile_data` sowie `season_goals.category`, `metric`, `direction`, `priority`, `start_date`, `coach_note`, `athlete_note`.
- Zulaessige Zielwerte werden ueber vier Check-Constraints begrenzt.
- Kein Drop, kein Delete, keine Nutzdatenveraenderung und keine RLS-Lockerung.
- PostgREST-Schema-Reload ist enthalten.

## Supabase DEV Ergebnis

- Vor jedem mutierenden Datenbankschritt geprueftes Ziel: `nlllqsfdhfiwticrcrnp` (`paddlio-dev`, linked, ACTIVE_HEALTHY).
- Production `twlkhfbrrwjwppxinmpn` war nicht verknuepft und wurde nicht verwendet.
- Migration als einzelne Datei erfolgreich auf DEV ausgefuehrt und Version `20261003071613` als angewendet in der DEV-Migrationshistorie markiert.
- Verifiziert: alle acht neuen Spalten vorhanden.
- Verifiziert: RLS bleibt fuer `profiles`, `season_goals` und `materials` aktiv; bestehende Policies blieben erhalten.
- Echter Athlete-DEV-Test: Ziel und persoenliches Material erstellt, nach Reload aus DEV geladen und die ausschliesslich fuer den Test erzeugten Datensaetze anschliessend entfernt.
- Echter Athlete-DEV-Test: erweitertes Profilfeld per PATCH gespeichert, nach Reload aus DEV gelesen und anschliessend auf den vorherigen Testkontostand zurueckgesetzt.

## Betroffene Dateien

- `src/App.tsx`
- `src/lib/database.types.ts`
- `src/services/cloudWriteService.ts`
- `src/services/goalService.ts`
- `src/services/materialService.ts`
- `src/services/profileService.ts`
- `src/services/competitionService.ts`
- `src/services/journalService.ts`
- `src/services/trainingTemplateService.ts`
- `src/services/syncInfrastructure.test.ts`
- `src/services/persistenceServices.test.ts`
- `src/views/GoalsView.tsx`
- `src/views/EquipmentView.tsx`
- `src/views/ProfileView.tsx`
- `src/views/SettingsView.tsx`
- `src/styles.css`
- `tests/e2e/personal-persistence.spec.ts`
- `supabase/migrations/20261003071613_reliable_goals_material_profile_persistence.sql`

## Tests

- `npm.cmd run test`: 27 Dateien, 152/152 Tests bestanden.
- `npm.cmd run build`: erfolgreich, 186 Module; nur bestehender Chunk-Hinweis.
- `npm.cmd run check:beta`: Encoding, RLS, Security, Bundle, A11y und Beta-Blocker bestanden.
- `npm.cmd run test:e2e`: 46 bestanden, 28 vorgesehene Projekt-/Viewport-Skips, 0 Fehler.
- `npm.cmd run test:e2e:roles`: 9 bestanden, 1 vorgesehener Mobile-Projekt-Skip, 0 Fehler.
- Neue Regressionen pruefen bestaetigten/queued Cloudwrite, nicht wiederholbare Fehler, vollstaendigen Ziel-Roundtrip, Material-Owner, Profil- und Einstellungen-Payloads sowie echte DEV-Reloads.
- Der zuvor reparierte Gruppenchat-/Realtime-Test blieb gruen.

## Offene Punkte

- Physische Safari-Tests auf iPhone/iPad und ein echtes zweites Geraet sind lokal nicht automatisierbar. Playwright deckt kleine Phone-Viewports, Tablet-Layouts, Reload, Rollen und den Zwei-Session-Trainings-/Feedbackfluss ab.
- Das Profilbild wird in der bestehenden Architektur als Data-URL in der eigenen Profilzeile gespeichert. Die Zuordnung ist RLS-geschuetzt und getestet; fuer groessere Bilder waere spaeter eine separate Storage-Optimierung sinnvoll, aber kein Blocker dieses Fixes.
- Nach DEV-Deploy manuell pruefen: Ziel erstellen/bearbeiten; Material erstellen/bearbeiten; alle Profilfelder und Profilbild speichern; App schliessen/oeffnen; Logout/Login; zweites Geraet.

## Naechste sinnvolle Aufgabe

- Manueller DEV-Praxistest auf iPhone, iPad und PC fuer Ziele, Material, Profilbild und App-Einstellungen. Nur bei einem reproduzierbaren Restbefund einen neuen gezielten Stabilitaetsblock starten.

## Sicherheitsbestaetigung

- Ausschliesslich Branch `develop` verwendet.
- Ausschliesslich Supabase DEV `nlllqsfdhfiwticrcrnp` veraendert.
- `main` unveraendert.
- Production Supabase `twlkhfbrrwjwppxinmpn` unveraendert.

## Commit und Pushstatus

- Implementierungscommit: wird nach Abschluss dieses Handoffs eingetragen.
- Pushstatus: ausstehend bis zum gezielten Commit.
