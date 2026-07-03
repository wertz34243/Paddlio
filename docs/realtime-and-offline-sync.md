# Paddlio Realtime and Offline Sync

## Realtime Konzept

Paddlio 3.3 nutzt Supabase Realtime fuer gemeinsame Trainer-/Sportler-Workflows. Realtime-Logik liegt zentral in:

```text
src/services/realtimeService.ts
```

Vorbereitete Subscriptions:

- `subscribeToUserTrainings(userId)`: Trainings, Ziele und Gruppenzuordnung fuer einen Athleten.
- `subscribeToCoachClub(clubId)`: Trainings, Gruppen, Profile und Traineranfragen des eigenen Vereins.
- `subscribeToTrainingFeedback(scope)`: Rueckmeldungen fuer Athlet oder Coach-Sicht.
- `subscribeToNotifications(userId)`: persoenliche Benachrichtigungen.
- `unsubscribeAll()`: sauberer Abbau bei Logout.

Der AuthProvider nutzt eine allgemeine Subscription, um den lokalen Cache nach Cloud-Aenderungen zu aktualisieren.

## Benachrichtigungen

Die Tabelle `notifications` speichert Live-Hinweise fuer Nutzer:

- neues Training zugewiesen
- Training geaendert
- Training abgesagt
- Feedback eingegangen
- Ziel erstellt oder erreicht
- Traineranfrage genehmigt oder abgelehnt
- Nutzer wurde Gruppe hinzugefuegt

Die UI liegt im Mehr-Menue unter `Updates`. Ungelesene Benachrichtigungen werden zuerst angezeigt und koennen einzeln oder gesammelt als gelesen markiert werden.

## Offline Queue

Offline-Aenderungen landen in:

```text
paddlio_sync_queue
```

Service:

```text
src/services/offlineQueueService.ts
```

Queue-Eintrag:

- `id`
- `table`
- `operation`: `insert`, `update`, `delete`
- `payload`
- `createdAt`
- `retryCount`
- `status`

Beim Wiederverbinden versucht Paddlio die Queue automatisch zu synchronisieren. Erfolgreiche Eintraege werden entfernt, fehlgeschlagene bleiben mit erhoehtem Retry-Zaehler erhalten.

## Konfliktloesung

Version 3.3 verwendet bewusst eine einfache Strategie:

```text
Last-write-wins
```

Supabase `updated_at` und der lokale Sync-Zeitpunkt bilden die Grundlage fuer spaetere Konfliktanzeigen. Die App zeigt bereits einen Hinweis, wenn Daten zwischen Geraeten synchronisiert wurden.

## Datenschutz

Realtime ersetzt keine Rechtepruefung. Zugriff muss weiterhin ueber Supabase RLS abgesichert sein:

- Athlete sieht nur eigene Trainings, Ziele, Gruppenmitgliedschaften und Notifications.
- Coach sieht nur Daten des eigenen Vereins.
- Admin sieht alles.

Das Frontend filtert zusaetzlich, aber die serverseitige RLS bleibt entscheidend.

## Grenzen der aktuellen Version

- Offline-Queue ist ein Browser-Cache und keine echte garantierte Background-Sync-Engine.
- Konflikte werden noch nicht interaktiv aufgeloest.
- Benachrichtigungen werden clientseitig best-effort erzeugt; langfristig sollten Edge Functions oder Datenbank-Trigger kritische Notifications erzeugen.
- Realtime-Subscriptions werden sparsam genutzt, aber fuer sehr grosse Vereine braucht die App spaeter Pagination und feinere Channel-Segmentierung.
