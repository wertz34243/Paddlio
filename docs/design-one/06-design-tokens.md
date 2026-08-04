# Paddlio One Design-Token-Plan

Stand: 2026-08-04  
Branch: `develop`

Vorhandene Basis: `src/styles.css` enthält bereits mehrere `:root`-Blöcke, Paddlio-Farben, Density-Tokens und Breakpoints. Paddlio One soll diese Tokens konsolidieren.

## Ziel-Farbwerte

| Token | Wert | Zweck |
|---|---:|---|
| `--po-bg` | `#111315` | App-Hintergrund |
| `--po-bg-deep` | `#07090B` | tiefe Flächen |
| `--po-surface` | `#191D21` | normale Panels |
| `--po-surface-elevated` | `#23272D` | hervorgehobene Panels |
| `--po-border` | `#2D333B` | Trennlinien |
| `--po-primary` | `#24C8F5` | Paddlio-Akzent |
| `--po-success` | `#37D67A` | erledigt/positiv |
| `--po-warning` | `#F8B84E` | Hinweis/mittel |
| `--po-danger` | `#FF5E5E` | Fehler |
| `--po-competition` | `#FF3D6E` | Wettkampf |
| `--po-polar` | `#00C6C8` | Polar |
| `--po-technique` | `#8B5CF6` | Technik |
| `--po-recovery` | `#6D7BFF` | Regeneration |
| `--po-text` | `#F7F3EA` | warmweiß |
| `--po-text-secondary` | `#B7C0CC` | sekundär |
| `--po-text-muted` | `#7E8A99` | Meta |

Regel: Maximal drei Akzentfarben gleichzeitig pro Ansicht.

## Typografie

| Token | Phone | Tablet | Desktop | Zweck |
|---|---:|---:|---:|---|
| `--type-display-xl` | 34-38px | 30-34px | 26-30px | starke Startmomente |
| `--type-display-l` | 30-34px | 26-30px | 22-26px | Page Hero |
| `--type-page-title` | 26-30px | 23-26px | 20-23px | Seitentitel |
| `--type-section-title` | 20-22px | 18-20px | 16-18px | Bereiche |
| `--type-card-title` | 17-18px | 16-17px | 14-16px | Karten |
| `--type-metric` | 30-36px | 26-32px | 22-28px | Kennzahlen |
| `--type-body` | 16px | 15px | 14px | Lesetext |
| `--type-secondary` | 14px | 13px | 12.5px | Zusatztext |
| `--type-caption` | 12px | 11.5px | 11px | Metadaten |
| `--type-button` | 15-16px | 14-15px | 13-14px | Buttons |
| `--type-label` | 12px | 11.5px | 11px | Labels |

## Spacing und Dichte

| Token | Phone | Tablet | Desktop |
|---|---:|---:|---:|
| `--space-page` | 18-20px | 18-20px | 16-18px |
| `--space-section` | 24px | 20px | 14-16px |
| `--space-card-gap` | 16px | 14px | 10-12px |
| `--space-card` | 20px | 16-18px | 12-15px |
| `--control-height` | 52px | 44-46px | 36-40px |
| `--input-height` | 46-50px | 42-44px | 36-40px |
| `--radius-card` | 20-22px | 16-18px | 12-14px |
| `--radius-control` | 999px | 999px | 999px |

## Breakpoints

| Breakpoint | Bedeutung |
|---|---|
| `< 768px` | Phone |
| `768px - 1199px` | Tablet / Split |
| `>= 1200px` | Desktop |
| `>= 1600px` | Large Desktop |
| `>= 1920px` | Ultrawide-Optionen |

Zusätzlich:

- Touch und Hover berücksichtigen.
- iPad Split View kann Phone-Breite haben.
- `prefers-reduced-motion` respektieren.
- `safe-area-inset-*` weiter verwenden.

## Migrationsregel für `styles.css`

1. Paddlio-One-Tokens oben zentral definieren.
2. Alte Token-Namen vorerst auf neue Tokens mappen, z. B. `--primary: var(--po-primary)`.
3. Komponenten schrittweise auf Paddlio-One-Tokens umstellen.
4. Alte doppelte `:root`-Blöcke erst entfernen, wenn keine Abhängigkeit mehr besteht.
