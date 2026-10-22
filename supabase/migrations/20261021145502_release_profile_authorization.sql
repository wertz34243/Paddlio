-- Align the existing ClubAdmin model and close legacy authorization shortcuts.
alter table public.profiles drop constraint profiles_roles_check;
alter table public.profiles add constraint profiles_roles_check
  check (roles <@ array['Athlete','Coach','TeamAdmin','ClubAdmin','Admin']::text[]);

create or replace function public.default_roles_for_email(email text)
returns text[] language sql immutable set search_path = ''
as $$ select array['Athlete']::text[]; $$;

create or replace function public.paddlio_is_admin_0031()
returns boolean language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.status = 'active'
      and 'Admin' = any(p.roles)
  );
$$;

create or replace function public.paddlio_normalize_profile_roles_0034()
returns trigger language plpgsql security definer set search_path = ''
as $$
declare
  actor_is_admin boolean := false;
  actor_is_service boolean := coalesce(auth.jwt()->>'role', '') = 'service_role';
begin
  new.email := lower(trim(coalesce(new.email, '')));
  if auth.uid() is not null then
    select exists (
      select 1 from public.profiles p where p.id = auth.uid()
        and 'Admin' = any(p.roles) and p.status = 'active'
    ) into actor_is_admin;
  end if;
  if actor_is_admin or actor_is_service then
    new.roles := array(
      select distinct role_name
      from unnest(coalesce(new.roles,array['Athlete']::text[]) || array['Athlete']::text[]) role_name
      where role_name in ('Athlete','Coach','TeamAdmin','ClubAdmin','Admin')
      order by role_name
    );
  elsif tg_op = 'UPDATE' then
    new.roles := old.roles;
    new.status := old.status;
    new.primary_role := old.primary_role;
    if auth.uid() is not null then
      new.email := old.email;
      new.club_id := old.club_id;
      new.active_club_id := old.active_club_id;
    end if;
  else
    new.roles := array['Athlete']::text[];
    new.primary_role := 'Athlete';
    new.status := 'active';
    new.club_id := null;
    new.active_club_id := null;
  end if;
  new.updated_at := now();
  return new;
end;
$$;
-- Also protect primary_role/status/active_club_id-only requests.
drop trigger paddlio_profiles_role_sync_0034 on public.profiles;
create trigger paddlio_profiles_role_sync_0034
before insert or update on public.profiles
for each row execute function public.paddlio_normalize_profile_roles_0034();

revoke all on function public.paddlio_normalize_profile_roles_0034() from public, anon, authenticated;
notify pgrst, 'reload schema';
