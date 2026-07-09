# Paddlio Communication & Team System

Stand: Version 3.8

## Ziel

Paddlio 3.8 integriert Kommunikation, Vereinsmeldungen, Aufgaben und Anwesenheit in die Plattform. Trainer, Sportler, ClubAdmins und Admins sollen Trainings- und Vereinsorganisation nicht mehr auf WhatsApp, Excel oder Zettel auslagern muessen.

## Module

- Direktnachrichten: 1:1 Nachrichten zwischen Sportlern, Trainern, ClubAdmins und Admins.
- Gruppenchat: Chat pro Trainingsgruppe.
- Vereinsnews: Pinnwand für wichtige Meldungen mit Kategorie, Priorität und Zielgruppe.
- Aufgaben: Aufgaben mit Typ, Priorität, Fälligkeit und Zuweisung an Nutzer.
- Anwesenheit: Zusage, Absage oder Unsicherheit pro Training.
- Dateien: Anhang-Metadaten für spätere Supabase Storage Uploads.

## Supabase Tabellen

- `direct_messages`
- `group_messages`
- `club_posts`
- `tasks`
- `task_assignments`
- `training_attendance`
- `file_attachments`

Migration:

- `supabase/migrations/0011_communication_team_system.sql`

## RLS Grundlogik

- Athlete sieht eigene Direktnachrichten, eigene Aufgaben, eigene Anwesenheit und Nachrichten seiner Gruppen.
- Coach sieht Vereins-/Gruppendaten im eigenen Verein und kann Aufgaben, News und Gruppenkommunikation für eigene Gruppen nutzen.
- ClubAdmin sieht und verwaltet den eigenen Verein.
- Admin sieht und verwaltet alles.

Frontend-Filter sind nur Ergonomie. Datenschutz muss in Supabase RLS erzwungen werden.

## Offline

Die bestehenden Offline-Queue-Services werden für Schreiben genutzt. Wenn Supabase nicht erreichbar ist, werden Nachrichten, Aufgaben, Anwesenheit und Datei-Metadaten lokal zwischengespeichert und später synchronisiert.

## Benachrichtigungen

Die bestehende `notifications`-Tabelle bleibt zentral. 3.8 bereitet Ereignisse für neue Direktnachrichten, Gruppennachrichten, Vereinsnews, Aufgaben und Anwesenheit vor. Native Push Notifications sind noch nicht enthalten.

## Datei-Anhänge

Der Bucket `paddlio-files` wird vorbereitet. Die App speichert stabile Anhang-Metadaten, crasht aber nicht, falls Supabase Storage noch nicht voll konfiguriert ist.

## Grenzen

- Keine Ende-zu-Ende-Verschluesselung.
- Keine native Push API.
- Datei-Upload ist vorbereitet, aber noch kein vollständiger Storage-Workflow.
- Reaktionen, Kommentare und Threading sind für später vorbereitet.

## Nächste Schritte für 3.9/4.0

- echte Storage Uploads mit Bucket Policies
- Benachrichtigungs-Routing aus Nachrichten/Tasks heraus
- bessere Coach-Filter nach Gruppen und Wettkampfphasen
- spätere Integrationen wie Polar Sync, Ergebnis Sync, Excel Import, Paddlio Academy und Videoanalyse
