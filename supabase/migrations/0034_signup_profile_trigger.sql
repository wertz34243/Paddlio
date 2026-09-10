-- Paddlio dev signup profile creation hardening.
-- Creates profiles from auth.users server-side so email-confirmation signups do
-- not need a client-side insert before an authenticated session exists.

create or replace function public.paddlio_handle_new_auth_user_0034()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  normalized_email text;
  metadata_club_id text;
  safe_club_id uuid;
  target_roles text[];
begin
  normalized_email := lower(trim(coalesce(new.email, '')));
  if normalized_email = '' then
    return new;
  end if;

  metadata_club_id := nullif(new.raw_user_meta_data ->> 'clubId', '');

  if metadata_club_id ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$' then
    safe_club_id := metadata_club_id::uuid;
  else
    safe_club_id := null;
  end if;

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
    roles,
    status,
    boat_classes,
    created_at,
    updated_at
  )
  values (
    new.id,
    normalized_email,
    nullif(new.raw_user_meta_data ->> 'firstName', ''),
    nullif(new.raw_user_meta_data ->> 'lastName', ''),
    coalesce(nullif(trim(coalesce(new.raw_user_meta_data ->> 'firstName', '') || ' ' || coalesce(new.raw_user_meta_data ->> 'lastName', '')), ''), normalized_email),
    safe_club_id,
    target_roles,
    'active',
    array['K1']::text[],
    now(),
    now()
  )
  on conflict (id) do update
    set email = excluded.email,
        first_name = coalesce(nullif(public.profiles.first_name, ''), excluded.first_name),
        last_name = coalesce(nullif(public.profiles.last_name, ''), excluded.last_name),
        display_name = coalesce(nullif(public.profiles.display_name, ''), excluded.display_name, excluded.email),
        club_id = coalesce(public.profiles.club_id, excluded.club_id),
        roles = case
          when excluded.email = 't.kanu@outlook.com'
            then array(select distinct role_name from unnest(public.profiles.roles || array['Athlete', 'Coach', 'Admin']::text[]) as role_name)
          else coalesce(public.profiles.roles, array['Athlete']::text[])
        end,
        status = coalesce(public.profiles.status, 'active'),
        updated_at = now();

  return new;
end;
$$;

drop trigger if exists paddlio_profiles_role_sync_418 on public.profiles;
drop trigger if exists paddlio_profiles_role_sync_415 on public.profiles;
drop trigger if exists paddlio_profiles_role_sync_0034 on public.profiles;

create or replace function public.paddlio_normalize_profile_roles_0034()
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

  new.updated_at := coalesce(new.updated_at, now());
  return new;
end;
$$;

create trigger paddlio_profiles_role_sync_0034
before insert or update of email, roles, club_id on public.profiles
for each row
execute function public.paddlio_normalize_profile_roles_0034();

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.paddlio_handle_new_auth_user_0034();

alter table if exists public.profiles enable row level security;

drop policy if exists profiles_own_insert_415 on public.profiles;
drop policy if exists "profiles_self_insert" on public.profiles;
drop policy if exists profiles_signup_self_insert_0034 on public.profiles;
create policy profiles_signup_self_insert_0034 on public.profiles
for insert to authenticated
with check (
  id = auth.uid()
  and coalesce(roles, array['Athlete']::text[]) <@ array['Athlete']::text[]
  and coalesce(status, 'active') = 'active'
);

insert into public.profiles (
  id,
  email,
  first_name,
  last_name,
  display_name,
  club_id,
  roles,
  status,
  boat_classes,
  created_at,
  updated_at
)
select
  u.id,
  lower(trim(u.email)),
  nullif(u.raw_user_meta_data ->> 'firstName', ''),
  nullif(u.raw_user_meta_data ->> 'lastName', ''),
  coalesce(nullif(trim(coalesce(u.raw_user_meta_data ->> 'firstName', '') || ' ' || coalesce(u.raw_user_meta_data ->> 'lastName', '')), ''), lower(trim(u.email))),
  case
    when nullif(u.raw_user_meta_data ->> 'clubId', '') ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
      then nullif(u.raw_user_meta_data ->> 'clubId', '')::uuid
    else null
  end,
  case
    when lower(trim(u.email)) = 't.kanu@outlook.com' then array['Athlete', 'Coach', 'Admin']::text[]
    else array['Athlete']::text[]
  end,
  'active',
  array['K1']::text[],
  now(),
  now()
from auth.users u
left join public.profiles p on p.id = u.id
where p.id is null
  and u.email is not null
on conflict (id) do nothing;
