# Component Library

## Bestehende Komponenten

| Komponente | Datei | Rolle im Zielsystem |
|---|---|---|
| `AppCard` | `src/components/AppCard.tsx` | Standardkarte für KPIs, Listenblöcke und Dashboard-Sektionen |
| `SegmentNav` | `src/components/SegmentNav.tsx` | Tabs/Segmentsteuerung |
| `Icon` | `src/components/Icon.tsx` | zentrale Icons |
| `DeviceCapabilityGate` | `src/components/DeviceCapabilityGate.tsx` | Geräte- und Feature-Hinweise |
| `DesktopSideNavigation` | `src/components/navigation/AppNavigation.tsx` | Tablet/Desktop Sidebar |
| `BottomNavigation` | `src/components/navigation/AppNavigation.tsx` | Phone Navigation |
| `LoadingState` | `src/components/AppSupport.tsx` | Ladezustand |

## Zielkomponenten

Diese Bausteine sollen schrittweise aus vorhandenen Komponenten entstehen:

- `PageHeader`
- `SectionHeader`
- `KpiStrip`
- `KpiCard`
- `ListRow`
- `StatusChip`
- `CalendarToolbar`
- `CalendarEventBlock`
- `TemplateLibraryPanel`
- `QuickEditPanel`
- `ResponsiveMasterDetail`
- `EmptyState`
- `ErrorState`

## Regeln

- Keine zweite parallele Designbibliothek.
- Keine Sonderbuttons ohne fachlichen Grund.
- Phone-Touchziele bleiben groß.
- Desktop nutzt kompakte Controls.
- Tabellen nur dort, wo Vergleich und Verwaltung schneller werden.
- Icons erhalten verständliche Labels oder `aria-label`.
