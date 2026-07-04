# Paddlio Vereinsportal

Stand: Version 3.7

## Ziel

Das Vereinsportal erweitert Paddlio von einer Trainingsplattform zu einer Vereinsplattform fuer Kanuslalom. Trainer, ClubAdmins und Admins verwalten Mitglieder, Gruppen, Material, Boote, Termine, Dokumente, Nachrichten und Vereineinstellungen zentral.

## Module

- Dashboard: Mitglieder, Trainer, Gruppen, Trainings, Wettkaempfe, Material und Vereinsziele
- Mitglieder: Suche, Rollen, Altersklasse, Bootsklasse, Status und Eintrittsdatum
- Trainer: Trainerprofile, Lizenz- und Qualifikationsplatzhalter
- Gruppen: Gruppenuebersicht mit Altersklasse, Bootsklassen, Trainer und Teilnehmern
- Material: Inventarnummer, Kategorie, Zustand, Besitzer, Foto, letzte Pruefung und Bemerkung
- Boote: Hersteller, Modell, Bootsklasse, Laenge, Gewicht, Baujahr, Besitzer, Vereinsboot und Sportlerverknuepfung
- Vereinskalender: Training, Wettkampf, Sitzung, Vereinsfeier und Arbeitseinsatz
- Dokumente: PDF/Word/Excel/Bild-Metadaten und Ordnerstruktur
- Nachrichten: Mitteilungen an Verein, Trainer, Sportler, Gruppen oder einzelne Sportler
- Einstellungen: Logo, Farben, Adresse, Homepage, Ansprechpartner, Vereinsnummer und Impressum

## Rollenrechte

- Athlete: sieht nur eigene Vereinszuordnung.
- Coach: sieht und verwaltet den eigenen Verein im operativen Rahmen.
- TeamAdmin: wird aktuell wie Coach behandelt, bleibt aber als eigene Rolle erhalten.
- ClubAdmin: verwaltet den eigenen Verein, Mitglieder, Gruppen, Trainer und Vereinsdaten.
- Admin: sieht alle geladenen Vereine und darf alles verwalten.

## Supabase

Neue Tabellen:

- `club_material`
- `boats`
- `club_events`
- `club_documents`
- `club_messages`
- `club_settings`

Migration:

- `supabase/migrations/0010_club_management_portal.sql`

Die Migration erweitert zudem `profiles.roles` um `ClubAdmin` und legt RLS-Policies fuer Vereinszugriff an.

## Grenzen

Datei-Uploads sind in Version 3.7 als Dokument-Metadaten mit Datei-URL vorbereitet. Echte Uploads brauchen spaeter Supabase Storage Buckets, MIME-Regeln und separate Storage Policies.

Drag & Drop fuer Sportlergruppen ist fachlich vorbereitet, die erste Version nutzt mobile-taugliche Karten und Zuordnungen statt komplexem Desktop-only Drag & Drop.
