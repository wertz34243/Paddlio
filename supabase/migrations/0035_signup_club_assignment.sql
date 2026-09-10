-- Paddlio dev signup club assignment hardening.
-- Keeps registration club assignment tied to active public.clubs rows only.

create or replace function public.paddlio_normalize_club_lookup_0035(value text)
returns text
language sql
immutable
as $$
  select nullif(trim(regexp_replace(lower(regexp_replace(coalesce(value, ''), '[^[:alnum:]]+', ' ', 'g')), '\s+', ' ', 'g')), '');
$$;

create or replace function public.paddlio_resolve_signup_club_0035(
  p_club_id text default null,
  p_club_name text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  metadata_club_id text := nullif(trim(coalesce(p_club_id, '')), '');
  metadata_club_name text := public.paddlio_normalize_club_lookup_0035(p_club_name);
  resolved_club_id uuid;
  match_count integer;
begin
  if metadata_club_id ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$' then
    select id
    into resolved_club_id
    from public.clubs
    where id = metadata_club_id::uuid
      and status = 'active'
    limit 1;

    if resolved_club_id is not null then
      return resolved_club_id;
    end if;
  end if;

  if metadata_club_name is null then
    return null;
  end if;

  with matches as (
    select c.id
    from public.clubs c
    where c.status = 'active'
      and (
        public.paddlio_normalize_club_lookup_0035(c.name) = metadata_club_name
        or public.paddlio_normalize_club_lookup_0035(c.short_name) = metadata_club_name
      )
    union
    select ca.club_id
    from public.club_aliases ca
    join public.clubs c on c.id = ca.club_id
    where c.status = 'active'
      and public.paddlio_normalize_club_lookup_0035(ca.alias) = metadata_club_name
  )
  select count(distinct id), min(id)
  into match_count, resolved_club_id
  from matches;

  if match_count = 1 then
    return resolved_club_id;
  end if;

  return null;
end;
$$;

create or replace function public.paddlio_handle_new_auth_user_0034()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  normalized_email text;
  safe_club_id uuid;
  target_roles text[];
begin
  normalized_email := lower(trim(coalesce(new.email, '')));
  if normalized_email = '' then
    return new;
  end if;

  safe_club_id := public.paddlio_resolve_signup_club_0035(
    new.raw_user_meta_data ->> 'clubId',
    new.raw_user_meta_data ->> 'club'
  );

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

  if safe_club_id is not null and to_regclass('public.club_memberships') is not null then
    execute
      'insert into public.club_memberships (club_id, user_id, role, status, created_at, updated_at)
       values ($1, $2, $3, $4, now(), now())
       on conflict (club_id, user_id) do update
       set status = case
             when public.club_memberships.status = ''active'' then ''active''
             else excluded.status
           end,
           updated_at = now()'
    using safe_club_id, new.id, case when normalized_email = 't.kanu@outlook.com' then 'Admin' else 'Athlete' end, 'active';
  end if;

  return new;
end;
$$;

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
  target_club_id uuid := public.paddlio_resolve_signup_club_0035(p_club_id::text, null);
begin
  if p_user_id is null then
    raise exception 'paddlio_ensure_profile_415 requires p_user_id';
  end if;

  if normalized_email = '' then
    raise exception 'paddlio_ensure_profile_415 requires p_email';
  end if;

  if normalized_email = 't.kanu@outlook.com' and target_club_id is null then
    select id
    into target_club_id
    from public.clubs
    where status = 'active'
      and (
        public.paddlio_normalize_club_lookup_0035(name) = 'mkc monheim'
        or public.paddlio_normalize_club_lookup_0035(short_name) in ('mkc', 'mkc monheim')
      )
    order by created_at asc
    limit 1;
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
      target_roles,
      'active',
      array['K1']::text[],
      now(),
      now()
    )
    returning * into ensured_profile;
  end if;

  if target_club_id is not null and to_regclass('public.club_memberships') is not null then
    execute
      'insert into public.club_memberships (club_id, user_id, role, status, created_at, updated_at)
       values ($1, $2, $3, $4, now(), now())
       on conflict (club_id, user_id) do update
       set status = case
             when public.club_memberships.status = ''active'' then ''active''
             else excluded.status
           end,
           updated_at = now()'
    using target_club_id, p_user_id, case when normalized_email = 't.kanu@outlook.com' then 'Admin' else 'Athlete' end, 'active';
  end if;

  return ensured_profile;
end;
$$;

grant execute on function public.paddlio_ensure_profile_415(uuid, text, text, text, text, uuid) to authenticated;

drop policy if exists clubs_active_public_select_0035 on public.clubs;
create policy clubs_active_public_select_0035 on public.clubs
for select
to anon, authenticated
using (status = 'active');

with resolved as (
  select
    p.id as profile_id,
    public.paddlio_resolve_signup_club_0035(
      u.raw_user_meta_data ->> 'clubId',
      u.raw_user_meta_data ->> 'club'
    ) as club_id
  from public.profiles p
  join auth.users u on u.id = p.id
  where p.club_id is null
)
update public.profiles p
set club_id = r.club_id,
    updated_at = now()
from resolved r
where p.id = r.profile_id
  and r.club_id is not null;

insert into public.club_memberships (club_id, user_id, role, status, created_at, updated_at)
select distinct
  p.club_id,
  p.id,
  case when lower(trim(p.email)) = 't.kanu@outlook.com' then 'Admin' else 'Athlete' end,
  'active',
  now(),
  now()
from public.profiles p
join auth.users u on u.id = p.id
where p.club_id is not null
  and to_regclass('public.club_memberships') is not null
on conflict (club_id, user_id) do update
set status = case
      when public.club_memberships.status = 'active' then 'active'
      else excluded.status
    end,
    updated_at = now();
