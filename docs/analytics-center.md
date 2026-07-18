# Paddlio Analytics Center

## Kennzahlen

Paddlio 3.5 berechnet im Analysezentrum:

- Trainingsminuten im Zeitraum und Monat
- Anzahl Trainings und Statusverteilung erledigt/geplant/ausgelassen
- offene Rückmeldungen und Feedbackquote
- Trainingsbereiche und Intensitätsverteilung
- beste K1- und C1-Zeiten
- Strafsekunden-Schnitt
- K1/C1-Differenz am gleichen Datum und Ort
- Zielstatus, Zielquote und Fortschritt je Ziel
- regelbasierte Belastung mit sportlicher Empfehlung

## Datenquellen

Die Auswertung nutzt die bereits synchronisierten Cloud-/Cache-Daten:

- `profiles`
- `clubs`
- `training_plan_items`
- `training_feedback`
- `training_templates`
- `season_goals`
- `competitions`
- `competition_results`
- `training_groups`
- `group_members`

Der Client berechnet aus dem rollenbasiert geladenen Daten-Snapshot. Supabase RLS bleibt die entscheidende Datenschutzschicht.

## Rollenrechte

- Athlete sieht nur eigene Analyse.
- Coach sieht eigene Daten, Sportler im eigenen Verein und eigene Gruppen.
- Admin sieht die Plattformübersicht.

Die UI blendet Views passend zur Rolle ein. Die Datenabfragen müssen weiterhin in Supabase nach Rolle, `userId` und `clubId` geschützt sein.

## Belastungsanalyse

Die Belastung ist regelbasiert und nutzt:

- Trainingsdauer
- Intensität
- harte Einheiten
- Regenerationseinheiten
- Feedbackwerte für Müdigkeit, Gefühl, Motivation und Schlaf

Ausgabe:

- niedrig
- normal
- hoch
- sehr hoch

Die Empfehlungen sind sportliche Trainingshinweise und keine medizinischen Aussagen.

## Grenzen

- Diagramme sind bewusst leichte CSS/SVG-nahe Komponenten und keine externe Chart-Bibliothek.
- Coach-/Admin-Auswertungen nutzen den aktuell geladenen Daten-Snapshot.
- Sehr große Vereine brauchen später Pagination und serverseitige Aggregationen.

## Vorbereitung KI-Coach 3.6

Die Kennzahlen sind so strukturiert, dass ein später KI-Coach daraus Empfehlungen ableiten kann:

- Trainingskonsistenz
- Belastungstrend
- technische Schwerpunkte
- Zielrisiken
- Wettkampfentwicklung

Vor einer KI-Erweiterung sollten die Kennzahlen serverseitig normalisiert und mit klaren Datenschutzregeln versehen werden.
