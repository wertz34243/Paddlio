-- Authorization comes only from active profiles.roles; memberships provide scope, never roles.
CREATE OR REPLACE FUNCTION public.current_user_club_id()
 RETURNS uuid
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
select club_id from public.profiles where id=auth.uid() and status='active';
$function$;
CREATE OR REPLACE FUNCTION public.current_user_is_admin()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
select exists(select 1 from public.profiles active_actor where active_actor.id=auth.uid() and active_actor.status='active') and coalesce((select public.has_role('Admin')),false);
$function$;
CREATE OR REPLACE FUNCTION public.current_user_is_club_manager(target_club_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
select exists(select 1 from public.profiles p where p.id=auth.uid() and p.status='active' and p.roles && array['Coach','TeamAdmin','ClubAdmin','Admin']::text[] and (p.club_id=target_club_id or exists(select 1 from public.club_memberships cm where cm.user_id=p.id and cm.club_id=target_club_id and cm.status='active')));
$function$;
CREATE OR REPLACE FUNCTION public.has_role(required_role text)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
select exists(select 1 from public.profiles active_actor where active_actor.id=auth.uid() and active_actor.status='active') and coalesce((select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and required_role = any(roles)
      and status = 'active'
  )),false);
$function$;
CREATE OR REPLACE FUNCTION public.is_admin()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
select exists(select 1 from public.profiles active_actor where active_actor.id=auth.uid() and active_actor.status='active') and coalesce((select public.has_role('Admin')),false);
$function$;
CREATE OR REPLACE FUNCTION public.paddlio_can_author_trainer_feedback_0041(target_training_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
select exists(select 1 from public.profiles active_actor where active_actor.id=auth.uid() and active_actor.status='active') and coalesce((select exists (
    select 1
    from public.training_plan_items t
    where t.id = target_training_id
      and (
        public.paddlio_is_admin_415()
        or t.owner_id = auth.uid()
        or t.coach_id = auth.uid()
        or (
          t.club_id is not null
          and public.paddlio_user_has_club_role_0024(t.club_id, array['Coach','ClubAdmin','Admin'])
        )
      )
  )),false);
$function$;
CREATE OR REPLACE FUNCTION public.paddlio_can_manage_club_415(target_club_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
select public.has_role('Admin') or exists(select 1 from public.profiles p where p.id=auth.uid() and p.status='active' and p.roles && array['ClubAdmin','Admin']::text[] and (p.club_id=target_club_id or exists(select 1 from public.club_memberships cm where cm.user_id=p.id and cm.club_id=target_club_id and cm.status='active')));
$function$;
CREATE OR REPLACE FUNCTION public.paddlio_can_manage_group_415(target_group_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
select exists(select 1 from public.profiles active_actor where active_actor.id=auth.uid() and active_actor.status='active') and coalesce((select public.paddlio_is_admin_415()
    or exists (
      select 1
      from public.training_groups g
      where g.id = target_group_id
        and (g.coach_id = auth.uid() or public.paddlio_can_manage_club_415(g.club_id))
    )),false);
$function$;
CREATE OR REPLACE FUNCTION public.paddlio_can_read_academy_course_0031(course_id text)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
select exists(select 1 from public.profiles active_actor where active_actor.id=auth.uid() and active_actor.status='active') and coalesce((select exists (
    select 1
    from public.academy_courses c
    where c.id = course_id
      and (
        (
          c.status = 'published'
          and (
            c.club_id is null
            or c.club_id = ''
            or public.paddlio_user_has_club_role_0031(c.club_id, array['Athlete','Coach','TeamAdmin','ClubAdmin','Admin'])
          )
        )
        or c.created_by = auth.uid()::text
        or public.paddlio_user_has_club_role_0031(c.club_id, array['Coach','TeamAdmin','ClubAdmin','Admin'])
      )
  )),false);
$function$;
CREATE OR REPLACE FUNCTION public.paddlio_can_read_academy_lesson_0031(lesson_id text)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
select exists(select 1 from public.profiles active_actor where active_actor.id=auth.uid() and active_actor.status='active') and coalesce((select exists (
    select 1
    from public.academy_lessons l
    where l.id = lesson_id
      and (
        (
          l.status = 'published'
          and (
            l.club_id is null
            or l.club_id = ''
            or public.paddlio_user_has_club_role_0031(l.club_id, array['Athlete','Coach','TeamAdmin','ClubAdmin','Admin'])
          )
        )
        or l.created_by = auth.uid()::text
        or public.paddlio_user_has_club_role_0031(l.club_id, array['Coach','TeamAdmin','ClubAdmin','Admin'])
        or (
          l.course_id is not null
          and public.paddlio_can_read_academy_course_0031(l.course_id)
        )
      )
  )),false);
$function$;
CREATE OR REPLACE FUNCTION public.paddlio_can_read_training_feedback_0024(item training_feedback)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
select exists(select 1 from public.profiles active_actor where active_actor.id=auth.uid() and active_actor.status='active') and coalesce((select public.paddlio_is_admin_415()
    or item.athlete_id = auth.uid()
    or item.coach_id = auth.uid()
    or exists (
      select 1 from public.training_plan_items t
      where t.id = item.training_plan_item_id and public.paddlio_can_read_training_item_0024(t)
    )),false);
$function$;
CREATE OR REPLACE FUNCTION public.paddlio_can_read_training_item_0024(item training_plan_items)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
select exists(select 1 from public.profiles active_actor where active_actor.id=auth.uid() and active_actor.status='active') and coalesce((select public.paddlio_is_admin_415()
    or item.owner_id = auth.uid()
    or item.coach_id = auth.uid()
    or item.assigned_athlete_id = auth.uid()
    or (item.club_id is not null and public.paddlio_user_has_club_role_0024(item.club_id, array['Coach','ClubAdmin','Admin']))
    or (item.assigned_group_id is not null and exists (
      select 1 from public.group_memberships gm
      where gm.group_id = item.assigned_group_id and gm.user_id = auth.uid() and gm.status = 'active'
    ))
    or (item.assigned_group_id is not null and exists (
      select 1 from public.group_members gm
      where gm.group_id = item.assigned_group_id
        and coalesce(gm.user_id, gm.athlete_id) = auth.uid()
        and coalesce(gm.status, 'active') = 'active'
    ))),false);
$function$;
CREATE OR REPLACE FUNCTION public.paddlio_can_write_training_feedback_0024(item training_feedback)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
select exists(select 1 from public.profiles active_actor where active_actor.id=auth.uid() and active_actor.status='active') and coalesce((select (
      item.feedback_type = 'athlete'
      and item.athlete_id = auth.uid()
      and item.author_id = auth.uid()
    )
    or (
      item.feedback_type = 'trainer'
      and item.author_id = auth.uid()
      and item.coach_id = auth.uid()
      and public.paddlio_can_author_trainer_feedback_0041(item.training_plan_item_id)
    )),false);
$function$;
CREATE OR REPLACE FUNCTION public.paddlio_can_write_training_item_0024(item training_plan_items)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
select exists(select 1 from public.profiles active_actor where active_actor.id=auth.uid() and active_actor.status='active') and coalesce((select public.paddlio_is_admin_415()
    or item.owner_id = auth.uid()
    or item.coach_id = auth.uid()
    or item.assigned_athlete_id = auth.uid()
    or (item.club_id is not null and public.paddlio_user_has_club_role_0024(item.club_id, array['Coach','ClubAdmin','Admin']))),false);
$function$;
CREATE OR REPLACE FUNCTION public.paddlio_is_admin_0031()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
select exists(select 1 from public.profiles active_actor where active_actor.id=auth.uid() and active_actor.status='active') and coalesce((select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.status = 'active'
      and 'Admin' = any(p.roles)
  )),false);
$function$;
CREATE OR REPLACE FUNCTION public.paddlio_is_admin_414()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
select exists(select 1 from public.profiles active_actor where active_actor.id=auth.uid() and active_actor.status='active') and coalesce((select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and 'Admin' = any(roles)
      and status = 'active'
  )),false);
$function$;
CREATE OR REPLACE FUNCTION public.paddlio_is_admin_415()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
select exists(select 1 from public.profiles active_actor where active_actor.id=auth.uid() and active_actor.status='active') and coalesce((select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and 'Admin' = any(roles)
      and status = 'active'
  )),false);
$function$;
CREATE OR REPLACE FUNCTION public.paddlio_is_admin_profile_sync_415()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
select exists(select 1 from public.profiles active_actor where active_actor.id=auth.uid() and active_actor.status='active') and coalesce((select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and 'Admin' = any(p.roles)
      and p.status = 'active'
  )),false);
$function$;
CREATE OR REPLACE FUNCTION public.paddlio_user_has_club_role_0024(target_club_id uuid, allowed_roles text[])
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
select exists(select 1 from public.profiles p where p.id=auth.uid() and p.status='active' and p.roles && allowed_roles and (p.club_id=target_club_id or exists(select 1 from public.club_memberships cm where cm.user_id=p.id and cm.club_id=target_club_id and cm.status='active')));
$function$;
CREATE OR REPLACE FUNCTION public.paddlio_user_has_club_role_0031(target_club_id text, allowed_roles text[])
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
select public.has_role('Admin') or exists(select 1 from public.profiles p where p.id=auth.uid() and p.status='active' and p.roles && allowed_roles and (p.club_id::text=target_club_id or exists(select 1 from public.club_memberships cm where cm.user_id=p.id and cm.club_id::text=target_club_id and cm.status='active')));
$function$;

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
