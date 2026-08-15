# Role E2E Fix

## Problem

Der Coach-Rollen-E2E war nicht stabil, weil Testdaten und UI-Erwartungen nicht mehr zur aktuellen App passten:

- Der Trainingsbereich nutzt im Tab inzwischen `Vorlagen` statt `Plan`.
- Die Athlete-Auswahl verwendete alte Namen aus früheren Testdaten.
- ClubAdmin war nicht separat als Rolle im E2E abgedeckt.
- Mobile-Layout-Tests liefen doppelt im Desktop-Projekt und verursachten zwei Timeouts.

## Anpassungen

- `openTrainingPlan()` akzeptiert `Vorlagen` und alte `Plan`-Benennung.
- Der Training-Button wird per aktueller und alter Beschriftung gefunden.
- Athlete-Zielauswahl nutzt die Development-Seed-Namen `Mia Test`, `Noah Test`, `Lea Test`.
- ClubAdmin bekommt einen eigenen E2E-Test.
- Mobile Layout Guards laufen nur noch im `mobile-edge`-Projekt.

## Ergebnis

- `npm.cmd run test:e2e`: 6 passed, 12 skipped.
- `npm.cmd run test:e2e:roles`: 10 skipped.

Die Skips entstehen ausschließlich, weil in dieser Shell keine `PADDLIO_E2E_*`-Variablen gesetzt sind. Die Teststruktur ist korrigiert; ein echter Rollenlauf benötigt die Development-E2E-Variablen.

## Nachpruefung mit Development-Variablen

Ein authentifizierter Lauf gegen `https://nlllqsfdhfiwticrcrnp.supabase.co` zeigt:

- Athlete-Rolle: bestanden
- Coach-Rolle: blockiert

Der Coach-Login funktioniert, aber `dev.coach@paddlio.test` wird in der App als Sportler erkannt. Der App-Code uebersetzt `Coach` korrekt zu `coach`; die Ursache liegt daher im Development-Profil/Testdatenstand. Das Coach-Profil muss in `profiles.roles` die Rolle `Coach` enthalten, bevor Coach-, ClubAdmin-/Admin- und Zwei-Geraete-E2E als gruen bewertet werden koennen.
