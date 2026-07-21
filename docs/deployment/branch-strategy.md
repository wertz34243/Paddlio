# Paddlio Branch Strategy

## Branches

| Branch | Zweck | Deployment |
| --- | --- | --- |
| `main` | stabile Production-Version | Vercel Production |
| `develop` | laufende Entwicklung und Tests | Vercel Preview/Development |
| `feature/*` | einzelne neue Funktionen | Preview |
| `fix/*` | gezielte Fehlerkorrekturen | Preview |
| `refactor/*` | technische Umbauten | Preview |

## Regeln

- `main` enthält nur geprüfte Releases.
- Neue Arbeit startet auf `feature/*`, `fix/*` oder `refactor/*`.
- Fertige Arbeit wird zuerst nach `develop` gemergt.
- `develop` wird vollständig geprüft.
- Erst danach wird nach `main` gemergt.
- Keine Secrets in Git.
- Keine produktiven Migrationen ändern, die bereits ausgeführt wurden.

## Pflichtchecks vor Merge nach main

- `npm.cmd run build`
- `npm.cmd run check:beta`
- `npm.cmd run test`
- `npm.cmd run test:e2e`
- Authentifizierte Rollen-/Sync-E2E mit `PADDLIO_E2E_*`, sofern Credentials gesetzt sind
- Migrationen zuerst auf Supabase Development testen
