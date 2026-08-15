# Phase 2.9 Two-Device E2E Results

## Intended Scenario

Coach Desktop plus Athlete Phone:

1. Coach creates training.
2. Athlete sees training.
3. Athlete sends feedback.
4. Coach sees feedback.
5. Coach deletes training.

## Current Result

Blocked.

The Coach account is now correctly recognized as Coach, but the Coach planning form has no selectable Athlete test account.

Observed in E2E:

```text
Sportler fuer Einzeltraining: no Mia Test / athlete1 checkbox.
```

## Cause

The Development database currently does not expose the required Coach-to-Athlete relation to the Coach session. The seed script can create the relation, but the local Development Service Role Key is not available in this workspace/session.

## Required Fix

Run the Development seed with:

```text
SUPABASE_SERVICE_ROLE_KEY=<Development service role key>
PADDLIO_SEED_ALLOW_DEVELOPMENT=true
VITE_APP_ENV=development
SUPABASE_URL=https://nlllqsfdhfiwticrcrnp.supabase.co
npm.cmd run seed:development
```

Do not use Production credentials.
