# Paddlio

Paddlio ist eine moderne Trainings- und Wettkampfplattform fuer Kanuslalom.

**Train. Analyze. Improve.**

Version 1.0 richtet sich an Athletinnen und Athleten. Paddlio kombiniert Training, Wettkaempfe, Analyse, Material, Profil, persoenliche Rekorde und regelbasierte Athlete Intelligence in einer mobilen Web-App.

## Version 1.5 - QA & Stabilitaet

- Robustere lokale Auth- und LocalStorage-Schicht mit In-Memory-Fallback, falls Browser-Speicher kurzzeitig nicht verfuegbar ist
- Gespeicherte App-Daten werden beim Laden und Speichern konsequent an den eingeloggten Nutzer und dessen Athletenprofil gebunden
- Leere Zustaende fuer Wettkaempfe und Material verbessert
- Mobile Layout-Haertung fuer Header, Bottom Navigation, Safe Area, Karten, lange Texte und kleine Screens
- Sichtbare Beispiel-/Alttexte weiter bereinigt, damit neue Nutzer eine leere, eigene App sehen

## Version 1.6 - Cross-Platform PWA

- Web App Manifest fuer iPhone, iPad, Android, Windows und moderne Desktop-Browser
- Standalone-Display, Dark-Mode Theme Color, maskable Icon, Apple Touch Icon und Windows Tile-Metadaten
- Service Worker als Offline-Grundlage fuer App-Shell und Offline-Fallback
- Verbesserte Safe-Area-Unterstuetzung fuer installierte iOS/iPadOS Apps

## Version 1.7 - Mobile Layout Feinschliff

- Home startet ohne grossen globalen Header direkt mit Begruessung, Tagesinfo und den wichtigsten Karten
- Unterseiten nutzen einen kompakten Header, der beim Scrollen normal aus dem Sichtbereich verschwindet
- Logout ist in die Einstellungen verschoben und nicht mehr prominent auf dem Dashboard
- Bottom Navigation ist flacher, sicherer fuer iPhone-Safe-Areas und verdeckt weniger Inhalt
- Mobile Abstaende, Home-Hero und Sticky-Aktionen wurden fuer mehr sichtbaren Inhalt gestrafft

## Paddlio auf iPhone/iPad installieren

1. Paddlio in Safari oeffnen.
2. Teilen-Button antippen.
3. `Zum Home-Bildschirm` waehlen.
4. Name `Paddlio` bestaetigen und `Hinzufuegen` antippen.

Paddlio startet danach als eigenstaendige App im Dark-Mode Look mit iOS-Statusleiste.

## Paddlio auf Android installieren

1. Paddlio in Chrome oeffnen.
2. Im Browsermenue `App installieren` oder `Zum Startbildschirm hinzufuegen` waehlen.
3. Installation bestaetigen.

Chrome nutzt das Manifest, die 192x192-/512x512-Icons und den Standalone-Modus.

## Paddlio auf Windows installieren

1. Paddlio in Microsoft Edge oeffnen.
2. In der Adressleiste oder im Menue `Apps` die Option `Diese Website als App installieren` waehlen.
3. Installation bestaetigen.

Edge verwendet Manifest, Theme Color und Windows Tile-Metadaten.

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
