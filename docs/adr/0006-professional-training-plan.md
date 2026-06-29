# ADR 0006: Professionelles Trainingssystem fuer Version 0.6

## Kontext

Paddlio soll Trainingsplanung nicht nur als einfache Wochenliste behandeln, sondern als Kernfunktion fuer Athleten, Trainer, Sportler und spaeter Gruppen im Verein.

## Entscheidung

`PlanEntry` wird zum professionellen Trainingsplan-Eintrag erweitert. Ein Eintrag enthaelt Datum, automatisch abgeleiteten Wochentag, Uhrzeit, Dauer, Trainingsbereich, Trainingsart, Trainingsziel, Intensitaet, Status und Notizen. Zusaetzlich werden Felder fuer spaetere Trainerfunktionen vorbereitet:

- `createdByUserId`
- `assignedAthleteId`
- `assignedGroupId`
- `feedbackNote`

## Konsequenzen

- Die App funktioniert weiter fuer einen Benutzer.
- Trainer koennen spaeter Trainings erstellen und Athleten oder Gruppen zuweisen.
- Sportlerstatus wie erledigt oder ausgelassen ist bereits als eigener Zustand modelliert.
- Dashboard und Analyse berechnen Plan-Kennzahlen aus gespeicherten LocalStorage-Daten.
- Bestehende Daten werden nach `paddlemotion:v0.6:data` migriert.
