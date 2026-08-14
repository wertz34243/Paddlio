# Tablet Context Panel

## Prinzip

Der rechte Tablet-Bereich zeigt immer nur einen aktiven Kontext:

- Vorlagen
- Trainingsdetails
- Quick Edit
- leerer Kontext-Hinweis

Damit bleibt der Kalender sichtbar und die Trainerin oder der Trainer verliert beim Planen nicht die Orientierung.

## Verhalten

| Aktion | Kontext rechts |
| --- | --- |
| Keine Auswahl | Vorlagen oder ruhiger Hinweis |
| Vorlage antippen/ablegen | Quick Edit |
| Training antippen | Trainingsdetails |
| Quick Edit speichern/abbrechen | zurück zum Kalender/Vorlagen |

## Umsetzung

`TrainingCalendarView` rendert auf Tablet/Desktop einen gemeinsamen `master-calendar-context`. Phone nutzt weiter Bottom-Sheet/Modal-Verhalten.

