-- Validate new references, not merely the visible row's club label.
create or replace function paddlio_private.protect_release_scope_identity()
returns trigger language plpgsql security definer set search_path = '' as $guard$
declare old_data jsonb; new_data jsonb := to_jsonb(new); k text;
begin
 if current_setting('role',true) not in ('anon','authenticated') then return new; end if;
 if tg_op='UPDATE' then
   old_data:=to_jsonb(old);
   foreach k in array ARRAY['id','club_id','owner_id','user_id','created_by','athlete_id','sender_id','author_id','target_user_id','target_group_id','target_type','group_id','task_id','assigned_to','owner_user_id','created_for_user_id','training_id'] loop
     if new_data->k is distinct from old_data->k then
       raise exception 'Record identity/scope is immutable' using errcode='42501';
     end if;
   end loop;
 end if;
 if new_data->>'owner_id' is not null and new_data->>'user_id' is not null
    and new_data->>'owner_id' <> new_data->>'user_id' then
   raise exception 'Conflicting owner identifiers' using errcode='42501';
 end if;

 if tg_op='INSERT' and not public.has_role('Admin') then
   if new_data->>'club_id' is not null and not exists (
     select 1 from public.profiles p where p.id=auth.uid() and p.status='active'
       and (p.club_id=(new_data->>'club_id')::uuid or p.active_club_id=(new_data->>'club_id')::uuid
         or exists(select 1 from public.club_memberships cm where cm.user_id=p.id and cm.club_id=(new_data->>'club_id')::uuid and cm.status='active'))
   ) then raise exception 'Cannot insert into another club' using errcode='42501'; end if;
   if tg_table_name <> 'task_assignments' then
     foreach k in array ARRAY['owner_id','user_id','athlete_id','owner_user_id','created_for_user_id'] loop
       if new_data->>k is not null and (new_data->>k)::uuid <> auth.uid() and not (
         (public.has_role('Coach') or public.has_role('TeamAdmin') or public.has_role('ClubAdmin'))
         and exists(select 1 from public.profiles p where p.id=(new_data->>k)::uuid and p.status='active'
           and (p.club_id=(new_data->>'club_id')::uuid or p.active_club_id=(new_data->>'club_id')::uuid
             or exists(select 1 from public.club_memberships cm where cm.user_id=p.id and cm.club_id=(new_data->>'club_id')::uuid and cm.status='active')))
       ) then raise exception 'Referenced account is outside actor scope' using errcode='42501'; end if;
     end loop;
   end if;
 end if;
 if tg_table_name='training_attendance' and new_data->>'user_id' is not null
    and new_data->>'user_id' is distinct from new_data->>'athlete_id'
 then raise exception 'Conflicting attendance identity' using errcode='42501'; end if;
 if tg_table_name='task_assignments' and new_data->>'user_id' is not null
    and new_data->>'user_id' is distinct from new_data->>'assigned_to'
 then raise exception 'Conflicting task recipient identity' using errcode='42501'; end if;

 if tg_op='INSERT' and tg_table_name='task_assignments' then
   if not exists (
     select 1 from public.tasks t join public.profiles recipient on recipient.id=(new_data->>'assigned_to')::uuid
     where t.id=(new_data->>'task_id')::uuid and recipient.status='active'
       and (recipient.club_id=t.club_id or recipient.active_club_id=t.club_id
            or exists(select 1 from public.club_memberships cm where cm.club_id=t.club_id and cm.user_id=recipient.id and cm.status='active'))
   ) then raise exception 'Task recipient is outside task club' using errcode='42501'; end if;
 end if;
 if tg_op='INSERT' and tg_table_name in ('club_posts','club_messages') then
   if new_data->>'target_type'='athlete' and not exists (
     select 1 from public.profiles recipient where recipient.id=(new_data->>'target_user_id')::uuid and recipient.status='active'
       and (recipient.club_id=(new_data->>'club_id')::uuid or recipient.active_club_id=(new_data->>'club_id')::uuid
            or exists(select 1 from public.club_memberships cm where cm.club_id=(new_data->>'club_id')::uuid and cm.user_id=recipient.id and cm.status='active'))
   ) then raise exception 'Message recipient is outside sender club' using errcode='42501'; end if;
   if new_data->>'target_type'='group' and not exists (
     select 1 from public.training_groups g where g.id=(new_data->>'target_group_id')::uuid and g.club_id=(new_data->>'club_id')::uuid
   ) then raise exception 'Message group is outside sender club' using errcode='42501'; end if;
 end if;
 if tg_op='INSERT' and tg_table_name='training_attendance' then
   if not exists (
     select 1 from public.training_plan_items t where t.id=(new_data->>'training_id')::uuid
     and t.club_id is not distinct from (new_data->>'club_id')::uuid
     and (t.owner_id=auth.uid() or t.coach_id=auth.uid() or t.assigned_athlete_id=auth.uid()
       or exists(select 1 from public.group_members gm where gm.group_id=t.assigned_group_id and gm.athlete_id=auth.uid())
       or (t.club_id=public.current_user_club_id() and (public.has_role('Coach') or public.has_role('ClubAdmin') or public.has_role('TeamAdmin')))
       or public.has_role('Admin'))
     and (
       t.assigned_athlete_id=(new_data->>'athlete_id')::uuid
       or t.owner_id=(new_data->>'athlete_id')::uuid
       or exists(select 1 from public.group_members gm where gm.group_id=t.assigned_group_id and gm.athlete_id=(new_data->>'athlete_id')::uuid)
       or ((public.has_role('Coach') or public.has_role('ClubAdmin') or public.has_role('TeamAdmin') or public.has_role('Admin'))
           and exists(select 1 from public.profiles recipient where recipient.id=(new_data->>'athlete_id')::uuid and recipient.club_id=t.club_id))
     )
   ) then raise exception 'Attendance does not match an accessible training and athlete' using errcode='42501'; end if;
 end if;
 return new;
end;
$guard$;
revoke all on function paddlio_private.protect_release_scope_identity() from public,anon,authenticated;

alter policy smart_coach_recommendations_release_read on public.smart_coach_recommendations
using (exists(select 1 from public.profiles p where p.id=auth.uid() and p.status='active')
 and (owner_user_id=auth.uid() or created_for_user_id=auth.uid()));
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

-- Runtime isolation regression. All fixtures are rolled back by the subtransaction.
DO $test$
DECLARE
 actor uuid := gen_random_uuid(); outsider uuid := gen_random_uuid();
 club_a uuid := gen_random_uuid(); club_b uuid := gen_random_uuid();
 row_id uuid := gen_random_uuid(); insert_id uuid := gen_random_uuid();
 t text; r text; cols text; vals text; n integer; blocked boolean;
 tables text[] := ARRAY['beta_feedback','beta_readiness_checks','beta_testers','boats','club_material','club_events','club_documents','club_settings','external_connections','external_training_sessions','file_attachments','personal_bests','result_imports','smart_coach_recommendations','group_messages','tasks','task_assignments','training_attendance','club_posts','club_messages'];
BEGIN
 BEGIN
  perform set_config('request.jwt.claims','{"role":"service_role"}',true);
  insert into auth.users(id,email,raw_user_meta_data) values
    (actor,'rls-a-'||actor||'@example.invalid','{}'),(outsider,'rls-b-'||outsider||'@example.invalid','{}');
  insert into public.clubs(id,name,status) values (club_a,'RLS temporary A','active'),(club_b,'RLS temporary B','active');
  update public.profiles set club_id=club_a, active_club_id=club_a,roles=array['Athlete'],status='active' where id=actor;
  update public.profiles set club_id=club_b, active_club_id=club_b,roles=array['Athlete'],status='active' where id=outsider;
  foreach t in array tables loop
    select string_agg(format('%I',column_name),',' order by ordinal_position),
           string_agg(case when column_name='id' then quote_literal(row_id)
                when column_name='club_id' then quote_literal(club_b)
                else quote_literal(outsider) end,',' order by ordinal_position)
      into cols,vals from information_schema.columns
      where table_schema='public' and table_name=t and column_name in
       ('id','club_id','user_id','owner_id','created_by','sender_id','author_id','athlete_id','assigned_to','owner_user_id','created_for_user_id','training_id','task_id');
    execute format('insert into public.%I (%s) values (%s)',t,cols,vals);
  end loop;
  foreach r in array ARRAY['Athlete','Coach','ClubAdmin'] loop
    perform set_config('request.jwt.claims','{"role":"service_role"}',true);
    update public.profiles set roles=array[r],primary_role=r where id=actor;
    perform set_config('request.jwt.claims',jsonb_build_object('role','authenticated','sub',actor)::text,true);
    execute 'set local role authenticated';
    foreach t in array tables loop
      execute format('select count(*) from public.%I where id=$1',t) into n using row_id;
      if n<>0 then raise exception '% reads unrelated %',r,t; end if;
      execute format('update public.%I set updated_at=updated_at where id=$1',t) using row_id;
      get diagnostics n=row_count;
      if n<>0 then raise exception '% updates unrelated %',r,t; end if;
      execute format('delete from public.%I where id=$1',t) using row_id;
      get diagnostics n=row_count;
      if n<>0 then raise exception '% deletes unrelated %',r,t; end if;
    end loop;
    execute 'reset role';
    -- Explicitly forge every foreign ownership column; INSERT must fail too.
    foreach t in array tables loop
      select string_agg(format('%I',column_name),',' order by ordinal_position),
             string_agg(case when column_name='id' then quote_literal(insert_id)
                  when column_name='club_id' then quote_literal(club_b)
                  else quote_literal(outsider) end,',' order by ordinal_position)
        into cols,vals from information_schema.columns where table_schema='public' and table_name=t
        and column_name in ('id','club_id','user_id','owner_id','created_by','sender_id','author_id','athlete_id','assigned_to','owner_user_id','created_for_user_id','training_id','task_id');
      blocked:=false;
      execute 'set local role authenticated';
      begin
        execute format('insert into public.%I (%s) values (%s)',t,cols,vals);
      exception when insufficient_privilege then blocked:=true;
      end;
      execute 'reset role';
      if not blocked then raise exception '% inserts foreign-owned %',r,t; end if;
    end loop;
  end loop;
  perform set_config('request.jwt.claims','{"role":"service_role"}',true);
  update public.profiles set roles=array['Admin'],primary_role='Admin' where id=actor;
  perform set_config('request.jwt.claims',jsonb_build_object('role','authenticated','sub',actor)::text,true);
  execute 'set local role authenticated';
  foreach t in array tables loop
    execute format('select count(*) from public.%I where id=$1',t) into n using row_id;
    if n<>1 then raise exception 'Admin cannot read %',t; end if;
    execute format('update public.%I set updated_at=updated_at where id=$1',t) using row_id;
    get diagnostics n=row_count;
    if n<>1 then raise exception 'Admin cannot update %',t; end if;
  end loop;
  execute 'reset role';
  perform set_config('request.jwt.claims',jsonb_build_object('role','authenticated','sub',outsider)::text,true);
  execute 'set local role authenticated';
  foreach t in array ARRAY['boats','external_connections','external_training_sessions','file_attachments','personal_bests','result_imports','smart_coach_recommendations','task_assignments','training_attendance','beta_feedback'] loop
    execute format('select count(*) from public.%I where id=$1',t) into n using row_id;
    if n<>1 then raise exception 'Owner cannot read %',t; end if;
  end loop;
  execute 'reset role';

  -- Same-club membership is not permission to read another person's private records.
  perform set_config('request.jwt.claims','{"role":"service_role"}',true);
  update public.profiles set club_id=club_b,active_club_id=club_b,roles=array['Athlete'],primary_role='Athlete' where id=actor;
  perform set_config('request.jwt.claims',jsonb_build_object('role','authenticated','sub',actor)::text,true);
  execute 'set local role authenticated';
  foreach t in array ARRAY['beta_feedback','beta_testers','external_connections','external_training_sessions','file_attachments','personal_bests','result_imports','smart_coach_recommendations','task_assignments','training_attendance'] loop
    execute format('select count(*) from public.%I where id=$1',t) into n using row_id;
    if n<>0 then raise exception 'Same-club Athlete reads private %',t; end if;
  end loop;
  execute 'reset role';
  -- Legitimate staff access in the same club, including TeamAdmin.
  foreach r in array ARRAY['Coach','TeamAdmin','ClubAdmin'] loop
    perform set_config('request.jwt.claims','{"role":"service_role"}',true);
    update public.profiles set roles=array[r],primary_role=r where id=actor;
    perform set_config('request.jwt.claims',jsonb_build_object('role','authenticated','sub',actor)::text,true);
    execute 'set local role authenticated';
    foreach t in array ARRAY['boats','club_material','club_events','club_documents','club_settings','external_training_sessions','personal_bests','result_imports','training_attendance'] loop
      execute format('select count(*) from public.%I where id=$1',t) into n using row_id;
      if n<>1 then raise exception 'Same-club % cannot read %',r,t; end if;
    end loop;
    foreach t in array ARRAY['boats','club_material','club_events','personal_bests','result_imports','training_attendance'] loop
      execute format('update public.%I set updated_at=updated_at where id=$1',t) using row_id;
      get diagnostics n=row_count;
      if n<>1 then raise exception 'Same-club % cannot update %',r,t; end if;
    end loop;
    execute 'reset role';
  end loop;
  -- Recipient filtering must hold even for a Coach in the same club.
  update public.club_posts set target_type='athlete',target_user_id=outsider where id=row_id;
  update public.club_messages set target_type='athlete',target_user_id=outsider where id=row_id;
  execute 'set local role authenticated';
  foreach t in array ARRAY['club_posts','club_messages'] loop
    execute format('select count(*) from public.%I where id=$1',t) into n using row_id;
    if n<>0 then raise exception 'Unaddressed same-club staff reads %',t; end if;
  end loop;
  execute 'reset role';
  perform set_config('request.jwt.claims',jsonb_build_object('role','authenticated','sub',outsider)::text,true);
  execute 'set local role authenticated';
  foreach t in array ARRAY['club_posts','club_messages'] loop
    execute format('select count(*) from public.%I where id=$1',t) into n using row_id;
    if n<>1 then raise exception 'Recipient cannot read %',t; end if;
  end loop;
  -- Owner updates are permitted, but identity transfer and conflicting aliases are not.
  update public.external_connections set display_name='Own connection' where id=row_id;
  get diagnostics n=row_count;
  if n<>1 then raise exception 'Owner update failed'; end if;
  blocked:=false;
  begin update public.external_connections set owner_id=actor where id=row_id;
  exception when insufficient_privilege then blocked:=true; end;
  if not blocked then raise exception 'Owner identity can be reassigned'; end if;
  blocked:=false;
  begin insert into public.external_connections(owner_id,user_id) values (outsider,actor);
  exception when insufficient_privilege then blocked:=true; end;
  if not blocked then raise exception 'Conflicting owners accepted'; end if;
  execute 'reset role';
  -- Allow the real task response, reject reparenting it.
  update public.tasks set created_by=actor where id=row_id;
  update public.task_assignments set task_id=row_id where id=row_id;
  execute 'set local role authenticated';
  update public.task_assignments set response_note='My response' where id=row_id;
  get diagnostics n=row_count;
  if n<>1 then raise exception 'Task recipient cannot respond'; end if;
  blocked:=false;
  begin update public.task_assignments set task_id=insert_id where id=row_id;
  exception when insufficient_privilege then blocked:=true; end;
  if not blocked then raise exception 'Task response can be reparented'; end if;
  execute 'reset role';
  -- A disabled Admin is not an administrator and cannot use old permissive policies.
  perform set_config('request.jwt.claims','{"role":"service_role"}',true);
  update public.profiles set roles=array['Admin'],primary_role='Admin',status='disabled' where id=actor;
  perform set_config('request.jwt.claims',jsonb_build_object('role','authenticated','sub',actor)::text,true);
  execute 'set local role authenticated';
  foreach t in array tables loop
    execute format('select count(*) from public.%I where id=$1',t) into n using row_id;
    if n<>0 then raise exception 'Disabled Admin reads %',t; end if;
    execute format('update public.%I set updated_at=updated_at where id=$1',t) using row_id;
    get diagnostics n=row_count;
    if n<>0 then raise exception 'Disabled Admin updates %',t; end if;
  end loop;
  execute 'reset role';
  -- Disabled owner must not bypass the restrictive gate via old attendance policies.
  perform set_config('request.jwt.claims','{"role":"service_role"}',true);
  update public.profiles set status='disabled' where id=outsider;
  perform set_config('request.jwt.claims',jsonb_build_object('role','authenticated','sub',outsider)::text,true);
  execute 'set local role authenticated';
  foreach t in array tables loop
    execute format('update public.%I set updated_at=updated_at where id=$1',t) using row_id;
    get diagnostics n=row_count;
    if n<>0 then raise exception 'Disabled owner updates %',t; end if;
  end loop;
  execute 'reset role';
  perform set_config('request.jwt.claims','{"role":"anon"}',true);
  execute 'set local role anon';
  foreach t in array tables loop
    begin
      execute format('select count(*) from public.%I where id=$1',t) into n using row_id;
      if n<>0 then raise exception 'Anonymous reads %',t; end if;
    exception when insufficient_privilege then null;
    end;
  end loop;
  execute 'reset role';

  raise exception using errcode='PZ001',message='rollback successful fixtures';
 exception when sqlstate 'PZ001' then null;
 end;
END;
$test$;
