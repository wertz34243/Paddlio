-- Paddlio beta test account repair
-- Safe targeted repair for existing Supabase Auth users.
-- No auth.users deletion, no table drop, no destructive broad update.
--
-- Run after CHECK_BETA_PROFILE_ROLE_STATE.sql.
-- Edit only the athlete e-mail values in beta_athletes if you want to repair those test accounts too.

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
  id uuid primary key references auth.users(id) on delete cascade,
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

alter table public.profiles add column if not exists active_club_id uuid references public.clubs(id) on delete set null;
alter table public.profiles add column if not exists primary_role text;
alter table public.club_memberships add column if not exists updated_at timestamptz default now();

insert into public.clubs (name, short_name, city, status)
select 'MKC Monheim', 'MKC', 'Monheim am Rhein', 'active'
where not exists (
  select 1 from public.clubs
  where lower(name) in ('mkc monheim', 'mülheimer kanu club', 'muelheimer kanu club')
     or lower(coalesce(short_name, '')) = 'mkc'
);

do $$
declare
  mkc_id uuid;
  admin_id uuid;
begin
  select id into mkc_id
  from public.clubs
  where lower(name) in ('mkc monheim', 'mülheimer kanu club', 'muelheimer kanu club')
     or lower(coalesce(short_name, '')) = 'mkc'
  order by created_at asc
  limit 1;

  select id into admin_id
  from auth.users
  where lower(trim(email)) = 't.kanu@outlook.com'
  order by created_at asc
  limit 1;

  if admin_id is not null then
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
      admin_id,
      't.kanu@outlook.com',
      'Tobias',
      'Kuhn',
      'Tobias Kuhn',
      mkc_id,
      mkc_id,
      array['Athlete', 'Coach', 'Admin']::text[],
      'Admin',
      'active',
      'Leistungsklasse',
      array['K1', 'C1']::text[],
      'Rechts',
      now(),
      now()
    )
    on conflict (id) do update set
      email = excluded.email,
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

    insert into public.club_memberships (club_id, user_id, role, status, created_at, updated_at)
    values (mkc_id, admin_id, 'Admin', 'active', now(), now())
    on conflict do nothing;

    update public.club_memberships
    set role = 'Admin',
        status = 'active',
        updated_at = now()
    where club_id = mkc_id
      and user_id = admin_id;
  end if;
end $$;

-- Optional athlete repair.
-- Replace the example e-mails with real beta athlete e-mails, then uncomment this block.
/*
with beta_athletes(email, first_name, last_name) as (
  values
    ('auren@example.com', 'Auren', ''),
    ('tobikuhn565@example.com', 'Tobi', 'Kuhn')
),
resolved as (
  select u.id, lower(trim(u.email)) as email, b.first_name, b.last_name
  from auth.users u
  join beta_athletes b on lower(trim(u.email)) = lower(trim(b.email))
)
insert into public.profiles (
  id, email, first_name, last_name, display_name, club_id, active_club_id,
  roles, primary_role, status, age_category, boat_classes, created_at, updated_at
)
select
  r.id,
  r.email,
  r.first_name,
  r.last_name,
  trim(concat(r.first_name, ' ', r.last_name)),
  c.id,
  c.id,
  array['Athlete']::text[],
  'Athlete',
  'active',
  null,
  array['K1']::text[],
  now(),
  now()
from resolved r
cross join lateral (
  select id from public.clubs
  where lower(name) in ('mkc monheim', 'mülheimer kanu club', 'muelheimer kanu club')
     or lower(coalesce(short_name, '')) = 'mkc'
  order by created_at asc
  limit 1
) c
on conflict (id) do update set
  email = excluded.email,
  first_name = excluded.first_name,
  last_name = excluded.last_name,
  display_name = excluded.display_name,
  club_id = excluded.club_id,
  active_club_id = excluded.active_club_id,
  roles = excluded.roles,
  primary_role = excluded.primary_role,
  status = excluded.status,
  updated_at = now();
*/

select
  'result' as section,
  p.email,
  p.display_name,
  p.roles,
  c.name as club_name,
  p.age_category,
  p.boat_classes
from public.profiles p
left join public.clubs c on c.id = p.club_id
where lower(trim(p.email)) = 't.kanu@outlook.com'
order by p.updated_at desc;
