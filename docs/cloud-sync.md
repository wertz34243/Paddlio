# Paddlio Cloud Sync

Paddlio 3.0.3 macht Supabase zum Hauptspeicher für migrierte App-Daten. LocalStorage bleibt als Offline- und Performance-Cache erhalten.

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
- Wettkämpfe und Ergebnisse
- Material

Nach erfolgreichem Durchlauf wird `migrationCompleted = true` ueber den lokalen Key markiert. Dadurch wird keine doppelte Migration ausgeführt.

## Offline Queue

Wenn Supabase nicht erreichbar ist oder das Gerät offline ist, landen Änderungen in:

```text
paddlio_sync_queue
```

Beim Onlinegehen wird die Queue automatisch abgearbeitet. Gelingt ein Eintrag nicht, bleibt er mit erhoehter Attempt-Zahl in der Queue.

## Realtime

Paddlio abonniert Supabase Realtime für:

- `training_plan_items`
- `training_feedback`
- `training_templates`
- `season_goals`
- `trainer_requests`
- `profiles`

Wenn sich Daten ändern, wird der Cloud-Cache neu geladen. Das Dashboard reagiert dadurch ohne manuellen Reload.

## Konflikte

Aktuelle Strategie:

```text
Neueste Aenderung gewinnt.
```

Die App zeigt einen Hinweis, wenn Daten zwischen Geräten synchronisiert wurden. Für spätere Versionen kann daraus eine detaillierte Konfliktansicht entstehen.

## Datenschutz

Alle Cloud-Daten laufen ueber Supabase Row Level Security. Das Frontend versteckt Funktionen, aber die eigentliche Zugriffskontrolle muss in RLS bleiben:

- Athlete sieht eigene Daten.
- Coach sieht Daten des eigenen Vereins.
- Admin sieht alles.

## Version 3.0.4 Vorbereitung

Als nächstes sollten Schreibpfade in den einzelnen Feature-Views noch granularer auf Services umgestellt werden. Aktuell synchronisiert der AuthProvider den lokalen Snapshot best-effort in die Cloud.

## Version 3.2 Trainingsplanung

Die Trainingsplanung nutzt weiterhin den lokalen Snapshot als Offline-fähige Arbeitskopie und synchronisiert ueber den AuthProvider in die Cloud. Für Coach-Workflows sind folgende Tabellen performancekritisch:

- `training_plan_items`: Tages-, Wochen-, Monats- und Blockplanung.
- `training_feedback`: Rückmeldungen von Athleten an Coaches.
- `training_templates`: private und vereinsweite Trainingsvorlagen.

Migration `0006_training_planning_2_0.sql` legt Indizes für Datum, Verein, Athlet, Coach, Gruppen-/Athletenlisten und Vorlagen-Sichtbarkeit an. Ausserdem wird Supabase Realtime für Training, Feedback und Vorlagen vorbereitet, damit Coach und Athlet denselben Plan ohne manuelles Neuladen sehen können.
