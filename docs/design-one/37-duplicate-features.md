# Paddlio One - Doppelte und konkurrierende Funktionen

Stand: 2026-08-04  
Branch: `develop`

## Kurzfazit

Paddlio hat keine gefährliche Doppelarchitektur in der Datenbank, aber in der Oberfläche gibt es mehrere konkurrierende Orte für ähnliche Aufgaben. Das erzeugt Unsicherheit und erschwert Tests.

## Doppelte oder überlappende Bereiche

| Thema | Orte | Problem | Empfehlung |
|---|---|---|---|
| Trainingsplanung | Kalender, Plan, Training, Coach | Trainer weiß nicht immer, wo geplant wird. | Kalender als Hauptplanung, Plan als Experten-/Wochenansicht. |
| Training ansehen | Heute, Training, Kalender, Journal | Gleiche Einheit erscheint in mehreren Formen. | Einheitliches Training-Detail-Panel. |
| Training abschließen | Training, Journal, Dashboard-Aktionen | Abschluss wirkt nicht durchgehend. | Ein Abschlussflow mit Schnell- und Detailmodus. |
| Vorlagen | Plan, Kalender, Trainingsbereich | Vorlagen wirken wie Listen statt Planungswerkzeug. | Eine zentrale Vorlagenbibliothek mit Kontextansichten. |
| Feedback | Training, Journal, Team, Coach | Feedbackstatus ist verteilt. | Feedback direkt am Training und zusätzlich aggregiert im Team. |
| Aufgaben | Team, Dashboard, Plan, Training | Traineraufgaben brauchen klaren Eigentümer. | Aufgaben zentral, aber am Training verknüpft sichtbar. |
| Analyse | Analyse, Smart Coach, Ziele, Rekorde, Polar | Viele Einzelauswertungen. | Analyse als zentrale Auswertung, Polar/Smart Coach als Quellen/Karten. |
| Wettkampf | Wettkampf, Analyse, Ergebnisse, Videos | Fachlich sinnvoll, aber Navigation schwer. | Wettkampf als Bereich mit Unterseiten und Analyse-Verlinkung. |
| Material | Mehr, Training Detail, Materialseite | Material ist Stammdaten und Trainingsteil. | Materialseite für Verwaltung, Trainingdetail für Zuordnung. |
| Verein/Admin | Verein, More, Coach/Admin, Beta | Adminfunktionen sind verstreut. | Admin-Hub mit klaren Unterpunkten. |

## Doppelte Layoutsysteme

| System | Fund | Risiko |
|---|---|---|
| Alte App-Shell | `.app-shell`, ältere Header-/Card-Regeln | Vermischt sich mit Paddlio One. |
| Paddlio-One-Shell | `.po-app-shell`, Paddlio-One-Tokens | Gute Richtung, noch nicht überall führend. |
| Master Calendar CSS | `.master-calendar-*` | Fachlich nützlich, aber Spezialdesign muss in Komponentensystem überführt werden. |
| Mehrere `:root`-Blöcke | `src/styles.css` | Token-Konflikte und unklare Priorität. |

## Doppelte Navigation

Phone:

- `Heute`, `Kalender`, `Training`, `Team`, `Mehr` ist gut.

Tablet/Desktop:

- Viele Hauptpunkte sind sichtbar.
- `Kalender` und `Plan` sind beide prominent.
- `Team`, `Verein`, `Coach`, `Admin` können je Rolle konkurrieren.

Empfehlung:

- Hauptnavigation schlanker halten.
- Spezialfunktionen über Kontextmenüs, Tabs und Hubs bündeln.

## Doppelte Datenbegriffe

| Begriff | Risiko | Empfehlung |
|---|---|---|
| Einheit | Kann freies Training oder geplantes Training bedeuten. | Begriffe sauber trennen: geplante Einheit, freies Training, Journal-Eintrag. |
| Plan | Kann Wochenplanung, Trainingsplan oder Kalenderplan bedeuten. | `Kalender` für Termine, `Wochenplanung` für Struktur. |
| Feedback | Sportlerfeedback, Trainerantwort, Beta-Feedback. | Benennung kontextabhängig machen. |
| Aufgabe | Trainingsaufgabe, Traineraufgabe, Systemaufgabe. | Typ klar sichtbar machen. |

## Bereinigungsstrategie

1. Für jede Hauptaufgabe genau eine primäre Seite definieren.
2. Andere Seiten dürfen nur Einstieg, Status oder Kontext zeigen.
3. Ein gemeinsames Training-Detail-Panel verwenden.
4. Vorlagen nur einmal fachlich modellieren und überall wiederverwenden.
5. Alte CSS-Klassen schrittweise auf Paddlio-One-Komponenten mappen.

## Fazit

Die Doppelungen sind lösbar. Sie sind aktuell ein UX- und Wartbarkeitsproblem, noch kein Beweis für Datenverlust oder kaputte Logik. Trotzdem sollten sie vor dem nächsten großen Featurepaket reduziert werden.

