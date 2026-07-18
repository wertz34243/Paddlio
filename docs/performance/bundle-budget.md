# Paddlio Bundle Budget

Stand: Phase 8 der Beta-Stabilisierung.

## Ziel

Der normale App-Start darf nicht durch selten genutzte Module belastet werden. Import/Export, XLSX-Verarbeitung, Akademie, Analyse, Coach- und Admin-nahe Bereiche werden lazy geladen.

## Aktueller Build

Gemessen nach `npm.cmd run build`:

| Chunk | Größe | Zweck |
| --- | ---: | --- |
| `index-*.js` | 584.20 kB | Initiale App |
| `xlsx-*.js` | 500.06 kB | Excel Import/Export, lazy |
| `supabase-*.js` | 213.62 kB | Supabase Client |
| `ImportExportView-*.js` | 45.20 kB | Import/Export, lazy |
| `CoachView-*.js` | 39.74 kB | Coach-Bereich, lazy |
| `AnalyticsCenterView-*.js` | 12.72 kB | Analyse, lazy |
| `AcademyView-*.js` | 12.27 kB | Akademie, lazy |
| `ResultsReadinessView-*.js` | 12.03 kB | Ergebnis-/Beta-Status, lazy |
| `index-*.css` | 99.17 kB | App Styles |

Vor der Aufteilung lag der initiale Hauptchunk bei ca. 704.78 kB. Die erste Reduktion beträgt damit ca. 120 kB.

## Beta-Budget

Der automatisierte Check `npm.cmd run check:bundle` prüft:

- Initialer `index-*.js` Chunk maximal 650 kB.
- `xlsx-*.js` muss als eigener Chunk existieren.
- `xlsx-*.js` darf nicht direkt in `index.html` referenziert sein.
- Feature-Chunks dürfen maximal 250 kB groß sein.
- Bekannte Vendor-Chunks `xlsx` und `supabase` sind vom Feature-Limit ausgenommen.

Wenn `dist/assets` noch nicht existiert, überspringt der Check mit Hinweis. Im Release-Ablauf muss deshalb zuerst `npm.cmd run build` laufen.

## Lazy-Loaded Bereiche

- Akademie
- Analyse-Center
- Coach-Bereich
- Import/Export
- Ergebnis-/Readiness-Status
- XLSX Parser und Export Builder

## Nächste Schritte

- `App.tsx` weiter in Shell, Router und LazyRoutes trennen.
- CSS in fachliche Dateien aufteilen.
- Supabase-Client bleibt aktuell ein eigener Vendor-Chunk; weitere Reduktion ist nur durch selektive Abfragen und weniger initiale Feature-Imports sinnvoll.
