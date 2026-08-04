# Paddlio One Design System

Stand: Phase 1, Branch `develop`

## Ziel

Paddlio One definiert eine gemeinsame visuelle Grundlage für Phone, Tablet und Desktop. Die bestehende Produktlogik bleibt unverändert. Phase 1 liefert Tokens, Basiskomponenten, Layout-Regeln und Development-Previews.

## Grundprinzip

| Gerät | Aufgabe | Dichte |
|---|---|---|
| Phone | Training durchführen, schnell reagieren | großzügig |
| Tablet | Training planen, Kalenderarbeit am Wasser | mittel |
| Desktop | Planung, Analyse, Verwaltung | kompakt |

## Token-Gruppen

- Farben: Hintergrund, Panels, Karten, Text, Akzent, Status
- Typografie: Page Title, Section Title, Card Title, Body, Caption, Label
- Spacing: Page Padding, Section Gap, Card Gap, Card Padding
- Controls: Button-Höhen, Input-Höhen, Icon-Größen
- Layout: Sidebar-Breite, Context-Panel, Content-Breite
- Kalender: Row Height, Block Radius, Category Colors
- Motion: kurze, reduzierte Übergänge mit `prefers-reduced-motion`

## Themes

- `dark`: Hauptreferenz
- `light`: helle Arbeitsfläche
- `highContrast`: erhöhte Kontraste für Prüfung und Barrierefreiheit

## Statusfarben

| Status | Farbe | Verwendung |
|---|---|---|
| Primary | Cyan/Türkis | Hauptaktion, aktive Navigation |
| Success | Grün | durchgeführt, positiv |
| Info | Blau | geplant, Information |
| Warning | Orange | offen, Hinweis |
| Danger | Rot | Fehler, Konflikt |
| Muted | Grau | neutral, Archiv, inaktiv |

## Nicht enthalten

Phase 1 verändert keine Fachseiten wie Kalender, Training, Team oder Analyse. Diese Bereiche werden in späteren Phasen auf die Foundation migriert.
