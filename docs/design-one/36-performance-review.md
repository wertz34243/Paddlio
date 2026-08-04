# Paddlio One - Performance Review

Stand: 2026-08-04  
Branch: `develop`

## Prüfresultate

Ausgeführt:

- `npm.cmd run build`: bestanden.
- `npm.cmd run check:beta`: bestanden.
- `npm.cmd run test`: bestanden.
- `npm.cmd run test:e2e`: bestanden mit 4 Public-Smoke-Tests, 8 Rollen-/Sync-Tests übersprungen.
- `npm.cmd run test:e2e:roles`: 8 Tests übersprungen.

## Bundle

| Datei | Größe | gzip | Bewertung |
|---|---:|---:|---|
| Haupt-JS | 623.12 kB | 169.42 kB | hoch, aber Budget grün |
| CSS | 160.06 kB | 28.95 kB | zu groß für dauerhaftes Wachstum |
| XLSX | 500.06 kB | 163.12 kB | groß, aber eigener Chunk |
| Supabase | 213.62 kB | 55.17 kB | erwartbar |
| TrainingCalendarView | 37.17 kB | 10.42 kB | akzeptabel als lazy Feature |
| CoachView | 39.95 kB | 9.24 kB | akzeptabel als lazy Feature |

## Bewertung

Performance-Bewertung: **70 / 100**

Die App baut erfolgreich und das Projektbudget akzeptiert den aktuellen Stand. Trotzdem zeigen Haupt-JS und CSS, dass Paddlio in eine Wartungs- und Ladezeitgrenze hineinläuft. Der Hauptchunk ist nach wie vor groß. CSS ist besonders auffällig, weil viele alte und neue Designschichten parallel existieren.

## Stärken

- Vite-Build ist stabil.
- Große Featurebereiche wie Akademie, Analysezentrum, Coach, Import/Export, Polar und Kalender werden teilweise lazy geladen.
- XLSX liegt nicht im Haupt-JS.
- Bundle-Budget existiert und läuft im Beta-Check.
- Unit-Tests laufen schnell.

## Risiken

- Haupt-JS mit über 600 kB minified ist für Phone weiter hoch.
- CSS mit 160 kB deutet auf zu viele parallele Layoutsysteme hin.
- App.tsx enthält viel Orchestrierung und viele direkte Imports.
- Einige Kernviews sind sehr groß:
  - `PlanView.tsx`: ca. 105 kB.
  - `CoachView.tsx`: ca. 65 kB.
  - `TrainingCalendarView.tsx`: ca. 65 kB.
  - `ClubPortalView.tsx`: ca. 29 kB.
  - `CommunicationView.tsx`: ca. 27 kB.
- Weitere Features könnten den Hauptchunk wieder erhöhen, wenn sie direkt importiert werden.

## Daten- und Sync-Performance

Positiv:

- Es gibt Syncstatus und Cloudstatus.
- Lokale Daten werden gefiltert, zum Beispiel gelöschte Trainings nicht aktiv angezeigt.
- Realtime und Sync wurden in früheren Phasen bereits adressiert.

Offen:

- Der echte Zwei-Geräte-E2E war in diesem Lauf nicht aktiv.
- Es fehlt im Review ein messbarer Vergleich der initialen Supabase-Requests.
- Offline-/Reconnect-Verhalten ist nicht mit aktiven Credentials nachgewiesen.

## Empfehlungen

Priorität A:

- App.tsx weiter in AppShell, Route-Orchestrierung, TrainingRoutes, MoreRoutes und Navigation teilen.
- CSS konsolidieren und alte Schichten entfernen.
- PlanView modularisieren.
- TrainingCalendarView in Kalender, Vorlagen, Drawer, QuickEdit und Utilities trennen.
- Rollen-/Sync-E2E mit aktiver Development-Umgebung ausführen.

Priorität B:

- Dashboard-Widgets lazy/contextuell laden.
- Tabellen und Listen bei großen Datenmengen virtualisieren.
- Analyse- und Polar-Details erst bei Öffnen laden.
- CSS-Budget ergänzen, nicht nur JS-Budget.

Priorität C:

- Performance-Messung für Phone-Start etablieren.
- Cache-Hit-Rate und Syncdauer technisch erfassen.

## Fazit

Paddlio ist nicht langsam kaputt, aber es wird schwerer. Jetzt ist der richtige Zeitpunkt, Struktur zu reduzieren, nicht noch mehr Oberfläche oben draufzusetzen.

