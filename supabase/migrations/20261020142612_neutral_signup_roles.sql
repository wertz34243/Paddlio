-- Signup metadata is presentation data, never authorization.
-- Existing profile roles and memberships are not changed.
create or replace function public.paddlio_handle_new_auth_user_0034()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  normalized_email text := lower(trim(coalesce(new.email, '')));
begin
  if normalized_email = '' then return new; end if;
  insert into public.profiles (
    id, email, first_name, last_name, display_name, club_id,
    roles, status, boat_classes, created_at, updated_at
  )
  values (
    new.id, normalized_email,
    nullif(new.raw_user_meta_data ->> 'firstName', ''),
    nullif(new.raw_user_meta_data ->> 'lastName', ''),
    coalesce(nullif(trim(coalesce(new.raw_user_meta_data ->> 'firstName', '') || ' ' ||
      coalesce(new.raw_user_meta_data ->> 'lastName', '')), ''), normalized_email),
    null, array['Athlete']::text[], 'active', array['K1']::text[], now(), now()
  )
  on conflict (id) do update
    set email = excluded.email,
        first_name = coalesce(nullif(public.profiles.first_name, ''), excluded.first_name),
        last_name = coalesce(nullif(public.profiles.last_name, ''), excluded.last_name),
        display_name = coalesce(nullif(public.profiles.display_name, ''), excluded.display_name),
        updated_at = now();
  return new;
end;
$$;
revoke all on function public.paddlio_handle_new_auth_user_0034() from public, anon, authenticated;
