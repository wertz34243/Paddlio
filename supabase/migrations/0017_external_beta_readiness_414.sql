-- Paddlio 4.1.4 External Beta Readiness Fix
-- Idempotent schema and RLS compatibility patch for the external beta.

alter table if exists public.competitions
  add column if not exists course text;

alter table if exists public.competitions
  add column if not exists organizer text;

alter table if exists public.competitions
  add column if not exists level text;

alter table if exists public.competitions
  add column if not exists source text default 'manual';

alter table if exists public.competitions
  add column if not exists external_id text;

alter table if exists public.competitions
  add column if not exists source_url text;

alter table if exists public.profiles enable row level security;

create or replace function public.paddlio_is_admin_414()
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
      and 'Admin' = any(roles)
      and status = 'active'
  );
$$;

drop policy if exists profiles_own_select_414 on public.profiles;
create policy profiles_own_select_414 on public.profiles
  for select
  to authenticated
  using (id = auth.uid());

drop policy if exists profiles_own_insert_414 on public.profiles;
create policy profiles_own_insert_414 on public.profiles
  for insert
  to authenticated
  with check (id = auth.uid());

drop policy if exists profiles_own_update_414 on public.profiles;
create policy profiles_own_update_414 on public.profiles
  for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

drop policy if exists profiles_admin_all_414 on public.profiles;
create policy profiles_admin_all_414 on public.profiles
  for all
  to authenticated
  using (public.paddlio_is_admin_414())
  with check (public.paddlio_is_admin_414());

create index if not exists competitions_course_idx on public.competitions(course);
