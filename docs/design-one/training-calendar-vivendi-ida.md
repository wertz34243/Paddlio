# Trainingskalender: Vivendi-Übersicht, IDA-Tiefe

## Grundprinzip

Der Paddlio-Trainingskalender trennt die schnelle Wochenübersicht klar von der vollständigen Trainingsplanung.

- Kalenderkarte: zeigt nur die operative Kurzfassung.
- Trainingsdetail: zeigt die vollständigen sportwissenschaftlichen Parameter.

So bleibt das Wochenraster ruhig und scanbar, ohne spätere Trainingsdaten zu blockieren.

## Kalenderkarte

Die Karte im Raster verwendet nur:

- `startTime`
- `endTime`
- `title`
- `category`
- `color`
- `status`

Darstellung:

```text
16:30 - 17:30
K1 Technik
GA1 ✓
```

Nicht in der Kalenderkarte:

- lange Fokusbeschreibung
- individuelle Anpassung
- Trainerhinweise
- Notizen
- Feedbacktext
- Serien, Wiederholungen, Pausen
- große Aktionsbuttons

## Trainingsdetail

Beim Öffnen einer Karte wird der vollständige Trainingsdatensatz angezeigt. Die Detailansicht arbeitet mit Progressive Disclosure:

- wichtigste Planungsdaten zuerst
- Durchführung, Feedback und Aufgaben in Tabs
- zusätzliche Parameter über `Mehr anzeigen` oder aufklappbare Bereiche

Mögliche Trainingsbereiche:

- GA1
- GA2
- WA
- S
- SA
- KB

Weitere Parameter bleiben im Detail verfügbar, unter anderem Bootsklasse, Strecke, Wiederholungen, Serien, Pausen, Intensität, Pulsbereich, Belastungsbereich, Ziel, Beschreibung, Trainerhinweise, Durchführung und Feedback.

## UX-Ziel

Sportler erkennen in wenigen Sekunden:

- wann trainiere ich?
- was trainiere ich?
- wie intensiv ist es?

Trainer öffnen dieselbe Einheit und bearbeiten anschließend die vollständige Trainingsplanung.
