-- DEV only. No fixture persists.
begin;
do $$
declare
  test_user uuid := gen_random_uuid();
  fake_club uuid := gen_random_uuid();
  actual_roles text[];
  actual_club uuid;
begin
  insert into auth.users(id,email,raw_user_meta_data)
  values(test_user, test_user::text || '@signup-test.invalid',
    jsonb_build_object('roles',jsonb_build_array('Admin','Coach'),
      'role','Admin','clubId',fake_club::text,'firstName','Fixture'));
  select roles,club_id into actual_roles,actual_club from public.profiles where id=test_user;
  if actual_roles is distinct from array['Athlete']::text[] or actual_club is not null then
    raise exception 'signup metadata granted privileges or club access';
  end if;
  if has_function_privilege('anon','public.paddlio_handle_new_auth_user_0034()','EXECUTE')
    or has_function_privilege('authenticated','public.paddlio_handle_new_auth_user_0034()','EXECUTE') then
    raise exception 'signup trigger exposed';
  end if;
end;
$$;
rollback;
select 'neutral signup roles and club isolation passed; fixture rolled back' as result;
