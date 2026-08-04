# Paddlio One - Layout-Verbesserungen

Stand: Development, Branch `develop`

## Layout-Bewertung

| Bereich | Phone | Tablet | Desktop |
|---|---:|---:|---:|
| Kalender | 7/10 | 6/10 | 6/10 |
| Training Übersicht | 7/10 | 6/10 | 6/10 |
| Plan/Woche | 6/10 | 6,5/10 | 6,5/10 |
| Journal | 7/10 | 6/10 | 6/10 |
| Vorlagen | 6/10 | 6/10 | 6/10 |

## Grundproblem

Phone ist inzwischen relativ gut auf Alltag ausgelegt. Tablet und Desktop brauchen aber noch stärker eigene Arbeitsflächen. Der verfügbare Platz soll nicht nur mehr Karten zeigen, sondern parallele Arbeit ermöglichen:

- Kalender + Vorlagen
- Liste + Detail
- Plan + Konflikte
- Training + Feedback
- Journal + Soll/Ist

## Kalender-Wireframes

### Phone

```text
┌─────────────────────────┐
│ Kalender                │
│ Heute  Woche  Liste     │
│ <  21. Juli  >          │
├─────────────────────────┤
│ Tagesliste              │
│ 16:30 Technik           │
│ 18:00 Kraft             │
├─────────────────────────┤
│ + Training              │
└─────────────────────────┘
```

### Tablet

```text
┌───────┬──────────────────────┬──────────────┐
│ Nav   │ Wochenkalender       │ Vorlagen     │
│       │ Zeitachse            │ Favoriten    │
│       │ Blöcke               │ Wochen       │
│       │                      │ Saison       │
└───────┴──────────────────────┴──────────────┘
```

### Desktop

```text
┌────────┬────────────────────────────────┬──────────────┐
│ Nav    │ Kalender 70-75 %               │ Vorlagen     │
│        │ Toolbar + Filter + Suche       │ Details      │
│        │ Woche/Monat/Jahr               │ Konflikte    │
├────────┴────────────────────────────────┴──────────────┤
│ Wochenplan, offene Rückmeldungen, Aufgaben              │
└─────────────────────────────────────────────────────────┘
```

## Wochenplanung-Wireframes

### Phone

```text
┌─────────────────────────┐
│ Diese Woche             │
│ Mo  Technik 16:30       │
│ Di  Kraft 17:30         │
│ Mi  frei                │
│ Do  GA1 16:30           │
│ [Woche kopieren]        │
└─────────────────────────┘
```

### Tablet/Desktop

```text
┌──────────────────────────────────────────┬──────────────┐
│ Mo │ Di │ Mi │ Do │ Fr │ Sa │ So         │ Vorlagen     │
│    │    │    │    │    │    │            │ Wochen       │
│ Trainingsblöcke per Drag & Drop          │ Konflikte    │
└──────────────────────────────────────────┴──────────────┘
```

## Jahresplanung-Wireframes

### Phone

```text
┌─────────────────────────┐
│ Saisonübersicht         │
│ Jan Grundlagen          │
│ Feb Aufbau              │
│ Mär Technik             │
│ Apr Wettkampf           │
└─────────────────────────┘
```

### Desktop

```text
┌────────┬────────────────────────────────────────────┬──────────────┐
│ Nav    │ Jan Feb Mär Apr Mai Jun Jul Aug Sep Okt... │ Bausteine    │
│        │ KW-Zeilen, Wettkämpfe, Belastungsphasen    │ Grundlagen   │
│        │                                            │ Aufbau       │
└────────┴────────────────────────────────────────────┴──────────────┘
```

## Training-Durchführung-Wireframes

### Phone

```text
┌─────────────────────────┐
│ Nächstes Training       │
│ Technik Aufwärtstore    │
│ 90 min · K1 · mittel    │
│ Fokus und Übungen       │
│ [Starten]               │
│ [Durchgeführt]          │
└─────────────────────────┘
```

### Tablet/Desktop

```text
┌──────────────────────┬──────────────────────┬──────────────┐
│ Trainingsplan        │ Detail               │ Feedback     │
│ heutige Einheiten    │ Übungen, Soll/Ist    │ Aufgaben     │
└──────────────────────┴──────────────────────┴──────────────┘
```

## Feedback-Wireframes

### Phone

```text
┌─────────────────────────┐
│ Feedback                │
│ RPE                     │
│ Dauer                   │
│ Wie war es?             │
│ Notiz                   │
│ [Speichern]             │
│ Details ergänzen        │
└─────────────────────────┘
```

### Desktop

```text
┌────────────────────┬──────────────────────┐
│ Offene Feedbacks   │ Feedback Detail      │
│ Sportlerliste      │ Antwort, Soll/Ist    │
└────────────────────┴──────────────────────┘
```

## Journal-Wireframes

### Phone

```text
┌─────────────────────────┐
│ Journal                 │
│ Diese Woche             │
│ Eintrag 1 Soll/Ist      │
│ Eintrag 2 Soll/Ist      │
└─────────────────────────┘
```

### Desktop

```text
┌──────────────┬─────────────────────────────┬──────────────┐
│ Filter       │ Journaltabelle              │ Soll/Ist     │
│ Woche/Gruppe │ Datum, Training, RPE, Gefühl │ Verlauf      │
└──────────────┴─────────────────────────────┴──────────────┘
```

## Layout-Prioritäten

### A

- Kalenderdetail rechts statt Seitenwechsel.
- Phone-Feedback als Bottom Sheet.
- Desktop-Kalender mit rechter Vorlagen-/Detailspalte.
- Tablet-Kalender mit Split View.

### B

- Jahresplanung kompakter und saisonorientiert.
- Journal auf Desktop als Tabelle + Detail.
- Trainingskarten überall gleich aufgebaut.

### C

- Ultrawide: vier Spalten mit Kalender, Vorlagen, Details, Feedback.
- Druck-/Exportlayout für Wochenplan.

