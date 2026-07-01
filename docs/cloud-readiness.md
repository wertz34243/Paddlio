# Paddlio Cloud Readiness

Paddlio 2.7 bleibt eine lokale Demo-App mit LocalStorage. Diese Datei beschreibt, welche Teile fuer echte Mehrbenutzerfaehigkeit in eine Cloud-Schicht verschoben und serverseitig abgesichert werden muessen.

## Datenmodelle fuer die Cloud

- Users und Profile: `AuthUser`, `User`, Rollen, Status, Vereinszuordnung, Profilbild-Metadaten.
- Auth und Sessions: echte Auth-Provider-Identitaet, Session-Token, Passwort-Reset, MFA optional.
- Clubs und Club Requests: offizielle Vereine, Vereinsvorschlaege, Status und Admin-Review.
- Trainer Requests: Traineranfragen, Review-Status, Review-Historie und Admin-Entscheidungen.
- Training Groups: Gruppen pro Verein, Coach-Zuordnung, Sportler-Zuordnung, Status.
- Training Templates: private Vorlagen, Vereinsvorlagen, Favoriten, Tags, Trainingsbereich, Bootsklasse, Standarddauer und Standardintensitaet.
- Training Plan Items: eigene Trainings, Coach-Zuweisungen an Sportler oder Gruppen, Wiederholungen, Status.
- Training Feedback: Rueckmeldungen, Ausfallgruende, Befinden, Schlaf, Motivation und Coach-Sichtbarkeit.
- Competitions: Rennen, Ergebnisse, Zeiten, Strafsekunden, Platzierung, Medienverweise.
- Training Sessions und Journal: Trainingstagebuch, RPE, Fokus, Notizen und Wohlbefinden.
- Season Goals: Ziele, Zieltypen, Fortschritt, Coach-Kommentare, Archivstatus.
- Equipment: Boote, Paddel, Zubehoer, Status, Bewertungen, Notizen und Bilder.
- Invitations und Settings: Einladungen, Sprache, Einheiten, Dark Mode und App-Einstellungen.

## LocalStorage-Strukturen ersetzen

- `paddlio_users` wird durch Auth-Provider plus `profiles` Tabelle ersetzt.
- `paddlio_session` und `paddlio_sessions` werden durch sichere Provider-Sessions ersetzt.
- `paddlio_data_<userId>` wird in normalisierte Tabellen fuer Training, Ziele, Wettkaempfe, Material, Journal und Profil aufgeteilt.
- `paddlio_clubs` und `paddlio_club_requests` werden Cloud-Tabellen mit Admin-Review.
- `paddlio_training_groups`, `paddlio_training_templates`, `paddlio_training_plan_items`, `paddlio_training_feedback` und `paddlio_season_goals` werden serverseitig nach userId, clubId und role gefiltert.
- Alte Demo- oder Legacy-Keys sollten nur fuer eine einmalige Migration gelesen und danach nicht mehr geschrieben werden.

## Serverrechte

- Athlete: darf nur eigene Datensaetze lesen und schreiben.
- Coach: darf nur Sportler, Gruppen, Trainingsvorlagen, Trainings, Feedback und Ziele des eigenen Vereins beziehungsweise der eigenen Gruppen lesen und bearbeiten.
- TeamAdmin: bleibt strukturell separat und kann zunaechst Coach-Rechte erhalten.
- Admin: darf alle Datensaetze sehen und verwalten.
- Trainerrechte duerfen nur durch Admin-Review oder eine serverseitige Admin-Aktion vergeben werden.
- Adminrechte duerfen niemals aus Client-State, LocalStorage oder Formularwerten entstehen.
- Traineranfragen, Rollenwechsel, Benutzerdeaktivierung und Loeschungen brauchen Audit-Felder wie `reviewedBy`, `updatedBy` und Zeitstempel.

## Empfehlung

Supabase ist fuer Paddlio der naheliegende erste Schritt, weil Postgres, Row Level Security, Auth, Storage und Edge Functions gut zu Vereins-, Rollen- und Analyse-Daten passen. Firebase ist ebenfalls moeglich, erfordert aber besonders sorgfaeltige Security Rules fuer clubId, coachId und userId.

## Risiken der aktuellen Demo-Auth

- Passwoerter und Sessions liegen lokal im Browser und sind nicht fuer sensible produktive Daten geeignet.
- Rollen koennen in einer reinen Frontend-Demo nicht wirklich vertrauenswuerdig geschuetzt werden.
- LocalStorage ist geraete- und browsergebunden, nicht synchronisiert und kann geloescht werden.
- Coach- und Admin-Funktionen wirken lokal, sind aber ohne Serverpruefung keine echte Zugriffskontrolle.

## Naechste Schritte fuer Version 3.0

1. Supabase- oder Firebase-Projekt anlegen und Auth aktivieren.
2. Tabellen fuer Users, Clubs, Groups, Training Templates, Training, Goals, Competitions, Material und Feedback modellieren.
3. Row Level Security beziehungsweise Security Rules fuer Athlete, Coach, TeamAdmin und Admin definieren.
4. Lokale Storage-Funktionen hinter ein Repository/API-Interface setzen.
5. Einmalige Migration aus LocalStorage in Cloud-Daten vorbereiten.
6. Deployment-Umgebungsvariablen fuer Vercel dokumentieren.
7. End-to-End-Tests fuer Registrierung, Login, Rollenwechsel und Datenisolierung einfuehren.
