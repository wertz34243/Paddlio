# Responsive Layouts

## Phone

Ziel: Training durchführen und schnell reagieren.

- Einspaltig
- große Touchflächen
- wenige Karten
- primäre Aktion zuerst
- Bottom Navigation
- Header reduziert und scrollsensibel
- komplexe Tabellen vermeiden

Kernseiten:

- Heute: nächstes Training, Rückmeldungen, Aufgaben, Termine
- Kalender: Tag, 3 Tage, Liste, kompakte Woche
- Training: starten, durchgeführt, teilweise, Feedback, RPE, Notiz
- Team: Gruppe, Trainer, Nachrichten, Anwesenheit
- Mehr: gruppierte Liste

## Tablet

Ziel: Training planen und am Wasser arbeiten.

- kompakte Sidebar
- Split View
- Kalender + Vorlagen
- gute Touchziele
- Portrait mit reduzierter Spaltenzahl
- Landscape als Arbeitsfläche

Kernlayouts:

- Kalender links/Mitte, Vorlagen rechts
- Sportlerliste links, Feedback/Profil rechts
- Kursliste links, Lektion rechts
- Importvorschau + Mapping bei kleineren Dateien

## Desktop

Ziel: vollständig planen, analysieren und verwalten.

- kompakte Sidebar
- 3-4 Spalten auf Dashboard
- flachere Karten
- kompaktere Buttons
- Tabellen und Listen, wo fachlich sinnvoll
- Dialoge breiter und mehrspaltig
- weniger vertikales Scrollen

Wichtig für 1366 x 768:

- Heute-Dashboard muss mehrere Bereiche gleichzeitig zeigen.
- Trainingskarten dürfen keine langen Mobile-Karten bleiben.
- Kalender muss ohne große Header mehr Rasterfläche bekommen.

## Breakpoints

Aktuelle zentrale Logik:

- Phone: unter 768 px
- Tablet: 768 bis 1199 px
- Desktop: ab 1200 px

Zusätzlich werden Touch, Hover, Pointer, Standalone-Modus, iOS/iPadOS/macOS und Split-Layout-Fähigkeit berücksichtigt.
