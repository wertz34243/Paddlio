# Stabilization 2.8 Summary

## Umgesetzt

- Tablet Portrait nutzt Overlay-Kontext statt dauerhafter rechter Spalte.
- Tablet Portrait wechselt bei zu geringer Breite automatisch von Woche auf 3 Tage.
- Kalender bleibt Hauptfläche.
- Quick Edit, Vorlagen und Trainingsdetails bleiben erreichbar, verdecken den Kalender aber nur als gezielter Kontext.
- Development-Seed wurde robuster und realistischer.
- Rollen-E2E wurde auf aktuelle UI und Seed-Namen angepasst.
- ClubAdmin-E2E wurde ergänzt.
- Mobile-Layout-Timeouts im Desktop-Projekt wurden durch saubere Projekttrennung behoben.

## Tests

- `npm.cmd run build`: bestanden
- `npm.cmd run check:beta`: bestanden
- `npm.cmd run test`: 13 Dateien, 58 Tests bestanden
- `npm.cmd run test:e2e`: 6 bestanden, 12 übersprungen
- `npm.cmd run test:e2e:roles`: 10 übersprungen

## Nicht nachgewiesen

- Rollen-E2E mit echten Login-Daten
- Zwei-Geräte-Sync
- Offline/Online-Sync
- echte Screenshots mit eingeloggten Development-Testdaten
- Seed-Ausführung gegen Development

## Grund

In der aktuellen Shell waren keine `PADDLIO_E2E_*`-Variablen und kein `SUPABASE_SERVICE_ROLE_KEY` gesetzt. Ohne diese Werte werden keine Testdaten geschrieben und keine authentifizierten Rollenflüsse ausgeführt.

## Bewertung

- Tablet Portrait: 88/100 lokal technisch verbessert, visuell mit Testdaten noch nicht final nachgewiesen
- Tablet Landscape: 90/100 gehalten
- Kalender: 87/100
- Rollen-E2E: vorbereitet, aber nicht nachgewiesen
- Zwei-Geräte-Sync: vorbereitet, aber nicht nachgewiesen
- Beta-Status: interne Nutzung möglich, Trainer-Test erst nach grünem Rollen-/Sync-Lauf

