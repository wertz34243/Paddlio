-- Align profile-directory authorization with the current role-based admin helper.

create or replace function public.paddlio_is_admin_profile_sync_415()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and 'Admin' = any(p.roles)
      and p.status = 'active'
  );
$$;

drop policy if exists profiles_admin_all_415 on public.profiles;
create policy profiles_admin_all_415 on public.profiles
for all to authenticated
using (public.paddlio_is_admin_profile_sync_415())
with check (public.paddlio_is_admin_profile_sync_415());

notify pgrst, 'reload schema';
