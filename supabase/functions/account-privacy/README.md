# Account privacy Edge Function

Authenticated endpoint for a user's own JSON access export and irreversible account deletion. The browser never receives the service-role key.

Deployment target for this release check is **DEV only**: `nlllqsfdhfiwticrcrnp`.

```powershell
supabase functions deploy account-privacy --project-ref nlllqsfdhfiwticrcrnp
supabase secrets set PADDLIO_ALLOWED_ORIGINS=https://dev.paddlio.de --project-ref nlllqsfdhfiwticrcrnp
```

Keep JWT verification enabled. Do not deploy with `--no-verify-jwt`. Supabase supplies `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` to the function runtime; none of these values belongs in frontend environment variables.

Before enabling deletion for general use, run the DEV test protocol in `docs/security/manual-dev-security-check.md`. Shared communication retention and storage-object deletion must match the operator's approved retention policy.

## Transactional deletion

Install the 20261020141843, 20261020142422 and 20261021051925 migrations before deploying this handler. The service-only readiness RPC fails closed if the Auth deletion trigger is absent or disabled. The handler performs no preliminary REST updates/deletes: GoTrue's hard deletion and the private trigger's relational cleanup commit or roll back together.

The trigger uses OLD.id, never a client-supplied target. Its function is private, has an empty search_path and is not directly executable by application roles. SECURITY DEFINER is needed because GoTrue's Auth transaction must clean application tables without a user JWT. Shared messages, assignments and other athletes' competition data survive with the departing account's identifiers detached. Storage-owned objects stop deletion before cleanup; storage byte deletion is not falsely claimed to be transactional.

Run `npx vitest run tests/unit` for handler boundary tests and `supabase/tests/account_privacy_transaction.sql` against DEV for rollback/isolation regression. The SQL test rolls back all fixtures. Deleting Auth users does not invalidate already-issued JWT signatures; sensitive endpoints must verify the user/session and RLS helpers must require a surviving profile. The full authenticated browser matrix remains a separate release gate.
