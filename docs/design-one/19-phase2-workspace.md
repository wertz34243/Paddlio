# Paddlio One Phase 2 Workspace

Stand: 2026-08-04  
Branch: `develop`  
Production: nicht veraendert

## Ziel

Phase 2 setzt die in Phase 1 erstellten Paddlio-One-Tokens und Komponenten erstmals in produktiven Arbeitsbereichen ein. Der Umbau konzentriert sich bewusst auf die Trainingszentrale:

- Dashboard / Heute
- Kalender
- Trainingsplan-Anbindung
- Trainingsjournal
- Vorlagen

Nicht Teil dieser Phase:

- Polar
- Analyse
- KI
- Team
- Nachrichten
- Akademie
- Wettkampf
- Material
- Admin

## Dashboard / Heute

Das Dashboard wurde als Trainingszentrale neu strukturiert.

Desktop:

- Linke Spalte: Heute, naechstes Training, Schnellaktionen
- Mitte: Wochenuebersicht, Kalenderausblick, aktuelle Belastung
- Rechte Spalte: Feedback, Aufgaben, Nachrichten, Wetter-Platzhalter, Smart-Coach-Platzhalter

Tablet:

- Zweispaltiges Arbeitslayout mit kompakten Karten
- Trainings- und Wocheninformationen bleiben gleichzeitig sichtbar

Phone:

- Einspaltiger Tagesfluss
- Fokus auf naechstes Training, Status, Aufgaben und Rueckmeldungen
- Keine ueberladene Desktop-Informationsdichte

## Kalender

Der Kalender wurde als eigener Workspace aufgebaut.

Desktop:

- Kalenderbereich links
- Vorlagenbibliothek rechts
- Wochenplan unten
- Vorlagen koennen per Drag & Drop auf Kalendertage gezogen werden

Tablet:

- Kalender und Vorlagen teilen sich die Flaeche
- Kompakter als Phone, aber weiterhin touchfreundlich

Phone:

- Reduzierte Modi: Tag, Woche, Monat
- Vorlagen als kompakte Auswahl statt breiter Seitenleiste

## Vorlagen

Vorlagen werden nicht mehr nur als einfache Liste dargestellt, sondern als kompakte Arbeitskarten.

Jede Vorlage zeigt:

- Icon
- Titel
- Kategorie
- Dauer
- Intensitaet
- Fokus

Unterstuetzt:

- Favoriten-Optik
- Zuletzt verwendet / Systemvorlagen als Struktur
- Drag & Drop in Kalender auf Tablet/Desktop
- Schnellnutzung auf Phone

## Training

Der Trainingsbereich wurde auf einen durchgehenden Ablauf ausgerichtet:

1. Training ansehen
2. Training starten
3. Durchfuehrung markieren
4. Feedback erfassen
5. Journal aktualisieren

Desktop und Tablet nutzen kompakte Aktionsleisten. Phone behaelt grosse Hauptaktionen.

## Trainingsjournal

Das Journal wurde kompakter und klarer aufgebaut:

- KPI-Leiste
- Liste der Eintraege
- Soll/Ist-Zusammenfassung
- Chips fuer Gefuehl, Muedigkeit, Schlaf und Motivation

## Gemeinsame Komponenten

Verwendet werden die Phase-1-Komponenten:

- `PaddlioOnePageHeader`
- `PaddlioOneCard`
- `PaddlioOneMetricCard`
- `PaddlioOneButton`
- `PaddlioOneStatusChip`

## Qualitaetspruefung

Ausgefuehrte Pruefungen:

- `npm.cmd run build`
- `npm.cmd run check:beta`
- `npm.cmd run test`
- `npm.cmd run test:e2e`

Ergebnis:

- Build erfolgreich
- Beta-Check erfolgreich
- Unit-Tests erfolgreich
- Public E2E erfolgreich
- Rollen-E2E wurden durch das bestehende Testsystem uebersprungen, weil keine `PADDLIO_E2E_*` Variablen in dieser Shell gesetzt waren

## Bekannte Grenzen

- Phase 2 ersetzt noch nicht Polar, Analyse, Team, Nachrichten oder Admin.
- Wetter und Smart Coach sind bewusst als ruhige Platzhalter sichtbar.
- Tiefere echte Kalender-Konfliktlogik bleibt in vorhandenen Services und wird in einer spaeteren Phase weiter ausgebaut.
