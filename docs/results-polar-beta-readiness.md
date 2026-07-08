# Paddlio 3.9 - Results, Polar Sync & Beta Readiness

## Ziel

Version 3.9 schliesst die wichtigsten Funktionsbereiche vor der 4.0-Beta: bessere Ergebnisverwaltung, vorbereitete externe Trainingsdaten, Polar-Sync-Architektur und ein Admin-Beta-Check.

## Ergebnisverwaltung

Paddlio erweitert `competition_results` um:

- Laufzeiten, Strafsekunden und Gesamtzeiten fuer Lauf 1 und Lauf 2
- besten Lauf
- Platzierung, Starterzahl, Abstand zum Sieger, Podium und persoenlicher Bestzeit
- Strecke, Ort, Altersklasse und Bootsklasse
- Ergebnisquelle, Importquelle und Trainerkommentar

Bestehende Felder bleiben erhalten. Die Migration fuegt nur fehlende Spalten hinzu.

## Persoenliche Bestzeiten

Bestzeiten werden aus geladenen Ergebnissen berechnet nach:

- Athlet
- Bootsklasse
- Strecke
- Ort

Die Tabelle `personal_bests` speichert berechnete Bestzeiten fuer Cloud-Sync und spaetere Auswertungen.

## Import-Vorbereitung

`result_imports` bereitet CSV, Excel, PDF, Web-Links und manuelle Quellen vor. Automatische Scraper sind absichtlich nicht aktiv, damit Beta-Tests stabil bleiben.

Statuswerte:

- `draft`
- `preview`
- `imported`
- `failed`

## Polar und externe Trainingsdaten

`external_connections` und `external_training_sessions` bereiten Polar Flow und spaetere Anbieter vor.

Wichtig:

- Keine Client-Secrets in `VITE_*` Variablen speichern.
- Echte OAuth-Flows muessen ueber Supabase Edge Functions oder ein separates Backend laufen.
- Frontend zeigt nur Status, Metadaten und importierte Trainings.

Unterstuetzte vorbereitete Provider:

- `polar`
- `garmin_prepared`
- `apple_health_prepared`
- `manual`

## Belastung

Die 3.9-Belastungsansicht nutzt externe Trainingsdaten fuer:

- Trainingsdauer pro Woche
- Vergleich zur Vorwoche
- unverknuepfte externe Einheiten
- einfache Hinweise bei starkem Umfangsanstieg

Das ist Trainingssteuerung, keine medizinische Bewertung.

## Smart Coach Erweiterungen

Neue Regeln:

- Wettkampf in sieben Tagen: Umfang reduzieren, Technik sauber halten
- Ergebnis verbessert: positive Rueckmeldung
- lange kein Ergebnis: Ergebnis nachtragen
- externe Einheit unverknuepft: Training verknuepfen
- externe Belastung stark gestiegen: Erholung bewusst planen

## Beta-Check

Admins koennen eine Checkliste ausfuehren fuer:

- Supabase
- Nutzer/Rollen
- Gruppen
- Trainingsplanung
- Kommunikation
- Ergebnisse
- Mobile Ansicht
- Datenschutz/RLS

Automatische Checks nutzen den geladenen Snapshot. Einige Punkte bleiben bewusst manuell, weil echte Mobile- und RLS-Validierung im Supabase/Vercel-Setup bestaetigt werden muss.

## Supabase Tabellen

Migration:

`supabase/migrations/0012_results_polar_beta_readiness.sql`

Neue beziehungsweise erweiterte Tabellen:

- `competition_results`
- `personal_bests`
- `result_imports`
- `external_connections`
- `external_training_sessions`
- `beta_readiness_checks`

## Datenschutz

Grundregeln:

- Athlete sieht eigene Ergebnisse, externe Trainings und Bestzeiten.
- Coach sieht Ergebnisse und Trainingsdaten der eigenen Vereins-/Gruppensportler.
- ClubAdmin sieht den eigenen Verein.
- Admin sieht alles.

RLS bleibt Pflicht. UI-Filter sind nur zusaetzliche UX.

## Grenzen

- Polar OAuth ist vorbereitet, aber noch nicht aktiv.
- CSV/PDF/Excel Import ist als Struktur vorbereitet, aber noch ohne Parser.
- Beta-Check ersetzt keine echte Security-Pruefung in Supabase.
- LocalStorage bleibt nur Cache und Offline-Fallback.
