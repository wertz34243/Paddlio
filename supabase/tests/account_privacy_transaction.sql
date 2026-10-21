-- DEV-only regression. All fixtures and mutations are rolled back.
-- Run after 20261020141843_atomic_account_privacy.sql.
begin;
set local statement_timeout = '20s';
create table paddlio_private.privacy_delete_blocker_test (
  user_id uuid references auth.users(id)
);
do $$
declare
  victim uuid := gen_random_uuid();
  other_user uuid := gen_random_uuid();
  third_user uuid := gen_random_uuid();
  shared_message uuid := gen_random_uuid();
  unrelated_message uuid := gen_random_uuid();
  orphan_message uuid := gen_random_uuid();
  last_message uuid := gen_random_uuid();
  self_message uuid := gen_random_uuid();
  notice uuid := gen_random_uuid();
  shared_plan uuid := gen_random_uuid();
  shared_competition uuid := gen_random_uuid();
  other_result uuid := gen_random_uuid();
  other_start uuid := gen_random_uuid();
  academy_assignment text := gen_random_uuid()::text;
  failed boolean := false;
begin
  if not public.account_deletion_ready() then raise exception 'trigger not ready'; end if;
  if has_function_privilege('anon', 'public.account_deletion_ready()', 'EXECUTE')
     or has_function_privilege('authenticated', 'public.account_deletion_ready()', 'EXECUTE')
     or has_function_privilege('authenticated', 'paddlio_private.cleanup_deleted_account()', 'EXECUTE') then
    raise exception 'private cleanup API exposed';
  end if;

  insert into auth.users (id, email, raw_user_meta_data)
  values
    (victim, victim::text || '@privacy-test.invalid', '{}'::jsonb),
    (other_user, other_user::text || '@privacy-test.invalid', '{}'::jsonb),
    (third_user, third_user::text || '@privacy-test.invalid', '{}'::jsonb);
  insert into public.direct_messages(id, sender_id, receiver_id, message)
  values
    (shared_message, victim, other_user, 'shared fixture'),
    (unrelated_message, other_user, third_user, 'unrelated fixture'),
    (orphan_message, null, null, 'pre-existing orphan fixture'),
    (last_message, victim, null, 'last participant fixture'),
    (self_message, victim, victim, 'self fixture');
  insert into public.notifications(id,user_id,title) values (notice,victim,'fixture');
  insert into public.training_plan_items(id,owner_id,assigned_athlete_id,coach_id,title,date)
  values (shared_plan,other_user,victim,victim,'shared fixture',current_date);
  insert into public.academy_assignments(id,assigned_by,assigned_to)
  values (academy_assignment,victim::text,other_user::text);
  insert into public.club_requests(requested_by,reviewed_by,name) values (other_user,victim,'fixture');
  insert into public.trainer_requests(user_id,reviewed_by) values (other_user,victim);
  insert into paddlio_private.privacy_delete_blocker_test values (victim);
  insert into public.competitions(id,name,start_date,user_id,created_by)
  values(shared_competition,'fixture',current_date,victim,victim);
  insert into public.competition_results(id,competition_id,athlete_id,created_by,boat_class)
  values(other_result,shared_competition,other_user,victim,'K1');
  insert into public.competition_start_entries(id,competition_id,athlete_id,created_by,start_number,display_name)
  values(other_start,shared_competition,other_user,victim,1,'fixture');

  -- A downstream Auth deletion failure must roll back all trigger effects.
  begin
    delete from auth.users where id = victim;
  exception when foreign_key_violation then
    failed := true;
  end;
  if not failed then raise exception 'failure injection did not fire'; end if;
  if not exists (select 1 from public.notifications where id=notice)
     or not exists (select 1 from public.direct_messages where id=shared_message and sender_id=victim)
     or not exists (select 1 from public.direct_messages where id=last_message)
     or not exists (select 1 from public.profiles where id=victim)
     or not exists (select 1 from auth.users where id=victim) then
    raise exception 'partial deletion after failure';
  end if;
  delete from paddlio_private.privacy_delete_blocker_test where user_id=victim;
  delete from auth.users where id=victim;
  if not exists (select 1 from public.competition_results where id=other_result and athlete_id=other_user and created_by is null)
     or not exists (select 1 from public.competition_start_entries where id=other_start and athlete_id=other_user and created_by is null) then
    raise exception 'another athlete lost competition data';
  end if;
  if exists (select 1 from auth.users where id=victim)
     or exists (select 1 from public.profiles where id=victim)
     or exists (select 1 from public.notifications where id=notice)
     or exists (select 1 from public.direct_messages where id in (last_message,self_message)) then
    raise exception 'owned data remains';
  end if;
  if not exists (select 1 from public.direct_messages where id=shared_message and sender_id is null and receiver_id=other_user)
     or not exists (select 1 from public.direct_messages where id=unrelated_message and sender_id=other_user and receiver_id=third_user)
     or not exists (select 1 from public.direct_messages where id=orphan_message)
     or not exists (select 1 from public.training_plan_items where id=shared_plan and owner_id=other_user and assigned_athlete_id is null and coach_id is null)
     or not exists (select 1 from public.academy_assignments where id=academy_assignment and assigned_by is null and assigned_to=other_user::text) then
    raise exception 'unrelated/shared data damaged';
  end if;
end;
$$;
rollback;
select 'account privacy atomicity, isolation and permissions passed; fixtures rolled back' as result;
