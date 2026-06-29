# ADR 0007: Rebranding zu Paddlio

## Kontext

Die App wird zu Paddlio umbenannt. Das Rebranding betrifft sichtbare Produktnamen, Dokumentation und App-Branding. Bestehende LocalStorage-Daten sollen erhalten bleiben.

## Entscheidung

Version 0.7 fuehrt zentrale Brand-Konstanten ein:

- `APP_NAME = "Paddlio"`
- `APP_SLOGAN = "Train. Analyze. Improve."`
- Rollenbegriffe: `Paddlio Athlete`, `Paddlio Coach`, `Paddlio Team`

Die sichtbare App, der Browser-Titel und die Produktdokumentation verwenden Paddlio. Interne Legacy-Storage-Keys bleiben unveraendert, damit bestehende Browserdaten nicht geloescht werden.

## Konsequenzen

- Keine Datenmigration ist noetig.
- Das UI zeigt Paddlio mit Slogan im Header.
- Spaetere Rollen koennen konsistent mit Paddlio-Begriffen benannt werden.
