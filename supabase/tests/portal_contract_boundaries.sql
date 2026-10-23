do $test$
declare a uuid:=gen_random_uuid(); c uuid:=gen_random_uuid(); f uuid:=gen_random_uuid();
 ca uuid:=gen_random_uuid(); cb uuid:=gen_random_uuid(); doc uuid:=gen_random_uuid();
 boat uuid:=gen_random_uuid(); ga uuid:=gen_random_uuid(); gb uuid:=gen_random_uuid(); blocked boolean;
begin
 begin
  perform set_config('request.jwt.claims','{"role":"service_role"}',true);
  insert into auth.users(id,email,raw_user_meta_data)
   select id,'portal-'||id||'@example.invalid','{}' from unnest(array[a,c,f]) id;
  insert into public.clubs(id,name) values(ca,'Portal A'),(cb,'Portal B');
  update public.profiles set club_id=ca,active_club_id=ca,roles=array['Coach'],primary_role='Coach',status='active' where id in(a,c);
  update public.profiles set roles=array['ClubAdmin'],primary_role='ClubAdmin' where id=a;
  update public.profiles set club_id=cb,active_club_id=cb,roles=array['Athlete'],primary_role='Athlete',status='active' where id=f;
  insert into public.training_groups(id,club_id,coach_id,name,status) values(ga,ca,c,'Portal A','active'),(gb,cb,f,'Portal B','active');
  perform set_config('request.jwt.claims',jsonb_build_object('role','authenticated','sub',a)::text,true);
  execute 'set local role authenticated';
  insert into public.club_material(club_id,name,owner_name,last_check,note) values(ca,'Material','Owner',current_date,'Remark');
  insert into public.boats(id,club_id,owner_name,linked_athlete_ids) values(boat,ca,'Owner',array[c]);
  insert into public.club_events(club_id,title,date,time,trainer_user_id,athlete_user_id,note)
   values(ca,'Event',current_date,'12:00',c,c,'Note');
  insert into public.club_documents(id,club_id,created_by,file_path,mime_type,visible_for_roles)
   values(doc,ca,a,'https://example.invalid/document','application/pdf',array['teamAdmin']);
  insert into public.club_settings(id,club_id,name,value) values(ca,ca,'portal','{"homepage":"https://example.invalid"}');
  insert into public.club_settings(id,club_id,name,value) values(ca,ca,'portal','{"homepage":"updated"}')
   on conflict(id) do update set value=excluded.value;
  if (select value->>'homepage' from public.club_settings where id=ca)<>'updated' then raise exception 'Settings update failed'; end if;
  blocked:=false;
  begin update public.boats set linked_athlete_ids=array[f] where id=boat;
   exception when insufficient_privilege then blocked:=true; end;
  if not blocked then raise exception 'Foreign boat reference accepted'; end if;
  blocked:=false;
  begin insert into public.club_events(club_id,trainer_user_id) values(ca,f);
   exception when insufficient_privilege then blocked:=true; end;
  if not blocked then raise exception 'Foreign event reference accepted'; end if;
  blocked:=false;
  begin insert into public.club_events(club_id,athlete_user_id) values(ca,f);
   exception when insufficient_privilege then blocked:=true; end;
  if not blocked then raise exception 'Foreign event athlete accepted'; end if;
  blocked:=false;
  begin insert into public.club_events(club_id,group_id) values(ca,gb);
   exception when insufficient_privilege then blocked:=true; end;
  if not blocked then raise exception 'Foreign event group accepted'; end if;
  insert into public.club_events(club_id,group_id,title) values(ca,ga,'Valid group');
  blocked:=false;
  begin insert into public.boats(club_id,linked_athlete_ids) values(ca,array[f]);
   exception when insufficient_privilege then blocked:=true; end;
  if not blocked then raise exception 'Foreign boat insert accepted'; end if;
  execute 'reset role';
  perform set_config('request.jwt.claims',jsonb_build_object('role','authenticated','sub',c)::text,true);
  execute 'set local role authenticated';
  if exists(select 1 from public.club_documents where id=doc) then raise exception 'Unselected document role can read'; end if;
  insert into public.beta_feedback(user_id,role,message,page_path,browser_info) values(c,'coach','Feedback','/feedback','Test browser');
  execute 'reset role';
  update public.club_documents set visible_for_roles=array['coach'] where id=doc;
  execute 'set local role authenticated';
  if not exists(select 1 from public.club_documents where id=doc) then raise exception 'Selected document role cannot read'; end if;
  execute 'reset role';
  if has_function_privilege('authenticated','paddlio_private.check_portal_references()','EXECUTE')
   or has_function_privilege('anon','paddlio_private.check_portal_references()','EXECUTE') then raise exception 'Private guard exposed'; end if;
  raise sqlstate 'PZ001' using message='rollback portal fixtures';
 exception when sqlstate 'PZ001' then null;
 end;
end $test$;
