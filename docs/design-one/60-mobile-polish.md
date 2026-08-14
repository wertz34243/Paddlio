# Phase 2.9 Mobile Polish

## Ziel

Phone bleibt die schnelle Alltagsoberfläche: ansehen, starten, Feedback geben, Journal pflegen und einfache Trainings erstellen. Keine neuen Module, keine Änderungen an Auth, RLS, Datenbank oder Sync-Grundarchitektur.

## Gefundene UI-Probleme

- Der Training-Bereich zeigte auf Phone dauerhaft erklärende Gerätehinweise.
- Die Training-Tabs konnten auf kleinen Breiten knapp werden.
- Die Aktionsleiste im Training hatte mehrere gleich starke Aktionen.
- Kalender-Header und Kalender-Aktion wirkten auf Phone zu groß.
- Training-Details öffneten visuell wie ein Seitenpanel statt wie eine mobile Auswahl.
- Kennzahlen waren vorhanden, aber die Einheit der Belastung war nicht eindeutig.

## Mobile-Polish-Entscheidungen

- Phone zeigt keine dauerhaften Erklärungskarten mehr in normalen Produktansichten.
- Training-Tabs bleiben: Übersicht, Erstellen, Vorlagen, Journal.
- Training-Aktionshierarchie: eine Hauptaktion `+ Training`, sekundär `Vorlagen` und `Journal`.
- Belastung wird als `Pkt` gekennzeichnet.
- Kalender auf Phone startet in der 3-Tage-Ansicht.
- Kalender-Aktion auf Phone ist ein kompakter Plus-Button.
- Training-Details werden auf Phone als Bottom-Sheet-artige Oberfläche dargestellt.

## Migrationsmatrix

| Alte Funktion | Neuer Bereich | Phone | Tablet | Desktop | entfernt? |
|---|---|---|---|---|---|
| Plan | Kalender + Training/Vorlagen | nicht Hauptnavigation | Planungsfläche | Expertenplanung | nein |
| Kalender | Kalender | Tag, 3 Tage, Woche, Liste | Woche/Monat + Details | Woche/Monat/Jahr/Saison | nein |
| Trainingsplanung | Training Erstellen + Kalender | Schrittassistent | Kalender + Quick Edit | Workspace + Mehrfachbearbeitung | nein |
| Trainingstagebuch | Training Journal | kompakt | Detail/Journal | Detail/Journal | nein |
| Journal | Training Journal | Ist-Daten | Ist-Daten | Ist-Daten | nein |
| Vorlagen | Training Vorlagen + Kalender-Seitenbereich | kompakte Liste | Sidebar/Drawer | rechte Arbeitsleiste | nein |
| Schnell planen | Kalender + Training Erstellen | Plus/Assistent | Quick Edit | Quick Edit | nein |
| Freies Training | Training Erstellen/Journal | Assistent | Formular | Formular | nein |
| Einheit planen | Training Erstellen | Assistent | Kalender | Kalender | nein |
| Wochenplanung | Kalender/Planung | kompakt lesbar | voll | voll | nein |
| Saisonplanung | Kalender/Planung | nicht primär | Landscape | voll | nein |

## Bewertung nach Umsetzung

Ziel ist Phone UX über 90/100. Der tatsächliche Wert wird nach visueller Prüfung und Tests im Abschlussbericht bewertet.
