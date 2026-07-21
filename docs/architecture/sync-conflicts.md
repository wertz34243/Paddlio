# Sync-Konflikte

## Prinzip

Konflikte werden pro Entität behandelt. Eine generische Upsert-Regel für alle Tabellen ist zu riskant.

## Regeln

| Entität | Konfliktregel |
| --- | --- |
| Trainingsplan | Coach-Planfelder und Sportler-Feedback getrennt mergen |
| Feedback | eindeutig pro Training und Sportler; neueres Feedback ersetzt älteres |
| Nachrichten | append-only, keine Zusammenführung |
| Anwesenheit | letzte gültige Statusänderung gewinnt |
| Polar-Training | Provider Activity ID verhindert Duplikate |
| Material | unsichere Konflikte manuell bestätigen |
| Profil | Feldvalidierung, keine stille Teilüberschreibung |

## Löschungen

Gelöschte Trainings müssen als Tombstone synchronisiert werden. Ein Gerät mit alten lokalen Daten darf gelöschte Trainings nicht erneut anlegen.
