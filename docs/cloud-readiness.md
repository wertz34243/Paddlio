# Paddlio Cloud Readiness

Paddlio 2.7 bleibt eine lokale Demo-App mit LocalStorage. Diese Datei beschreibt, welche Teile für echte Mehrbenutzerfähigkeit in eine Cloud-Schicht verschoben und serverseitig abgesichert werden muessen.

## Datenmodelle für die Cloud

- Users und Profile: `AuthUser`, `User`, Rollen, Status, Vereinszuordnung, Profilbild-Metadaten.
- Auth und Sessions: echte Auth-Provider-Identitaet, Session-Token, Passwort-Reset, MFA optional.
- Clubs und Club Requests: offizielle Vereine, Vereinsvorschlaege, Status und Admin-Review.
- Trainer Requests: Traineranfragen, Review-Status, Review-Historie und Admin-Entscheidungen.
- Training Groups: Gruppen pro Verein, Coach-Zuordnung, Sportler-Zuordnung, Status.
- Training Templates: private Vorlagen, Vereinsvorlagen, Favoriten, Tags, Trainingsbereich, Bootsklasse, Standarddauer und Standardintensität.
- Training Plan Items: eigene Trainings, Coach-Zuweisungen an Sportler oder Gruppen, Wiederholungen, Status.
- Training Feedback: Rückmeldungen, Ausfallgründe, Befinden, Schlaf, Motivation und Coach-Sichtbarkeit.
- Competitions: Rennen, Ergebnisse, Zeiten, Strafsekunden, Platzierung, Medienverweise.
- Training Sessions und Journal: Trainingstagebuch, RPE, Fokus, Notizen und Wohlbefinden.
- Season Goals: Ziele, Zieltypen, Fortschritt, Coach-Kommentare, Archivstatus.
- Equipment: Boote, Paddel, Zubehör, Status, Bewertungen, Notizen und Bilder.
- Invitations und Settings: Einladungen, Sprache, Einheiten, Dark Mode und App-Einstellungen.

## LocalStorage-Strukturen ersetzen

- `paddlio_users` wird durch Auth-Provider plus `profiles` Tabelle ersetzt.
- `paddlio_session` und `paddlio_sessions` werden durch sichere Provider-Sessions ersetzt.
- `paddlio_data_<userId>` wird in normalisierte Tabellen für Training, Ziele, Wettkämpfe, Material, Journal und Profil aufgeteilt.
- `paddlio_clubs` und `paddlio_club_requests` werden Cloud-Tabellen mit Admin-Review.
- `paddlio_training_groups`, `paddlio_training_templates`, `paddlio_training_plan_items`, `paddlio_training_feedback` und `paddlio_season_goals` werden serverseitig nach userId, clubId und role gefiltert.
- Alte Demo- oder Legacy-Keys sollten nur für eine einmalige Migration gelesen und danach nicht mehr geschrieben werden.

## Serverrechte

- Athlete: darf nur eigene Datensaetze lesen und schreiben.
- Coach: darf nur Sportler, Gruppen, Trainingsvorlagen, Trainings, Feedback und Ziele des eigenen Vereins beziehungsweise der eigenen Gruppen lesen und bearbeiten.
- TeamAdmin: bleibt strukturell separat und kann zunächst Coach-Rechte erhalten.
- Admin: darf alle Datensaetze sehen und verwalten.
- Trainerrechte dürfen nur durch Admin-Review oder eine serverseitige Admin-Aktion vergeben werden.
- Adminrechte dürfen niemals aus Client-State, LocalStorage oder Formularwerten entstehen.
- Traineranfragen, Rollenwechsel, Benutzerdeaktivierung und Loeschungen brauchen Audit-Felder wie `reviewedBy`, `updatedBy` und Zeitstempel.

## Empfehlung

Supabase ist für Paddlio der naheliegende erste Schritt, weil Postgres, Row Level Security, Auth, Storage und Edge Functions gut zu Vereins-, Rollen- und Analyse-Daten passen. Firebase ist ebenfalls möglich, erfordert aber besonders sorgfältige Security Rules für clubId, coachId und userId.

## Risiken der aktuellen Demo-Auth

- Passwörter und Sessions liegen lokal im Browser und sind nicht für sensible produktive Daten geeignet.
- Rollen können in einer reinen Frontend-Demo nicht wirklich vertrauenswürdig geschützt werden.
- LocalStorage ist geraete- und browsergebunden, nicht synchronisiert und kann gelöscht werden.
- Coach- und Admin-Funktionen wirken lokal, sind aber ohne Serverpruefung keine echte Zugriffskontrolle.

## Nächste Schritte für Version 3.0

1. Supabase- oder Firebase-Projekt anlegen und Auth aktivieren.
2. Tabellen für Users, Clubs, Groups, Training Templates, Training, Goals, Competitions, Material und Feedback modellieren.
3. Row Level Security beziehungsweise Security Rules für Athlete, Coach, TeamAdmin und Admin definieren.
4. Lokale Storage-Funktionen hinter ein Repository/API-Interface setzen.
5. Supabase Auth Provider aktivieren und Profile, Vereine, Benutzer, Gruppen und Traineranfragen aus der Cloud laden.
6. Einmalige Migration aus LocalStorage in Cloud-Daten vorbereiten.
7. Deployment-Umgebungsvariablen für Vercel dokumentieren.
8. End-to-End-Tests für Registrierung, Login, Rollenwechsel und Datenisolierung einführen.

## Stand Version 3.0.2

- Supabase Auth ist als primaerer Login-Pfad vorbereitet.
- `profiles`, `clubs`, `trainer_requests` und `training_groups` werden über Services geladen und lokal gecacht.
- Trainings, Ziele, Wettkämpfe und Material werden in 3.0.3 in Supabase migriert; Analyse nutzt weiterhin die lokal gecachten Cloud-Daten.

## Stand Version 3.0.3

- Lokale Trainings, Trainingsfeedback, Trainingsvorlagen, Ziele, Wettkämpfe und Material werden beim ersten Login in Supabase migriert.
- Supabase Realtime aktualisiert Training, Feedback, Ziele, Traineranfragen und Profile.
- `paddlio_sync_queue` puffert Offline-Änderungen und wird beim Onlinegehen abgearbeitet.
- LocalStorage bleibt Cache, Supabase wird für migrierte Daten Hauptspeicher.
