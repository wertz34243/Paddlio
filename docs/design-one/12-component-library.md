# Paddlio One Component Library

Stand: Phase 1, Branch `develop`

## Komponenten

| Komponente | Zweck | Status |
|---|---|---|
| `PaddlioOnePageShell` | Seitenhülle mit Theme-Hook | umgesetzt |
| `PaddlioOneAppShell` | Sidebar, Hauptbereich und Kontextbereich | umgesetzt |
| `PaddlioOnePageHeader` | Seitentitel mit Aktion | umgesetzt |
| `PaddlioOneSectionHeader` | Bereichstitel mit Beschreibung | umgesetzt |
| `PaddlioOneCard` | neutrale Karte mit Tonalität | umgesetzt |
| `PaddlioOneMetricCard` | kompakte KPI-Karte | umgesetzt |
| `PaddlioOneButton` | primäre, sekundäre, Ghost- und Danger-Aktion | umgesetzt |
| `PaddlioOneIconButton` | Icon-only-Aktion mit `aria-label` | umgesetzt |
| `PaddlioOneStatusChip` | sichtbarer Status mit Text | umgesetzt |
| `PaddlioOneListRow` | kompakte Listenzeile | umgesetzt |
| `PaddlioOneTextField` | Formularfeld mit Label und Hilfetext | umgesetzt |
| `PaddlioOneEmptyState` | leerer Zustand | umgesetzt |
| `PaddlioOneErrorState` | verständlicher Fehlerzustand mit Details | umgesetzt |
| `PaddlioOneToolbar` | flexible Aktionsleiste | umgesetzt |
| `PaddlioOneContentGrid` | responsive Inhaltsraster | umgesetzt |
| `PaddlioOneMasterDetailLayout` | Master-Detail-Grundlayout | umgesetzt |

## Regeln

- Kein Status nur über Farbe.
- Icon-only-Buttons brauchen immer einen Screenreader-Namen.
- Karten dienen echter Gruppierung, nicht reiner Dekoration.
- Desktop-Kontrollen sind kompakter als Phone-Kontrollen.
- Phone bleibt touchfreundlich.

## Preview

Die Komponenten sind in Development unter `/components-preview` erreichbar. In Production wird diese Route nicht aktiviert.
