# Phase 2.10 Development Seed And Flow Status

Branch: develop

## Scope

Phase 2.10 does not add product features or redesign UI. The work is limited to the
Development seed and the evidence required for final Phone/Tablet flow testing.

## Safety Result

- Production branch was not touched.
- Production database was not touched.
- The seed script still blocks known Production project refs.
- The seed requires:
  - `VITE_APP_ENV=development`
  - `PADDLIO_SEED_ALLOW_DEVELOPMENT=true`
  - a Development Supabase project URL
  - a Development service role key
  - a local test password

## Seed Changes Prepared

The Development seed now prepares the required core test dataset:

- Club: Paddlio Testverein
- Group: Paddlio Testgruppe U18
- Users:
  - dev.athlete@paddlio.test
  - dev.athlete1@paddlio.test
  - dev.athlete2@paddlio.test
  - dev.athlete3@paddlio.test
  - dev.coach@paddlio.test
  - dev.clubadmin@paddlio.test
  - dev.admin@paddlio.test
- Group memberships:
  - Coach as Coach
  - all test athletes as Athletes
- Templates:
  - GA1 Grundlagenfahrt
  - GA2 Tempoausdauer
  - K1 Technik
  - C1 Technik
  - Kraftausdauer Zirkel
  - Regeneration & Beweglichkeit
  - Wettkampfsimulation
- Calendar/training data:
  - current test week with six realistic sessions
  - cancelled training
  - completed feedback training
  - trainer tasks
  - athlete-specific direct assignment
  - repeat series marker
  - development competition and result
  - Polar mock without real Polar tokens

## Seed Execution Status

Not executed in this run.

Reason:

- No `SUPABASE_SERVICE_ROLE_KEY` exists in the current shell.
- `.env.e2e.local` does not contain `SUPABASE_SERVICE_ROLE_KEY`.
- Running the seed without the Development service role key would either fail or prompt
  interactively, which cannot be completed safely by the agent.

Required local command:

```powershell
powershell -ExecutionPolicy Bypass -File scripts\run-development-seed.ps1
```

Enter only the Development Supabase Project URL and the Development Service Role Key.
Do not use Production credentials.

## Test Results

Executed after code-level seed preparation:

```powershell
npm.cmd run test
npm.cmd run build
npm.cmd run check:beta
npm.cmd run test:e2e:roles
npm.cmd run test:e2e
```

Results:

- Unit tests: passed, 62 tests.
- Build: passed.
- check:beta: passed.
- Role E2E: 8 passed, 1 skipped, 1 failed.
- Full E2E: 15 passed, 5 skipped, 2 failed.

The failed role E2E is the two-device flow. It still fails because the live Development
database does not yet expose `Mia Test` / `athlete1` in the Coach planning form.

This is consistent with the seed not being executed.

The full E2E additionally fails the mobile Coach template test because the live
Development database does not yet expose seeded training templates to the Coach phone
view. This is also consistent with the seed not being executed.

## Flow Evidence

Verified:

- Athlete role isolation works.
- Coach sees Coach Hub and not Admin Hub.
- ClubAdmin sees Coach-level hub and not global Admin Hub.
- Admin sees Admin Hub.

Not yet verified:

- Mobile Coach template insert.
- Coach to Athlete create/update flow.
- Athlete feedback to Coach flow.
- Two-device sync.
- Delete/reload persistence.
- Private trainer task visibility.

Reason:

The Development database still lacks the required seeded athlete/template relations.

## Beta Gate

Current status:

- Internal use: yes, with seed caveat.
- Real trainer test: no.
- Closed beta: no.

Real trainer test requires the Development seed to be executed and the remaining E2E
flows to pass against seeded data.
