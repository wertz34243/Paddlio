# Realtime Subscriptions

Stand: Phase 9 der Beta-Stabilisierung.

## Ziel

Realtime soll nur Daten beobachten, die für den aktuellen Benutzerkontext relevant sind. Breite globale Tabellen-Abos erhöhen Last, erzeugen doppelte Events und können die Zwei-Geräte-Synchronisierung unnötig verlangsamen.

## Zentrale Verwaltung

Die Verwaltung liegt in:

`src/services/realtimeService.ts`

Die Datei stellt eine gemeinsame Funktion für tabellenspezifische Subscription-Scopes bereit. Jeder Scope:

- besitzt einen stabilen Schlüssel,
- entfernt ein bestehendes Abo mit gleichem Schlüssel vor Neuaufbau,
- nutzt Supabase-Filter nach Nutzer oder Verein,
- entfernt Channels beim Cleanup,
- dedupliziert kurz hintereinander eintreffende gleiche Events.

## Aktive Scopes

| Scope | Start | Ende | Filter | Zweck |
| --- | --- | --- | --- | --- |
| `user-core-{userId}` | nach Login | Logout oder Profilwechsel | `user_id`, `athlete_id`, `assigned_to`, `assigned_athlete_id`, `owner_id` | Eigene Trainings, Feedbacks, Nachrichten, Ziele, Material, Akademie-Fortschritt |
| `notifications-{userId}` | nach Login | Logout oder Profilwechsel | `user_id` | Benachrichtigungen |
| `coach-club-{clubId}` | Coach/ClubAdmin/Admin mit Verein | Rollen-/Vereinswechsel | `club_id` | Vereinsbezogene Trainings, Feedbacks, Gruppen, Aufgaben, Teamdaten |

## Entfernte Muster

Der frühere globale `paddlio-cloud-sync` Channel abonnierte viele Tabellen ohne Nutzer- oder Vereinsfilter. Dieser globale Pfad wird nicht mehr exportiert und nicht mehr verwendet.

Ebenfalls entfernt wurden doppelte Feedback-Abos im Auth-Provider. Feedback ist jetzt im User- und Coach-Scope enthalten.

## Tabellen Nach Bereich

Training:

- `training_plan_items`
- `training_templates`
- `training_feedback`
- `training_journal_entries`
- `training_attendance`

Team und Nachrichten:

- `direct_messages`
- `club_messages`
- `group_messages`
- `tasks`
- `task_assignments`
- `training_groups`
- `group_members`
- `group_memberships`

Analyse und Ergebnisse:

- `competition_results`
- `personal_bests`
- `season_goals`
- `smart_coach_recommendations`
- `external_training_sessions`

Akademie:

- `academy_progress`
- `academy_favorites`
- `academy_assignments`
- Coach/Verein zusätzlich `academy_courses`, `academy_lessons`, `academy_media`

## Offene Optimierung

Aktuell startet der User-Scope nach Login und der Coach-Scope für berechtigte Rollen. Der nächste Schritt ist view-basiertes Starten und Stoppen einzelner Subscriptions, zum Beispiel nur beim Öffnen des Team- oder Akademie-Bereichs. Für die externe Beta ist der wichtigste Schritt erledigt: keine ungefilterten globalen Tabellen-Abos mehr.
