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

Der erste Importpfad schreibt in die bestehenden lokalen Paddlio-Datenstrukturen und protokolliert Importjobs, Importzeilen und Profile in Supabase.

## Sicherheit

- Bestehende Daten werden nicht gelöscht.
- Bestehende Daten werden nicht ungefragt überschrieben.
- CSV-/Excel-Exports schützen Werte, die Tabellenprogramme als Formeln interpretieren könnten.
- Importdateien werden im Browser analysiert und nicht dauerhaft gespeichert.
- Importberichte enthalten nur begrenzte Zeilenprotokolle.
- Neue Supabase-Tabellen sind per RLS geschützt.

## Supabase

Migration:

`supabase/migrations/0027_import_export_module.sql`

Neue Tabellen:

- `import_jobs`
- `import_profiles`
- `import_rows`
- `export_jobs`

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
