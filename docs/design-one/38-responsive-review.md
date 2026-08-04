# Paddlio One - Responsive Review

Stand: 2026-08-04  
Branch: `develop`

## Kurzfazit

Die responsive Grundlage ist vorhanden und sinnvoll: Phone, Tablet und Desktop werden zentral unterschieden. Die Umsetzung ist aber noch nicht überall gleich tief. Phone wirkt am stärksten fokussiert, Tablet ist auf dem Weg zur Trainer-Arbeitsfläche, Desktop braucht weiter Dichte und klare Panels.

Responsive-Bewertung: **74 / 100**

## Geräteklassen

Vorhandene Logik:

- `phone`: Breite unter 768 px.
- `tablet`: Breite ab 768 bis unter 1200 px.
- `desktop`: Breite ab 1200 px.
- Zusatzfähigkeiten: Touch, Hover, Split Layout, Dense Tables, Standalone, iOS, iPadOS, macOS.

Bewertung:

Die Grundlage ist richtig. Wichtig bleibt: iPad Split View kann wie Phone-Breite wirken. Die App darf dann kompakt werden, aber die Rolle nicht verlieren.

## Phone

Stärken:

- Bottom Navigation mit maximal fünf Punkten.
- Hauptfokus auf Heute, Kalender, Training, Team, Mehr.
- Komplexe Funktionen werden reduziert oder in Mehr verschoben.
- Touch-Ziele sind groß genug angelegt.

Risiken:

- Einige Unterbereiche können noch zu viel Formularlast haben.
- Tabellen, Import und Admin dürfen nicht versehentlich nur visuell versteckt, aber trotzdem geladen werden.
- Training abschließen muss noch schneller sein.

## Tablet

Stärken:

- Split-Layout ist vorgesehen.
- Kalender + Vorlagen ist die richtige Richtung.
- Tablet kann Coach-Arbeit am Wasser abbilden.

Risiken:

- Tablet ist noch nicht überall eigenständig, sondern teils Phone größer oder Desktop kleiner.
- Drag & Drop und Touch-Feedback brauchen echte Geräteprüfung.
- Portrait und Landscape brauchen unterschiedliche Prioritäten.

Empfehlung:

- Tablet Landscape: Sidebar + Kalender + Vorlagen/Detail.
- Tablet Portrait: Kalender + Bottom/Drawer für Vorlagen.

## Desktop

Stärken:

- Sidebar vorhanden.
- Viele Features können parallel gezeigt werden.
- Dashboard und Kalender sind für hohe Dichte vorbereitet.

Risiken:

- Einige Bereiche wirken noch wie vergrößerte mobile Karten.
- Desktop braucht mehr Listen, Tabellen, Toolbars und Detailpanels.
- 1366 x 768 muss weiter priorisiert werden.

## Breakpoints

| Breakpoint | Einschätzung |
|---|---|
| unter 768 px | sinnvoll für Phone |
| 768 bis 1199 px | sinnvoll, aber Tablet braucht Touch-spezifische Prüfung |
| ab 1200 px | sinnvoll für Desktop |
| ab 1680 px | Ultrawide vorbereitet, aber noch wenig produktiv genutzt |

## Responsive Risiken nach Bereich

| Bereich | Phone | Tablet | Desktop |
|---|---|---|---|
| Heute | gut | mittel | mittel |
| Kalender | gut für Liste/Tag | gut, aber prüfen | gut, weiter verdichten |
| Training | gut, Abschluss vereinfachen | mittel | mittel |
| Team | gut als Liste | Master/Detail nötig | Tabellen/Details nötig |
| Analyse | kompakt gut | 2-Spalten nötig | mehr KPI/Charts gleichzeitig |
| Polar | Alltag gut | Diagramme größer | Historie/Details |
| Import | Status gut | eingeschränkt | vollständig |
| Admin | Status gut | eingeschränkt | vollständig |

## Fazit

Die Geräteidee ist stark. Die nächste Stufe ist nicht mehr Erkennung, sondern konsequente Seitenmigration: jede wichtige Seite braucht eine echte Phone-, Tablet- und Desktop-Absicht.

