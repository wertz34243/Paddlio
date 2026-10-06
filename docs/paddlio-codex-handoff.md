# Paddlio Codex Handoff

## Stand

- Datum/Uhrzeit: 2026-10-06 07:16 CEST
- Stabilitaetsblock: Zeitwahl fuer neue Trainings auf 15-Minuten-Raster
- Status: IMPLEMENTIERT UND AUTOMATISIERT GEPRUEFT

## Root Cause

- Die mobile Vorlagenplanung addierte oder subtrahierte immer exakt 15 Minuten. Dadurch wurde aus der minutengenauen initialen Geraetezeit `17:07` faelschlich `17:22` beziehungsweise `16:52`.
- Die minutengenaue lokale Initialisierung selbst war korrekt. Bearbeitungsformulare lesen bereits den gespeicherten Wert und waren nicht Ursache des Problems.

## Aenderungen

- Gemeinsame Funktion `shiftTimeOnQuarterHourGrid()` eingefuehrt.
- Bei ungeraden Minuten springt `+15` auf den naechsten und `-15` auf den vorherigen Viertelstundenpunkt.
- Von bereits ausgerichteten Zeiten bewegen die Buttons weiter um volle 15 Minuten.
- Tagesgrenzen werden korrekt behandelt (`23:53 +15 -> 00:00`, `00:00 -15 -> 23:45`).
- Neue Vorlagenverwendungen und individuelle Trainingsentwuerfe behalten als Startwert die exakte lokale Geraetezeit.
- Im individuellen Trainingsentwurf werden `time` und `startTime` aus demselben Zeitwert initialisiert.
- Bestehende Trainingseintraege und deren gespeicherte Uhrzeiten werden beim Bearbeiten nicht automatisch gerundet.

## Migrationen / Supabase DEV

- Keine Migration erforderlich.
- Keine Datenbankbefehle ausgefuehrt.
- Supabase DEV `nlllqsfdhfiwticrcrnp` wurde nicht veraendert.

## Betroffene Dateien

- `src/lib/dateOnly.ts`
- `src/lib/dateOnly.test.ts`
- `src/App.tsx`
- `src/views/PlanView.tsx`
- `tests/e2e/mobile-layout.spec.ts`
- `docs/paddlio-codex-handoff.md`
- `docs/paddlio-codex-next.md`

## Tests

- `npm.cmd run test -- src/lib/dateOnly.test.ts`: 28 Dateien, 166/166 Tests bestanden.
- `npm.cmd run build`: erfolgreich; nur bestehender Chunk-Groessenhinweis.
- `npm.cmd run check:beta`: Encoding, RLS, Security, Bundle, A11y und Beta bestanden.
- Relevanter Playwright-Test `authenticated coach phone templates require confirmation before insert`: 1/1 bestanden.
- Gesamtes `mobile-layout.spec.ts`: 5 bestanden, 6 vorgesehene Projekt-Skips, 1 unabhaengiger bestehender Datenfehler. Der Feedback-Test fand im DEV-Kalender keine `.master-training-block-main`; der Zeitwahltest war gruen.

## Commit / Push

- Implementierungscommit: `25efc0f` (`Align training time controls to quarter hours`).
- Pushstatus: wird nach Commit auf `origin/develop` aktualisiert.

## Offene Punkte

- Manueller Kurztest auf iPhone/iPad/PC: neuen Eintrag oeffnen, exakte lokale Startzeit pruefen, danach `+15` und `-15` pruefen.
- Der datenabhaengige mobile Feedback-E2E-Test benoetigt fuer einen isolierten Lauf eine vorhandene Kalender-Trainingseinheit; dies betrifft die Zeitwahl nicht.

## Naechste sinnvolle Aufgabe

- Erst nach neuem Auftrag. Fuer diesen Block sind keine weiteren Produkt- oder Schemaaenderungen erforderlich.

## Grenzen bestaetigt

- Nur Branch `develop` verwendet.
- Keine Production-Daten oder Production Supabase `twlkhfbrrwjwppxinmpn` veraendert.
- `main` unveraendert.
