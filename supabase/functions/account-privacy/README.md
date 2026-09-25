# Account privacy Edge Function

Authenticated endpoint for a user's own JSON access export and irreversible account deletion. The browser never receives the service-role key.

Deployment target for this release check is **DEV only**: `nlllqsfdhfiwticrcrnp`.

```powershell
supabase functions deploy account-privacy --project-ref nlllqsfdhfiwticrcrnp
supabase secrets set PADDLIO_ALLOWED_ORIGINS=https://dev.paddlio.de --project-ref nlllqsfdhfiwticrcrnp
```

Keep JWT verification enabled. Do not deploy with `--no-verify-jwt`. Supabase supplies `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` to the function runtime; none of these values belongs in frontend environment variables.

Before enabling deletion for general use, run the DEV test protocol in `docs/security/manual-dev-security-check.md`. Shared communication retention and storage-object deletion must match the operator's approved retention policy.
