-- Paddlio Admin Test Profile Reset
-- Safe targeted repair for t.kanu@outlook.com.
-- This file does not delete auth.users, does not drop tables, and does not touch unrelated users.

create extension if not exists pgcrypto;

create table if not exists public.clubs (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  short_name text,
  city text,
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
  age_category text,
  boat_classes text[] default array[]::text[],
  paddle_side text,
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

create table if not exists public.training_groups (
  id uuid primary key default gen_random_uuid(),
  club_id uuid references public.clubs(id) on delete cascade,
  coach_id uuid references public.profiles(id) on delete set null,
  name text not null,
  description text,
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

alter table public.clubs add column if not exists short_name text;
alter table public.clubs add column if not exists city text;
alter table public.clubs add column if not exists status text not null default 'active';
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
alter table public.profiles add column if not exists age_category text;
alter table public.profiles add column if not exists boat_classes text[] default array[]::text[];
alter table public.profiles add column if not exists paddle_side text;
alter table public.profiles add column if not exists created_at timestamptz default now();
alter table public.profiles add column if not exists updated_at timestamptz default now();

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

do $$
declare
  admin_email constant text := 't.kanu@outlook.com';
  admin_user_id uuid;
  admin_club_id uuid;
  roles_udt text;
  roles_data_type text;
  boat_udt text;
  boat_data_type text;
  duplicate_profile record;
begin
  select id
  into admin_user_id
  from auth.users
  where lower(trim(email)) = admin_email
  order by created_at asc
  limit 1;

  if admin_user_id is null then
    raise notice 'No auth.users row found for %. Create/sign in with this account in Supabase Auth first. No changes were made to auth.users.', admin_email;
    return;
  end if;

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
  else
    update public.clubs
    set name = 'MKC Monheim',
        short_name = coalesce(nullif(short_name, ''), 'MKC'),
        city = coalesce(nullif(city, ''), 'Monheim am Rhein'),
        status = 'active',
        updated_at = now()
    where id = admin_club_id;
  end if;

  insert into public.profiles (
    id,
    email,
    first_name,
    last_name,
    display_name,
    club_id,
    active_club_id,
    roles,
    primary_role,
    status,
    age_category,
    boat_classes,
    paddle_side,
    created_at,
    updated_at
  )
  values (
    admin_user_id,
    admin_email,
    'Tobias',
    'Kuhn',
    'Tobias Kuhn',
    admin_club_id,
    admin_club_id,
    array['Athlete', 'Coach', 'Admin']::text[],
    'Admin',
    'active',
    'Leistungsklasse',
    array['K1', 'C1']::text[],
    'Links',
    now(),
    now()
  )
  on conflict (id) do update
  set email = excluded.email,
      first_name = excluded.first_name,
      last_name = excluded.last_name,
      display_name = excluded.display_name,
      club_id = excluded.club_id,
      active_club_id = excluded.active_club_id,
      roles = excluded.roles,
      primary_role = excluded.primary_role,
      status = excluded.status,
      age_category = excluded.age_category,
      boat_classes = excluded.boat_classes,
      paddle_side = excluded.paddle_side,
      updated_at = now();

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'profiles' and column_name = 'nickname'
  ) then
    execute 'update public.profiles set nickname = $1 where id = $2'
    using 'Tobias', admin_user_id;
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'profiles' and column_name = 'role'
  ) then
    execute 'update public.profiles set role = $1 where id = $2'
    using 'Admin', admin_user_id;
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'profiles' and column_name = 'age_class'
  ) then
    execute 'update public.profiles set age_class = $1 where id = $2'
    using 'Leistungsklasse', admin_user_id;
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'profiles' and column_name = 'level'
  ) then
    execute 'update public.profiles set level = $1 where id = $2'
    using 'Leistungsklasse', admin_user_id;
  end if;

  select data_type, udt_name
  into roles_data_type, roles_udt
  from information_schema.columns
  where table_schema = 'public'
    and table_name = 'profiles'
    and column_name = 'roles';

  if roles_data_type = 'jsonb' then
    execute 'update public.profiles set roles = $1::jsonb where id = $2'
    using '["Athlete","Coach","Admin"]', admin_user_id;
  elsif roles_udt = '_text' then
    execute 'update public.profiles set roles = $1::text[] where id = $2'
    using array['Athlete', 'Coach', 'Admin']::text[], admin_user_id;
  end if;

  select data_type, udt_name
  into boat_data_type, boat_udt
  from information_schema.columns
  where table_schema = 'public'
    and table_name = 'profiles'
    and column_name = 'boat_classes';

  if boat_data_type = 'jsonb' then
    execute 'update public.profiles set boat_classes = $1::jsonb where id = $2'
    using '["K1","C1"]', admin_user_id;
  elsif boat_udt = '_text' then
    execute 'update public.profiles set boat_classes = $1::text[] where id = $2'
    using array['K1', 'C1']::text[], admin_user_id;
  end if;

  update public.club_memberships
  set role = 'Admin',
      status = 'active',
      updated_at = now()
  where club_id = admin_club_id
    and user_id = admin_user_id;

  if not found then
    insert into public.club_memberships (club_id, user_id, role, status, created_at, updated_at)
    values (admin_club_id, admin_user_id, 'Admin', 'active', now(), now());
  end if;

  for duplicate_profile in
    select id, email
    from public.profiles
    where lower(trim(email)) = admin_email
      and id <> admin_user_id
  loop
    if exists (
      select 1 from information_schema.columns
      where table_schema = 'public' and table_name = 'profiles' and column_name = 'status'
    ) then
      update public.profiles
      set status = 'disabled',
          updated_at = now()
      where id = duplicate_profile.id;
      raise notice 'Disabled duplicate profile id=% email=% for admin test account.', duplicate_profile.id, duplicate_profile.email;
    else
      raise notice 'Duplicate profile found but not changed because profiles.status is missing: id=% email=%', duplicate_profile.id, duplicate_profile.email;
    end if;
  end loop;

  update public.group_memberships gm
  set role = 'Coach',
      status = 'active',
      updated_at = now()
  from public.training_groups tg
  where gm.group_id = tg.id
    and gm.user_id = admin_user_id
    and tg.coach_id = admin_user_id;

  insert into public.group_memberships (group_id, user_id, role, status, created_at, updated_at)
  select tg.id, admin_user_id, 'Coach', 'active', now(), now()
  from public.training_groups tg
  where tg.coach_id = admin_user_id
    and not exists (
      select 1
      from public.group_memberships gm
      where gm.group_id = tg.id
        and gm.user_id = admin_user_id
    );

  raise notice 'Admin profile reset completed for user_id=% club_id=%', admin_user_id, admin_club_id;
end;
$$;

select
  'auth_user' as section,
  au.id,
  au.email,
  au.created_at,
  au.email_confirmed_at,
  au.confirmed_at
from auth.users au
where lower(trim(au.email)) = 't.kanu@outlook.com';

select
  'profile' as section,
  p.id,
  p.email,
  p.first_name,
  p.last_name,
  p.display_name,
  p.primary_role,
  p.roles,
  p.status,
  p.club_id,
  p.active_club_id,
  p.age_category,
  p.boat_classes,
  p.paddle_side,
  p.updated_at
from public.profiles p
where lower(trim(p.email)) = 't.kanu@outlook.com'
order by p.created_at asc;

select
  'club' as section,
  c.id,
  c.name,
  c.short_name,
  c.city,
  c.status,
  c.updated_at
from public.clubs c
where lower(c.name) = 'mkc monheim'
   or lower(coalesce(c.short_name, '')) in ('mkc', 'mkc monheim')
order by c.created_at asc;

select
  'club_membership' as section,
  cm.id,
  cm.user_id,
  cm.club_id,
  c.name as club_name,
  cm.role,
  cm.status,
  cm.updated_at
from public.club_memberships cm
left join public.clubs c on c.id = cm.club_id
where cm.user_id in (
  select id from auth.users where lower(trim(email)) = 't.kanu@outlook.com'
)
order by cm.created_at asc;

select
  'group_membership' as section,
  gm.id,
  gm.user_id,
  gm.group_id,
  tg.name as group_name,
  gm.role,
  gm.status,
  gm.updated_at
from public.group_memberships gm
left join public.training_groups tg on tg.id = gm.group_id
where gm.user_id in (
  select id from auth.users where lower(trim(email)) = 't.kanu@outlook.com'
)
order by tg.name asc nulls last, gm.created_at asc;
