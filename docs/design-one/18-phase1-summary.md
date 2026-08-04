# Paddlio One Phase 1 Summary

Stand: Phase 1, Branch `develop`

## Umgesetzt

- zentrale Paddlio-One-Theme- und Layout-Utility
- Unit-Tests für Layout-Modi, Theme-Namen und Token-Kontrakt
- responsive Design Tokens in `styles.css`
- Basiskomponenten für Karten, KPIs, Buttons, Listen, Formulare und Zustände
- Shell-Grundkomponenten für Sidebar, Main, Kontextpanel, Toolbar, Grid und Master-Detail
- Development-only Route `/components-preview`
- Development-only Route `/design-preview`
- vorbereitete Screenshots unter `docs/ui/paddlio-one/phase-1/`
- Dokumentation für Designsystem, Komponenten, Theme Engine, Accessibility und Responsive Rules

## Nicht umgesetzt

- kein Umbau echter Fachseiten
- keine Kalender-Neustrukturierung
- keine Trainingslogik-Änderung
- keine Datenbankänderung
- keine RLS-Änderung
- keine Auth-Änderung
- kein Merge nach `main`

## Nächste Phase

Phase 2 kann echte Seiten schrittweise migrieren. Reihenfolge:

1. AppShell und Navigation
2. Heute
3. Kalender mit Vorlagenbereich
4. Training
5. Analyse, Polar, Team
