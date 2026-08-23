# Tablet Final QA

## Geprüfte Zustände

Screenshots liegen unter:

`docs/ui/paddlio-one/tablet-calendar-builder-final/`

Erzeugt wurden:

- Kalender Woche Landscape
- Kalender mit Vorlagenpanel
- Training Detail
- Template Quick Edit
- Monatsansicht
- Tablet Portrait
- Builder leer
- Builder mit Gruppe
- Builder aus Vorlage
- Builder Live-Vorschau
- Builder Abschnitte
- Builder nach Speichern

## Automatisierte Prüfung

Gezielter Lauf:

`npm.cmd exec -- playwright test tests/e2e/tablet-calendar-builder-final.spec.ts --project=edge`

Ergebnis:

- 2 passed

Pflichtläufe:

- `npm.cmd run test`: 14 Dateien, 62 Tests passed
- `npm.cmd run build`: passed, bekannte Vite-Chunk-Warnung
- `npm.cmd run check:beta`: passed
- `npm.cmd run test:e2e:roles`: 9 passed, 1 bewusst geskippt im mobilen Two-Device-Projekt
- `npm.cmd run test:e2e`: 21 passed, 9 viewport-/projektspezifische Skips

## Bekannte Einschränkungen

- Vite meldet weiterhin die bekannte Chunk-Warnung für `xlsx` und den Hauptchunk.
- Desktop ist nicht final optimiert.
- Wochen-/Saisonvorlagen nutzen weiterhin bestehende Preview-/Einfügepfade; keine neue Datenmigration.

## Vorläufige Bewertung

- Tablet Kalender: 90/100
- Wochenansicht: 90/100
- Monatsansicht: 88/100
- Vorlagen: 90/100
- Drag & Drop / Quick Edit: 88/100
- Training Detail: 88/100
- Training erstellen: 91/100
- Live Preview: 90/100
- Tablet Portrait: 86/100
- Tablet Landscape: 91/100
- Trainerworkflow: 90/100
- Designkonsistenz: 90/100
- Gesamt Tablet UX: 90/100
