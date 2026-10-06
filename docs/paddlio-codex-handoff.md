# Paddlio Codex Handoff

## Stand

- Datum/Uhrzeit: 2026-10-06 08:27 CEST
- Stabilitaetsblock: Letzter Release-Blocker Trainingseinheiten-Import
- Status: ROOT CAUSE BEHOBEN, DEV VERIFIZIERT, TESTS GRUEN

## Root Cause

- Der Import und Supabase-Write funktionierten bereits: DEV-Logs zeigen erfolgreiche `POST 201` auf `training_journal_entries`; nachfolgende Lesezugriffe antworteten mit `GET 200`.
- In DEV sind importtypische Journalzeilen mit Titel/Trainingsart/Bootsklasse vorhanden.
- Die sichtbare Restursache lag im Routing: Phone verwendete `TrainingJournalView`, Tablet und Desktop leiteten den Tab `Journal` dagegen in `PlanView` mit `initialWorkflowTab="feedback"` um.
- Diese Feedbackansicht baut ausschliesslich auf Kalender-/Plan-Eintraegen auf. Freie importierte Journalzeilen ohne `trainingPlanEntryId` konnten dort nie erscheinen.
- `TrainingSession` ist weiterhin der lokale Begleitdatensatz. Cloud-Source-of-Truth fuer durchgefuehrte/importierte Einheiten ist bewusst `training_journal_entries`; dessen Metadaten reichen fuer Reload und Zweitgeraetedarstellung aus.

## Aenderungen

- Der Tab `Journal` rendert jetzt auf Phone, Tablet und Desktop einheitlich `TrainingJournalView`.
- Die Ansicht verwendet einheitlich `activeData.journal`, `activeData.training` und den sichtbaren Planbestand.
- Cloud-Mapping von Journal-Metadaten ist direkt testbar und fuer Reload abgesichert.
- Ein importierter freier Journaleintrag wird auch ohne lokale Session und ohne Plan-Verknuepfung angezeigt.
- Bestehende manuelle Journalzeilen bleiben unveraendert sichtbar.
- Bestehende Desktop-/Tablet-E2E-Erwartungen wurden auf die echte Journalansicht aktualisiert.
- Neuer E2E-Test prueft die cloudbasierte Journalansicht bei iPhone-, iPad- und Desktop-Viewport.

## Migrationen / Supabase DEV

- Keine neue Migration erforderlich.
- Ausschliesslich Supabase DEV `nlllqsfdhfiwticrcrnp` gelesen; Production wurde nicht verwendet.
- Verifiziert: `training_journal_entries` besitzt `id`, `athlete_id`, `training_id`, `training_plan_entry_id`, `date`, `actual_duration_minutes`, `title`, `training_type` und `boat_class` mit passenden Typen.
- Verifiziert: RLS aktiv, zwei Journal-Policies vorhanden, Realtime-Publication aktiv.
- Verifiziert: 15 Journalzeilen vorhanden, davon 3 mit Importmetadaten und deterministischer Importidentitaet. Keine Nutzdaten wurden veraendert oder geloescht.

## Betroffene Dateien

- `src/App.tsx`
- `src/services/journalService.ts`
- `src/services/journalService.test.ts`
- `src/views/TrainingJournalView.test.tsx`
- `tests/e2e/journal-import-visibility.spec.ts`
- `tests/e2e/desktop-training-workspace.spec.ts`
- `tests/e2e/tablet-real-ipad-polish.spec.ts`
- `tests/e2e/tablet-training-consolidation.spec.ts`
- `docs/paddlio-codex-handoff.md`
- `docs/paddlio-codex-next.md`

## Tests

- Unit/Integration: 29 Dateien, 169/169 Tests bestanden.
- Build: erfolgreich; nur bestehender Chunk-Groessenhinweis.
- `check:beta`: Encoding, RLS, Security, Bundle, A11y und Beta bestanden.
- Journal-E2E: iPhone, iPad und Desktop, 3/3 bestanden.
- DEV-Cloud: erfolgreicher Write/Read-Pfad anhand realer Logs und vorhandener Importzeilen bestaetigt.

## Commit / Push

- Implementierungscommit: `09f85c4` (`Show imported sessions in journal across devices`).
- Handoff-Commit folgt separat.
- Pushstatus wird nach Handoff-Commit aktualisiert.

## Offene Punkte / manueller Nachtest

- Nach DEV-Deploy einmal dieselbe Trainingseinheiten-Datei erneut importieren: der Importbericht muss den Datensatz als Duplikat ueberspringen.
- Journal auf iPhone, iPad und PC oeffnen, danach Reload sowie Ab-/Anmeldung pruefen.
- Auf einem zweiten Geraet denselben Journaleintrag kontrollieren.
- Keine bekannten technischen Restfehler im Trainingseinheiten-Importpfad.

## Grenzen bestaetigt

- Nur Branch `develop` verwendet.
- Nur Supabase DEV `nlllqsfdhfiwticrcrnp` gelesen.
- `main` unveraendert.
- Production Supabase `twlkhfbrrwjwppxinmpn` unveraendert.
- Keine Nutzdaten geloescht oder zurueckgesetzt.
