-- Paddlio 4.1.5 Admin, Club and Group Assignment Hotfix
-- Idempotent compatibility layer for central club/group membership management.

alter table if exists public.profiles
  add column if not exists primary_role text;

alter table if exists public.profiles
  add column if not exists active_club_id uuid references public.clubs(id) on delete set null;

update public.profiles
set
  email = lower(trim(email)),
  primary_role = coalesce(
    primary_role,
    case
      when 'Admin' = any(roles) then 'Admin'
      when 'ClubAdmin' = any(roles) then 'ClubAdmin'
      when 'Coach' = any(roles) then 'Coach'
      when 'TeamAdmin' = any(roles) then 'TeamAdmin'
      else 'Athlete'
    end
  ),
  active_club_id = coalesce(active_club_id, club_id),
  updated_at = now()
where email is not null;

alter table if exists public.clubs
  add column if not exists created_by uuid references public.profiles(id) on delete set null;

create table if not exists public.club_memberships (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.clubs(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null default 'Athlete',
  status text not null default 'active',
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint club_memberships_role_check check (role in ('Athlete', 'Coach', 'ClubAdmin', 'Admin')),
  constraint club_memberships_status_check check (status in ('active', 'pending', 'inactive')),
  constraint club_memberships_unique_user_club unique (club_id, user_id)
);

create table if not exists public.group_memberships (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.training_groups(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null default 'Athlete',
  status text not null default 'active',
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint group_memberships_role_check check (role in ('Athlete', 'Coach', 'AssistantCoach')),
  constraint group_memberships_status_check check (status in ('active', 'pending', 'inactive')),
  constraint group_memberships_unique_user_group unique (group_id, user_id)
);

create table if not exists public.group_members (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.training_groups(id) on delete cascade,
  athlete_id uuid references public.profiles(id) on delete cascade,
  created_at timestamptz default now()
);

alter table if exists public.group_members
  add column if not exists athlete_id uuid references public.profiles(id) on delete cascade;

alter table if exists public.group_members
  add column if not exists user_id uuid references public.profiles(id) on delete cascade;

alter table if exists public.group_members
  add column if not exists role text not null default 'Athlete';

alter table if exists public.group_members
  add column if not exists status text not null default 'active';

alter table if exists public.group_members
  add column if not exists updated_at timestamptz default now();

update public.group_members
set user_id = coalesce(user_id, athlete_id),
    role = coalesce(role, 'Athlete'),
    status = coalesce(status, 'active'),
    updated_at = coalesce(updated_at, now())
where athlete_id is not null;

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
on conflict (club_id, user_id) do update
set role = excluded.role,
    status = excluded.status,
    updated_at = now();

insert into public.group_memberships (group_id, user_id, role, status)
select distinct group_id, coalesce(user_id, athlete_id), role, status
from public.group_members
where group_id is not null
  and coalesce(user_id, athlete_id) is not null
on conflict (group_id, user_id) do update
set role = excluded.role,
    status = excluded.status,
    updated_at = now();

insert into public.group_memberships (group_id, user_id, role, status)
select distinct id, coach_id, 'Coach', 'active'
from public.training_groups
where coach_id is not null
on conflict (group_id, user_id) do update
set role = 'Coach',
    status = 'active',
    updated_at = now();

create index if not exists profiles_active_club_id_idx on public.profiles(active_club_id);
create index if not exists club_memberships_club_idx on public.club_memberships(club_id);
create index if not exists club_memberships_user_idx on public.club_memberships(user_id);
create index if not exists group_memberships_group_idx on public.group_memberships(group_id);
create index if not exists group_memberships_user_idx on public.group_memberships(user_id);
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
    from public.profiles
    where id = auth.uid()
      and lower(email) = 't.kanu@outlook.com'
      and 'Admin' = any(roles)
      and status = 'active'
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
        and p.club_id = target_club_id
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

alter table public.profiles enable row level security;
alter table public.clubs enable row level security;
alter table public.training_groups enable row level security;
alter table public.group_members enable row level security;
alter table public.club_memberships enable row level security;
alter table public.group_memberships enable row level security;

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

drop policy if exists profiles_admin_club_update_415 on public.profiles;
create policy profiles_admin_club_update_415 on public.profiles
for update to authenticated
using (public.paddlio_is_admin_415() or public.paddlio_can_manage_club_415(club_id) or public.paddlio_can_manage_club_415(active_club_id))
with check (public.paddlio_is_admin_415() or public.paddlio_can_manage_club_415(club_id) or public.paddlio_can_manage_club_415(active_club_id));
