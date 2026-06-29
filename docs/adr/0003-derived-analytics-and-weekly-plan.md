# ADR 0003: Abgeleitete Kennzahlen und Wochenplan fuer Version 0.3

## Kontext

Paddlio 0.3 soll intelligenter werden. Dashboard und Analyse duerfen nicht mehr mit festen Werten arbeiten, sondern muessen Kennzahlen aus gespeicherten Wettkampf- und Trainingsdaten berechnen. Zusaetzlich braucht die Athleten-App einen einfachen Wochenplan.

## Entscheidung

Kennzahlen werden als reine Funktionen in `src/domain/metrics.ts` berechnet. Der Wochenplan wird als `PlanEntry[]` Teil des versionierten LocalStorage-Modells `paddlemotion:v0.3:data`.

## Enthaltene Kennzahlen

- Wettkampfanzahl
- beste K1- und C1-Gesamtzeit
- Durchschnittszeit je Bootsklasse
- Strafschnitt je Bootsklasse und insgesamt
- Trainingsminuten und Einheiten der aktuellen Woche
- letzter Wettkampf und letzte Trainingseinheit
- K1-C1-Differenz bei gleichem Datum und Ort
- Saisonziel-Fortschritt

## Konsequenzen

- UI-Komponenten zeigen Kennzahlen nur an und berechnen sie nicht selbst.
- Fehlende Daten werden als Platzhalter dargestellt.
- Der Plan kann spaeter mit echten Trainingssessions, Trainerfreigaben oder Kalenderexporten verbunden werden.
- Bestehende 0.2-Daten werden migriert, indem der Wochenplan ergaenzt wird.
