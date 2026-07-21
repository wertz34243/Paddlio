# Paddlio Release Process

## Development Flow

1. Feature-Branch von `develop` erstellen.
2. Änderung implementieren.
3. Lokal prüfen:
   - `npm.cmd run build`
   - `npm.cmd run check:beta`
   - `npm.cmd run test`
4. Nach `develop` mergen.
5. Vercel Preview prüfen.
6. Supabase-Migrationen nur auf Development anwenden.
7. Rollen-, Sync- und Zwei-Geräte-Flow testen.

## Production Release

1. `develop` muss grün sein.
2. Git-Status sauber.
3. Pflichtchecks ausführen:
   - `npm.cmd run build`
   - `npm.cmd run check:beta`
   - `npm.cmd run test`
   - `npm.cmd run test:e2e`
4. Migrationen gegen Production prüfen.
5. Backup-/Rollback-Plan bestätigen.
6. `develop` nach `main` mergen.
7. Production Deployment prüfen.
8. Smoke-Test auf Production.

## Migrationen

- Alte Migrationen nicht ändern.
- Neue Migrationen idempotent schreiben.
- Reihenfolge:
  1. Development Supabase
  2. Tests
  3. Review
  4. Production Supabase

## Rollback

- Code-Rollback über letzten stabilen `main` Commit.
- Datenbank-Rollback nur nach vorher dokumentiertem Plan.
- Keine automatische Rücknahme produktiver Daten ohne Prüfung.
