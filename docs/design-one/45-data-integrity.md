# Version 0.9 - Datenintegrität

Stand: 2026-08-04  
Branch: `develop`

## Kurzfazit

Datenintegrität ist für Paddlio wichtiger als neue Funktionen. Wenn ein Trainer eine Woche plant oder eine Serie löscht, muss Paddlio absolut berechenbar reagieren. Aktuell ist die Grundlage vorhanden, aber die wichtigsten Alltagsrisiken müssen noch gezielt getestet werden.

Datenintegrität-Bewertung: **70 / 100**

## Kritische Datenobjekte

| Objekt | Risiko | Erwartung |
|---|---|---|
| Training | Duplikate, falsches Löschen | eindeutige ID, kein Wiederauftauchen |
| Serien/Wiederholungen | falsche Termine löschen | einzelne oder alle Termine sauber unterscheidbar |
| Woche kopieren | doppelte Einheiten | Zielwoche klar, Konflikte sichtbar |
| Feedback | fremde Texte sichtbar | personenbezogen und geschützt |
| Journal | Speicherung unvollständig | Reload-sicher |
| Aufgaben | private Traineraufgaben sichtbar | Rechte sauber trennen |
| Gruppen | erstellen möglich, löschen nicht immer | vollständiger CRUD prüfen |
| Profil | Hälfte gespeichert, Hälfte nicht | alle Felder eindeutig persistieren |
| Polar | doppelte Trainings | Polar-ID als Duplikatschutz |
| Import | unkontrolliertes Überschreiben | Vorschau, Bestätigung, Bericht |

## Speicher-/Reload-Matrix

| Aktion | Muss bleiben nach Reload | Status |
|---|---|---|
| Profil ändern | ja | weiter testen |
| Training erstellen | ja | weiter testen |
| Training bearbeiten | ja | weiter testen |
| Training löschen | nein, darf nicht zurückkommen | kritisch |
| Serie erstellen | ja | kritisch |
| Serie komplett löschen | nein, darf nicht zurückkommen | kritisch |
| Einzeltermin aus Serie löschen | nur Einzeltermin weg | kritisch |
| Feedback speichern | ja | weiter testen |
| Journal speichern | ja | weiter testen |
| Gruppe erstellen | ja | weiter testen |
| Gruppe löschen | nein, darf nicht zurückkommen | kritisch |

## Bekannte Nutzerhinweise

Der Nutzer hat echte Probleme gemeldet bei:

- Profil speichert nur teilweise.
- Gruppen können erstellt, aber nicht zuverlässig gelöscht werden.
- Wiederholungen funktionierten, dann wieder nicht.
- Serien konnten nicht in einem Schritt gelöscht werden.

Diese Hinweise sind wertvoller als reine Theorie und müssen in Tests übersetzt werden.

## Datensicherheitsregeln

1. Keine produktiven Daten löschen.
2. Keine Tabellen zurücksetzen.
3. Keine RLS-Regeln öffnen.
4. Keine service-role im Frontend.
5. Keine stillen Fehler.
6. Keine automatische Überschreibung ohne Bestätigung.
7. Löschungen müssen synchron sichtbar bleiben.
8. Konflikte müssen erklärbar sein.

## Empfehlung

Für Version 0.9 sollten zuerst kleine, harte Tests entstehen:

- `create -> reload -> exists`
- `update -> reload -> updated`
- `delete -> reload -> gone`
- `series delete all -> reload -> gone`
- `feedback -> second role -> visible only if allowed`
- `profile -> reload -> all fields preserved`

Erst danach UI-Polish an diesen Bereichen fortsetzen.

