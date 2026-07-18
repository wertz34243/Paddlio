# Paddlio Sync Strategy

Paddlio verwendet Supabase als führende Quelle, sobald ein Nutzer angemeldet und das Profil bestätigt ist. LocalStorage ist eine Offline-Arbeitskopie und darf Cloud-Daten nicht dauerhaft überschreiben.

## Fuehrende Quelle

- Auth, Profil, Rolle und Verein: Supabase.
- Training, Feedback, Nachrichten, Akademie-Fortschritt, Import/Export und Polar: Supabase bei bestehender Verbindung.
- LocalStorage: nur Cache, Offline-Queue und schneller Start.

## Initialer Sync

1. Auth-Session laden.
2. Profil/Rolle/Verein bestätigen.
3. Kernbereiche laden.
4. Wartende Queue tabellenspezifisch abarbeiten.
5. Optionale Module später laden.

## Tabellenbezogene Sync-Regeln

Jede synchronisierte Tabelle braucht explizite Regeln:

| Tabelle | Konfliktschluessel | Delete | Fuehrendes Feld |
|---|---|---|---|
| `training_plan_items` | `id` | Soft Delete `deleted_at` | `updated_at` |
| `training_feedback` | `training_id, athlete_user_id` | fachlich nur wenn erlaubt | `completed_at` |
| `messages` | `id` | nicht hart löschen im Client | `created_at` |
| `academy_progress` | `user_id, lesson_id` | Statusupdate | `updated_at` |
| `external_training_sessions` | `provider, provider_activity_id` | keine automatische Löschung | `updated_at` |
| `polar_training_imports` | `user_id, provider_activity_id` | keine automatische Löschung | `updated_at` |

## Löschungen

Trainingspläne nutzen Soft Deletes. Gelöschte Einträge bleiben als Tombstone erhalten, damit ein zweites Gerät alte lokale Daten nicht erneut hochlädt.

## Konflikte

- Neueres `updated_at` gewinnt nur bei gleicher Entitaet und gleicher Berechtigung.
- Unsichere Konflikte werden nicht automatisch gemerged.
- Polar-Trainings werden nur vorgeschlagen, nicht unsicher automatisch verbunden.

## Fehlerstatus

Die UI unterscheidet:

- Synchronisierung läuft
- synchronisiert
- lokale Änderungen ausstehend
- offline
- eingeschraenkt
- Fehler
- Konflikt erkannt

Die permanente Sync-Anzeige ist nur in Einstellungen/Systemstatus sichtbar. Datensatzbezogene Fehler werden direkt am betroffenen Datensatz gezeigt.
