# Date-only Architektur

Date-only Werte in Paddlio haben immer das Format `YYYY-MM-DD` und stehen für einen lokalen Kalendertag, nicht für einen UTC-Zeitpunkt.

## Zentrale Datei

`src/lib/dateOnly.ts`

Wichtige Funktionen:

- `todayDateKey`
- `parseDateKey`
- `formatDateKey`
- `isValidDateKey`
- `compareDateKeys`
- `addDaysToDateKey`
- `startOfWeekDateKey`
- `endOfWeekDateKey`
- `dateKeyFromLocalDate`
- `dateKeyToLocalDate`
- `normalizeDateKey`

## Regeln

- `new Date("YYYY-MM-DD")` nicht für Kalenderdaten verwenden.
- `toISOString().slice(0, 10)` nicht für lokale Trainingstage verwenden.
- Timestamps bleiben UTC-Timestamps.
- Kalender, Training, Wettkampf, Akademie-Zuweisungen, Import/Export und Polar-Zuordnung nutzen lokale DateKeys.

## Polar

Polar liefert Zeitpunkte. Beim Übernehmen ins Trainingstagebuch wird daraus ein lokaler DateKey erzeugt. Dadurch bleibt ein Training vom Dienstag auf Dienstag, auch wenn der UTC-Zeitpunkt je nach Zeitzone auf Montag fallen könnte.

## Tests

Unit-Tests prüfen unter anderem:

- Monatswechsel
- Jahreswechsel
- Sommerzeit/Winterzeit
- Dienstag bleibt Dienstag
- Leap Year
- Polar-Zeitstempel zu lokalem Trainingstag
