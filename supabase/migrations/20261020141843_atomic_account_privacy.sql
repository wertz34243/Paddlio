-- Account cleanup runs inside GoTrue's auth.users DELETE transaction.
-- Any cleanup/constraint/Auth failure rolls back all relational changes.
-- No existing user data is changed by installing this migration.
create schema if not exists paddlio_private;
revoke all on schema paddlio_private from public, anon, authenticated;
alter table public.academy_assignments alter column assigned_by drop not null;

create or replace function paddlio_private.cleanup_deleted_account()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- Storage bytes cannot participate in a Postgres transaction. Fail before
  -- cleanup instead of deleting metadata and orphaning the underlying objects.
  if exists (select 1 from storage.objects where owner_id = old.id::text) then
    raise exception 'account_storage_cleanup_required' using errcode = 'P0001';
  end if;

  -- Only messages involving THIS account and no remaining participant.
  -- Pre-existing orphan messages and conversations of other accounts survive.
  delete from public.direct_messages
  where (sender_id = old.id and (receiver_id is null or receiver_id = old.id))
     or (receiver_id = old.id and sender_id is null);

  update public.direct_messages set sender_id = null where sender_id = old.id;
  update public.direct_messages set receiver_id = null where receiver_id = old.id;
  update public.group_messages set sender_id = null where sender_id = old.id;
  update public.club_messages set sender_id = null where sender_id = old.id;
  update public.club_messages set target_user_id = null where target_user_id = old.id;
  update public.club_posts set author_id = null where author_id = old.id;
  update public.club_posts set target_user_id = null where target_user_id = old.id;
  update public.training_plan_items set assigned_athlete_id = null where assigned_athlete_id = old.id;
  update public.training_plan_items set coach_id = null where coach_id = old.id;
  update public.training_groups set coach_id = null where coach_id = old.id;
  update public.audit_logs set actor_id = null where actor_id = old.id;
  update public.academy_courses set created_by = null where created_by = old.id::text;
  update public.academy_lessons set created_by = null where created_by = old.id::text;
  update public.academy_learning_paths set created_by = null where created_by = old.id::text;
  update public.academy_media set created_by = null where created_by = old.id::text;
  update public.academy_assignments set assigned_by = null where assigned_by = old.id::text;
  update public.club_requests set reviewed_by = null where reviewed_by = old.id;
  update public.trainer_requests set reviewed_by = null where reviewed_by = old.id;
  update public.training_feedback set author_id = null where author_id = old.id;
  update public.training_feedback set coach_id = null where coach_id = old.id;
  update public.season_goals set assigned_by = null where assigned_by = old.id;
  update public.training_templates set created_by = null where created_by = old.id;
  update public.competition_results set created_by = null where created_by = old.id;

  delete from public.academy_quiz_attempts where user_id = old.id::text;
  delete from public.academy_favorites where user_id = old.id::text;
  delete from public.academy_progress where user_id = old.id::text;
  delete from public.academy_assignments where assigned_to = old.id::text;
  delete from public.polar_training_imports where user_id = old.id;
  delete from public.polar_sync_jobs where user_id = old.id;
  delete from public.polar_oauth_states where user_id = old.id;
  delete from public.polar_accounts where user_id = old.id;
  delete from public.device_connections where user_id = old.id;
  delete from public.export_jobs where user_id = old.id;
  delete from public.import_profiles where user_id = old.id;
  delete from public.import_jobs where user_id = old.id;
  delete from public.training_feedback where athlete_id = old.id;
  delete from public.training_journal_entries where athlete_id = old.id;
  delete from public.task_assignments where assigned_to = old.id or user_id = old.id;
  delete from public.training_attendance where athlete_id = old.id or user_id = old.id;
  delete from public.notifications where user_id = old.id;
  delete from public.file_attachments where owner_id = old.id or user_id = old.id;
  delete from public.tasks where user_id = old.id or owner_id = old.id or created_by = old.id;
  delete from public.result_imports where owner_id = old.id or user_id = old.id;
  delete from public.personal_bests where owner_id = old.id or user_id = old.id;
  delete from public.external_connections where owner_id = old.id or user_id = old.id;
  delete from public.external_training_sessions where owner_id = old.id or user_id = old.id;
  delete from public.beta_readiness_checks where user_id = old.id;
  delete from public.beta_feedback where user_id = old.id;
  delete from public.beta_testers where user_id = old.id;
  delete from public.competition_results where athlete_id = old.id;
  delete from public.competitions where user_id = old.id or created_by = old.id;
  delete from public.materials where athlete_id = old.id;
  delete from public.season_goals where athlete_id = old.id;
  delete from public.training_templates where owner_id = old.id;
  delete from public.training_plan_items where owner_id = old.id;
  delete from public.smart_coach_recommendations where owner_user_id = old.id or created_for_user_id = old.id;
  delete from public.boats where owner_id = old.id or user_id = old.id;
  delete from public.club_material where owner_id = old.id or user_id = old.id;
  delete from public.club_events where user_id = old.id or created_by = old.id;
  delete from public.club_documents where owner_id = old.id or created_by = old.id;
  delete from public.group_members where athlete_id = old.id;
  delete from public.group_memberships where user_id = old.id;
  delete from public.club_memberships where user_id = old.id;
  delete from public.trainer_requests where user_id = old.id;
  delete from public.club_requests where requested_by = old.id;
  return old;
end;
$$;
revoke all on function paddlio_private.cleanup_deleted_account() from public, anon, authenticated, service_role;

drop trigger if exists paddlio_cleanup_deleted_account on auth.users;
create trigger paddlio_cleanup_deleted_account
before delete on auth.users
for each row execute function paddlio_private.cleanup_deleted_account();

-- The Edge Function fails closed if deployed before this migration.
create or replace function public.account_deletion_ready()
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$
  select exists (
    select 1 from pg_catalog.pg_trigger
    where tgrelid = 'auth.users'::regclass
      and tgname = 'paddlio_cleanup_deleted_account'
      and tgenabled in ('O', 'A')
      and tgfoid = 'paddlio_private.cleanup_deleted_account()'::regprocedure
  );
$$;
revoke all on function public.account_deletion_ready() from public, anon, authenticated;
grant execute on function public.account_deletion_ready() to service_role;
notify pgrst, 'reload schema';
