# AI Cache

## Ziel

KI-Antworten werden nicht bei jedem Render, Seitenwechsel oder Realtime-Event neu erzeugt.

## Cache-Schlüssel

Ein Eintrag besteht aus:

- `context_type`
- `user_id` oder erlaubter Team-Scope
- `input_hash`
- `context_version`
- `generated_at`
- `expires_at`
- `model`
- `output`

## Invalidierung

| Änderung | Ungültige Kontexte |
| --- | --- |
| Training abgeschlossen | `daily_coach`, `weekly_coach` |
| Feedback gespeichert | `daily_coach`, `recovery`, `coach_alerts` |
| Polar-Training importiert | `daily_coach`, `weekly_coach`, `recovery` |
| Wettkampfergebnis geändert | `competition`, `weekly_coach` |
| Nachricht gesendet | keine Trainings-KI |

## Kostenkontrolle

- kein KI-Aufruf bei jedem Seitenwechsel
- kein KI-Aufruf bei jedem Realtime-Event
- Batch- oder Hintergrundjobs bevorzugen
- regelbasierter Fallback bleibt verfügbar
