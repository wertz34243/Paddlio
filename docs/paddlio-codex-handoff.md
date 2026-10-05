# Paddlio Codex Handoff

## Stand

- Datum/Uhrzeit: 2026-10-05 16:09 CEST
- Stabilitaetsblock: Paddlio 5.0 letzter Import- und Dark-Mode-Release-Fix
- Status: IMPLEMENTIERT, AUF SUPABASE DEV ANGEWENDET UND AUTOMATISIERT GRUEN

## Root Cause

- Importierte Trainingseinheiten erhielten lokale Praefix-IDs, obwohl `training_journal_entries.id` und `training_id` UUIDs erwarten. Titel, Trainingsart und Bootsklasse existierten zudem nur in der lokalen TrainingSession; nach Cloud-Reload konnte das Journal die Einheit nicht vollstaendig rekonstruieren.
- Wettkampfergebnisse nutzten fuer Wettkampf und Ergebnis voneinander abweichende beziehungsweise geraetelokal gemappte IDs. Ein erneutes Speichern konnte eine neue Cloud-Wettkampf-ID erzeugen. Ein allein importierter zweiter Lauf wurde bei der Bestzeitberechnung durch den leeren ersten Lauf zu 0 Sekunden verfaelscht.
- Startlisten akzeptierten bei mehreren gleichnamigen Wettkaempfen ohne Datum den ersten Treffer. Die Zuordnung war nicht eindeutig.
- Die Profileinstellung `darkMode` wurde am authentifizierten App-Root nicht als Theme gesetzt. Native Select-/Option-Flaechen konnten deshalb in einer unpassenden Systemdarstellung erscheinen.
- Drei E2E-Szenarien setzten zufaellig vorhandene Kalenderdaten voraus und liefen bei leerem DEV-Kalender in Timeouts.

## Aenderungen

- Trainingseinheiten erhalten eine deterministische, gueltige UUID. Ein erneuter Import desselben Inhalts wird auch nach Cloud-Reload erkannt.
- Journalzeilen speichern optional Titel, Trainingsart und Bootsklasse. Die Journalansicht nutzt diese Cloud-Metadaten ohne geraetelokale TrainingSession.
- Importierte Wettkaempfe erhalten stabile UUIDs. `competition_results.id` entspricht der kanonischen Wettkampf-ID.
- Lauf 1 und Lauf 2 werden getrennt gemappt; die Bestzeit verwendet nur tatsaechlich gefahrene Laeufe.
- Competition- und Startlistenimporte verwenden die kanonische Cloud-Vereins-UUID.
- Gleichnamige Wettkaempfe ohne eindeutiges Datum blockieren den Startlistenimport mit verstaendlicher Meldung.
- Der App-Root setzt `data-po-theme=dark|light`. Selects, Options, Hover-, Fokus- und Disabled-Zustaende nutzen konsistente Theme-Farben.
- Kalender-E2E-Tests warten auf den geladenen Zustand und erzeugen bei wirklich leerem Desktop-/Tablet-Kalender ueber den bestehenden Vorlagenflow eine Einheit.

## Migration

- Neu: `supabase/migrations/20261005134123_import_journal_metadata_500.sql`.
- Ergaenzt `public.training_journal_entries` additiv um nullable `title`, `training_type` und `boat_class`.
- Ergaenzt einen K1/C1-Check fuer `boat_class`.
- Keine Tabelle gedroppt, keine Nutzdaten geloescht, RLS nicht deaktiviert.
- PostgREST-Schema-Reload enthalten.

## Supabase DEV Ergebnis

- Vor jedem Datenbankbefehl Zielprojekt geprueft: `nlllqsfdhfiwticrcrnp`.
- Migration erfolgreich direkt auf Supabase DEV angewendet und Version `20261005134123` als angewendet markiert.
- Verifiziert: alle drei Spalten vorhanden und nullable.
- Verifiziert: Constraint `training_journal_entries_boat_class_500` aktiv.
- Verifiziert: RLS weiterhin aktiv und Tabelle weiterhin in `supabase_realtime`.
- Production `twlkhfbrrwjwppxinmpn` wurde nicht verwendet.

## Betroffene Dateien

- `src/App.tsx`
- `src/domain/types.ts`
- `src/features/importExport/engine.ts` und Test
- `src/services/competitionService.ts` und Test
- `src/services/importPersistenceService.ts` und Test
- `src/services/journalService.ts` und Test
- `src/styles.css`
- `src/views/TrainingJournalView.tsx`
- `tests/e2e/helpers/calendar.ts`
- drei Kalender-/Tablet-E2E-Spezifikationen
- `supabase/migrations/20261005134123_import_journal_metadata_500.sql`

## Importziele

| Importtyp | Ziel |
|---|---|
| Trainingsplan | `training_plan_items` / Kalender |
| Trainingseinheiten | `training_journal_entries` / Trainingstagebuch |
| Wettkampfergebnisse | `competitions` + `competition_results` / Ergebnisse |
| Sportlerliste | `imported_club_members` / Sportlerverwaltung |
| Startliste | `competition_start_entries` / zugeordneter Wettkampf |
| Vereinsmitglieder | `imported_club_members` / Mitgliederverwaltung |
| Gruppen | `training_groups` / Gruppenverwaltung |
| Materialliste | `materials` / Materialverwaltung |

## Tests

- `npm.cmd audit`: 0 Schwachstellen.
- `npm.cmd run test`: 28 Dateien, 162/162 bestanden.
- `npm.cmd run build`: erfolgreich; nur bestehender Chunk-Groessenhinweis.
- Encoding, RLS, Bundle, A11y und Beta: bestanden.
- `npm.cmd run test:e2e`: 46 bestanden, 28 vorgesehene Projekt-/Viewport-Skips, 0 Fehler.
- `npm.cmd run test:e2e:roles`: 9 bestanden, 1 vorgesehener Mobile-Projekt-Skip, 0 Fehler.
- CSV, XLS und XLSX sowie alle acht Importtypen bleiben in Parser-/Engine-/Persistenztests abgedeckt.

## Offene Punkte und manueller Nachtest

- Ein realer Import wurde nicht in bestehende DEV-Testkonten geschrieben, um keine dauerhaften Testdatensaetze einzustreuen. Cloud-Schema, Persistenzpayloads, Reload-Semantik und generische Zwei-Geraete-Synchronisierung sind automatisiert geprueft.
- Tobias sollte nach DEV-Deploy je eine fiktive CSV/XLSX-Datei fuer Trainingseinheiten, Wettkampfergebnisse und Startliste importieren und auf iPhone, iPad sowie PC Zielansicht, Reload und zweites Geraet pruefen.
- Bei identischem Wettkampfnamen muss die Startliste das Datum enthalten.
- Native iOS-Auswahlpicker werden vom Betriebssystem gerendert. Theme und Kontrast sind im DOM gesetzt; finale Safari-/PWA-Sichtpruefung bleibt manuell.

## Naechste sinnvolle Aufgabe

- DEV deployen und den beschriebenen manuellen Funktionsblock abschliessen. Bei Erfolg kann Schritt 3 (Sicherheit, Rechtliches und Webseiten) beginnen; vorher keine neuen Produktfeatures.

## Sicherheitsbestaetigung

- Ausschliesslich Branch `develop`.
- Ausschliesslich Supabase DEV `nlllqsfdhfiwticrcrnp` veraendert.
- `main` unveraendert.
- Production Supabase `twlkhfbrrwjwppxinmpn` unveraendert.
- Keine vorhandenen Nutzdaten geloescht.

## Commit und Pushstatus

- Implementierungscommit: `abadfcd` (`Fix imported training and competition persistence`).
- Handoff-Commit: wird mit diesem Bericht erstellt.
- Pushstatus: ausstehend bis zum Handoff-Commit.

