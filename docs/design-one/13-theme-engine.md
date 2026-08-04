# Paddlio One Theme Engine

Stand: Phase 1, Branch `develop`

## Dateien

- `src/lib/paddlioOneTheme.ts`
- `src/lib/paddlioOneTheme.test.ts`
- `src/styles.css`

## Themes

| Theme | Beschreibung |
|---|---|
| `dark` | Standard für Paddlio One |
| `light` | helle UI-Prüfung |
| `highContrast` | Kontrastprüfung |

## Geräteprofile

| Breite | Modus |
|---|---|
| bis 767 px | Phone |
| 768 bis 1199 px | Tablet |
| 1200 bis 1919 px | Desktop |
| ab 1920 px | Ultrawide |

## Layout-Dichte

Die Funktion `getPaddlioOneLayoutMode()` ordnet Viewport-Breiten den Modi `phone`, `tablet`, `desktop` und `ultrawide` zu. Die Funktion ersetzt keine Sicherheits- oder Rollenlogik.

## Theme-Anwendung

Themes werden über `data-po-theme` gesetzt. Dadurch können Vorschau und spätere Seiten dieselben Komponenten ohne separate CSS-Architektur verwenden.
