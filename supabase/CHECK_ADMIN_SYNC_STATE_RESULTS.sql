-- Paddlio Admin Sync State Check - Results Version
-- Read-only diagnostics for t.kanu@outlook.com.
-- Shows normal SELECT results in Supabase instead of RAISE NOTICE messages.
-- Permanent data is not changed. Only a temporary result table is used for this SQL session.

create temporary table if not exists admin_sync_results (
  sort_order integer,
  section text,
  field text,
  value text
) on commit drop;

truncate table admin_sync_results;

do $$
declare
  admin_email constant text := 't.kanu@outlook.com';
  auth_user_id uuid;
  auth_count integer := 0;
  profile_count integer := 0;
  club_count integer := 0;
  membership_count integer := 0;
  duplicate_profile_count integer := 0;
  primary_role_expr text := 'null::text';
  active_club_expr text := 'null::uuid';
begin
  insert into admin_sync_results values
    (1, 'tables', 'auth.users_exists', (to_regclass('auth.users') is not null)::text),
    (2, 'tables', 'public.profiles_exists', (to_regclass('public.profiles') is not null)::text),
    (3, 'tables', 'public.clubs_exists', (to_regclass('public.clubs') is not null)::text),
    (4, 'tables', 'public.club_memberships_exists', (to_regclass('public.club_memberships') is not null)::text),
    (5, 'tables', 'public.training_groups_exists', (to_regclass('public.training_groups') is not null)::text),
    (6, 'tables', 'public.group_memberships_exists', (to_regclass('public.group_memberships') is not null)::text);

  if to_regclass('auth.users') is not null then
    execute $q$
      insert into admin_sync_results(sort_order, section, field, value)
      select 20, 'auth_user', 'id', id::text
      from auth.users
      where lower(trim(email)) = 't.kanu@outlook.com'
      order by created_at asc
    $q$;

    execute $q$
      insert into admin_sync_results(sort_order, section, field, value)
      select 21, 'auth_user', 'email', email
      from auth.users
      where lower(trim(email)) = 't.kanu@outlook.com'
      order by created_at asc
    $q$;

    execute $q$
      insert into admin_sync_results(sort_order, section, field, value)
      select 22, 'auth_user', 'created_at', created_at::text
      from auth.users
      where lower(trim(email)) = 't.kanu@outlook.com'
      order by created_at asc
    $q$;

    execute $q$
      insert into admin_sync_results(sort_order, section, field, value)
      select 23, 'auth_user', 'email_confirmed_at', coalesce(email_confirmed_at::text, 'null')
      from auth.users
      where lower(trim(email)) = 't.kanu@outlook.com'
      order by created_at asc
    $q$;

    execute $q$
      insert into admin_sync_results(sort_order, section, field, value)
      select 24, 'auth_user', 'confirmed_at', coalesce(confirmed_at::text, 'null')
      from auth.users
      where lower(trim(email)) = 't.kanu@outlook.com'
      order by created_at asc
    $q$;

    execute $q$
      select count(*), min(id)
      from auth.users
      where lower(trim(email)) = 't.kanu@outlook.com'
    $q$
    into auth_count, auth_user_id;
  end if;

  if to_regclass('public.profiles') is not null then
    if exists (
      select 1 from information_schema.columns
      where table_schema = 'public' and table_name = 'profiles' and column_name = 'primary_role'
    ) then
      primary_role_expr := 'p.primary_role';
    end if;

    if exists (
      select 1 from information_schema.columns
      where table_schema = 'public' and table_name = 'profiles' and column_name = 'active_club_id'
    ) then
      active_club_expr := 'p.active_club_id';
    end if;

    execute format($q$
      insert into admin_sync_results(sort_order, section, field, value)
      select 40, 'profile', 'id', p.id::text
      from public.profiles p
      where lower(trim(p.email)) = 't.kanu@outlook.com'
         or p.id in (select id from auth.users where lower(trim(email)) = 't.kanu@outlook.com')
      order by p.created_at asc
    $q$);

    execute format($q$
      insert into admin_sync_results(sort_order, section, field, value)
      select 41, 'profile', 'email', p.email
      from public.profiles p
      where lower(trim(p.email)) = 't.kanu@outlook.com'
         or p.id in (select id from auth.users where lower(trim(email)) = 't.kanu@outlook.com')
      order by p.created_at asc
    $q$);

    execute format($q$
      insert into admin_sync_results(sort_order, section, field, value)
      select 42, 'profile', 'name', concat_ws(' ', p.first_name, p.last_name)
      from public.profiles p
      where lower(trim(p.email)) = 't.kanu@outlook.com'
         or p.id in (select id from auth.users where lower(trim(email)) = 't.kanu@outlook.com')
      order by p.created_at asc
    $q$);

    execute format($q$
      insert into admin_sync_results(sort_order, section, field, value)
      select 43, 'profile', 'display_name', coalesce(p.display_name, 'null')
      from public.profiles p
      where lower(trim(p.email)) = 't.kanu@outlook.com'
         or p.id in (select id from auth.users where lower(trim(email)) = 't.kanu@outlook.com')
      order by p.created_at asc
    $q$);

    execute format($q$
      insert into admin_sync_results(sort_order, section, field, value)
      select 44, 'profile', 'primary_role', coalesce((%s)::text, 'null')
      from public.profiles p
      where lower(trim(p.email)) = 't.kanu@outlook.com'
         or p.id in (select id from auth.users where lower(trim(email)) = 't.kanu@outlook.com')
      order by p.created_at asc
    $q$, primary_role_expr);

    execute format($q$
      insert into admin_sync_results(sort_order, section, field, value)
      select 45, 'profile', 'roles', coalesce(p.roles::text, 'null')
      from public.profiles p
      where lower(trim(p.email)) = 't.kanu@outlook.com'
         or p.id in (select id from auth.users where lower(trim(email)) = 't.kanu@outlook.com')
      order by p.created_at asc
    $q$);

    execute format($q$
      insert into admin_sync_results(sort_order, section, field, value)
      select 46, 'profile', 'club_id', coalesce(p.club_id::text, 'null')
      from public.profiles p
      where lower(trim(p.email)) = 't.kanu@outlook.com'
         or p.id in (select id from auth.users where lower(trim(email)) = 't.kanu@outlook.com')
      order by p.created_at asc
    $q$);

    execute format($q$
      insert into admin_sync_results(sort_order, section, field, value)
      select 47, 'profile', 'active_club_id', coalesce((%s)::text, 'null')
      from public.profiles p
      where lower(trim(p.email)) = 't.kanu@outlook.com'
         or p.id in (select id from auth.users where lower(trim(email)) = 't.kanu@outlook.com')
      order by p.created_at asc
    $q$, active_club_expr);

    execute format($q$
      insert into admin_sync_results(sort_order, section, field, value)
      select 48, 'profile', 'boat_classes', coalesce(p.boat_classes::text, 'null')
      from public.profiles p
      where lower(trim(p.email)) = 't.kanu@outlook.com'
         or p.id in (select id from auth.users where lower(trim(email)) = 't.kanu@outlook.com')
      order by p.created_at asc
    $q$);

    execute $q$
      select count(*)
      from public.profiles
      where lower(trim(email)) = 't.kanu@outlook.com'
         or id in (select id from auth.users where lower(trim(email)) = 't.kanu@outlook.com')
    $q$
    into profile_count;

    execute $q$
      select greatest(count(*) - 1, 0)
      from public.profiles
      where lower(trim(email)) = 't.kanu@outlook.com'
    $q$
    into duplicate_profile_count;
  end if;

  if to_regclass('public.clubs') is not null then
    execute $q$
      insert into admin_sync_results(sort_order, section, field, value)
      select 60, 'club', 'id', id::text
      from public.clubs
      where lower(name) = 'mkc monheim'
         or lower(coalesce(short_name, '')) in ('mkc', 'mkc monheim')
      order by created_at asc
    $q$;

    execute $q$
      insert into admin_sync_results(sort_order, section, field, value)
      select 61, 'club', 'name', name
      from public.clubs
      where lower(name) = 'mkc monheim'
         or lower(coalesce(short_name, '')) in ('mkc', 'mkc monheim')
      order by created_at asc
    $q$;

    execute $q$
      insert into admin_sync_results(sort_order, section, field, value)
      select 62, 'club', 'short_name', coalesce(short_name, 'null')
      from public.clubs
      where lower(name) = 'mkc monheim'
         or lower(coalesce(short_name, '')) in ('mkc', 'mkc monheim')
      order by created_at asc
    $q$;

    execute $q$
      select count(*)
      from public.clubs
      where lower(name) = 'mkc monheim'
         or lower(coalesce(short_name, '')) in ('mkc', 'mkc monheim')
    $q$
    into club_count;
  end if;

  if to_regclass('public.club_memberships') is not null then
    execute $q$
      insert into admin_sync_results(sort_order, section, field, value)
      select 80, 'club_membership', 'row', concat_ws(' | ', cm.id::text, cm.user_id::text, cm.club_id::text, coalesce(c.name, 'unknown club'), cm.role, cm.status)
      from public.club_memberships cm
      left join public.clubs c on c.id = cm.club_id
      where cm.user_id in (select id from auth.users where lower(trim(email)) = 't.kanu@outlook.com')
      order by cm.created_at asc
    $q$;

    execute $q$
      select count(*)
      from public.club_memberships cm
      where cm.user_id in (select id from auth.users where lower(trim(email)) = 't.kanu@outlook.com')
    $q$
    into membership_count;
  end if;

  if to_regclass('public.group_memberships') is not null and to_regclass('public.training_groups') is not null then
    execute $q$
      insert into admin_sync_results(sort_order, section, field, value)
      select 100, 'group_membership', 'row', concat_ws(' | ', gm.id::text, gm.group_id::text, coalesce(tg.name, 'unknown group'), gm.user_id::text, gm.role, gm.status)
      from public.group_memberships gm
      left join public.training_groups tg on tg.id = gm.group_id
      where gm.user_id in (select id from auth.users where lower(trim(email)) = 't.kanu@outlook.com')
      order by tg.name asc nulls last, gm.created_at asc
    $q$;
  end if;

  insert into admin_sync_results values
    (900, 'summary', 'auth_user_found', (auth_count > 0)::text),
    (901, 'summary', 'profile_found', (profile_count > 0)::text),
    (902, 'summary', 'club_found', (club_count > 0)::text),
    (903, 'summary', 'membership_found', (membership_count > 0)::text),
    (904, 'summary', 'duplicate_profiles_found', (duplicate_profile_count > 0)::text);
end;
$$;

select section, field, value
from admin_sync_results
order by sort_order, section, field, value;
