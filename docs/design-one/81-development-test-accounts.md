# Phase 2.9 Development Test Accounts

## Accounts

No passwords or keys are documented here.

| Account | Expected role | E2E status |
|---|---|---|
| dev.athlete1@paddlio.test | Athlete | Passed |
| dev.coach@paddlio.test | Coach | Passed |
| dev.clubadmin@paddlio.test | ClubAdmin | Passed as coach-level access without Admin Hub |
| dev.admin@paddlio.test | Admin | Passed |

## Required Local E2E Variables

These variables are required locally and must not be committed:

```text
PADDLIO_E2E_ATHLETE_EMAIL
PADDLIO_E2E_ATHLETE_PASSWORD
PADDLIO_E2E_COACH_EMAIL
PADDLIO_E2E_COACH_PASSWORD
PADDLIO_E2E_CLUBADMIN_EMAIL
PADDLIO_E2E_CLUBADMIN_PASSWORD
PADDLIO_E2E_ADMIN_EMAIL
PADDLIO_E2E_ADMIN_PASSWORD
```

The Playwright config now loads `.env.e2e.local` after `.env.local`, so Development E2E can override local Production app settings without committing secrets.

## Development Seed

`scripts/run-development-seed.ps1` no longer contains a default password. If no password is passed, it prompts securely.

The seed still requires a Development-only `SUPABASE_SERVICE_ROLE_KEY`. Without that key, Coach-Athlete relations and realistic calendar data cannot be repaired automatically.
