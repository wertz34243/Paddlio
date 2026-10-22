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
