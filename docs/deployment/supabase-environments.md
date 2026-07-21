# Supabase Environments

## Production Supabase

- Zweck: echte Nutzer und echte Vereinsdaten
- Aktuell im Code bekannte Project URL: `https://twlkhfbrrwjwppxinmpn.supabase.co`
- Darf nicht zurückgesetzt werden.
- Migrationen nur nach Development-Test ausführen.

## Development Supabase

Benötigt ein separates Supabase-Projekt.

Mindestdaten:

- Test Admin
- Test ClubAdmin
- Test Coach
- Test Athlete
- Testverein
- Testgruppe
- Testtraining
- Testfeedback

## Development Setup

1. Neues Supabase-Projekt erstellen.
2. Migrationen aus `supabase/migrations` anwenden.
3. Testdaten anlegen.
4. Vercel Preview/Development Variablen setzen:
   - `VITE_APP_ENV=development`
   - `VITE_SUPABASE_URL=<development-url>`
   - `VITE_SUPABASE_ANON_KEY=<development-anon-key>`
5. Keine echten Production-Daten kopieren, wenn Datenschutz betroffen ist.

## RLS

RLS muss in Development und Production identisch geprüft werden.

Pflichtcheck:

```powershell
npm.cmd run check:beta
```
