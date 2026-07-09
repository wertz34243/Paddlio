-- Paddlio 4.1.5 Safe Supabase Sync
-- Run this file in the Supabase SQL Editor for an existing database.
-- It is idempotent, non-destructive, and only repairs/adds missing schema, RLS and policies.

create extension if not exists pgcrypto;

create table if not exists public.clubs (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  short_name text,
  city text,
  contact_name text,
  contact_email text,
  website text,
  logo_url text,
  primary_color text,
  secondary_color text,
  status text not null default 'active',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.profiles (
  id uuid primary key,
  email text not null,
  first_name text,
  last_name text,
  display_name text,
  club_id uuid references public.clubs(id) on delete set null,
  roles text[] not null default array['Athlete']::text[],
  status text not null default 'active',
  avatar_url text,
  age_category text,
  boat_classes text[] default array[]::text[],
  paddle_side text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.training_groups (
  id uuid primary key default gen_random_uuid(),
  club_id uuid references public.clubs(id) on delete cascade,
  coach_id uuid references public.profiles(id) on delete set null,
  name text not null,
  description text,
  age_category text,
  boat_classes text[] default array[]::text[],
  training_focus text,
  color text,
  status text not null default 'active',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.club_memberships (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.clubs(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null default 'Athlete',
  status text not null default 'active',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.group_memberships (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.training_groups(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null default 'Athlete',
  status text not null default 'active',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.group_members (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.training_groups(id) on delete cascade,
  athlete_id uuid references public.profiles(id) on delete cascade,
  created_at timestamptz default now()
);

alter table public.clubs add column if not exists short_name text;
alter table public.clubs add column if not exists city text;
alter table public.clubs add column if not exists contact_name text;
alter table public.clubs add column if not exists contact_email text;
alter table public.clubs add column if not exists website text;
alter table public.clubs add column if not exists logo_url text;
alter table public.clubs add column if not exists primary_color text;
alter table public.clubs add column if not exists secondary_color text;
alter table public.clubs add column if not exists status text not null default 'active';
alter table public.clubs add column if not exists created_by uuid references public.profiles(id) on delete set null;
alter table public.clubs add column if not exists created_at timestamptz default now();
alter table public.clubs add column if not exists updated_at timestamptz default now();

alter table public.profiles add column if not exists email text;
alter table public.profiles add column if not exists first_name text;
alter table public.profiles add column if not exists last_name text;
alter table public.profiles add column if not exists display_name text;
alter table public.profiles add column if not exists club_id uuid references public.clubs(id) on delete set null;
alter table public.profiles add column if not exists active_club_id uuid references public.clubs(id) on delete set null;
alter table public.profiles add column if not exists roles text[] not null default array['Athlete']::text[];
alter table public.profiles add column if not exists primary_role text;
alter table public.profiles add column if not exists status text not null default 'active';
alter table public.profiles add column if not exists avatar_url text;
alter table public.profiles add column if not exists age_category text;
alter table public.profiles add column if not exists boat_classes text[] default array[]::text[];
alter table public.profiles add column if not exists paddle_side text;
alter table public.profiles add column if not exists created_at timestamptz default now();
alter table public.profiles add column if not exists updated_at timestamptz default now();

alter table public.training_groups add column if not exists club_id uuid references public.clubs(id) on delete cascade;
alter table public.training_groups add column if not exists coach_id uuid references public.profiles(id) on delete set null;
alter table public.training_groups add column if not exists description text;
alter table public.training_groups add column if not exists age_category text;
alter table public.training_groups add column if not exists boat_classes text[] default array[]::text[];
alter table public.training_groups add column if not exists training_focus text;
alter table public.training_groups add column if not exists color text;
alter table public.training_groups add column if not exists status text not null default 'active';
alter table public.training_groups add column if not exists created_at timestamptz default now();
alter table public.training_groups add column if not exists updated_at timestamptz default now();

alter table public.club_memberships add column if not exists club_id uuid references public.clubs(id) on delete cascade;
alter table public.club_memberships add column if not exists user_id uuid references public.profiles(id) on delete cascade;
alter table public.club_memberships add column if not exists role text not null default 'Athlete';
alter table public.club_memberships add column if not exists status text not null default 'active';
alter table public.club_memberships add column if not exists created_at timestamptz default now();
alter table public.club_memberships add column if not exists updated_at timestamptz default now();

alter table public.group_memberships add column if not exists group_id uuid references public.training_groups(id) on delete cascade;
alter table public.group_memberships add column if not exists user_id uuid references public.profiles(id) on delete cascade;
alter table public.group_memberships add column if not exists role text not null default 'Athlete';
alter table public.group_memberships add column if not exists status text not null default 'active';
alter table public.group_memberships add column if not exists created_at timestamptz default now();
alter table public.group_memberships add column if not exists updated_at timestamptz default now();

alter table public.group_members add column if not exists athlete_id uuid references public.profiles(id) on delete cascade;
alter table public.group_members add column if not exists user_id uuid references public.profiles(id) on delete cascade;
alter table public.group_members add column if not exists role text not null default 'Athlete';
alter table public.group_members add column if not exists status text not null default 'active';
alter table public.group_members add column if not exists updated_at timestamptz default now();

do $$
begin
  if exists (
    select 1
    from pg_constraint
    where conrelid = 'public.profiles'::regclass
      and conname = 'profiles_roles_check'
  ) then
    alter table public.profiles drop constraint profiles_roles_check;
  end if;

  alter table public.profiles
    add constraint profiles_roles_check
    check (roles <@ array['Athlete', 'Coach', 'TeamAdmin', 'ClubAdmin', 'Admin']::text[]);
exception
  when duplicate_object then null;
end;
$$;

do $$
begin
  if not exists (
    select 1
    from public.club_memberships
    where club_id is not null and user_id is not null
    group by club_id, user_id
    having count(*) > 1
  ) then
    create unique index if not exists club_memberships_unique_user_club_idx
      on public.club_memberships(club_id, user_id);
  else
    raise notice 'club_memberships unique index skipped because duplicate memberships exist.';
  end if;

  if not exists (
    select 1
    from public.group_memberships
    where group_id is not null and user_id is not null
    group by group_id, user_id
    having count(*) > 1
  ) then
    create unique index if not exists group_memberships_unique_user_group_idx
      on public.group_memberships(group_id, user_id);
  else
    raise notice 'group_memberships unique index skipped because duplicate memberships exist.';
  end if;
end;
$$;

create index if not exists profiles_email_lower_idx on public.profiles(lower(email));
create index if not exists profiles_club_id_idx on public.profiles(club_id);
create index if not exists profiles_active_club_id_idx on public.profiles(active_club_id);
create index if not exists club_memberships_club_idx on public.club_memberships(club_id);
create index if not exists club_memberships_user_idx on public.club_memberships(user_id);
create index if not exists training_groups_club_idx on public.training_groups(club_id);
create index if not exists training_groups_coach_idx on public.training_groups(coach_id);
create index if not exists group_memberships_group_idx on public.group_memberships(group_id);
create index if not exists group_memberships_user_idx on public.group_memberships(user_id);
create index if not exists group_members_group_idx on public.group_members(group_id);
create index if not exists group_members_athlete_idx on public.group_members(athlete_id);
create index if not exists group_members_user_idx on public.group_members(user_id);

create or replace function public.paddlio_is_admin_415()
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

create or replace function public.paddlio_can_manage_club_415(target_club_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.paddlio_is_admin_415()
    or exists (
      select 1
      from public.club_memberships cm
      where cm.club_id = target_club_id
        and cm.user_id = auth.uid()
        and cm.status = 'active'
        and cm.role in ('ClubAdmin', 'Admin')
    )
    or exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and coalesce(p.active_club_id, p.club_id) = target_club_id
        and p.status = 'active'
        and (p.roles && array['ClubAdmin','Admin']::text[])
    );
$$;

create or replace function public.paddlio_can_manage_group_415(target_group_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.paddlio_is_admin_415()
    or exists (
      select 1
      from public.training_groups g
      where g.id = target_group_id
        and (
          g.coach_id = auth.uid()
          or public.paddlio_can_manage_club_415(g.club_id)
        )
    );
$$;

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

  select public.paddlio_is_admin_415() into is_admin_actor;

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
     and target_club_id is not null then
    update public.club_memberships
    set role = 'Admin',
        status = 'active',
        updated_at = now()
    where club_id = target_club_id
      and user_id = p_user_id;

    if not found then
      insert into public.club_memberships (club_id, user_id, role, status, updated_at)
      values (target_club_id, p_user_id, 'Admin', 'active', now());
    end if;
  end if;

  return ensured_profile;
end;
$$;

grant execute on function public.paddlio_ensure_profile_415(uuid, text, text, text, text, uuid) to authenticated;

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

update public.club_memberships cm
set role = case
      when 'Admin' = any(p.roles) then 'Admin'
      when 'ClubAdmin' = any(p.roles) then 'ClubAdmin'
      when 'Coach' = any(p.roles) or 'TeamAdmin' = any(p.roles) then 'Coach'
      else 'Athlete'
    end,
    status = case when p.status = 'active' then 'active' else 'inactive' end,
    updated_at = now()
from public.profiles p
where cm.club_id = p.club_id
  and cm.user_id = p.id
  and p.club_id is not null;

insert into public.club_memberships (club_id, user_id, role, status)
select distinct
  p.club_id,
  p.id,
  case
    when 'Admin' = any(p.roles) then 'Admin'
    when 'ClubAdmin' = any(p.roles) then 'ClubAdmin'
    when 'Coach' = any(p.roles) or 'TeamAdmin' = any(p.roles) then 'Coach'
    else 'Athlete'
  end,
  case when p.status = 'active' then 'active' else 'inactive' end
from public.profiles p
where p.club_id is not null
  and not exists (
    select 1
    from public.club_memberships cm
    where cm.club_id = p.club_id
      and cm.user_id = p.id
  );

update public.group_members
set user_id = coalesce(user_id, athlete_id),
    role = coalesce(role, 'Athlete'),
    status = coalesce(status, 'active'),
    updated_at = coalesce(updated_at, now())
where athlete_id is not null;

update public.group_memberships gm
set role = source_members.role,
    status = source_members.status,
    updated_at = now()
from (
  select distinct group_id, coalesce(user_id, athlete_id) as user_id, role, status
  from public.group_members
  where group_id is not null
    and coalesce(user_id, athlete_id) is not null
) source_members
where gm.group_id = source_members.group_id
  and gm.user_id = source_members.user_id;

insert into public.group_memberships (group_id, user_id, role, status)
select distinct group_id, coalesce(user_id, athlete_id), role, status
from public.group_members source_members
where group_id is not null
  and coalesce(user_id, athlete_id) is not null
  and not exists (
    select 1
    from public.group_memberships gm
    where gm.group_id = source_members.group_id
      and gm.user_id = coalesce(source_members.user_id, source_members.athlete_id)
  );

update public.group_memberships gm
set role = 'Coach',
    status = 'active',
    updated_at = now()
from public.training_groups g
where gm.group_id = g.id
  and gm.user_id = g.coach_id
  and g.coach_id is not null;

insert into public.group_memberships (group_id, user_id, role, status)
select distinct id, coach_id, 'Coach', 'active'
from public.training_groups g
where coach_id is not null
  and not exists (
    select 1
    from public.group_memberships gm
    where gm.group_id = g.id
      and gm.user_id = g.coach_id
  );

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

    update public.club_memberships
    set role = 'Admin',
        status = 'active',
        updated_at = now()
    where club_id = admin_club_id
      and user_id = admin_profile_id;

    if not found then
      insert into public.club_memberships (club_id, user_id, role, status, updated_at)
      values (admin_club_id, admin_profile_id, 'Admin', 'active', now());
    end if;
  end if;
end;
$$;

alter table public.profiles enable row level security;
alter table public.clubs enable row level security;
alter table public.training_groups enable row level security;
alter table public.group_members enable row level security;
alter table public.club_memberships enable row level security;
alter table public.group_memberships enable row level security;

drop policy if exists profiles_own_select_415 on public.profiles;
create policy profiles_own_select_415 on public.profiles
for select to authenticated
using (id = auth.uid());

drop policy if exists profiles_own_insert_415 on public.profiles;
create policy profiles_own_insert_415 on public.profiles
for insert to authenticated
with check (id = auth.uid());

drop policy if exists profiles_own_update_415 on public.profiles;
create policy profiles_own_update_415 on public.profiles
for update to authenticated
using (id = auth.uid())
with check (id = auth.uid());

drop policy if exists profiles_admin_all_415 on public.profiles;
create policy profiles_admin_all_415 on public.profiles
for all to authenticated
using (public.paddlio_is_admin_415())
with check (public.paddlio_is_admin_415());

drop policy if exists clubs_read_415 on public.clubs;
create policy clubs_read_415 on public.clubs
for select to authenticated
using (true);

drop policy if exists clubs_manage_415 on public.clubs;
create policy clubs_manage_415 on public.clubs
for all to authenticated
using (public.paddlio_is_admin_415() or public.paddlio_can_manage_club_415(id))
with check (public.paddlio_is_admin_415() or public.paddlio_can_manage_club_415(id));

drop policy if exists club_memberships_read_415 on public.club_memberships;
create policy club_memberships_read_415 on public.club_memberships
for select to authenticated
using (
  user_id = auth.uid()
  or public.paddlio_is_admin_415()
  or public.paddlio_can_manage_club_415(club_id)
);

drop policy if exists club_memberships_write_415 on public.club_memberships;
create policy club_memberships_write_415 on public.club_memberships
for all to authenticated
using (public.paddlio_is_admin_415() or public.paddlio_can_manage_club_415(club_id))
with check (public.paddlio_is_admin_415() or public.paddlio_can_manage_club_415(club_id));

drop policy if exists training_groups_read_415 on public.training_groups;
create policy training_groups_read_415 on public.training_groups
for select to authenticated
using (
  public.paddlio_is_admin_415()
  or coach_id = auth.uid()
  or public.paddlio_can_manage_club_415(club_id)
  or exists (
    select 1
    from public.group_memberships gm
    where gm.group_id = training_groups.id
      and gm.user_id = auth.uid()
      and gm.status = 'active'
  )
);

drop policy if exists training_groups_write_415 on public.training_groups;
create policy training_groups_write_415 on public.training_groups
for all to authenticated
using (public.paddlio_is_admin_415() or coach_id = auth.uid() or public.paddlio_can_manage_club_415(club_id))
with check (public.paddlio_is_admin_415() or coach_id = auth.uid() or public.paddlio_can_manage_club_415(club_id));

drop policy if exists group_memberships_read_415 on public.group_memberships;
create policy group_memberships_read_415 on public.group_memberships
for select to authenticated
using (
  user_id = auth.uid()
  or public.paddlio_is_admin_415()
  or public.paddlio_can_manage_group_415(group_id)
);

drop policy if exists group_memberships_write_415 on public.group_memberships;
create policy group_memberships_write_415 on public.group_memberships
for all to authenticated
using (public.paddlio_is_admin_415() or public.paddlio_can_manage_group_415(group_id))
with check (public.paddlio_is_admin_415() or public.paddlio_can_manage_group_415(group_id));

drop policy if exists group_members_read_415 on public.group_members;
create policy group_members_read_415 on public.group_members
for select to authenticated
using (
  athlete_id = auth.uid()
  or user_id = auth.uid()
  or public.paddlio_is_admin_415()
  or public.paddlio_can_manage_group_415(group_id)
);

drop policy if exists group_members_write_415 on public.group_members;
create policy group_members_write_415 on public.group_members
for all to authenticated
using (public.paddlio_is_admin_415() or public.paddlio_can_manage_group_415(group_id))
with check (public.paddlio_is_admin_415() or public.paddlio_can_manage_group_415(group_id));
