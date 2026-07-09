# Paddlio Realtime and Offline Sync

## Realtime Konzept

Paddlio 3.3 nutzt Supabase Realtime für gemeinsame Trainer-/Sportler-Workflows. Realtime-Logik liegt zentral in:

```text
src/services/realtimeService.ts
```

Vorbereitete Subscriptions:

- `subscribeToUserTrainings(userId)`: Trainings, Ziele und Gruppenzuordnung für einen Athleten.
- `subscribeToCoachClub(clubId)`: Trainings, Gruppen, Profile und Traineranfragen des eigenen Vereins.
- `subscribeToTrainingFeedback(scope)`: Rückmeldungen für Athlet oder Coach-Sicht.
- `subscribeToNotifications(userId)`: persönliche Benachrichtigungen.
- `unsubscribeAll()`: sauberer Abbau bei Logout.

Der AuthProvider nutzt eine allgemeine Subscription, um den lokalen Cache nach Cloud-Änderungen zu aktualisieren.

## Benachrichtigungen

Die Tabelle `notifications` speichert Live-Hinweise für Nutzer:

- neues Training zugewiesen
- Training geändert
- Training abgesagt
- Feedback eingegangen
- Ziel erstellt oder erreicht
- Traineranfrage genehmigt oder abgelehnt
- Nutzer wurde Gruppe hinzugefügt

Die UI liegt im Mehr-Menü unter `Updates`. Ungelesene Benachrichtigungen werden zuerst angezeigt und können einzeln oder gesammelt als gelesen markiert werden.

## Offline Queue

Offline-Änderungen landen in:

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

Beim Wiederverbinden versucht Paddlio die Queue automatisch zu synchronisieren. Erfolgreiche Einträge werden entfernt, fehlgeschlagene bleiben mit erhoehtem Retry-Zähler erhalten.

## Konfliktloesung

Version 3.3 verwendet bewusst eine einfache Strategie:

```text
Last-write-wins
```

Supabase `updated_at` und der lokale Sync-Zeitpunkt bilden die Grundlage für spätere Konfliktanzeigen. Die App zeigt bereits einen Hinweis, wenn Daten zwischen Geräten synchronisiert wurden.

## Datenschutz

Realtime ersetzt keine Rechtepruefung. Zugriff muss weiterhin über Supabase RLS abgesichert sein:

- Athlete sieht nur eigene Trainings, Ziele, Gruppenmitgliedschaften und Notifications.
- Coach sieht nur Daten des eigenen Vereins.
- Admin sieht alles.

Das Frontend filtert zusaetzlich, aber die serverseitige RLS bleibt entscheidend.

## Grenzen der aktuellen Version

- Offline-Queue ist ein Browser-Cache und keine echte garantierte Background-Sync-Engine.
- Konflikte werden noch nicht interaktiv aufgeloest.
- Benachrichtigungen werden clientseitig best-effort erzeugt; langfristig sollten Edge Functions oder Datenbank-Trigger kritische Notifications erzeugen.
- Realtime-Subscriptions werden sparsam genutzt, aber für sehr große Vereine braucht die App später Pagination und feinere Channel-Segmentierung.
