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
  metadata_club_id text;
  safe_club_id uuid;
begin
  metadata_club_id := nullif(new.raw_user_meta_data ->> 'clubId', '');

  if metadata_club_id ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$' then
    safe_club_id := metadata_club_id::uuid;
  else
    safe_club_id := null;
  end if;

  perform public.paddlio_ensure_profile_415(
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'firstName', ''),
    coalesce(new.raw_user_meta_data ->> 'lastName', ''),
    nullif(trim(coalesce(new.raw_user_meta_data ->> 'firstName', '') || ' ' || coalesce(new.raw_user_meta_data ->> 'lastName', '')), ''),
    safe_club_id
  );

  return new;
end;
$$;

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

do $$
declare
  auth_user record;
  metadata_club_id text;
  safe_club_id uuid;
begin
  for auth_user in
    select u.id, u.email, u.raw_user_meta_data
    from auth.users u
    left join public.profiles p on p.id = u.id
    where p.id is null
      and u.email is not null
  loop
    metadata_club_id := nullif(auth_user.raw_user_meta_data ->> 'clubId', '');

    if metadata_club_id ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$' then
      safe_club_id := metadata_club_id::uuid;
    else
      safe_club_id := null;
    end if;

    perform public.paddlio_ensure_profile_415(
      auth_user.id,
      auth_user.email,
      coalesce(auth_user.raw_user_meta_data ->> 'firstName', ''),
      coalesce(auth_user.raw_user_meta_data ->> 'lastName', ''),
      nullif(trim(coalesce(auth_user.raw_user_meta_data ->> 'firstName', '') || ' ' || coalesce(auth_user.raw_user_meta_data ->> 'lastName', '')), ''),
      safe_club_id
    );
  end loop;
end;
$$;
