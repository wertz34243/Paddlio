# Phase 2.9 Role E2E Results

Command:

```text
npm.cmd run test:e2e:roles
```

Result:

| Test | Desktop Edge | Mobile Edge |
|---|---:|---:|
| Athlete cannot see Coach/Admin hubs | Passed | Passed |
| Coach can use Coach Hub but not Admin Hub | Passed | Passed |
| ClubAdmin can use Coach-level Hub without Admin Hub | Passed | Passed |
| Admin sees Admin Hub | Passed | Passed |
| Coach creates training, Athlete sends feedback, Coach sees feedback | Failed | Skipped by design |

The mobile two-device test is intentionally skipped because the scenario is Coach Desktop plus Athlete Phone. It runs in the desktop project with a separate mobile Athlete context.

## Remaining Failure

The two-device flow fails before save:

```text
Coach planning form does not list dev.athlete1@paddlio.test / Mia Test.
```

This is a Development test-data relation issue, not a role-recognition issue.
