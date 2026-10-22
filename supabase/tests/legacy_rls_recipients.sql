-- Group, recipient, parent-reference and legitimate-write regressions; no fixtures persist.
DO $test$
declare
 coach uuid:=gen_random_uuid(); athlete uuid:=gen_random_uuid(); peer uuid:=gen_random_uuid(); foreign_user uuid:=gen_random_uuid();
 club_a uuid:=gen_random_uuid(); club_b uuid:=gen_random_uuid(); group_a uuid:=gen_random_uuid(); group_b uuid:=gen_random_uuid();
 task uuid:=gen_random_uuid(); training uuid:=gen_random_uuid(); foreign_training uuid:=gen_random_uuid();
 post uuid:=gen_random_uuid(); message_id uuid:=gen_random_uuid(); recommendation uuid:=gen_random_uuid(); response uuid:=gen_random_uuid();
 actor uuid; n integer; blocked boolean;
begin
 begin
  perform set_config('request.jwt.claims','{"role":"service_role"}',true);
  insert into auth.users(id,email,raw_user_meta_data)
    select id,'scope-'||id||'@example.invalid','{}' from unnest(array[coach,athlete,peer,foreign_user]) id;
  insert into public.clubs(id,name,status) values(club_a,'Scope A','active'),(club_b,'Scope B','active');
  update public.profiles set club_id=club_a,active_club_id=club_a,roles=array['Athlete'],primary_role='Athlete',status='active' where id in (coach,athlete,peer);
  update public.profiles set club_id=club_b,active_club_id=club_b,roles=array['Coach'],primary_role='Coach',status='active' where id=foreign_user;
  update public.profiles set roles=array['Coach'],primary_role='Coach' where id=coach;
  insert into public.training_groups(id,club_id,coach_id,name,status) values (group_a,club_a,coach,'Scope group A','active'),(group_b,club_b,foreign_user,'Scope group B','active');
  insert into public.group_members(group_id,athlete_id) values(group_a,athlete);
  insert into public.training_plan_items(id,owner_id,coach_id,club_id,assigned_athlete_id,title,date)
    values(training,coach,coach,club_a,athlete,'Scoped training',current_date),
          (foreign_training,foreign_user,foreign_user,club_b,foreign_user,'Foreign training',current_date);
  perform set_config('request.jwt.claims',jsonb_build_object('role','authenticated','sub',coach)::text,true);
  execute 'set local role authenticated';
  insert into public.tasks(id,club_id,created_by,title) values(task,club_a,coach,'Scoped task');
  insert into public.task_assignments(id,task_id,assigned_to) values(response,task,athlete);
  insert into public.club_posts(id,club_id,author_id,target_type,target_user_id,title) values(post,club_a,coach,'athlete',athlete,'Private post');
  insert into public.club_messages(id,club_id,sender_id,target_type,target_user_id,title) values(message_id,club_a,coach,'athlete',athlete,'Private message');
  insert into public.smart_coach_recommendations(id,club_id,owner_user_id,created_for_user_id,title) values(recommendation,club_a,coach,athlete,'Scoped advice');
  blocked:=false;
  begin insert into public.task_assignments(task_id,assigned_to) values(task,foreign_user);
  exception when insufficient_privilege then blocked:=true; end;
  if not blocked then raise exception 'Foreign task recipient accepted'; end if;
  blocked:=false;
  begin insert into public.club_messages(club_id,sender_id,target_type,target_user_id) values(club_a,coach,'athlete',foreign_user);
  exception when insufficient_privilege then blocked:=true; end;
  if not blocked then raise exception 'Foreign direct recipient accepted'; end if;
  blocked:=false;
  begin insert into public.club_posts(club_id,author_id,target_type,target_group_id) values(club_a,coach,'group',group_b);
  exception when insufficient_privilege then blocked:=true; end;
  if not blocked then raise exception 'Foreign target group accepted'; end if;
  blocked:=false;
  begin insert into public.group_messages(club_id,group_id,sender_id) values(club_a,group_b,coach);
  exception when insufficient_privilege then blocked:=true; end;
  if not blocked then raise exception 'Foreign group/club mismatch accepted'; end if;
  blocked:=false;
  begin insert into public.personal_bests(club_id,owner_id,user_id) values(club_a,foreign_user,foreign_user);
  exception when insufficient_privilege then blocked:=true; end;
  if not blocked then raise exception 'Foreign owner hidden under own club accepted'; end if;
  blocked:=false;
  begin update public.club_posts set target_user_id=foreign_user where id=post;
  exception when insufficient_privilege then blocked:=true; end;
  if not blocked then raise exception 'Existing message recipient can be transferred'; end if;
  execute 'reset role';
  perform set_config('request.jwt.claims',jsonb_build_object('role','authenticated','sub',athlete)::text,true);
  execute 'set local role authenticated';
  if not exists(select 1 from public.club_posts where id=post) or not exists(select 1 from public.club_messages where id=message_id)
    or not exists(select 1 from public.smart_coach_recommendations where id=recommendation)
  then raise exception 'Addressed recipient cannot read shared records'; end if;
  update public.club_posts set title='Not mine' where id=post;
  get diagnostics n=row_count; if n<>0 then raise exception 'Recipient overwrites author content'; end if;
  delete from public.club_messages where id=message_id;
  get diagnostics n=row_count; if n<>0 then raise exception 'Recipient deletes author message'; end if;
  insert into public.group_messages(id,club_id,group_id,sender_id,message) values(response,club_a,group_a,athlete,'Own group message');
  insert into public.training_attendance(training_id,club_id,athlete_id,user_id) values(training,club_a,athlete,athlete);
  blocked:=false;
  begin insert into public.training_attendance(training_id,club_id,athlete_id) values(foreign_training,club_b,athlete);
  exception when insufficient_privilege then blocked:=true; end;
  if not blocked then raise exception 'Attendance for inaccessible foreign training accepted'; end if;
  blocked:=false;
  begin insert into public.personal_bests(club_id,owner_id,user_id) values(club_b,athlete,athlete);
  exception when insufficient_privilege then blocked:=true; end;
  if not blocked then raise exception 'Own record can be injected into foreign club'; end if;
  update public.task_assignments set response_note='Completed by recipient' where id=response;
  get diagnostics n=row_count; if n<>1 then raise exception 'Valid recipient response blocked'; end if;
  execute 'reset role';
  foreach actor in array array[peer,foreign_user] loop
    perform set_config('request.jwt.claims',jsonb_build_object('role','authenticated','sub',actor)::text,true);
    execute 'set local role authenticated';
    if exists(select 1 from public.club_posts where id=post)
      or exists(select 1 from public.club_messages where id=message_id)
      or exists(select 1 from public.smart_coach_recommendations where id=recommendation)
      or exists(select 1 from public.group_messages where id=response)
    then raise exception 'Nonrecipient or nonmember can read scoped communication'; end if;
    blocked:=false;
    begin insert into public.group_messages(club_id,group_id,sender_id) values(club_a,group_a,actor);
    exception when insufficient_privilege then blocked:=true; end;
    if not blocked then raise exception 'Nonmember writes to group'; end if;
    execute 'reset role';
  end loop;
  perform set_config('request.jwt.claims',jsonb_build_object('role','authenticated','sub',athlete)::text,true);
  execute 'set local role authenticated';
  delete from public.group_messages where id=response;
  get diagnostics n=row_count; if n<>1 then raise exception 'Sender cannot delete own group message'; end if;
  execute 'reset role';
  raise exception using errcode='PZ001',message='rollback successful fixtures';
 exception when sqlstate 'PZ001' then null;
 end;
end;
$test$;
