-- Paddlio Admin Sync State Check
-- Read-only diagnostics for t.kanu@outlook.com.
-- This file does not change data, tables, policies or auth users.

do $$
declare
  admin_email constant text := 't.kanu@outlook.com';
  auth_record record;
  profile_record record;
  club_record record;
  membership_record record;
  group_record record;
  duplicate_record record;
  auth_found boolean := false;
  profile_found boolean := false;
  club_found boolean := false;
  membership_found boolean := false;
  duplicate_profiles_found boolean := false;
  primary_role_expr text := 'null::text';
  active_club_expr text := 'null::uuid';
begin
  raise notice '=== Paddlio Admin Sync Check: % ===', admin_email;

  raise notice '--- Table availability ---';
  raise notice 'auth.users: %', to_regclass('auth.users') is not null;
  raise notice 'public.profiles: %', to_regclass('public.profiles') is not null;
  raise notice 'public.clubs: %', to_regclass('public.clubs') is not null;
  raise notice 'public.club_memberships: %', to_regclass('public.club_memberships') is not null;
  raise notice 'public.training_groups: %', to_regclass('public.training_groups') is not null;
  raise notice 'public.group_memberships: %', to_regclass('public.group_memberships') is not null;
  raise notice 'public.group_members: %', to_regclass('public.group_members') is not null;

  raise notice '--- Auth user ---';
  if to_regclass('auth.users') is not null then
    for auth_record in
      execute $q$
        select
          id,
          email,
          created_at,
          email_confirmed_at,
          confirmed_at,
          last_sign_in_at
        from auth.users
        where lower(trim(email)) = 't.kanu@outlook.com'
        order by created_at asc
      $q$
    loop
      auth_found := true;
      raise notice 'auth_user id=% email=% created_at=% email_confirmed_at=% confirmed_at=% last_sign_in_at=%',
        auth_record.id,
        auth_record.email,
        auth_record.created_at,
        auth_record.email_confirmed_at,
        auth_record.confirmed_at,
        auth_record.last_sign_in_at;
    end loop;
  end if;

  raise notice '--- Profile rows ---';
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

    for profile_record in
      execute format($q$
        select
          p.id,
          p.email,
          p.first_name,
          p.last_name,
          p.display_name,
          %s as primary_role,
          p.roles,
          p.status,
          p.club_id,
          %s as active_club_id,
          p.age_category,
          p.boat_classes,
          p.paddle_side,
          p.created_at,
          p.updated_at
        from public.profiles p
        where lower(trim(p.email)) = 't.kanu@outlook.com'
           or p.id in (select id from auth.users where lower(trim(email)) = 't.kanu@outlook.com')
        order by p.created_at asc
      $q$, primary_role_expr, active_club_expr)
    loop
      profile_found := true;
      raise notice 'profile id=% email=% name="% %" display=% primary_role=% roles=% status=% club_id=% active_club_id=% age=% boats=% paddle=% created=% updated=%',
        profile_record.id,
        profile_record.email,
        profile_record.first_name,
        profile_record.last_name,
        profile_record.display_name,
        profile_record.primary_role,
        profile_record.roles,
        profile_record.status,
        profile_record.club_id,
        profile_record.active_club_id,
        profile_record.age_category,
        profile_record.boat_classes,
        profile_record.paddle_side,
        profile_record.created_at,
        profile_record.updated_at;
    end loop;
  end if;

  raise notice '--- MKC Monheim club ---';
  if to_regclass('public.clubs') is not null then
    for club_record in
      execute $q$
        select id, name, short_name, city, status, created_at, updated_at
        from public.clubs
        where lower(name) = 'mkc monheim'
           or lower(coalesce(short_name, '')) in ('mkc', 'mkc monheim')
        order by created_at asc
      $q$
    loop
      club_found := true;
      raise notice 'club id=% name=% short_name=% city=% status=% created=% updated=%',
        club_record.id,
        club_record.name,
        club_record.short_name,
        club_record.city,
        club_record.status,
        club_record.created_at,
        club_record.updated_at;
    end loop;
  end if;

  raise notice '--- Club memberships ---';
  if to_regclass('public.club_memberships') is not null then
    for membership_record in
      execute $q$
        select cm.id, cm.user_id, cm.club_id, c.name as club_name, cm.role, cm.status, cm.created_at, cm.updated_at
        from public.club_memberships cm
        left join public.clubs c on c.id = cm.club_id
        where cm.user_id in (select id from auth.users where lower(trim(email)) = 't.kanu@outlook.com')
        order by cm.created_at asc
      $q$
    loop
      membership_found := true;
      raise notice 'club_membership id=% user_id=% club_id=% club_name=% role=% status=% created=% updated=%',
        membership_record.id,
        membership_record.user_id,
        membership_record.club_id,
        membership_record.club_name,
        membership_record.role,
        membership_record.status,
        membership_record.created_at,
        membership_record.updated_at;
    end loop;
  end if;

  raise notice '--- Group memberships ---';
  if to_regclass('public.group_memberships') is not null and to_regclass('public.training_groups') is not null then
    for group_record in
      execute $q$
        select gm.id, gm.group_id, tg.name as group_name, gm.user_id, gm.role, gm.status, gm.created_at, gm.updated_at
        from public.group_memberships gm
        left join public.training_groups tg on tg.id = gm.group_id
        where gm.user_id in (select id from auth.users where lower(trim(email)) = 't.kanu@outlook.com')
        order by tg.name asc nulls last, gm.created_at asc
      $q$
    loop
      raise notice 'group_membership id=% group_id=% group_name=% user_id=% role=% status=% created=% updated=%',
        group_record.id,
        group_record.group_id,
        group_record.group_name,
        group_record.user_id,
        group_record.role,
        group_record.status,
        group_record.created_at,
        group_record.updated_at;
    end loop;
  end if;

  raise notice '--- Duplicate profile checks ---';
  if to_regclass('public.profiles') is not null then
    for duplicate_record in
      execute $q$
        select lower(trim(email)) as normalized_email, count(*) as profile_count, array_agg(id order by created_at) as profile_ids
        from public.profiles
        where lower(trim(email)) = 't.kanu@outlook.com'
        group by lower(trim(email))
        having count(*) > 1
      $q$
    loop
      duplicate_profiles_found := true;
      raise notice 'duplicate email=% count=% ids=%',
        duplicate_record.normalized_email,
        duplicate_record.profile_count,
        duplicate_record.profile_ids;
    end loop;
  end if;

  raise notice '=== Summary ===';
  raise notice 'auth_user_found=%', auth_found;
  raise notice 'profile_found=%', profile_found;
  raise notice 'club_found=%', club_found;
  raise notice 'membership_found=%', membership_found;
  raise notice 'duplicate_profiles_found=%', duplicate_profiles_found;
end;
$$;
