# Layout And Overflow Fixes

## Behobene Risikobereiche

- horizontales Scrollen auf Phone
- feste oder zu breite Flex-/Grid-Inhalte
- Header mit zu großer Höhe
- Bottom Navigation zu nah am Content
- lange deutsche Titel in Karten
- abgeschnittene Segment-Tabs
- übergroße Vorlagenkarten auf Phone
- sehr breite Filterleisten auf Phone

## Technische Regeln

- `max-width: 100%`
- `min-width: 0`
- horizontal scrollbare Segmente
- Bottom-Padding mit Safe-Area-Berücksichtigung
- kompakte Phone-Controls
- Line-Clamp für lange Titel

## Automatisierte Absicherung

Ein Playwright-Test prüft die Login-Oberfläche auf iPhone-SE- und großer Phone-Breite gegen horizontalen Overflow.

