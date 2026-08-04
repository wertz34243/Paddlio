# Version 0.9 - Codequalität

Stand: 2026-08-04  
Branch: `develop`

## Kurzfazit

Der Code ist funktional, aber an mehreren Stellen zu groß und zu konzentriert. Die wichtigste Qualitätsarbeit ist jetzt nicht ein großer Rewrite, sondern kontrolliertes Aufteilen entlang echter Verantwortlichkeiten.

Codequalität-Bewertung: **66 / 100**

## Große Dateien

| Datei | Einschätzung |
|---|---|
| `src/styles.css` | zu groß, mehrere Designgenerationen parallel |
| `src/views/PlanView.tsx` | sehr groß, viele Verantwortlichkeiten |
| `src/views/TrainingCalendarView.tsx` | groß, sollte in Kalender, Vorlagen, Drawer, QuickEdit geteilt werden |
| `src/views/CoachView.tsx` | groß, Coach-Funktionen fachlich trennen |
| `src/App.tsx` | zu viel Navigation, Routing, Workflow und Cloud-Orchestrierung |

## Gute Grundlagen

- TypeScript-Build grün.
- Unit-Tests grün.
- Lazy Loading für mehrere große Views.
- Domainlogik ist teilweise gut ausgelagert.
- Device- und Feature-Capabilities sind zentral.
- Beta-Checks existieren.

## Risiken

- Große Komponenten erschweren sichere Änderungen.
- CSS-Duplikate können Designänderungen unberechenbar machen.
- App.tsx ist schwer zu testen.
- Mehrere UI-Generationen können sich gegenseitig überschreiben.
- Einige ältere Dokumente zeigen Mojibake; sichtbare App-Texte müssen weiter wachsam geprüft werden.

## Bereinigungsplan ohne Funktionsverlust

Priorität A:

- CSS in Abschnitte oder Dateien trennen: Tokens, Base, AppShell, Components, Calendar, Training, Responsive.
- TrainingCalendarView modularisieren.
- PlanView in Wochenplanung, Vorlagen, Serien, Aufgaben, Editor teilen.
- App.tsx in Shell, Navigation, TrainingRoutes, MoreRoutes und PageGuards trennen.

Priorität B:

- Gemeinsame Komponenten konsequenter nutzen.
- Alte Card-/Button-Klassen auf Paddlio-One-Komponenten mappen.
- Tests um Speicher-/Reload-Fälle ergänzen.
- Feature-Matrix mit realen Routen abgleichen.

Priorität C:

- Ungenutzte Views und Preview-Routen prüfen.
- CSS-Budget und Dateigrößen-Budget ergänzen.
- Story-/Preview-Seiten für Designkomponenten sauber halten.

## Nicht tun

- Kein großer Rewrite.
- Keine zweite Trainingsplanung.
- Keine neue Sync-Architektur ohne konkreten Fehlernachweis.
- Keine kosmetische Bereinigung, die Tests erschwert.

## Fazit

Die Codebasis trägt Paddlio, aber sie wird schwer. Version 0.9 sollte deshalb Stabilisierung und Vereinfachung priorisieren, bevor wieder neue Produktideen starten.

