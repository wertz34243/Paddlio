# Paddlio One Risikoliste

Stand: 2026-08-04  
Branch: `develop`

| Risiko | Auswirkung | Wahrscheinlichkeit | Gegenmaßnahme |
|---|---|---:|---|
| Big-Bang-Umbau beschädigt bestehende Funktionen | hoch | mittel | Phasenweise umbauen, Feature-Matrix nach jeder Phase aktualisieren |
| Parallelstruktur entsteht neben bestehender App | hoch | mittel | vorhandene Views/Services wiederverwenden, keine zweite Trainingsplanung |
| Kalender-Umbau bricht Wiederholungen oder Löschen | hoch | mittel | bestehende Training-/Plan-Tests erweitern, Delete/Repeat manuell prüfen |
| Device-Gates verstecken Funktionen nur optisch | hoch | niedrig-mittel | Rollen/Backend nicht ändern, Datenabfragen nicht unnötig auslösen |
| Desktop bleibt zu mobile-lastig | mittel | hoch | Density-Tokens und Row/Table-Komponenten priorisieren |
| Tablet-Zielbild wird nicht erreicht | hoch | hoch | Phase 3 auf Tablet Landscape als Haupttest ausrichten |
| `styles.css` wird weiter unübersichtlich | mittel | hoch | Tokens oben konsolidieren, neue Komponentenklassen gruppieren, später CSS aufteilen |
| Accessibility verschlechtert sich durch kompaktere UI | hoch | mittel | Touchziel- und Fokusregeln als harte Akzeptanzkriterien |
| Farbkonzept wird zu bunt | mittel | mittel | maximal drei Akzentfarben je Ansicht |
| Alte Texte mit Mojibake bleiben in Docs/UI | niedrig-mittel | mittel | bestehendes `check:encoding` weiter nutzen |
| Performance leidet durch mehr Desktop-Panels | mittel | mittel | Lazy Loading und view-basierte Realtime-Abos beibehalten |
| Phone lädt Desktopmodule | mittel | mittel | dynamic imports und Device-Capabilities prüfen |
| Admin-/Rollenbereiche werden auf Phone verwirrend | mittel | mittel | Phone Status/Hinweis, Vollbearbeitung Tablet/Desktop |
| Dialoge werden nicht responsive genug | mittel | hoch | Phase 4/8 gezielt Dialogsystem standardisieren |
| Testdaten oder Produktionsdaten werden berührt | hoch | niedrig | ausschließlich develop, keine DB-Änderung ohne Freigabe |
| Vercel Preview Protection erschwert UI-Tests | niedrig-mittel | hoch | lokale develop-Instanz für Screenshots nutzen |
| Nutzer-Modus Anfänger/Fortgeschritten wird mit Berechtigungen verwechselt | mittel | mittel | klar trennen: Bedienmodus reduziert Oberfläche, nicht Rechte |
| Polar zeigt Daten, die API nicht liefert | mittel | mittel | nicht verfügbare Werte klar kennzeichnen |
| KI wirkt wie Pflichtfunktion | mittel | mittel | KI optional, nie blockierend, regelbasierter Fallback |

## Kritische Nicht-Ziele

- Kein Merge nach `main`.
- Keine Production-Daten.
- Keine RLS-Schwächung.
- Keine neue Auth-Architektur.
- Keine zweite AppShell neben der bestehenden ohne Migration.
- Keine komplette Neuentwicklung von Training/Kalender ohne Nutzung bestehender Logik.

## Entscheidende Prüfpunkte je Phase

1. Funktion aus Matrix noch erreichbar?
2. Rolle korrekt eingeschränkt?
3. Phone nicht überladen?
4. Tablet sinnvoll als Trainergerät?
5. Desktop nicht mobile-skaliert?
6. Build grün?
7. `check:beta` grün?
8. Unit-Tests grün?
9. Keine ungewollten Datenänderungen?
