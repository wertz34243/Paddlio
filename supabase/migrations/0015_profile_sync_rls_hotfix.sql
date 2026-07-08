-- Paddlio 4.1.2 Cloud Sync and Encoding Fix
-- Ensures authenticated users can read, create and update their own profile.

alter table if exists public.profiles enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'profiles'
      and policyname = 'profiles_own_select_412'
  ) then
    create policy profiles_own_select_412 on public.profiles
      for select using (id = auth.uid());
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'profiles'
      and policyname = 'profiles_own_insert_412'
  ) then
    create policy profiles_own_insert_412 on public.profiles
      for insert with check (id = auth.uid());
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'profiles'
      and policyname = 'profiles_own_update_412'
  ) then
    create policy profiles_own_update_412 on public.profiles
      for update using (id = auth.uid()) with check (id = auth.uid());
  end if;
end $$;
