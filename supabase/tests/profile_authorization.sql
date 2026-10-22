-- DEV regression checks; all changes are rolled back.
begin;
do $$
declare
  athlete uuid := (select id from public.profiles where email='e2e-athlete@paddlio.de');
  club_admin uuid := (select id from public.profiles where email='e2e-clubadmin@paddlio.de');
  actual record;
begin
  if athlete is null or club_admin is null then raise exception 'DEV test fixtures missing'; end if;
  perform set_config('request.jwt.claims', '{"role":"service_role"}', true);
  update public.profiles set roles=array['ClubAdmin'],primary_role='ClubAdmin' where id=club_admin;
  if not exists(select 1 from public.profiles where id=club_admin and 'ClubAdmin'=any(roles)) then
    raise exception 'service-role provisioning failed';
  end if;
  perform set_config('request.jwt.claims', jsonb_build_object('role','authenticated','sub',athlete)::text, true);
  update public.profiles set primary_role='Admin' where id=athlete;
  update public.profiles set status='disabled' where id=athlete;
  update public.profiles set roles=array['Admin','Coach'] where id=athlete;
  select * into actual from public.profiles where id=athlete;
  if actual.roles <> array['Athlete']::text[] or actual.primary_role = 'Admin' or actual.status <> 'active' then
    raise exception 'self-service privilege change was accepted';
  end if;
  if public.paddlio_is_admin_0031() then raise exception 'athlete detected as admin'; end if;
  if public.default_roles_for_email('t.kanu@outlook.com') <> array['Athlete']::text[] then
    raise exception 'legacy email exception remains';
  end if;
  -- Even a legacy primary_role must never grant admin without profiles.roles.
  perform set_config('request.jwt.claims','{"role":"service_role"}',true);
  update public.profiles set primary_role='Admin' where id=athlete;
  perform set_config('request.jwt.claims', jsonb_build_object('role','authenticated','sub',athlete)::text,true);
  if public.paddlio_is_admin_0031() then raise exception 'primary_role granted admin'; end if;
end;
$$;
rollback;
select 'profile authorization regressions passed; changes rolled back' as result;
