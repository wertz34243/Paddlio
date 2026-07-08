# ADR 0006: Professionelles Trainingssystem für Version 0.6

## Kontext

Paddlio soll Trainingsplanung nicht nur als einfache Wochenliste behandeln, sondern als Kernfunktion für Athleten, Trainer, Sportler und später Gruppen im Verein.

## Entscheidung

`PlanEntry` wird zum professionellen Trainingsplan-Eintrag erweitert. Ein Eintrag enthält Datum, automatisch abgeleiteten Wochentag, Uhrzeit, Dauer, Trainingsbereich, Trainingsart, Trainingsziel, Intensität, Status und Notizen. Zusätzlich werden Felder für spätere Trainerfunktionen vorbereitet:

- `createdByUserId`
- `assignedAthleteId`
- `assignedGroupId`
- `feedbackNote`

## Konsequenzen

- Die App funktioniert weiter für einen Benutzer.
- Trainer können später Trainings erstellen und Athleten oder Gruppen zuweisen.
- Sportlerstatus wie erledigt oder ausgelassen ist bereits als eigener Zustand modelliert.
- Dashboard und Analyse berechnen Plan-Kennzahlen aus gespeicherten LocalStorage-Daten.
- Bestehende Daten werden nach `paddlemotion:v0.6:data` migriert.
