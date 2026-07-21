# Delta Sync

## Ziel

Paddlio soll nicht bei jedem Start komplette Tabellen laden. Synchronisiert werden Änderungen seit dem letzten erfolgreichen Cursor.

## Cursor

Bevorzugt:

- `updated_at`
- `created_at`
- `deleted_at`
- stabile `id`

Für Tabellen mit vielen Änderungen gilt ein zusammengesetzter Cursor aus Zeitstempel und ID, damit Änderungen mit gleicher Millisekunde nicht verloren gehen.

## Tabellenregeln

| Tabelle | Cursor | Konfliktregel | Delete |
| --- | --- | --- | --- |
| `training_plan_items` | `updated_at, id` | Feld-Merge für Planstatus und Feedback getrennt | Soft Delete |
| `training_feedback` | `updated_at, id` | pro Training und Sportler eindeutig | Soft Delete oder Status |
| `direct_messages` | `created_at, id` | append-only | kein Client-Hard-Delete |
| `external_training_sessions` | `updated_at, id` | Provider-ID verhindert Duplikate | keine automatische Löschung |
| `academy_progress` | `updated_at, id` | neuester Fortschritt pro Nutzer/Lektion | Status |

## Löschungen

Offline-fähige Tabellen brauchen Tombstones, damit gelöschte Datensätze nicht von einem alten Gerät wieder hochgeladen werden.
