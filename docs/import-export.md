# Paddlio Import & Export

Der Bereich ist erreichbar über `Mehr -> Integrationen` und bündelt Dateiimport, Export, Importprofile und Importhistorie.

## Unterstützte Dateiformate

- CSV mit Semikolon, Komma oder Tabulator
- XLSX
- XLS

ODS, JSON, XML, GPX, FIT, TCX, Polar und Garmin sind architektonisch vorbereitet, aber noch nicht als aktive Quellen freigeschaltet.

## Importablauf

1. Importart wählen
2. Datei auswählen
3. Datei analysieren
4. Tabellenblatt und Kopfzeile prüfen
5. Spalten zuordnen
6. Vorschau und Validierung prüfen
7. Import ausdrücklich bestätigen
8. Import ausführen
9. Bericht in der Importhistorie speichern

Kritische Fehler blockieren den Import. Warnungen bleiben sichtbar und können bewusst akzeptiert werden.

## Importtypen in Version 1

- Sportlerlisten
- Trainingspläne
- Trainingseinheiten
- Startlisten
- Wettkampfergebnisse
- Vereinsmitglieder
- Gruppen
- Materiallisten

Jeder bestaetigte Import schreibt zuerst in den fachlich passenden Cloud-Pfad. Erst nach erfolgreicher Cloud-Uebernahme wird der lokale App-Zustand aktualisiert und der Importbericht als erfolgreich angezeigt.

| Importtyp | Dauerhaftes Ziel |
| --- | --- |
| Trainingsplan | `training_plan_items`, danach Kalender/Planung |
| Trainingseinheiten | `training_journal_entries`, danach Journal |
| Wettkampfergebnisse | `competitions` und `competition_results` |
| Sportlerliste | `imported_club_members` als berechtigungsneutrale Einladung/Vorstufe |
| Startliste | `competition_start_entries`, fest einem vorhandenen Wettkampf zugeordnet |
| Vereinsmitglieder | `imported_club_members` als berechtigungsneutrale Mitgliedervorstufe |
| Gruppen | `training_groups` |
| Materialliste | `materials` |

Importierte Personen werden nicht automatisch zu Auth-Konten und erhalten keine Rollenrechte. Ein registriertes Profil wird erst ueber den bestehenden Einladungs-/Mitgliederprozess verknuepft.

## Sicherheit

- Bestehende Daten werden nicht gelöscht.
- Bestehende Daten werden nicht ungefragt überschrieben.
- CSV-/Excel-Exports schützen Werte, die Tabellenprogramme als Formeln interpretieren könnten.
- Importdateien werden im Browser analysiert und nicht dauerhaft gespeichert.
- Importberichte enthalten nur begrenzte Zeilenprotokolle.
- Neue Supabase-Tabellen sind per RLS geschützt.
- Organisationsimporte sind nur fuer Coach, TeamAdmin, ClubAdmin und Admin sichtbar. Athleten koennen nur eigene Plaene, Einheiten, Ergebnisse und eigenes Material importieren.
- Wiederholte Imports werden anhand fachlicher Identitaeten (zum Beispiel Wettkampf/Startnummer/Boot oder Datum/Zeit/Titel) uebersprungen.

## Supabase

Migration:

`supabase/migrations/0027_import_export_module.sql`

Ergaenzend:

`supabase/migrations/20261001131418_competition_start_entries.sql`

Neue Tabellen:

- `import_jobs`
- `import_profiles`
- `import_rows`
- `export_jobs`
- `competition_start_entries`
- `imported_club_members`

Die Migration ist idempotent und für bestehende Datenbanken ausgelegt.

## Export

Exportformate:

- XLSX
- CSV

Exportierbare Bereiche:

- Trainingspläne
- Trainingstagebuch
- Sportlerlisten
- Mitglieder
- Gruppen
- Wettkämpfe
- Ergebnisse
- Material
- Ziele
- Rekorde
- Akademie-Fortschritt

## Offene Ausbaustufen

- Serverseitige Datei-Verarbeitung für sehr große Dateien
- Web Worker für große Browser-Imports
- Sichere Undo-Funktion für eindeutig neue Datensätze
- Mehr Konfliktauflösung pro Zeile
- Downloadbare Beispielvorlagen
- Polar/Garmin/GPX/FIT-Adapter
- Zusätzliche Exportfilter und gespeicherte Exportprofile
