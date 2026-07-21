# AI Context Matrix

## Ziel

KI-Kontexte sind kleine, geprüfte Zusammenfassungen. Sie laden keine Rohdatenarchivbestände bei jedem Aufruf.

| Kontext | Nutzer | Eingaben | Ausgabe | Aktualisierung |
| --- | --- | --- | --- | --- |
| `daily_coach` | Sportler | Heute, aktuelle Woche, Feedback, Polar-Kurzstatus | Tageshinweis | nach Training, Feedback oder Polar-Sync |
| `weekly_coach` | Sportler/Trainer | 4-Wochen-Trend, Wochenplan, Belastung | Wochenzusammenfassung | täglich oder nach relevanten Änderungen |
| `coach_alerts` | Trainer | offene Rückmeldungen, auffällige Belastung, fehlende Einheiten | Trainerliste | nach Feedback oder Planänderung |
| `recovery` | Sportler | RPE, Müdigkeit, Polar-Werte, Trainingsdichte | Regenerationshinweis | nach Feedback oder Polar-Sync |
| `competition` | Sportler/Trainer | Wettkampf, Läufe, Strafsekunden, Trainingstrend | Wettkampfhinweis | nach Ergebnisänderung |

## Builder

Der spätere `PaddlioAIContextBuilder` sollte explizite Methoden besitzen:

- `buildDailyCoachContext()`
- `buildWeeklyCoachContext()`
- `buildCoachAlertsContext()`
- `buildRecoveryContext()`
- `buildCompetitionContext()`
