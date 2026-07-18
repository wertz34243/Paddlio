# Paddlio 5.0 Beta Test Matrix

Diese Matrix beschreibt die Mindestprüfung vor einer externen Beta. Produktive Daten werden nicht für Tests verwendet.

| Bereich | Admin | ClubAdmin | Coach | Athlete | Fremder Verein | Zwei Geräte | Offline/Online |
|---|---|---|---|---|---|---|---|
| Login und Profil | Rolle, Verein, Profil korrekt | Verein korrekt | Coach-Rolle korrekt | Athlete-Rolle korrekt | keine fremden Daten | gleicher Account gleich | lokaler Rollenstand markiert |
| Training planen | alles | Vereinsgruppen | eigene Gruppen/Sportler | nein | nein | Plan erscheint bei Athlete | Queue nach Reconnect |
| Training sehen | alles | eigener Verein | eigene Gruppen | eigene Pläne | nein | Reload stabil | lokal lesbar |
| Training löschen | alles | eigener Verein | eigene Pläne | eigene freie Einträge | nein | verschwindet beidseitig | Tombstone/Queue |
| Feedback | alles | eigener Verein nach Rolle | Feedback eigener Sportler | eigenes Feedback | nein | beidseitig sichtbar | ausstehend markiert |
| Nachrichten | alles | eigener Verein | eigene Kontakte/Gruppen | eigene Kontakte | nein | Verlauf bleibt | ausstehend markiert |
| Akademie | alles | Vereinsinhalte | zuweisen/sehen | freigegebene Inhalte | nein | Fortschritt bleibt | zuletzt geladen |
| Import | alles | Vereinsdaten | Trainings/Gruppen nach Recht | eigene Daten falls freigegeben | nein | Historie stabil | kein Import ohne Bestätigung |
| Export | alles | Vereinsdaten | berechtigte Gruppen | eigene Daten | nein | identische Filter | CSV/XLSX geschuetzt |
| Polar | eigene + admin falls erlaubt | keine fremden Tokens | keine fremden Tokens | eigene Verbindung | nein | Sync-Historie identisch | kein doppelter Import |
| Kalender | alles | eigener Verein | eigene Planung | eigene Termine | nein | Datum stabil | Date-only stabil |

## Kritische Beta-Flows

1. Coach erstellt Training für Athlete.
2. Athlete sieht Training am richtigen Datum.
3. Athlete markiert Training als durchgeführt und schreibt Feedback.
4. Coach sieht Feedback und antwortet.
5. Coach löscht Training.
6. Beide Geräte laden neu.
7. Training bleibt gelöscht, Feedback/Nachrichten bleiben konsistent.

## Geräte

- iPhone Portrait und Landscape
- Android Portrait
- iPad/Tablet Landscape
- Windows Desktop
- langsames Netzwerk
- offline und Reconnect
