# Version 0.9 - Sync Review

Stand: 2026-08-04  
Branch: `develop`

## Kurzfazit

Sync ist der wichtigste Vertrauenspunkt für Paddlio. Nutzer verzeihen kleine Designkanten eher als verlorene Trainings, falsche Wiederholungen oder Daten, die nach Reload wieder auftauchen. Der Sync ist funktional vorbereitet, aber der komplette Zwei-Geräte-Nachweis ist im aktuellen Lauf nicht aktiv erbracht.

Sync-Bewertung: **68 / 100**

## Kritische Sync-Flows

| Flow | Erwartung | Status |
|---|---|---|
| Training erstellen | erscheint lokal und in Cloud | vorbereitet |
| Training bearbeiten | andere Geräte sehen Änderung | offener Echt-Nachweis |
| Training löschen | verschwindet nach Reload dauerhaft | kritisch weiter testen |
| Serie löschen | alle gewählten Serientermine verschwinden | kritisch weiter testen |
| Einzeltermin aus Serie löschen | nur dieser Termin verschwindet | kritisch weiter testen |
| Woche kopieren | keine Duplikate, klare Zielwoche | vorbereitet |
| Feedback speichern | Coach sieht Feedback | E2E vorhanden, aber übersprungen |
| Journal speichern | bleibt nach Reload erhalten | weiter testen |
| Offline ändern | später synchronisieren | offener Nachweis |
| Konflikt | verständlich anzeigen | weiter ausbauen |

## Zwei-Geräte-Matrix

| Kombination | Ziel | Status |
|---|---|---|
| Trainer Desktop + Sportler Phone | wichtigste Beta-Prüfung | offen |
| Trainer Tablet + Sportler Phone | Training am Wasser | offen |
| Trainer Desktop + Trainer Tablet | Planungsabgleich | offen |
| Trainer Desktop + zweiter Browser | technischer Basisflow | Test vorhanden, übersprungen |

## Was bereits gut ist

- Cloudstatus und Syncstatus existieren.
- Es gibt eigene Services für Trainings, Feedback, Journal, Profil und Benachrichtigungen.
- Gelöschte Plan-Einträge werden aktiv aus den sichtbaren Daten gefiltert.
- E2E-Szenarien für Rollen und Sync sind im Projekt vorhanden.

## Größte Risiken

1. Rollen-/Sync-E2E wird ohne aktive Testumgebung übersprungen.
2. Serienlöschung ist fachlich heikel und wurde vom Nutzer bereits als Problem gemeldet.
3. Offline/Reconnect ist noch nicht ausreichend belegt.
4. Bei mehreren Einstiegspunkten können gleiche Trainings mehrfach bearbeitet werden.
5. Alte lokale Daten dürfen gelöschte Clouddaten nicht wieder herstellen.

## Akzeptanz für Version 0.9

Vor Freigabe eines Vereinstests muss aktiv nachgewiesen sein:

1. Coach erstellt Training auf Desktop.
2. Athlete sieht Training auf Phone.
3. Athlete speichert Feedback.
4. Coach sieht Feedback.
5. Coach bearbeitet Training.
6. Athlete sieht Änderung.
7. Coach löscht Training.
8. Athlete sieht Löschung.
9. Beide laden neu.
10. Training bleibt gelöscht.

## Empfehlung

Die nächste technische Stabilisierung sollte nicht neue Sync-Funktionen bauen, sondern die vorhandenen Flows messbar machen:

- Testumgebung für Rollen-E2E setzen.
- Serienlöschen als Unit- und E2E-Fall aufnehmen.
- Reload-Nachweise je Hauptentität dokumentieren.
- Sync-Fehler in verständlicher Sprache anzeigen.

