# Paddlio Codex Handoff

## Stand

- Datum/Uhrzeit: 2026-10-02 07:29 CEST
- Stabilitaetsblock: Praxistest-Fixes fuer Import/Export, Wettkampf, Trainingsplanung und Kalender-UI
- Status: IMPLEMENTIERT, DEV-SCHEMA AKTUALISIERT, AUTOMATISIERTE REGRESSION GRUEN

## Root Cause

- Sieben Importarten erzeugten teilweise nur lokale Vorschauobjekte oder meldeten Erfolg, ohne den fachlichen Cloud-Zielbereich vollstaendig zu persistieren. Gruppen hatten keinen Write-Pfad; Startlisten wurden faelschlich wie Sportlerdaten behandelt; Wettkampfergebnisse konnten fremde Namen still dem aktuellen Nutzer zuordnen.
- Mobile Wettkampfergebnisse schrieben die nicht vorhandene DEV-Spalte `competition_results.starter_field`; nur `starter_count` existiert.
- Das DEV-Schema hatte keine fachliche Startlisten- bzw. Import-Staging-Struktur und dem Journal fehlten aktive Durchfuehrungsfelder.
- Native `select`-Optionen erbten im Dark Mode helle Browserfarben. Kalenderaktionen konnten bei mittleren Desktopbreiten kollidieren; der Vorlagenkontext hatte keinen verlaesslichen eigenen Scrollbereich.
- Neue Eintraege verwendeten teils feste Uhrzeiten. Die Rollen-UI wurde vor Abschluss des eigenen Profilabrufs mit einem provisional Athlete-Profil freigegeben.
- Zwei Playwright-Helfer werteten noch ladende Optionen/Navigation als Endzustand; native Scrollanimationen konnten direkt folgende Tastendruecke verschlucken.

## Aenderungen

- Alle acht Importtypen besitzen jetzt einen expliziten Persistenzpfad und Erfolg wird nur nach bestaetigter Speicherung gemeldet.
- Zielrouten: Trainingsplan -> `training_plan_items`; Trainingseinheiten -> `training_journal_entries`; Wettkampfergebnisse -> `competition_results`; Sportler/Vereinsmitglieder -> `imported_club_members`; Startlisten -> `competition_start_entries`; Gruppen -> `training_groups`; Material -> `materials`.
- Startlisten werden einem vorhandenen Wettkampf zugeordnet und nicht mehr als neue Auth-Nutzer angelegt. Personenimporte bleiben sichere Vereins-Stagingdaten ohne Rollen- oder Login-Erteilung.
- Pflichtfelder, Synonyme, Laufzeitfehler, Teilimportzahlen und Duplikatschutz wurden erweitert. Organisationale Imports sind fuer Athletes ausgeblendet.
- Wettkampf-Writes laufen ueber den Retry-/Offline-Pfad; veraltetes `starter_field` wurde entfernt. Startlisten werden in der Wettkampfansicht angezeigt, mobile Formulare stapeln sauber.
- Neue Datums-/Zeitfelder verwenden die lokale Geraetezeit; gespeicherte Werte werden beim Bearbeiten nicht ueberschrieben.
- Athletes koennen eigene Vorlagen sowie Wochen- und Saisonplanung verwenden. Coach/Admin-Zuweisungen bleiben rollenbegrenzt.
- Quick-Edit-, Filter- und vergleichbare native Selects haben lesbare Dark-/Light-Optionen. Kalenderaktionen umbrechen ohne Ueberlagerung; Liste/Vorlagen sind auf Desktop konsistent; der Vorlagenpicker scrollt per Maus, Touchpad und Touch.
- Die echte Cloud-Rolle wird vor Freigabe der App-Shell geladen. E2E-Navigation, Tabwechsel und Desktop-Scrollpruefungen sind zustandsbasiert stabilisiert.
- Offline- und Polar-Grenzen sowie Importziele wurden dokumentiert; DEV-Polar-URLs zeigen auf `https://dev.paddlio.de`.

## Migrationen

- Neu: `supabase/migrations/20261001131418_competition_start_entries.sql`.
- Additiv/idempotent: `competition_start_entries`, `imported_club_members`, fehlende Journal-Durchfuehrungsspalten, Indizes, RLS-Policies, Grants, Realtime und PostgREST-Reload.
- Keine Tabellen gedroppt und keine Nutzdaten geloescht.

## Supabase DEV Ergebnis

- Vor jedem DB-Schritt geprueftes Ziel: ausschliesslich `nlllqsfdhfiwticrcrnp` (DEV); Production `twlkhfbrrwjwppxinmpn` war nicht verknuepft.
- Migration auf DEV erfolgreich angewendet und idempotent erneut geprueft.
- Beide neuen Tabellen vorhanden, RLS aktiv, Policies vorhanden und Realtime aktiviert.
- Fehlende Journalspalten sind vorhanden.
- Reales DEV-Schema bestaetigt `competition_results.starter_count`; `starter_field` existiert nicht und wird nicht mehr geschrieben.
- `training_groups.age_range` existiert nicht und wird nicht mehr als Importpayload gesendet.

## Tests

- `npm ci`: erfolgreich, 108 Pakete.
- `npm audit`: 0 bekannte Schwachstellen.
- `npm test`: 26 Dateien, 143/143 Tests.
- Parser: reale CSV-, XLS- und XLSX-Dateien getestet.
- Import-Engine/Persistenz: alle acht fachlichen Importtypen, Zieltabellen, Teilfehler und Duplikatschutz getestet.
- `npm run build`: erfolgreich, 186 Module; nur bestehender Chunk-Hinweis.
- `check:encoding`, `check:rls`, `check:bundle`, `check:a11y`, `check:beta`: erfolgreich.
- `npm run test:e2e`: 42 bestanden, 24 vorgesehene projekt-/viewportbezogene Skips, 0 Fehler.
- `npm run test:e2e:roles`: 9 bestanden, 1 vorgesehener Mobile-Mehrgeraete-Skip, 0 Fehler.
- Zusaetzlich: Desktop-Scrolltest 5 Wiederholungen gruen; Zwei-Geraete-Coach/Athlete-Flow gruen.

## Offene Punkte

- Polar benoetigt weiterhin die externe Provider-/Vercel-Konfiguration und einen realen OAuth-Providerlauf; keine geheimen Schluessel wurden in den Client aufgenommen.
- Der abschliessende manuelle Import-Praxistest mit Beispiel-Dateien auf iPhone, iPad und PC ist noch auszufuehren. Die automatisierten Parser-, Persistenz- und Cloud-Schema-Pruefungen sind gruen.
- Die von E2E-Laeufen aktualisierten Screenshotdateien waren bereits ausserhalb dieses Arbeitsumfangs geaendert und werden nicht mit diesem Block committed.
- Bestehende organisatorische/rechtliche Releasepunkte aus dem Security-Handoff bleiben unberuehrt.

## Naechste sinnvolle Aufgabe

Manueller DEV-Praxistest: je eine fiktive CSV/XLS/XLSX-Datei ueber die UI importieren, Zielbereich nach Reload auf iPhone/iPad/PC kontrollieren und anschliessend den Polar-OAuth-Lauf mit korrekt hinterlegter DEV-Konfiguration pruefen.

## Sicherheitsbestaetigung

- Ausschliesslich Branch `develop` verwendet.
- Ausschliesslich Supabase DEV `nlllqsfdhfiwticrcrnp` veraendert.
- `main` unveraendert.
- Production Supabase `twlkhfbrrwjwppxinmpn` unveraendert.

## Commit und Pushstatus

- Commit: wird nach finaler Diff-Pruefung erstellt.
- Pushstatus: ausstehend bis zum Commit dieses Blocks.
