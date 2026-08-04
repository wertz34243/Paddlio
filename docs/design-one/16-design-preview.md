# Paddlio One Design Preview

Stand: Phase 1, Branch `develop`

## Route

`/design-preview`

Die Route ist nur in Development aktiv. Production rendert diese Preview nicht.

## Parameter

| Parameter | Werte |
|---|---|
| `device` | `phoneSmall`, `phoneLarge`, `tabletPortrait`, `tabletLandscape`, `desktop1366`, `desktop1920`, `ultrawide` |
| `theme` | `dark`, `light`, `highContrast` |
| `role` | `Athlete`, `Coach`, `ClubAdmin`, `Admin` |

Beispiel:

`/design-preview?device=desktop1366&theme=dark&role=Coach`

## Zweck

Die Preview zeigt ein statisches Zielbild für Informationsdichte, Navigation, KPI-Karten, Wochenplan und Vorlagenbereich. Sie nutzt keine echten Nutzerdaten.
