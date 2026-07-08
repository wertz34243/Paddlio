# ADR 0002: Lokales CRUD-Datenmodell für Version 0.2

## Kontext

Paddlio 0.2 soll echte Daten im Browser speichern können. Die App braucht dafür editierbare Datenmodelle für Wettkampf, Training und Material, ohne bereits ein Backend einzuführen.

## Entscheidung

Die App verwendet ein versioniertes LocalStorage-Modell unter `paddlemotion:v0.2:data`. React-State ist die aktive Datenquelle der UI; jede Aenderung wird automatisch persistiert. Fachliche Berechnungen liegen weiterhin in `src/domain/metrics.ts`.

## Modell

- `Competition`: Wettkampf mit zwei Laeufen, Platzierung, Abstand, Gefühl und Notiz
- `TrainingSession`: Training mit Typ, Dauer, RPE, Fokus und Notiz
- `MaterialItem`: Material mit Kategorie, Status, Bewertung und Notiz

## Konsequenzen

- Add/Edit/Delete ist ohne Backend möglich.
- Browser-Neustarts behalten die Daten.
- Die Storage-Schicht kann später durch API oder Datenbank ersetzt werden.
- Alte 0.1-Daten werden beim ersten Start nach 0.2 migriert.
- Berechnete Werte werden nicht gespeichert, sondern aus Rohdaten abgeleitet.
