# Initial Sync Strategy

Stand: Phase 10 der Beta-Stabilisierung.

## Ziel

Nach dem Login soll Paddlio schnell nutzbar sein. Profil, Rolle, Verein und die direkt sichtbaren Kernbereiche dürfen nicht von optionalen Modulen wie Akademie, Importhistorie, Beta-Listen oder Polar-Historie blockiert werden.

## Priorität 1: Startkontext

Diese Daten werden direkt beim Login geladen und bestimmen, ob die App als synchronisiert gelten darf:

- Supabase Auth Session
- eigenes Profil
- Rollen
- Verein
- Profile im erlaubten Scope
- Vereine
- Trainer-/Club-Anfragen als Rollen-/Admin-Kontext
- Gruppen und Gruppenmitglieder
- lokaler Migrations-/Offline-Queue-Status

## Priorität 2: Sichtbare Kernbereiche

Diese Daten werden im ersten Cloud-Merge geladen, weil sie auf Heute, Training, Team oder den Hauptstatus wirken:

- `training_plan_items`
- `training_feedback`
- `training_journal_entries`
- `training_templates`
- `season_goals`
- `competitions`
- `materials`
- `notifications`
- `smart_coach_recommendations`
- `club_messages`
- `direct_messages`
- `group_messages`
- `tasks`
- `task_assignments`
- `training_attendance`

Danach wird die App auf `connected`, `pending`, `limited` oder `offline` gesetzt.

## Hintergrund-Load

Optionale oder schwere Module werden nach dem ersten nutzbaren Zustand im Hintergrund geladen und anschließend in denselben lokalen Cache gemerged:

- Ergebnisarchive und Importdaten
- externe Verbindungen und externe Trainings
- Beta-Readiness, Beta-Feedback, Beta-Tester
- Club-Portal-Material, Boote, Events, Dokumente, Einstellungen, Posts
- Datei-Anhänge
- Akademie-Kategorien, Kurse, Lektionen, Inhaltsblöcke, Lernpfade, Fortschritt, Quiz, Favoriten und Medien

Wenn währenddessen der Account wechselt oder ein Logout passiert, wird das Ergebnis verworfen.

## Fehlerverhalten

- Profilfehler bleiben kritisch und führen zu `Cloud eingeschränkt`.
- Fehler in optionalen Hintergrundmodulen blockieren den App-Start nicht.
- Optionale Fehler werden geloggt und setzen den Status auf `limited`, wenn der Kernsync erfolgreich war.

## Offene Optimierung

Die Hintergrundmodule werden aktuell nach dem Login gesammelt geladen. Der nächste Schritt ist view-basiertes Laden, zum Beispiel Akademie erst beim Öffnen von `Mehr > Akademie` und Importdaten erst beim Öffnen von `Integrationen`.
