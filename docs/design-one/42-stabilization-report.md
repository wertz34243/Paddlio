# Version 0.9 - Paddlio Stabilisierung

Stand: 2026-08-04  
Branch: `develop`  
Production: nicht verändert  
Ziel: Qualität, Stabilität und Vertrauen statt neue große Funktionen.

## Zusammenfassung

Paddlio ist auf `develop` technisch lauffähig und die vorhandenen Prüfprogramme sind im aktuellen Lauf grün. Die App ist damit für interne Tests geeignet. Für eine geschlossene oder öffentliche Beta fehlen aber noch belastbare Nachweise für echte Rollen-, Sync- und Zwei-Geräte-Flows.

Die Stabilisierung muss sich jetzt auf drei Dinge konzentrieren:

1. Kalender, Trainingsplan und Training als einen Ablauf zusammenführen.
2. Speichern, Löschen, Reload und Sync konsequent beweisen.
3. Große Dateien, doppelte UI-Schichten und unklare Workflows reduzieren.

## Ausgeführte Prüfungen

| Prüfung | Ergebnis | Hinweis |
|---|---|---|
| `npm.cmd run build` | bestanden | Vite warnt weiter vor großen Chunks. |
| `npm.cmd run check:beta` | bestanden | Encoding, RLS, Bundle, A11y und Beta-Blocker grün. |
| `npm.cmd run test` | bestanden | 13 Testdateien, 58 Tests grün. |
| `npm.cmd run test:e2e` | teilweise | 4 Public-Smoke-Tests grün, 8 Rollen-/Sync-Tests übersprungen. |
| `npm.cmd run test:e2e:roles` | übersprungen | 8 Rollen-/Sync-Tests übersprungen. |

## Aktuelle Buildwerte

| Artefakt | Größe | gzip | Einschätzung |
|---|---:|---:|---|
| Haupt-JS | 623.12 kB | 169.42 kB | hoch, aber Budget bestanden |
| CSS | 160.06 kB | 28.95 kB | zu groß, Konsolidierung nötig |
| XLSX | 500.06 kB | 163.12 kB | eigener Chunk, weiterhin beobachten |
| Supabase | 213.62 kB | 55.17 kB | erwartbar |
| Kalender-Chunk | 37.17 kB | 10.42 kB | akzeptabel |
| Coach-Chunk | 39.95 kB | 9.24 kB | akzeptabel |

## Phase A - Konsolidierung

Kalender, Trainingsplan und Training dürfen nicht als drei getrennte Welten wirken. Aktuell ist die Richtung gut, aber Nutzer können ähnliche Aufgaben noch über mehrere Bereiche starten.

Empfehlung:

- Kalender = Planungszentrale.
- Training = Durchführung, Feedback, Journal.
- Plan = Wochen-/Saisonwerkzeug für Trainer.
- Heute = Einstieg und nächste Aktion.

## Phase B - Workflow

Der Zielablauf ist angelegt, aber noch nicht vollständig nachgewiesen:

Vorlage -> Kalender -> Quick Edit -> Training öffnen -> Starten -> Feedback -> Journal -> Soll/Ist -> Reload -> zweites Gerät.

Offener Nachweis:

- echter Coach/Sportler-Flow mit aktiver Testumgebung.
- echte Reload-Prüfung.
- echte Serienlöschung nach Fehlerfall.
- echte zweite Geräteklasse, nicht nur zweiter Browser.

## Phase C - Zwei-Geräte-Test

Status: **nicht vollständig nachgewiesen**.

Die vorhandenen E2E-Tests enthalten entsprechende Szenarien, wurden in diesem Lauf aber übersprungen. Für Version 0.9 muss das als offener Blocker behandelt werden, bis die Testumgebung aktiv gesetzt und der Lauf grün ist.

## Phase D - Rollentest

Status: **technisch vorbereitet, nicht vollständig aktiv geprüft**.

Feature-Capabilities existieren. RLS-Check ist grün. Der echte Rollen-E2E war übersprungen. Deshalb gilt:

- interne Entwicklung: ok.
- geschlossene Beta: erst nach aktiv grünem Rollentest.
- öffentliche Beta: nein.

## Phase E - Datensicherheit

Hauptprüfpunkte:

- Serien löschen.
- Woche kopieren.
- Mehrfachbearbeitung.
- Reload.
- Sync.
- Offline und wieder online.

Diese Punkte sind fachlich kritisch, weil sie Vertrauen erzeugen oder zerstören. Besonders Serienlöschen darf keine alten Trainings wiederherstellen und keine falschen Serien entfernen.

## Phase F - Performance

Status: **stabil, aber wachsendes Risiko**.

Build und Budget bestehen. Die Warnung zu großen Chunks bleibt. CSS und Hauptbundle müssen vor weiterer UI-Ausweitung gezielt reduziert werden.

## Phase G - UX Polish

Die neue Richtung ist gut. Einige Seiten wirken bereits modern, andere noch wie Übergangszustände. Besonders wichtig:

- weniger doppelte Buttons.
- klare Hauptaktion je Seite.
- einheitliche Drawer und Dialoge.
- keine technische Fehlersprache.
- Desktop nicht wie vergrößertes Phone.

## Phase H - Accessibility

Automatische Checks sind grün. Manuell offen bleiben:

- Fokus in Drawer/Dialogen.
- Tastaturbedienung Kalender.
- Drag & Drop Alternative.
- Screenreader-Zusammenfassung für Diagramme.
- 200-%-Zoom.

## Phase I - Codequalität

Größte Risiken:

- `src/styles.css` ist zu groß.
- `src/views/PlanView.tsx` ist sehr groß.
- `src/views/TrainingCalendarView.tsx` ist sehr groß.
- `src/views/CoachView.tsx` ist groß.
- `src/App.tsx` enthält viel Routing-, UI- und Workflow-Orchestrierung.

## Finale Bewertung

| Kategorie | Note |
|---|---:|
| Design | 76 |
| UX | 74 |
| Kalender | 78 |
| Training | 76 |
| Synchronisation | 68 |
| Performance | 70 |
| Accessibility | 72 |
| Codequalität | 66 |
| Produktreife | 74 |
| Gesamt | 74 |

## Entscheidung

Paddlio ist stabil genug für interne Nutzung auf `develop`. Für Vereinstest oder geschlossene Beta müssen die letzten 20 Punkte aus der Beta-Checkliste abgearbeitet werden.

