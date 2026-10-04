-- Keep personal profile updates separate from protected role and club assignments.
-- The previous trigger still contained a legacy email-based admin exception and
-- could rewrite roles while a user only changed personal profile fields.
create or replace function public.paddlio_normalize_profile_roles_0034()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_is_admin boolean := false;
begin
  new.email := lower(trim(coalesce(new.email, '')));

  if auth.uid() is not null then
    select exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and 'Admin' = any(coalesce(p.roles, array[]::text[]))
        and p.status = 'active'
    ) into actor_is_admin;
  end if;

  if tg_op = 'UPDATE' and auth.uid() is null then
    -- Internal maintenance/profile triggers must not demote an existing account
    -- as a side effect of changing unrelated profile data.
    new.roles := old.roles;
    new.status := old.status;
    new.primary_role := old.primary_role;
  elsif tg_op = 'UPDATE' and auth.uid() = old.id and not actor_is_admin then
    -- Users may edit their personal profile, but never their own authorization
    -- or canonical club assignment through a manipulated client payload.
    new.email := old.email;
    new.roles := old.roles;
    new.status := old.status;
    new.primary_role := old.primary_role;
    new.club_id := old.club_id;
    new.active_club_id := old.active_club_id;
  elsif actor_is_admin then
    new.roles := array(
      select distinct role_name
      from unnest(coalesce(new.roles, array['Athlete']::text[]) || array['Athlete']::text[]) as role_name
      where role_name in ('Athlete', 'Coach', 'TeamAdmin', 'ClubAdmin', 'Admin')
    );
  else
    new.roles := array(
      select distinct role_name
      from unnest(coalesce(new.roles, array['Athlete']::text[]) || array['Athlete']::text[]) as role_name
      where role_name in ('Athlete', 'Coach', 'TeamAdmin', 'ClubAdmin')
    );
  end if;

  new.updated_at := coalesce(new.updated_at, now());
  return new;
end;
$$;

comment on function public.paddlio_normalize_profile_roles_0034() is
  'Normalizes profile roles without email exceptions and protects self-service role and club assignments.';

notify pgrst, 'reload schema';
