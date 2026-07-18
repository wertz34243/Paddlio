# ADR 0003: Abgeleitete Kennzahlen und Wochenplan für Version 0.3

## Kontext

Paddlio 0.3 soll intelligenter werden. Dashboard und Analyse dürfen nicht mehr mit festen Werten arbeiten, sondern müssen Kennzahlen aus gespeicherten Wettkampf- und Trainingsdaten berechnen. Zusätzlich braucht die Athleten-App einen einfachen Wochenplan.

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
- Der Plan kann später mit echten Trainingssessions, Trainerfreigaben oder Kalenderexporten verbunden werden.
- Bestehende 0.2-Daten werden migriert, indem der Wochenplan ergänzt wird.
