# DEV schema P0 inventory

The iPhone trace contains 34 unique `PGRST205` table misses. Every queried name belongs to the current repository data model; none is an invented or obsolete client table name.

| App query group | Expected tables | Source migration | DEV evidence | Next action |
|---|---|---|---|---|
| Journal | `training_journal_entries` | `0022` | PGRST205 | Distinguish missing table from stale cache |
| Communication | Messages, tasks, attendance, posts, attachments | `0011`, hardened by `0014`/`0037` | PGRST205 | Reconcile the complete module with RLS |
| Club portal | Messages, material, boats, events, documents, settings | `0010`, hardened by `0014` | PGRST205 | Reconcile the complete module with RLS |
| Results and beta | Personal bests, imports, external data, beta tables | `0012`-`0017` | PGRST205 | Reconcile only objects proven missing |
| Academy | 13 `academy_*` tables | `0026`, hardened by `0031` | PGRST205 | Reconcile the complete module with role-aware RLS |
| Competitions | `competitions`, `competition_results` | `0001`; columns in `0008`, `0016`, `0023` | 42703 | Identify the exact missing column |

Run `supabase/DIAGNOSE_DEV_SCHEMA_P0.sql` only in DEV project `nlllqsfdhfiwticrcrnp`. Result 1 separates real missing tables from a stale PostgREST cache. Result 3 identifies the competition column responsible for 42703.

Do not replay historical migrations blindly: some replace policies and assume dependencies that may also be absent. Create `0043` only after the diagnostic output proves which objects are missing.

The local Supabase link currently points to Production (`twlkhfbrrwjwppxinmpn`) and must not be used.
