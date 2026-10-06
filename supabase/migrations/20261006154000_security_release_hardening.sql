-- Paddlio 5.0 security release hardening.
-- Keep authenticated execution for RLS helpers and the intentional contact-directory RPC,
-- while removing anonymous/public RPC exposure and direct access to trigger-only functions.

alter function public.set_updated_at() set search_path = '';
alter function public.default_roles_for_email(text) set search_path = '';

do $$
declare
  function_name text;
  function_signature regprocedure;
begin
  foreach function_name in array array[
    'current_user_club_id', 'current_user_is_admin', 'current_user_is_club_manager',
    'handle_new_auth_user', 'has_role', 'is_admin',
    'paddlio_can_author_trainer_feedback_0041', 'paddlio_can_manage_club_415',
    'paddlio_can_manage_group_415', 'paddlio_can_read_academy_course_0031',
    'paddlio_can_read_academy_lesson_0031', 'paddlio_can_read_training_feedback_0024',
    'paddlio_can_read_training_item_0024', 'paddlio_can_write_training_feedback_0024',
    'paddlio_can_write_training_item_0024', 'paddlio_handle_new_auth_user_0034',
    'paddlio_is_admin_0031', 'paddlio_is_admin_414', 'paddlio_is_admin_415',
    'paddlio_is_admin_profile_sync_415', 'paddlio_normalize_profile_roles_0034',
    'paddlio_sync_training_feedback_0030', 'paddlio_user_has_club_role_0024',
    'paddlio_user_has_club_role_0031', 'paddlio_visible_contact_profiles_20261002'
  ] loop
    for function_signature in
      select p.oid::regprocedure
      from pg_proc p
      join pg_namespace n on n.oid = p.pronamespace
      where n.nspname = 'public' and p.proname = function_name
    loop
      execute format('revoke all on function %s from public', function_signature);
      execute format('revoke all on function %s from anon', function_signature);
    end loop;
  end loop;
end
$$;

do $$
declare
  function_name text;
  function_signature regprocedure;
begin
  foreach function_name in array array[
    'set_updated_at', 'default_roles_for_email', 'handle_new_auth_user',
    'paddlio_handle_new_auth_user_0034', 'paddlio_normalize_profile_roles_0034',
    'paddlio_sync_training_feedback_0030'
  ] loop
    for function_signature in
      select p.oid::regprocedure
      from pg_proc p
      join pg_namespace n on n.oid = p.pronamespace
      where n.nspname = 'public' and p.proname = function_name
    loop
      execute format('revoke all on function %s from public', function_signature);
      execute format('revoke all on function %s from anon', function_signature);
      execute format('revoke all on function %s from authenticated', function_signature);
    end loop;
  end loop;
end
$$;

notify pgrst, 'reload schema';
