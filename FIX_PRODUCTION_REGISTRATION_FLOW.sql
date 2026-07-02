create or replace function public.default_roles_for_email(email text)
returns text[]
language sql
immutable
as $$
  select array['Athlete']::text[];
$$;

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  metadata_club_id text;
  metadata_club_name text;
  safe_club_id uuid;
  new_display_name text;
begin
  metadata_club_id := nullif(new.raw_user_meta_data ->> 'clubId', '');
  metadata_club_name := nullif(trim(coalesce(new.raw_user_meta_data ->> 'club', '')), '');

  if metadata_club_id ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$' then
    safe_club_id := metadata_club_id::uuid;
  else
    safe_club_id := null;
  end if;

  new_display_name := coalesce(
    nullif(trim(coalesce(new.raw_user_meta_data ->> 'firstName', '') || ' ' || coalesce(new.raw_user_meta_data ->> 'lastName', '')), ''),
    new.email
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
    boat_classes
  )
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'firstName', ''),
    coalesce(new.raw_user_meta_data ->> 'lastName', ''),
    new_display_name,
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
        updated_at = now();

  if metadata_club_name is not null and safe_club_id is null then
    insert into public.club_requests (
      requested_by,
      name,
      message,
      status
    )
    values (
      new.id,
      metadata_club_name,
      'Automatischer Vereinsvorschlag aus der Registrierung von ' || new_display_name || ' (' || new.email || ').',
      'open'
    );
  end if;

  insert into public.notifications (
    user_id,
    title,
    body,
    type
  )
  select
    admin_profile.id,
    'Neue Registrierung',
    new_display_name || ' (' || new.email || ') hat ein Konto erstellt und wartet auf Admin-Pruefung.',
    'registration_request'
  from public.profiles admin_profile
  where 'Admin' = any(admin_profile.roles)
    and admin_profile.status = 'active';

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

drop policy if exists "club_requests_self_insert" on public.club_requests;
create policy "club_requests_self_insert" on public.club_requests
  for insert
  to authenticated
  with check (requested_by = auth.uid());

drop policy if exists "club_requests_admin_all" on public.club_requests;
create policy "club_requests_admin_all" on public.club_requests
  for all
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "notifications_self_select" on public.notifications;
create policy "notifications_self_select" on public.notifications
  for select
  using (user_id = auth.uid() or public.is_admin());

drop policy if exists "notifications_self_update" on public.notifications;
create policy "notifications_self_update" on public.notifications
  for update
  using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());

notify pgrst, 'reload schema';
