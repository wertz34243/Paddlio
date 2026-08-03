# Paddlio Design System

Ziel: ein einheitliches System für Phone, Tablet und Desktop. Die bestehende Paddlio-Sprache bleibt dunkel, ruhig, sportlich und datenorientiert.

## Aktueller Befund

- `src/styles.css` enthält mehrere historische `:root`-Blöcke und später ergänzte responsive Density-Variablen.
- Es gibt bereits gemeinsame Bausteine: `AppCard`, `SegmentNav`, `Icon`, `DeviceCapabilityGate`, `DesktopSideNavigation`, `BottomNavigation`.
- Die App nutzt viele Fachseiten direkt und einige schwere Bereiche lazy: Akademie, Coach, Import/Export, Polar, Results Readiness.
- Desktop wirkt stellenweise wie eine vergrößerte Phone-App: hohe Karten, große Controls, viel vertikaler Abstand.

## Zentrale Token-Gruppen

| Gruppe | Zweck |
|---|---|
| Background | App-Hintergrund, Dark/Light Basis |
| Surface | Panels, Shell, Sidebar |
| Card | einzelne fachliche Karten |
| Text | Primärtext, Sekundärtext, dezente Hinweise |
| Accent | Paddlio Cyan/Türkis |
| Status | Erfolg, Info, Warnung, Gefahr, Regeneration |
| Density | Page Padding, Section Gap, Card Padding, Control Height |
| Typography | Page Title, Section Title, Card Title, Body, Caption, Metric |
| Navigation | Sidebarbreite, Bottomhöhe, Icongröße |
| Calendar | Raster, Zeilenhöhe, Eventfarben |
| Forms | Inputhöhe, Labelgröße, Feldabstand |

## Responsive Density

| Token | Phone | Tablet | Desktop |
|---|---:|---:|---:|
| Page Padding | großzügig | 10-15 % kompakter | 20-25 % kompakter |
| Card Padding | 20-24 px | 16-20 px | 12-16 px |
| Control Height | 48-52 px | 42-46 px | 36-42 px |
| Page Title | 30-36 px | 26-32 px | 22-28 px |
| Card Gap | großzügig | mittel | kompakt |
| Layout | 1 Spalte | Split View | 3-4 Spalten |

Nicht verwenden: `transform: scale()` für Dichte.

## Trainingsfarben

| Kategorie | Farbe |
|---|---|
| Grundlagen / GA1 / GA2 | Grün |
| Technik | Blau |
| Kraft | Orange |
| Regeneration | Violett |
| Wettkampf | Rot |
| Neutral / Frei | Grau |

Farben markieren Status oder Kategorie. Kartenflächen bleiben überwiegend ruhig.

## Komponentenstandard

Alle Seiten sollen langfristig dieselben Bausteine verwenden:

- `PageHeader`
- `SectionHeader`
- `AppCard`
- `KpiStrip`
- `ListRow`
- `StatusChip`
- `PrimaryButton`
- `SecondaryButton`
- `EmptyState`
- `ErrorState`
- `Modal`
- `Drawer`
- `Sidebar`
- `Toolbar`
- `Tabs`
- `FilterBar`

Vorhandene Komponenten werden erweitert statt ersetzt.
