# Paddlio DEV schema drift (24.09.2026)

Target: `paddlio-dev` (`nlllqsfdhfiwticrcrnp`). Production was not queried or changed.

## Read-only PostgREST probe

| Migration | DEV evidence | Required | Action |
|---|---|---|---|
| 0007 notifications extension | `message`, `read`, `related_entity_type`, `related_entity_id` absent | yes | reconciled by 0038 |
| 0029 training deletion stability | `training_plan_items.deleted_at` absent | yes | reconciled by 0038 |
| 0033 repeat series | `training_plan_items.repeat_series_id` absent | yes | reconciled by 0038 |
| 0036 feedback idempotency/trainer feedback | all seven added feedback columns absent | yes | reconciled by 0038 |
| 0037 attendance delete permissions | cannot be proven through anonymous schema reads | independent | remote migration-history check still required |

The probe proves schema absence, not the contents of `supabase_migrations.schema_migrations`. The local Supabase link points to another project (`twlkhfbrrwjwppxinmpn`) and therefore was deliberately not used for a push.

## Concrete failures

- `training_feedback` 42703/PGRST204: first missing column is `feedback_type`; `author_id`, `technical_assessment`, `goal_achievement`, `load_assessment`, `observation`, and `improvement_point` are absent as well.
- `training_plan_items` PGRST204: `deleted_at` and `repeat_series_id` are absent.
- `notifications` PGRST204: `message`, `read`, `related_entity_type`, and `related_entity_id` are absent. Existing base columns include `body`, `type`, `read_at`, and `created_at`.

## Safe DEV action

Run `supabase/migrations/0038_dev_schema_drift_reconciliation.sql` in the SQL editor of project `nlllqsfdhfiwticrcrnp`, or link the CLI explicitly to that project and push migrations after confirming the target. The migration ends with `notify pgrst, 'reload schema';`.

After applying it, repeat the read-only column probes and then reopen the iPhone app. The existing five queue entries must remain present until their retry succeeds.
