# Paddlio DEV schema drift (24.09.2026)

Target: `paddlio-dev` (`nlllqsfdhfiwticrcrnp`). Production was not queried or changed.

## Read-only PostgREST probe

| Migration | DEV evidence | Required | Action |
|---|---|---|---|
| 0019 admin/club/group assignment | partially applied: profile core and training groups exist; `active_club_id`, `club_memberships`, `group_memberships`, and extended group-member columns are absent | yes | reconcile with 0039 before 0038 |
| 0020 profile reliability | `active_club_id` absent, so its profile baseline is incomplete | yes | baseline column supplied by 0039; full remote history still needs SQL Editor verification |
| 0024 training feedback authorization | helper chain cannot be valid without the absent 0019 objects | yes | canonical helper definitions supplied by 0039 |
| 0007 notifications extension | `message`, `read`, `related_entity_type`, `related_entity_id` absent | yes | reconciled by 0038 |
| 0029 training deletion stability | `training_plan_items.deleted_at` absent | yes | reconciled by 0038 |
| 0033 repeat series | `training_plan_items.repeat_series_id` absent | yes | reconciled by 0038 |
| 0036 feedback idempotency/trainer feedback | all seven added feedback columns absent | yes | reconciled by 0038 |
| 0037 attendance delete permissions | cannot be proven through anonymous schema reads | independent | remote migration-history check still required |

The probe proves schema absence, not the contents of `supabase_migrations.schema_migrations`. The local Supabase link points to another project (`twlkhfbrrwjwppxinmpn`) and therefore was deliberately not used for a push.

The real SQL Editor error `42883: public.paddlio_is_admin_415() does not exist` additionally proves that the 0019 function baseline is absent. The surrounding object probe shows that 0019 was only partially applied, rather than merely missing from migration history.

## Baseline dependencies

| Object | DEV evidence | Canonical source | Reconciliation |
|---|---|---|---|
| `profiles.roles`, `profiles.status`, `profiles.club_id` | present | 0001/earlier updates | unchanged |
| `profiles.active_club_id` | absent | 0019/0020 | add with FK in 0039 |
| `training_groups` core columns | present | 0001 | unchanged |
| `group_members` core (`athlete_id`) | present | 0001 | preserve and add 0019 compatibility columns |
| `club_memberships` | absent | 0019 | create and backfill in 0039 |
| `group_memberships` | absent | 0019 | create and backfill in 0039 |
| `paddlio_is_admin_415()` | confirmed absent by SQL Editor | 0019 | recreate canonical definition in 0039 |
| `paddlio_can_manage_club_415(uuid)` | dependent baseline unavailable | 0019 | recreate canonical definition in 0039 |
| `paddlio_can_manage_group_415(uuid)` | dependent baseline unavailable | 0019 | recreate canonical definition in 0039 |
| `paddlio_user_has_club_role_0024(uuid,text[])` | dependent baseline unavailable | 0024 | recreate canonical definition in 0039 |
| 0024 training item/feedback helpers | dependent baseline unavailable | 0024 | recreate canonical pre-0036 definitions in 0039; 0038 then upgrades feedback writes |

## Concrete failures

- `training_feedback` 42703/PGRST204: first missing column is `feedback_type`; `author_id`, `technical_assessment`, `goal_achievement`, `load_assessment`, `observation`, and `improvement_point` are absent as well.
- `training_plan_items` PGRST204: `deleted_at` and `repeat_series_id` are absent.
- `notifications` PGRST204: `message`, `read`, `related_entity_type`, and `related_entity_id` are absent. Existing base columns include `body`, `type`, `read_at`, and `created_at`.

## Safe DEV action

In the SQL editor of project `nlllqsfdhfiwticrcrnp`, run these files in this repair order:

1. `supabase/migrations/0039_dev_migration_baseline_reconciliation.sql`
2. `supabase/migrations/0038_dev_schema_drift_reconciliation.sql`

This exceptional order is only for repairing the already drifted DEV database. On a fresh database, the normal migration chain already runs 0019 and 0024 before 0038. Both reconciliation files finish with `notify pgrst, 'reload schema';`.

Do not run either script against production. The repository's local Supabase link currently targets `twlkhfbrrwjwppxinmpn`, so a local `db push` is unsafe until it is explicitly relinked to DEV.

After applying it, repeat the read-only column probes and then reopen the iPhone app. The existing five queue entries must remain present until their retry succeeds.
