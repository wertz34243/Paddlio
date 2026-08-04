# Paddlio One Seiten-Wireframes

Stand: 2026-08-04  
Branch: `develop`

Wireframes sind strukturelle Zielbilder, keine pixelgenauen Designs.

## Phone: Heute

```text
┌─────────────────────────┐
│ Paddlio        Profil   │
│ Guten Morgen, Name      │
│ Dienstag, 4. August     │
├─────────────────────────┤
│ Nächstes Training       │
│ Titel, Zeit, Dauer      │
│ [Training starten]      │
├─────────────────────────┤
│ KI / Belastung kurz     │
├─────────────────────────┤
│ Rückmeldungen           │
├─────────────────────────┤
│ Aufgaben                │
├─────────────────────────┤
│ Heute Kalender          │
└─────────────────────────┘
Bottom: Heute Kalender Training Team Mehr
```

## Tablet Landscape: Kalender

```text
┌──────────┬───────────────────────────────┬──────────────┐
│ Sidebar  │ Kalender Toolbar              │ Vorlagen     │
│ Heute    │ Tag Woche Monat Jahr + Filter │ Favoriten    │
│ Kalender ├───────────────────────────────┤ Meine        │
│ Training │ Wochenraster                  │ Verein       │
│ Plan     │ Mo Di Mi Do Fr Sa So          │ System       │
│ Team     │ Trainingsblöcke               │ Wochen       │
│ Analyse  │ Drop-Zonen                    │ Saison       │
│ Polar    ├───────────────────────────────┤              │
│ Mehr     │ Auswahl/Details               │ Ziehen       │
└──────────┴───────────────────────────────┴──────────────┘
```

## Desktop: Übersicht

```text
┌──────────┬──────────────┬──────────────┬──────────────┬──────────────┐
│ Sidebar  │ Heute        │ Wochenplan   │ Belastung    │ Schnellzugriff│
│          │ nächstes     │ KW           │ Soll/Ist     │ Aktionen      │
│          │ Training     │ Liste        │ Chart        │ Nachrichten   │
├──────────┼──────────────┼──────────────┼──────────────┼──────────────┤
│          │ Feedback     │ Aufgaben     │ Polar        │ Termine       │
│          │ Liste        │ Liste        │ KPI/Trend    │ Liste         │
└──────────┴──────────────┴──────────────┴──────────────┴──────────────┘
```

## Desktop: Kalender

```text
┌──────────┬─────────────────────────────────────────────┬──────────────┐
│ Sidebar  │ Toolbar: Heute < > Tag Woche Monat Jahr     │ Vorlagen     │
│          ├─────────────────────────────────────────────┤ Favoriten    │
│          │ Kalender 70-75 %                            │ Zuletzt      │
│          │ Wochen-/Monatsraster                        │ Meine        │
│          │ Trainingsblöcke mit Status                  │ Verein       │
│          ├─────────────────────────────────────────────┤ Wochen       │
│          │ Detail / Trainingsliste / Konflikte         │ Saison       │
└──────────┴─────────────────────────────────────────────┴──────────────┘
```

## Training Detail

```text
Header: Titel, Status, Datum, Gruppe

Links / oben:
  SOLL
  Dauer, Intensität, Fokus, Übungen, Trainer

Rechts / darunter:
  IST
  Durchführung, RPE, Feedback, Polar, Trainerfeedback

Actions:
  Starten, Durchgeführt, Teilweise, Feedback, Bearbeiten

Sektionen:
  Individuelle Anpassungen
  Traineraufgaben
  Material
  Notizen
```

## Team Desktop

```text
┌──────────┬─────────────────────┬─────────────────────────────┐
│ Sidebar  │ Sportler/Gruppen    │ Detail                      │
│          │ Suche, Filter       │ Profil, Belastung, Feedback │
│          │ Tabelle/ListRows    │ Aufgaben, Nachrichten       │
└──────────┴─────────────────────┴─────────────────────────────┘
```

## Analyse Desktop

```text
┌──────────┬────────────────────────────────────────────────────┐
│ Sidebar  │ KPI-Zeile: Zeit, Einheiten, Belastung, HF, Recovery│
│          ├──────────────────────┬─────────────────────────────┤
│          │ Belastung Chart      │ Polar Zonen                 │
│          ├──────────────────────┼─────────────────────────────┤
│          │ Soll/Ist Vergleich   │ Feedbacktrend               │
│          ├──────────────────────┴─────────────────────────────┤
│          │ Wettkampf / Ziele / Rekorde                         │
└──────────┴────────────────────────────────────────────────────┘
```
