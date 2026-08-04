# Paddlio One Komponentenplan

Stand: 2026-08-04  
Branch: `develop`

Ziel: Bestehende UI-Bausteine konsolidieren, nicht eine zweite Komponentenwelt bauen.

## Bestehende Komponentenbasis

| Datei | Funktion | Bewertung |
|---|---|---|
| `src/components/AppCard.tsx` | generische Karten | behalten, zu `Card`/`MetricCard` erweitern oder umbenennen |
| `src/components/navigation/AppNavigation.tsx` | Bottom/Sidebar Navigation | zentrale Basis für Paddlio One |
| `src/components/DeviceCapabilityGate.tsx` | Geräte-/Feature-Gate | behalten und mit verständlicheren Fallbacks erweitern |
| `src/components/SegmentNav.tsx` | Segmentsteuerung | in `Tabs`/`SegmentedControl` standardisieren |
| `src/components/Icon.tsx` | eigenes Iconsystem | behalten, später gezielt erweitern |

## Zielkomponenten

| Komponente | Zweck | Phone | Tablet | Desktop | Phase |
|---|---|---|---|---|---|
| `AppShell` | globaler Rahmen | Header + Bottom Nav | Sidebar/Hybrid | Sidebar + Panels | 1 |
| `Sidebar` | Navigation | nicht primär | kompakt | kompakt | 1 |
| `BottomNavigation` | Phone Navigation | voll | optional Portrait | nein | 1 |
| `PageHeader` | Seitentitel, Kontext, Aktionen | kompakt | kompakt | sehr kompakt | 1 |
| `SectionHeader` | Bereichstitel | kompakt | kompakt | kompakt | 1 |
| `Toolbar` | Filter, Ansichten, Aktionen | bottom/scrollbar | oben | oben | 1 |
| `Tabs` | Unterbereiche | große Touchfläche | kompakt | kompakt | 1 |
| `SegmentedControl` | Moduswechsel | groß | mittel | klein | 1 |
| `Card` | Content-Container | großzügig | kompakter | flach | 1 |
| `MetricCard` | KPI | groß | mittel | klein | 2 |
| `TrainingCard` | Trainingseinheit | Card | Card/Row | Row/Card hybrid | 3/4 |
| `PolarCard` | Polar-Zusammenfassung | kompakt | kompakt | KPI/Chart | 5 |
| `TaskRow` | Aufgaben | Row | Row | Row | 6 |
| `MessageRow` | Nachrichten | Row | Row + Chat | Row + Chat | 6 |
| `PersonRow` | Sportler/Trainer | Row/Card | Master row | Table row | 6 |
| `StatusChip` | Status nicht nur Farbe | Label+Icon | Label+Icon | Label+Icon | 1 |
| `EmptyState` | leere Seiten | Text + Aktion | Text + Aktion | Text + Aktion | 1 |
| `ErrorState` | Fehler | verständlich | verständlich | Details optional | 1 |
| `PrimaryButton` | Hauptaktion | 52px | 44px | 38-40px | 1 |
| `SecondaryButton` | Nebenaktion | 48px | 42px | 36-38px | 1 |
| `GhostButton` | leise Aktion | 44px | 40px | 34-36px | 1 |
| `IconButton` | Symbolaktion | min 44px | min 44px | 36-40px + Label/Tooltip | 1 |
| `FilterBar` | Filter | Sheet | Toolbar | Toolbar | 3/5 |
| `SearchField` | Suche | vollbreit | kompakt | kompakt | 6/8 |
| `Dialog` | Dialog | Fullscreen/Sheet | Modal | breites Modal | 4 |
| `Drawer` | sekundäre Inhalte | Bottom Sheet | Side Drawer | Side Drawer | 3 |
| `BottomSheet` | Phone Auswahl | voll | optional | nein | 3 |
| `FormSection` | Formulargruppen | 1 Spalte | 2 Spalten | 2-3 Spalten | 4 |
| `Calendar` | Planungsraster | Tag/Liste | Woche | Woche/Monat/Jahr | 3 |
| `TemplatePanel` | Vorlagen | Auswahlseite | rechte Sidebar | rechte Sidebar | 3 |
| `QuickActions` | häufige Aktionen | unten | oben/rechts | rechts | 2 |
| `ChartPanel` | Diagramme | klein | mittel | dicht | 5 |
| `AIRecommendationPanel` | Smart Coach | kurz | kontextuell | kontextuell | 5 |

## Komponentenregeln

- Keine Karte in Karte, außer echte wiederholte Items.
- Status immer mit Text und Symbol, nicht nur Farbe.
- Icon-only Buttons brauchen `aria-label`.
- Desktop-Buttons nicht automatisch volle Breite.
- Phone-Controls mindestens 44 x 44 px.
- Tabellen nur dort nutzen, wo sie schneller scanbar sind.
- Dialoge dürfen auf Desktop breit sein; keine schmalen mobilen Hochdialoge.

## Namensstrategie

Die erste Implementierung kann bestehende Klassen weiterverwenden, solange sie per Tokens stabilisiert werden. Neue wiederverwendbare Komponenten kommen bevorzugt nach:

```text
src/components/ui/
src/components/layout/
src/components/calendar/
src/components/training/
```

Das wird schrittweise gemacht, um keinen Big-Bang-Umbau zu erzwingen.
