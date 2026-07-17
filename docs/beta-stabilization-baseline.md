# Paddlio 5.0 Beta-Stabilisierung - Ausgangszustand

Datum: 2026-07-17

## Git

- Branch: `main`
- Ausgangs-Commit: `1e4aa02bf48b0c734350cbc709db1b96d521f8d6`
- Arbeitsverzeichnis vor Änderungen: sauber

## Checks

- `npm.cmd run build`: erfolgreich
- `npm.cmd run check:beta`: erfolgreich
- `npm.cmd audit --omit=dev`: keine bekannten Schwachstellen

## Bundle-Größen vor Stabilisierung

- `dist/index.html`: 1.68 kB, gzip 0.64 kB
- `dist/assets/index-ComaSacS.css`: 99.17 kB, gzip 18.66 kB
- `dist/assets/supabase-CV3J0IHI.js`: 213.62 kB, gzip 55.17 kB
- `dist/assets/xlsx-BGhuli8m.js`: 500.06 kB, gzip 163.12 kB
- `dist/assets/index-DYN03sDn.js`: 705.96 kB, gzip 188.44 kB

Vite meldet Chunk-Warnungen über 500 kB. Das bleibt ein Performance-Thema für die Beta-Stabilisierung.

## Tests und Skripte vor Stabilisierung

- `dev`
- `build`
- `check:beta`
- `preview`

Ein echter Unit-/E2E-Teststack war zu Beginn nicht vorhanden.

## Umgebung

Lokal sind nur folgende `.env.local`-Schlüssel vorhanden:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Die serverseitigen Polar-/Service-Role-Variablen sind lokal nicht als Prozess-/Systemvariablen gesetzt und müssen für Live-Polar in Vercel konfiguriert sein.

## Supabase-Migrationen

Vorhandene Migrationen: `0001_initial_schema.sql` bis `0028_polar_integration.sql`.

Aktuelle große Stabilisierungsthemen:

- Encoding/Mojibake
- Date-only-Logik
- Training-Sync und Löschlogik
- Trainer-Sportler-Feedback
- Nachrichten
- Rollen/RLS
- Testautomatisierung
- Bundle-Splitting
- Realtime-Scope
