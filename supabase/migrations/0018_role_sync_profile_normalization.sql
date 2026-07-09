-- Paddlio role synchronization hardening
-- Keeps profile e-mails normalized and guarantees the canonical admin account.

create or replace function public.paddlio_normalize_profile_roles_418()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  normalized_email text;
begin
  normalized_email := lower(trim(coalesce(new.email, '')));
  new.email := normalized_email;

  if new.roles is null or array_length(new.roles, 1) is null then
    new.roles := array['Athlete']::text[];
  end if;

  if normalized_email = 't.kanu@outlook.com' then
    new.roles := array(
      select distinct role_name
      from unnest(new.roles || array['Athlete', 'Coach', 'Admin']::text[]) as role_name
      where role_name in ('Athlete', 'Coach', 'TeamAdmin', 'ClubAdmin', 'Admin')
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

drop trigger if exists paddlio_profiles_role_sync_418 on public.profiles;
create trigger paddlio_profiles_role_sync_418
before insert or update of email, roles on public.profiles
for each row
execute function public.paddlio_normalize_profile_roles_418();

update public.profiles
set
  email = lower(trim(email)),
  roles = case
    when lower(trim(email)) = 't.kanu@outlook.com'
      then array(select distinct role_name from unnest(roles || array['Athlete', 'Coach', 'Admin']::text[]) as role_name)
    else array(select distinct role_name from unnest(roles || array['Athlete']::text[]) as role_name)
  end,
  updated_at = now()
where email is not null;

create index if not exists profiles_email_lower_idx
on public.profiles (lower(email));

do $$
begin
  if not exists (
    select 1
    from (
      select lower(email) as normalized_email, count(*) as profile_count
      from public.profiles
      where email is not null
      group by lower(email)
      having count(*) > 1
    ) duplicates
  ) then
    create unique index if not exists profiles_email_lower_unique_idx
    on public.profiles (lower(email));
  else
    raise notice 'profiles_email_lower_unique_idx skipped because duplicate profile e-mails exist.';
  end if;
end;
$$;
