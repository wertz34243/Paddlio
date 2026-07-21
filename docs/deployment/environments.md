# Paddlio Environments

## Production

- Branch: `main`
- Vercel Environment: `Production`
- Domain: `https://paddlio.vercel.app`
- Daten: echte Trainer, Sportler, Trainings, Polar-Verbindungen
- App-Env: `VITE_APP_ENV=production`
- Kein DEV-Badge sichtbar

## Development

- Branch: `develop`
- Vercel Environment: `Preview` oder `Development`
- Domain: Vercel-Preview-URL oder separate Dev-Domain
- Daten: ausschließlich Testdaten
- App-Env: `VITE_APP_ENV=development`
- DEV-Badge sichtbar

## Benötigte Vercel-Variablen

Production:

```text
VITE_APP_ENV=production
VITE_SUPABASE_URL=<production-supabase-url>
VITE_SUPABASE_ANON_KEY=<production-anon-key>
POLAR_REDIRECT_URI=https://paddlio.vercel.app/api/polar/callback
POLAR_APP_RETURN_URL=https://paddlio.vercel.app
```

Development/Preview:

```text
VITE_APP_ENV=development
VITE_SUPABASE_URL=<development-supabase-url>
VITE_SUPABASE_ANON_KEY=<development-anon-key>
POLAR_REDIRECT_URI=<development-domain>/api/polar/callback
POLAR_APP_RETURN_URL=<development-domain>
```

Secret-Werte werden nicht dokumentiert und nicht committed.

## Schutz gegen versehentliche Production-Nutzung

Die App verwendet `VITE_APP_ENV`.

- In Production darf die bekannte Production-Supabase-URL als Fallback genutzt werden.
- In Development/Preview wird ohne eigene `VITE_SUPABASE_URL` kein Production-Fallback genutzt.
- Dadurch soll eine Development-Version nicht still Production-Daten verändern.
