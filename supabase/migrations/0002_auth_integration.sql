-- Paddlio 3.0.2 Supabase Auth integration foundation

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
begin
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
    trim(coalesce(new.raw_user_meta_data ->> 'firstName', '') || ' ' || coalesce(new.raw_user_meta_data ->> 'lastName', '')),
    nullif(new.raw_user_meta_data ->> 'clubId', '')::uuid,
    public.default_roles_for_email(new.email),
    'active',
    array['K1']::text[]
  )
  on conflict (id) do update
    set email = excluded.email,
        roles = public.default_roles_for_email(excluded.email),
        updated_at = now();

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_auth_user();

drop policy if exists "profiles_self_insert" on public.profiles;
create policy "profiles_self_insert" on public.profiles
  for insert
  with check (
    id = auth.uid()
    and roles <@ array['Athlete']::text[]
  );

drop policy if exists "profiles_self_update" on public.profiles;
drop policy if exists "profiles_self_limited_update" on public.profiles;
create policy "profiles_self_limited_update" on public.profiles
  for update
  using (id = auth.uid())
  with check (
    id = auth.uid()
    and roles = (select roles from public.profiles where id = auth.uid())
    and status = (select status from public.profiles where id = auth.uid())
  );
