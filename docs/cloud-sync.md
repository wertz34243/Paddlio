# Paddlio Cloud Sync

Paddlio 3.0.3 macht Supabase zum Hauptspeicher fuer migrierte App-Daten. LocalStorage bleibt als Offline- und Performance-Cache erhalten.

## Migration

Nach dem ersten erfolgreichen Supabase-Login prueft Paddlio pro Nutzer den Key:

```text
paddlio_cloud_migration_<userId>
```

Wenn die Migration noch nicht abgeschlossen ist, werden vorhandene LocalStorage-Daten in Supabase geschrieben:

- Profil
- Trainingsplanung
- Trainingsfeedback
- Trainingsvorlagen
- Saisonziele
- Wettkaempfe und Ergebnisse
- Material

Nach erfolgreichem Durchlauf wird `migrationCompleted = true` ueber den lokalen Key markiert. Dadurch wird keine doppelte Migration ausgefuehrt.

## Offline Queue

Wenn Supabase nicht erreichbar ist oder das Geraet offline ist, landen Aenderungen in:

```text
paddlio_sync_queue
```

Beim Onlinegehen wird die Queue automatisch abgearbeitet. Gelingt ein Eintrag nicht, bleibt er mit erhoehter Attempt-Zahl in der Queue.

## Realtime

Paddlio abonniert Supabase Realtime fuer:

- `training_plan_items`
- `training_feedback`
- `season_goals`
- `trainer_requests`
- `profiles`

Wenn sich Daten aendern, wird der Cloud-Cache neu geladen. Das Dashboard reagiert dadurch ohne manuellen Reload.

## Konflikte

Aktuelle Strategie:

```text
Neueste Aenderung gewinnt.
```

Die App zeigt einen Hinweis, wenn Daten zwischen Geraeten synchronisiert wurden. Fuer spaetere Versionen kann daraus eine detaillierte Konfliktansicht entstehen.

## Datenschutz

Alle Cloud-Daten laufen ueber Supabase Row Level Security. Das Frontend versteckt Funktionen, aber die eigentliche Zugriffskontrolle muss in RLS bleiben:

- Athlete sieht eigene Daten.
- Coach sieht Daten des eigenen Vereins.
- Admin sieht alles.

## Version 3.0.4 Vorbereitung

Als naechstes sollten Schreibpfade in den einzelnen Feature-Views noch granularer auf Services umgestellt werden. Aktuell synchronisiert der AuthProvider den lokalen Snapshot best-effort in die Cloud.
