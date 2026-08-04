# Paddlio One Gerätematrix

Stand: 2026-08-04  
Branch: `develop`

Vorhandene Basis: `src/lib/deviceCapabilities.ts` unterscheidet `phone`, `tablet`, `desktop` über Breite sowie Touch/Hover/Platform-Capabilities. Diese Basis bleibt erhalten und wird erweitert, nicht ersetzt.

## Geräteklassen

| Klasse | Zweck | Navigation | Layout | Dichte |
|---|---|---|---|---|
| Phone | Alltag, Training durchführen, schnell reagieren | Bottom Navigation mit 5 Punkten | 1 Spalte, Bottom Sheets | großzügig |
| Tablet Portrait | Trainerarbeit mit begrenztem Platz | kompakte Sidebar oder Bottom/Side Hybrid | 2 Bereiche | mittel |
| Tablet Landscape | Kalender, Planung, Arbeit am Wasser | Sidebar links | Kalender Mitte, Vorlagen/Details rechts | mittel |
| Desktop | vollständige Arbeitsstation | kompakte Sidebar | 3-4 Bereiche, Tabellen/Listen | dicht |
| Ultrawide | Multi-Panel-Arbeit | Sidebar + optionale rechte Panels | 4-5 Arbeitsbereiche | dicht, aber nicht überladen |

## Hauptbereiche je Gerät

| Bereich | Phone | Tablet | Desktop |
|---|---|---|---|
| Heute | Tagesfokus, nächste Aktion | 2 Spalten | Dashboard mit 3-4 Spalten |
| Kalender | Tag, 3 Tage, Liste, kompakte Woche | Wochenkalender + Vorlagen | Kalender 70-75 %, Vorlagen rechts, Details unten |
| Training | Durchführung, Feedback, Journal | Detail + Liste | kompakte Listen, Detail, Editor |
| Plan | Wochenliste | 7-Tage-Plan | Wochen-, Monats-, Jahresplanung |
| Vorlagen | Auswahlflow | Sidebar/Drawer | permanente rechte Sidebar |
| Analyse | Kernwerte | 2-Spalten | KPI-Zeile + Charts |
| Team | Listen | Master/Detail | Tabelle + Detail |
| Nachrichten | Chat | Konversation + Chat | Split Chat |
| Aufgaben | eigene/offene | Liste + Detail | kompakte Aufgabenliste |
| Admin | Status/Hinweis | eingeschränkt | voll |

## Responsive Regeln

- Phone lädt keine großen Desktopmodule initial.
- Tablet Landscape ist die wichtigste Trainer-Arbeitsansicht.
- Desktop 1366 x 768 muss den wichtigsten Tages-/Planungsbereich ohne langes Scrollen zeigen.
- iPad Split View kann in Phone-Breite fallen; dann zählt Layoutfähigkeit, nicht nur Gerätemarke.
- Hover darf nur zusätzliche Bedienung bieten, nie die einzige Bedienmöglichkeit.

## Testmatrix

| Testgerät | Erwartung |
|---|---|
| iPhone SE | keine abgeschnittenen Buttons, Bottom Navigation sichtbar, Tagesfokus |
| aktuelles iPhone | Training starten/Feedback schnell erreichbar |
| großes iPhone | mehr Inhalt, aber weiter einspaltig |
| Android Phone | gleiche Kernnavigation |
| iPad Mini | 2-Spalten oder kompakte Sidebar |
| iPad Portrait | Kalender bedienbar, keine Desktop-Überladung |
| iPad Landscape | Sidebar + Kalender + Vorlagen |
| iPad Split View | sauberer Wechsel in kompakte Ansicht |
| 1366 x 768 | Dashboard und Kalender deutlich dichter |
| 1440 x 900 | 3-4 Spalten sinnvoll |
| 1920 x 1080 | Kalender/Analyse mit mehreren Panels |
| Ultrawide | zusätzliche rechte Panels optional |
