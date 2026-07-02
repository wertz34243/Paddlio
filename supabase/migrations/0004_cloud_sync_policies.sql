-- Paddlio cloud sync hardening
-- Fixes profile bootstrap, null-club users and core read/write RLS for live sync.

create or replace function public.default_roles_for_email(email text)
returns text[]
language sql
immutable
as $$
  select case
    when lower(email) = 't.kanu@outlook.com' then array['Athlete', 'Coach', 'Admin']::text[]
    else array['Athlete']::text[]
  end;
$$;

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  metadata_club_id text;
  safe_club_id uuid;
begin
  metadata_club_id := nullif(new.raw_user_meta_data ->> 'clubId', '');

  if metadata_club_id ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$' then
    safe_club_id := metadata_club_id::uuid;
  else
    safe_club_id := null;
  end if;

  insert into public.profiles (
    id,
    email,
    first_name,
    last_name,
    display_name,
    club_id,
    roles,
    status,
    boat_classes
  )
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'firstName', ''),
    coalesce(new.raw_user_meta_data ->> 'lastName', ''),
    nullif(trim(coalesce(new.raw_user_meta_data ->> 'firstName', '') || ' ' || coalesce(new.raw_user_meta_data ->> 'lastName', '')), ''),
    safe_club_id,
    public.default_roles_for_email(new.email),
    'active',
    array['K1']::text[]
  )
  on conflict (id) do update
    set email = excluded.email,
        first_name = coalesce(nullif(public.profiles.first_name, ''), excluded.first_name),
        last_name = coalesce(nullif(public.profiles.last_name, ''), excluded.last_name),
        display_name = coalesce(nullif(public.profiles.display_name, ''), excluded.display_name, excluded.email),
        roles = case
          when lower(excluded.email) = 't.kanu@outlook.com' then public.default_roles_for_email(excluded.email)
          else public.profiles.roles
        end,
        updated_at = now();

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_auth_user();

drop policy if exists "profiles_self_or_admin_select" on public.profiles;
drop policy if exists "profiles_self_select" on public.profiles;
create policy "profiles_self_select" on public.profiles
  for select
  using (
    id = auth.uid()
    or public.is_admin()
    or (
      public.has_role('Coach')
      and club_id is not null
      and club_id = public.current_user_club_id()
    )
  );

drop policy if exists "profiles_self_insert" on public.profiles;
create policy "profiles_self_insert" on public.profiles
  for insert
  with check (
    id = auth.uid()
    and (
      roles <@ array['Athlete']::text[]
      or (lower(email) = 't.kanu@outlook.com' and roles <@ array['Athlete', 'Coach', 'Admin']::text[])
    )
  );

drop policy if exists "profiles_self_limited_update" on public.profiles;
drop policy if exists "profiles_self_update" on public.profiles;
create policy "profiles_self_limited_update" on public.profiles
  for update
  using (id = auth.uid())
  with check (
    id = auth.uid()
    and roles = (select roles from public.profiles where id = auth.uid())
    and status = (select status from public.profiles where id = auth.uid())
  );

drop policy if exists "clubs_authenticated_select" on public.clubs;
create policy "clubs_authenticated_select" on public.clubs
  for select
  to authenticated
  using (status = 'active' or public.is_admin());

drop policy if exists "training_plan_items_scope_select" on public.training_plan_items;
create policy "training_plan_items_scope_select" on public.training_plan_items
  for select using (
    owner_id = auth.uid()
    or assigned_athlete_id = auth.uid()
    or coach_id = auth.uid()
    or public.is_admin()
    or (
      public.has_role('Coach')
      and club_id is not null
      and club_id = public.current_user_club_id()
    )
  );

drop policy if exists "training_plan_items_scope_write" on public.training_plan_items;
create policy "training_plan_items_scope_write" on public.training_plan_items
  for all using (
    owner_id = auth.uid()
    or coach_id = auth.uid()
    or public.is_admin()
    or (
      public.has_role('Coach')
      and club_id is not null
      and club_id = public.current_user_club_id()
    )
  )
  with check (
    owner_id = auth.uid()
    or coach_id = auth.uid()
    or public.is_admin()
    or (
      public.has_role('Coach')
      and club_id is not null
      and club_id = public.current_user_club_id()
    )
  );

drop policy if exists "season_goals_scope_select" on public.season_goals;
create policy "season_goals_scope_select" on public.season_goals
  for select using (
    athlete_id = auth.uid()
    or assigned_by = auth.uid()
    or public.is_admin()
    or exists (
      select 1 from public.profiles p
      where p.id = season_goals.athlete_id
        and p.club_id is not null
        and p.club_id = public.current_user_club_id()
        and public.has_role('Coach')
    )
  );

drop policy if exists "season_goals_scope_write" on public.season_goals;
create policy "season_goals_scope_write" on public.season_goals
  for all using (
    athlete_id = auth.uid()
    or public.is_admin()
    or exists (
      select 1 from public.profiles p
      where p.id = season_goals.athlete_id
        and p.club_id is not null
        and p.club_id = public.current_user_club_id()
        and public.has_role('Coach')
    )
  )
  with check (
    athlete_id = auth.uid()
    or public.is_admin()
    or exists (
      select 1 from public.profiles p
      where p.id = season_goals.athlete_id
        and p.club_id is not null
        and p.club_id = public.current_user_club_id()
        and public.has_role('Coach')
    )
  );
