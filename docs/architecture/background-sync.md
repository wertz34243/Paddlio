# Background Sync

## Ziel

Eine zentrale Background-Sync-Engine koordiniert lokale Änderungen, Cloud-Deltas, Fehlerstatus und Prioritäten. Sie ersetzt verstreute manuelle Sync-Aufrufe.

## Trigger

- App-Start
- Login
- App kommt in den Vordergrund
- Netzwerk wird wieder verfügbar
- Pull-to-refresh
- relevante lokale Änderung
- manuelle Synchronisierung

## Prioritäten

| Priorität | Daten | Zweck |
| --- | --- | --- |
| 1 | Profil, Rolle, heutige Trainings, Feedback, Nachrichten | App sofort benutzbar und kommunikativ korrekt |
| 2 | aktuelle Woche, Aufgaben, Team, Polar-Status | tägliche Arbeit vollständig |
| 3 | Analyse, Akademie, Material, Wettkämpfe | Erweiterungen ohne Startblockade |
| 4 | Historie, Archive, alte Imports | nur bei Bedarf |

## Fehlerverhalten

- Keine aggressive Dauerschleife.
- Exponentielles Retry bei temporären Fehlern.
- Berechtigungsfehler stoppen den betroffenen Job und verlangen erneute Anmeldung.
- Fehlerhafte Datensätze dürfen nicht endlos ohne Status erneut gesendet werden.
- Technische Details werden geloggt, Benutzertexte bleiben verständlich.
