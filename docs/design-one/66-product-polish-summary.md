# Product Polish Summary

## Scope

Dieser Auftrag konsolidiert den bestehenden Kern:

- Phone UX
- Kalender
- Training
- Vorlagen
- Tablet Trainer Workspace
- Desktop Workspace
- Sync-/Persistenzprüfung

Nicht erweitert wurden:

- Polar
- Academy
- Wettkampf
- Material
- KI/Smart Coach
- Analyse
- Import/Export
- Vereinsverwaltung

## Produktlogik

- Kalender = Was ist geplant.
- Training = Was möchte ich erstellen oder durchführen.
- Vorlagen = Was kann ich schnell wiederverwenden.
- Journal = Was ist tatsächlich passiert.

## Wichtigste UI-Änderungen

- Erklärungskarten aus Phone-Training entfernt.
- Kalender startet auf Phone mit 3 Tagen.
- Kalenderaktion auf Phone verdichtet.
- Kalendernavigation auf Phone kompakter gemacht.
- Training-Erstellen als 5-Schritt-Assistent.
- Belastungskennzahl mit Einheit.
- Training-Details auf Phone als Bottom Sheet.
- Journal-Kopf verdichtet und auf eine klare Hauptaktion reduziert.
- Tablet/Desktop-Kalender behalten die Vorlagen-/Detailspalte, aber mit kompakteren Arbeitsflächen.

## Prüfergebnis

- Build bestanden.
- `check:beta` bestanden.
- Unit-Tests bestanden: 13 Testdateien, 58 Tests.
- `test:e2e` bestanden für Public/Mobile-Smoke: 8 bestanden, 8 Rollen-/Sync-Tests übersprungen.
- `test:e2e:roles`: 8 übersprungen, weil `PADDLIO_E2E_*` nicht gesetzt war.

## Screenshots

16 Screenshots wurden unter `docs/ui/paddlio-one/product-polish/` erzeugt:

- Phone: Training Übersicht, Erstellen, Vorlagen, Journal, Kalender Tag, 3 Tage, Woche, Liste.
- Tablet: Kalender + Vorlagen, Kalender + Detail, Portrait Kalender.
- Desktop: Wochenkalender, Monatskalender, Saison/Jahr, Training Detail, Vorlagenbereich.

## Bekannte Restpunkte

- Desktop-Kalender und Vorlagenbereich sind funktional, aber visuell noch nicht final auf Zielbild-Niveau.
- Phone-Fullpage-Screenshots zeigen die fixe Bottom Navigation über Inhalt; echte Geräte-QA bleibt wichtig.
- Rollen-/Sync-Nachweis ist nicht aktiv erbracht, solange die E2E-Credentials fehlen.
