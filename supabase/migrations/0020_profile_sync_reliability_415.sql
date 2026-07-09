-- Paddlio 4.1.5 Profile Sync Reliability Hotfix
-- Makes Supabase the canonical source for profile, role and club confirmation.

alter table if exists public.profiles
  drop constraint if exists profiles_roles_check;

alter table if exists public.profiles
  add constraint profiles_roles_check
  check (roles <@ array['Athlete', 'Coach', 'TeamAdmin', 'ClubAdmin', 'Admin']::text[]);

alter table if exists public.profiles
  add column if not exists primary_role text;

alter table if exists public.profiles
  add column if not exists active_club_id uuid references public.clubs(id) on delete set null;

alter table if exists public.profiles enable row level security;

create or replace function public.paddlio_normalize_profile_roles_415()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  normalized_email text;
  is_admin_actor boolean;
begin
  normalized_email := lower(trim(coalesce(new.email, '')));
  new.email := normalized_email;

  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and lower(p.email) = 't.kanu@outlook.com'
      and 'Admin' = any(p.roles)
      and p.status = 'active'
  )
  into is_admin_actor;

  if new.roles is null or array_length(new.roles, 1) is null then
    new.roles := array['Athlete']::text[];
  end if;

  if normalized_email = 't.kanu@outlook.com' then
    new.roles := array(
      select distinct role_name
      from unnest(new.roles || array['Athlete', 'Coach', 'Admin']::text[]) as role_name
      where role_name in ('Athlete', 'Coach', 'TeamAdmin', 'ClubAdmin', 'Admin')
    );
  elsif not is_admin_actor then
    new.roles := array(
      select distinct role_name
      from unnest(new.roles || array['Athlete']::text[]) as role_name
      where role_name in ('Athlete', 'Coach', 'TeamAdmin', 'ClubAdmin')
    );
  else
    new.roles := array(
      select distinct role_name
      from unnest(new.roles || array['Athlete']::text[]) as role_name
      where role_name in ('Athlete', 'Coach', 'TeamAdmin', 'ClubAdmin', 'Admin')
    );
  end if;

  new.primary_role := case
    when 'Admin' = any(new.roles) then 'Admin'
    when 'ClubAdmin' = any(new.roles) then 'ClubAdmin'
    when 'Coach' = any(new.roles) then 'Coach'
    when 'TeamAdmin' = any(new.roles) then 'TeamAdmin'
    else 'Athlete'
  end;
  new.active_club_id := coalesce(new.active_club_id, new.club_id);
  new.updated_at := coalesce(new.updated_at, now());
  return new;
end;
$$;

drop trigger if exists paddlio_profiles_role_sync_418 on public.profiles;
drop trigger if exists paddlio_profiles_role_sync_415 on public.profiles;
create trigger paddlio_profiles_role_sync_415
before insert or update of email, roles, club_id, active_club_id on public.profiles
for each row
execute function public.paddlio_normalize_profile_roles_415();

create or replace function public.paddlio_ensure_profile_415(
  p_user_id uuid,
  p_email text,
  p_first_name text default '',
  p_last_name text default '',
  p_display_name text default null,
  p_club_id uuid default null
)
returns public.profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  normalized_email text := lower(trim(coalesce(p_email, '')));
  existing_profile public.profiles%rowtype;
  ensured_profile public.profiles%rowtype;
  target_roles text[];
  target_club_id uuid := p_club_id;
  admin_club_id uuid;
begin
  if p_user_id is null then
    raise exception 'paddlio_ensure_profile_415 requires p_user_id';
  end if;

  if normalized_email = '' then
    raise exception 'paddlio_ensure_profile_415 requires p_email';
  end if;

  if normalized_email = 't.kanu@outlook.com' then
    select id
    into admin_club_id
    from public.clubs
    where lower(name) = 'mkc monheim'
       or lower(coalesce(short_name, '')) in ('mkc', 'mkc monheim')
    order by created_at asc
    limit 1;

    if admin_club_id is null then
      insert into public.clubs (name, short_name, city, status, created_at, updated_at)
      values ('MKC Monheim', 'MKC', 'Monheim am Rhein', 'active', now(), now())
      returning id into admin_club_id;
    end if;

    target_club_id := admin_club_id;
  end if;

  select *
  into existing_profile
  from public.profiles
  where id = p_user_id;

  if found then
    target_roles := case
      when normalized_email = 't.kanu@outlook.com'
        then array(select distinct role_name from unnest(existing_profile.roles || array['Athlete', 'Coach', 'Admin']::text[]) as role_name)
      when existing_profile.roles is null or array_length(existing_profile.roles, 1) is null
        then array['Athlete']::text[]
      else existing_profile.roles
    end;

    update public.profiles
    set
      email = normalized_email,
      first_name = coalesce(nullif(existing_profile.first_name, ''), nullif(p_first_name, '')),
      last_name = coalesce(nullif(existing_profile.last_name, ''), nullif(p_last_name, '')),
      display_name = coalesce(nullif(existing_profile.display_name, ''), nullif(p_display_name, ''), normalized_email),
      club_id = case
        when normalized_email = 't.kanu@outlook.com' then target_club_id
        else coalesce(existing_profile.club_id, target_club_id)
      end,
      active_club_id = case
        when normalized_email = 't.kanu@outlook.com' then target_club_id
        else coalesce(existing_profile.active_club_id, existing_profile.club_id, target_club_id)
      end,
      roles = target_roles,
      status = case when normalized_email = 't.kanu@outlook.com' then 'active' else coalesce(existing_profile.status, 'active') end,
      updated_at = now()
    where id = p_user_id
    returning * into ensured_profile;
  else
    target_roles := case
      when normalized_email = 't.kanu@outlook.com' then array['Athlete', 'Coach', 'Admin']::text[]
      else array['Athlete']::text[]
    end;

    insert into public.profiles (
      id,
      email,
      first_name,
      last_name,
      display_name,
      club_id,
      active_club_id,
      roles,
      status,
      boat_classes,
      created_at,
      updated_at
    )
    values (
      p_user_id,
      normalized_email,
      nullif(p_first_name, ''),
      nullif(p_last_name, ''),
      coalesce(nullif(p_display_name, ''), normalized_email),
      target_club_id,
      target_club_id,
      target_roles,
      'active',
      array['K1']::text[],
      now(),
      now()
    )
    returning * into ensured_profile;
  end if;

  if normalized_email = 't.kanu@outlook.com'
     and target_club_id is not null
     and to_regclass('public.club_memberships') is not null then
    execute
      'insert into public.club_memberships (club_id, user_id, role, status, updated_at)
       values ($1, $2, $3, $4, now())
       on conflict (club_id, user_id) do update
       set role = excluded.role,
           status = excluded.status,
           updated_at = now()'
    using target_club_id, p_user_id, 'Admin', 'active';
  end if;

  return ensured_profile;
end;
$$;

grant execute on function public.paddlio_ensure_profile_415(uuid, text, text, text, text, uuid) to authenticated;

create or replace function public.paddlio_is_admin_profile_sync_415()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and lower(p.email) = 't.kanu@outlook.com'
      and 'Admin' = any(p.roles)
      and p.status = 'active'
  );
$$;

drop policy if exists profiles_own_select_415 on public.profiles;
create policy profiles_own_select_415 on public.profiles
for select to authenticated
using (id = auth.uid());

drop policy if exists profiles_own_insert_415 on public.profiles;
create policy profiles_own_insert_415 on public.profiles
for insert to authenticated
with check (id = auth.uid());

drop policy if exists profiles_admin_all_415 on public.profiles;
create policy profiles_admin_all_415 on public.profiles
for all to authenticated
using (public.paddlio_is_admin_profile_sync_415())
with check (public.paddlio_is_admin_profile_sync_415());

update public.profiles
set
  email = lower(trim(email)),
  roles = case
    when lower(trim(email)) = 't.kanu@outlook.com'
      then array(select distinct role_name from unnest(roles || array['Athlete', 'Coach', 'Admin']::text[]) as role_name)
    when roles is null or array_length(roles, 1) is null
      then array['Athlete']::text[]
    else roles
  end,
  primary_role = case
    when lower(trim(email)) = 't.kanu@outlook.com' or 'Admin' = any(roles) then 'Admin'
    when 'ClubAdmin' = any(roles) then 'ClubAdmin'
    when 'Coach' = any(roles) then 'Coach'
    when 'TeamAdmin' = any(roles) then 'TeamAdmin'
    else 'Athlete'
  end,
  active_club_id = coalesce(active_club_id, club_id),
  updated_at = now()
where email is not null;

do $$
declare
  admin_profile_id uuid;
  admin_club_id uuid;
begin
  select id into admin_profile_id
  from public.profiles
  where lower(email) = 't.kanu@outlook.com'
  order by created_at asc
  limit 1;

  if admin_profile_id is not null then
    select id into admin_club_id
    from public.clubs
    where lower(name) = 'mkc monheim'
       or lower(coalesce(short_name, '')) in ('mkc', 'mkc monheim')
    order by created_at asc
    limit 1;

    if admin_club_id is null then
      insert into public.clubs (name, short_name, city, status, created_at, updated_at)
      values ('MKC Monheim', 'MKC', 'Monheim am Rhein', 'active', now(), now())
      returning id into admin_club_id;
    end if;

    update public.profiles
    set club_id = admin_club_id,
        active_club_id = admin_club_id,
        roles = array(select distinct role_name from unnest(roles || array['Athlete', 'Coach', 'Admin']::text[]) as role_name),
        primary_role = 'Admin',
        status = 'active',
        updated_at = now()
    where id = admin_profile_id;

    if to_regclass('public.club_memberships') is not null then
      execute
        'insert into public.club_memberships (club_id, user_id, role, status, updated_at)
         values ($1, $2, $3, $4, now())
         on conflict (club_id, user_id) do update
         set role = excluded.role,
             status = excluded.status,
             updated_at = now()'
      using admin_club_id, admin_profile_id, 'Admin', 'active';
    end if;
  end if;
end;
$$;
