# ADR 0002: Lokales CRUD-Datenmodell fuer Version 0.2

## Kontext

Paddlio 0.2 soll echte Daten im Browser speichern koennen. Die App braucht dafuer editierbare Datenmodelle fuer Wettkampf, Training und Material, ohne bereits ein Backend einzufuehren.

## Entscheidung

Die App verwendet ein versioniertes LocalStorage-Modell unter `paddlemotion:v0.2:data`. React-State ist die aktive Datenquelle der UI; jede Aenderung wird automatisch persistiert. Fachliche Berechnungen liegen weiterhin in `src/domain/metrics.ts`.

## Modell

- `Competition`: Wettkampf mit zwei Laeufen, Platzierung, Abstand, Gefuehl und Notiz
- `TrainingSession`: Training mit Typ, Dauer, RPE, Fokus und Notiz
- `MaterialItem`: Material mit Kategorie, Status, Bewertung und Notiz

## Konsequenzen

- Add/Edit/Delete ist ohne Backend moeglich.
- Browser-Neustarts behalten die Daten.
- Die Storage-Schicht kann spaeter durch API oder Datenbank ersetzt werden.
- Alte 0.1-Daten werden beim ersten Start nach 0.2 migriert.
- Berechnete Werte werden nicht gespeichert, sondern aus Rohdaten abgeleitet.
