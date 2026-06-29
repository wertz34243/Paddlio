# Paddlio

Paddlio ist eine moderne Trainings- und Wettkampfplattform fuer Kanuslalom.

**Train. Analyze. Improve.**

Version 1.0 richtet sich an Athletinnen und Athleten. Paddlio kombiniert Training, Wettkaempfe, Analyse, Material, Profil, persoenliche Rekorde und regelbasierte Athlete Intelligence in einer mobilen Web-App.

## Milestone 1.0

- Athlete Intelligence Dashboard mit Tagesfokus, Trainingsserie, Athletenstatus und Countdown
- Paddlio Coach mit regelbasierten Empfehlungen aus Training, Wettkaempfen, Zielen und Journal
- Trainingstagebuch mit persoenlichem Journal nach jeder Einheit
- Trainingsplanung mit Wochenuebersicht, Status, Intensitaet und Fokus
- Wettkaempfe mit Timeline, Laufzeiten, Strafsekunden und Gefuehl
- Analyse mit Trends, Verteilungen, K1/C1-Vergleich und Trainingsumfang
- Ziele-Seite mit Saisonfortschritt und persoenlichen Profilzielen
- Persoenliche Rekorde fuer K1, C1, Strafsekunden, Trainingsserie und Saisonwerte
- Saisonuebersicht mit Monatswerten, Trainingsminuten, Belastung und Bestzeiten
- Materialverwaltung fuer Boote, Paddel und Zubehoer
- Athletenprofil mit Sportdaten, Zielen, Profilbild und Einstellungen
- Datenpersistenz im Browser ueber LocalStorage

## Technik

- React
- Vite
- TypeScript
- CSS
- LocalStorage

## Entwicklung starten

Voraussetzung: Node.js und npm.

```bash
npm install
npm run dev
```

Die App ist lokal normalerweise unter `http://localhost:5173` erreichbar.

## Produktions-Build

```bash
npm run build
npm run preview
```

Der Build wird in `dist/` erzeugt.

## Deployment mit Vercel

Das Projekt ist fuer Vercel vorbereitet.

- Framework Preset: `Vite`
- Build Command: `npm run build`
- Output Directory: `dist`
- Install Command: `npm install`

Die Datei `vercel.json` enthaelt die passenden Build- und SPA-Rewrite-Einstellungen.

## Datenhaltung

Paddlio speichert Daten lokal im Browser. Bestehende LocalStorage-Daten werden beim Laden normalisiert und migriert, damit fruehere Daten nicht verloren gehen. Alte interne Migrationsnamen bleiben deshalb bewusst im Code erhalten.

## Release-Check 1.0

- TypeScript-Build erfolgreich
- Vite-Produktionsbuild erfolgreich
- LocalStorage-Migration vorhanden
- Mobile-first Layout geprueft
- Vercel-Build-Konfiguration vorhanden
- Keine sichtbaren alten Brand-Namen

## Produktunterlagen

- [V1 Product Brief](docs/v1-product-brief.md)
- [Architecture](docs/architecture.md)
