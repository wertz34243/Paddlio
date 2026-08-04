# Version 0.9 - Rollen Review

Stand: 2026-08-04  
Branch: `develop`

## Kurzfazit

Die Rollenlogik ist fachlich sinnvoll angelegt. Es gibt zentrale Feature-Capabilities und der RLS-Beta-Check ist grün. Trotzdem ist die Version 0.9 erst dann wirklich vertrauenswürdig, wenn Athlete, Coach, ClubAdmin und Admin aktiv in Development getestet wurden.

Rollen-Bewertung: **75 / 100**

## Rollen

| Rolle | Kernaufgabe | Hauptansicht |
|---|---|---|
| Sportler | Training sehen, durchführen, Feedback geben | Heute, Kalender, Training |
| Trainer | Trainings planen, Feedback auswerten, Gruppen betreuen | Heute, Kalender, Training, Team |
| Vereinstrainer | mehrere Gruppen/Sportler steuern | Kalender, Plan, Team, Analyse |
| Vereinsadministrator | Mitglieder, Gruppen, Verein, Import verwalten | Team, Verein, Admin/Mehr |
| Admin | System, Rollen, Beta, Sicherheit prüfen | Admin, Einstellungen, Systemstatus |

## Sichtbarkeit

| Bereich | Sportler | Trainer | Vereinsadmin | Admin | Bewertung |
|---|---|---|---|---|---|
| Heute | ja | ja | ja | ja | gut |
| Kalender | eigene | Gruppen | Verein | voll | gut |
| Training | eigene | planen/betreuen | organisatorisch | voll | gut |
| Feedback | eigenes | zugeordnet | begrenzt | begrenzt | prüfen |
| Journal | eigenes | zugeordnet | nein/begrenzt | begrenzt | prüfen |
| Team | eigene Gruppe | Gruppen/Sportler | Verein | voll | gut |
| Analyse | eigene | zugeordnet | organisatorisch | voll | prüfen |
| Polar | eigenes | freigegeben | Status | Status | prüfen |
| Import | nein/status | begrenzt | voll | voll | gut |
| Admin | nein | nein | begrenzt | voll | prüfen |

## Gute Grundlagen

- Feature-Capability-Matrix existiert.
- Device-Capability-Matrix existiert.
- Phone reduziert komplexe Funktionen.
- RLS-Check besteht.
- Public-Smoke-E2E bestätigt, dass ohne Login keine private Navigation sichtbar ist.

## Offene Nachweise

Die Rollen-E2E wurden in diesem Lauf übersprungen. Deshalb fehlen aktive Nachweise für:

- Athlete sieht keinen Coach/Admin-Hub.
- Coach sieht keinen Admin-Hub.
- Admin sieht Admin-Hub.
- Zwei Rollen parallel im Test.
- Fremde Vereinsdaten bleiben unsichtbar.

## Kritische Fragen

1. Ist `clubAdmin` im Code überall gleich geschrieben und verarbeitet?
2. Können Admin-Testprofile wirklich als Admin starten und nicht im Sportlermodus landen?
3. Sind direkte Links auf eingeschränkte Seiten sauber abgefangen?
4. Werden Adminfunktionen auf Phone nur reduziert, aber nicht unsicher verfügbar?
5. Sind private Traineraufgaben für Sportler unsichtbar?

## Empfehlung

Vor externer Beta:

- Rollen-E2E aktiv grün.
- Manuelle Rollenprüfung mit Development-Testprofilen.
- Direkte Deep Links prüfen.
- Sichtbarkeit und echte Backend-Berechtigung getrennt dokumentieren.

