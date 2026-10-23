-- Persist existing portal fields without renaming canonical DEV ownership columns.
alter table public.club_material add column owner_name text;
alter table public.boats add column owner_name text,
  add column linked_athlete_ids uuid[] not null default '{}';
alter table public.club_events add column date date, add column time time,
  add column trainer_user_id uuid, add column athlete_user_id uuid,
  add column note text;
alter table public.club_documents add column mime_type text,
  add column visible_for_roles text[];
alter table public.beta_feedback add column page_path text, add column browser_info text;
alter table public.beta_testers add column invited_at timestamptz, add column last_seen_at timestamptz;

-- Old rows retain their existing visibility. Explicit new audience selections narrow it.
create policy club_documents_selected_roles on public.club_documents as restrictive
for select to authenticated using (
  public.current_user_is_admin() or public.has_role('ClubAdmin')
  or owner_id=auth.uid() or created_by=auth.uid()
  or visible_for_roles is null
  or (public.has_role('Coach') and 'coach'=any(visible_for_roles))
  or (public.has_role('TeamAdmin') and 'teamAdmin'=any(visible_for_roles))
);

-- New descriptive references must not point outside the row's club.
create function paddlio_private.check_portal_references() returns trigger
language plpgsql security definer set search_path='' as $function$
declare refs uuid[]; ref uuid;
begin
  if current_setting('role',true) not in ('anon','authenticated') then return new; end if;
  if auth.uid() is null then raise insufficient_privilege; end if;
  if tg_table_name='boats' then refs:=new.linked_athlete_ids;
  else
    refs:=array[new.trainer_user_id,new.athlete_user_id];
    if new.group_id is not null and not exists (
      select 1 from public.training_groups g where g.id=new.group_id and g.club_id=new.club_id
    ) then raise insufficient_privilege using message='Group belongs to another club'; end if;
  end if;
  foreach ref in array refs loop
    if ref is not null and not exists (
      select 1 from public.profiles p where p.id=ref and p.status='active'
      and (p.club_id=new.club_id or exists(select 1 from public.club_memberships m
        where m.user_id=p.id and m.club_id=new.club_id and m.status='active'))
    ) then raise insufficient_privilege using message='Portal reference belongs to another club'; end if;
  end loop;
  return new;
end $function$;
revoke all on function paddlio_private.check_portal_references() from public,anon,authenticated;
create trigger check_portal_references before insert or update on public.boats
for each row execute function paddlio_private.check_portal_references();

create trigger check_portal_references before insert or update on public.club_events
for each row execute function paddlio_private.check_portal_references();

-- Self-contained regression; both successful and failed fixture work is rolled back.
do $test$
declare a uuid:=gen_random_uuid(); c uuid:=gen_random_uuid(); f uuid:=gen_random_uuid();
 ca uuid:=gen_random_uuid(); cb uuid:=gen_random_uuid(); doc uuid:=gen_random_uuid();
 boat uuid:=gen_random_uuid(); blocked boolean;
begin
 begin
  perform set_config('request.jwt.claims','{"role":"service_role"}',true);
  insert into auth.users(id,email,raw_user_meta_data)
   select id,'portal-'||id||'@example.invalid','{}' from unnest(array[a,c,f]) id;
  insert into public.clubs(id,name) values(ca,'Portal A'),(cb,'Portal B');
  update public.profiles set club_id=ca,active_club_id=ca,roles=array['Coach'],primary_role='Coach',status='active' where id in(a,c);
  update public.profiles set roles=array['ClubAdmin'],primary_role='ClubAdmin' where id=a;
  update public.profiles set club_id=cb,active_club_id=cb,roles=array['Athlete'],primary_role='Athlete',status='active' where id=f;
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
