# ADR 0007: Rebranding zu Paddlio

## Kontext

Die App wird zu Paddlio umbenannt. Das Rebranding betrifft sichtbare Produktnamen, Dokumentation und App-Branding. Bestehende LocalStorage-Daten sollen erhalten bleiben.

## Entscheidung

Version 0.7 führt zentrale Brand-Konstanten ein:

- `APP_NAME = "Paddlio"`
- `APP_SLOGAN = "Train. Analyze. Improve."`
- Rollenbegriffe: `Paddlio Athlete`, `Paddlio Coach`, `Paddlio Team`

Die sichtbare App, der Browser-Titel und die Produktdokumentation verwenden Paddlio. Interne Legacy-Storage-Keys bleiben unverändert, damit bestehende Browserdaten nicht gelöscht werden.

## Konsequenzen

- Keine Datenmigration ist nötig.
- Das UI zeigt Paddlio mit Slogan im Header.
- Spätere Rollen können konsistent mit Paddlio-Begriffen benannt werden.
