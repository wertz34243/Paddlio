# Responsive Density

Paddlio nutzt drei Dichte-Stufen. Rollen und Berechtigungen bleiben fachlich getrennt von der Darstellung: Die Rolle entscheidet, was ein Nutzer darf; die Geräteklasse entscheidet, wie viel Oberfläche gleichzeitig gezeigt wird.

## Phone

- großzügige Sport-App-Darstellung
- Bottom Navigation mit maximal fünf Punkten: Heute, Kalender, Training, Team, Mehr
- einspaltige Tages- und Trainingsansicht
- große Touchflächen für Starten, Abschließen, Feedback und Nachrichten
- keine komplexe Jahresplanung oder große Tabellen

Zentrale Werte:

- Page Padding: 18 px
- Section Gap: 24 px
- Card Padding: 20 px
- Button Height: 52 px
- Input Height: 46 px
- Card Radius: 22 px

## Tablet

- kompakter als Phone, aber weiterhin touchfreundlich
- Sidebar und Kalender/Vorlagen-Arbeitsfläche
- Kalender, Wochenplanung, Vorlagen und Feedback können nebeneinander liegen
- Formulare und Übersichten häufiger zweispaltig
- Drag & Drop bleibt vorbereitet und sichtbar unterstützt

Zentrale Werte ab 768 px:

- Page Padding: 20 px
- Section Gap: 20 px
- Card Padding: 18 px
- Button Height: 46 px
- Input Height: 42 px
- Card Radius: 18 px

## Desktop

- professionelle Arbeitsoberfläche mit höherer Informationsdichte
- kompakte Sidebar mit Labels
- Dashboard zeigt Heute, Wochenplan, Polar, Aufgaben, Nachrichten und Schnellzugriff gleichzeitig
- flachere Karten, kleinere Buttons und kürzere Listenzeilen
- Kalender und Trainingslisten zeigen mehr Inhalt ohne unnötiges Scrollen

Zentrale Werte ab 1200 px:

- Page Padding: 18 px
- Section Gap: 16 px
- Card Padding: 15 px
- Button Height: 40 px
- Input Height: 38 px
- Card Radius: 14 px

## Umsetzung

Die zentrale Schicht liegt am Ende von `src/styles.css` in den Blöcken `Responsive density layer` und `Develop target design`.

Wichtige Tokens:

- `--density-page-padding`
- `--density-section-gap`
- `--density-card-gap`
- `--density-card-padding`
- `--density-control-height`
- `--density-input-height`
- `--density-card-radius`
- `--density-title-xl`
- `--density-title-lg`
- `--density-title-md`
- `--density-metric`
- `--density-body`
- `--density-caption`

Die vorhandenen Paddlio-5.0-Tokens `--space-page`, `--space-section`, `--space-card` und `--radius-card` bleiben angebunden. Bestehende Komponenten müssen deshalb nicht parallel neu gestylt werden.

## Bereiche

Heute:
Phone bleibt fokussiert. Tablet und Desktop erhalten zusätzlich eine Arbeitsübersicht mit Wochenplan, Polar-Kurzstatus, Aufgaben, Nachrichten und Schnellzugriff.

Kalender und Plan:
Vorlagen bleiben in der bestehenden Planungslogik. Auf Tablet/Desktop ist die Vorlagenleiste als Arbeitsbereich sichtbar und kompakter.

Training:
Training Cards, Kennzahlen und Aktionsleisten werden auf Tablet/Desktop flacher. Phone bleibt großzügig.

Mehr, Akademie, Import und Polar:
Panels verwenden dieselben Density-Tokens. Desktop soll nicht wie eine vergrößerte Phone-Ansicht wirken.

Navigation:
Phone nutzt Bottom Navigation. Tablet nutzt eine kompakte Sidebar. Desktop nutzt eine schmale Sidebar mit Labels und klaren aktiven Zuständen.

## Barrierefreiheit

Phone-Touchflächen bleiben groß. Tablet bleibt touchfähig. Desktop-Controls sind kleiner, aber nicht miniaturisiert. Fokus- und Kontrastregeln bleiben erhalten und werden im Beta-Check geprüft.
