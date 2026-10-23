
do $test$
declare u uuid:=gen_random_uuid(); ca uuid:=gen_random_uuid(); cb uuid:=gen_random_uuid();
 t public.training_plan_items; f public.training_feedback;
begin
 begin
  perform set_config('request.jwt.claims','{"role":"service_role"}',true);
  insert into auth.users(id,email,raw_user_meta_data) values(u,'helper-'||u||'@example.invalid','{}');
  insert into public.clubs(id,name) values(ca,'Helper A'),(cb,'Helper B');
  perform set_config('request.jwt.claims','{"role":"service_role"}',true);
  update public.profiles set club_id=ca,active_club_id=ca,roles=array['Athlete'],primary_role='Athlete',status='active' where id=u;
  perform set_config('request.jwt.claims',jsonb_build_object('sub',u,'role','authenticated')::text,true);
  insert into public.club_memberships(club_id,user_id,role,status) values(cb,u,'ClubAdmin','active');
  perform set_config('request.jwt.claims',jsonb_build_object('sub',u,'role','authenticated')::text,true);
  execute 'set local role authenticated';
  if public.paddlio_can_manage_club_415(cb)
   or public.paddlio_user_has_club_role_0024(cb,array['Coach','ClubAdmin'])
   or public.paddlio_user_has_club_role_0031(cb::text,array['Coach','ClubAdmin'])
  then raise exception 'Membership grants a role absent from profiles'; end if;
  if not public.paddlio_user_has_club_role_0024(cb,array['Athlete']) then raise exception 'Membership scope lost'; end if;
  execute 'reset role';
  perform set_config('request.jwt.claims','{"role":"service_role"}',true);
  update public.profiles set roles=array['Coach'],primary_role='Coach' where id=u;
  perform set_config('request.jwt.claims',jsonb_build_object('sub',u,'role','authenticated')::text,true);
  execute 'set local role authenticated';
  if not public.paddlio_user_has_club_role_0024(cb,array['Coach'])
   or not public.paddlio_user_has_club_role_0031(cb::text,array['Coach'])
   or not public.current_user_is_club_manager(cb)
  then raise exception 'Active profile role with membership scope denied'; end if;
  if public.paddlio_can_manage_club_415(cb) then raise exception 'Coach gains club administration'; end if;
  execute 'reset role';
  perform set_config('request.jwt.claims','{"role":"service_role"}',true);
  update public.profiles set roles=array['ClubAdmin'],primary_role='ClubAdmin' where id=u;
  perform set_config('request.jwt.claims',jsonb_build_object('sub',u,'role','authenticated')::text,true);
  execute 'set local role authenticated';
  if not public.paddlio_can_manage_club_415(cb) then raise exception 'Valid ClubAdmin denied'; end if;
  execute 'reset role';
  perform set_config('request.jwt.claims','{"role":"service_role"}',true);
  update public.profiles set roles=array['Admin'],primary_role='Admin',status='disabled' where id=u;
  perform set_config('request.jwt.claims',jsonb_build_object('sub',u,'role','authenticated')::text,true);
  t.owner_id:=u; t.coach_id:=u; t.assigned_athlete_id:=u; t.club_id:=ca;
  f.athlete_id:=u; f.author_id:=u; f.coach_id:=u; f.feedback_type:='athlete';
  execute 'set local role authenticated';
  if public.has_role('Admin') or public.is_admin() or public.current_user_is_admin()
   or public.paddlio_is_admin_0031() or public.paddlio_is_admin_414()
   or public.paddlio_is_admin_415() or public.paddlio_is_admin_profile_sync_415()
   or public.current_user_club_id() is not null or public.current_user_is_club_manager(ca)
   or public.paddlio_can_manage_club_415(cb)
   or public.paddlio_user_has_club_role_0024(cb,array['Admin','ClubAdmin'])
   or public.paddlio_user_has_club_role_0031(cb::text,array['Admin','ClubAdmin'])
   or public.paddlio_can_read_training_item_0024(t) or public.paddlio_can_write_training_item_0024(t)
   or public.paddlio_can_read_training_feedback_0024(f) or public.paddlio_can_write_training_feedback_0024(f)
  then raise exception 'Inactive profile retains authorization'; end if;
  execute 'reset role';
  raise sqlstate 'PZ001' using message='rollback helper fixtures';
 exception when sqlstate 'PZ001' then null;
 end;
end $test$;
