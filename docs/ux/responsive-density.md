# Responsive Density

Paddlio nutzt drei Dichte-Stufen. Die Rolle entscheidet weiterhin über Berechtigungen, die Dichte entscheidet nur über Darstellung und Informationsmenge.

## Phone

- großzügige Sport-App-Darstellung
- große Karten und Buttons
- einspaltige Formulare
- Bottom Navigation bleibt groß und touchfreundlich
- primär für Training, Feedback, Nachrichten und schnelle Aktionen

Zentrale Werte:

- Page Padding: 18 px
- Section Gap: 24 px
- Card Padding: 20 px
- Button Height: 52 px
- Input Height: 46 px
- Card Radius: 22 px

## Tablet

- kompakter als Phone, aber weiterhin touchfreundlich
- mehr Inhalt pro Bildschirm
- Formulare und Übersichten häufiger zweispaltig
- Kalender, Team und Training bleiben ohne kleine Desktop-Controls bedienbar

Zentrale Werte ab 768 px:

- Page Padding: 20 px
- Section Gap: 20 px
- Card Padding: 18 px
- Button Height: 46 px
- Input Height: 42 px
- Card Radius: 18 px

## Desktop

- professionelle Arbeitsoberfläche mit höherer Informationsdichte
- flachere Karten
- kompaktere Buttons und Inputs
- kleinere Überschriften
- schmalere Sidebar
- Kalender und Trainingslisten zeigen mehr Inhalt ohne Scrollen

Zentrale Werte ab 1200 px:

- Page Padding: 18 px
- Section Gap: 16 px
- Card Padding: 15 px
- Button Height: 40 px
- Input Height: 38 px
- Card Radius: 14 px

## Umsetzung

Die zentrale Schicht liegt am Ende von `src/styles.css` im Block `Responsive density layer`.

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

Die vorhandenen Paddlio-5.0-Tokens `--space-page`, `--space-section`, `--space-card` und `--radius-card` werden an diese Density-Tokens angebunden. Dadurch bleiben bestehende Komponenten kompatibel.

## Bereiche

Training:
Karten, Kennzahlen, Aktionsleisten und Kalender werden auf Tablet/Desktop flacher. Phone bleibt unverändert groß.

Kalender:
Monats- und Wochenzellen werden auf Desktop niedriger, Toolbar und Tabs kompakter.

Formulare:
Inputs werden auf Tablet/Desktop niedriger. Zweispaltige Formulare bleiben erhalten, Phone bleibt einspaltig.

Mehr, Akademie, Import und Polar:
Karten und Panels verwenden dieselben Density-Tokens. Desktop wirkt dadurch nicht mehr wie eine vergrößerte Phone-Ansicht.

Navigation:
Die Desktop-Sidebar wird schmaler, Icons und Navigationszeilen werden reduziert. Die Phone-Bottom-Navigation bleibt groß.

## Barrierefreiheit

Die Phone-Touchflächen bleiben groß. Tablet bleibt touchfähig. Desktop-Controls sind kleiner, aber nicht miniaturisiert. Die vorhandenen Fokus- und Kontrastregeln bleiben unverändert.
