do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'club_requests_requested_by_fk') then
    alter table public.club_requests
      add constraint club_requests_requested_by_fk
      foreign key (requested_by)
      references public.profiles(id)
      on delete set null;
  end if;

  if not exists (select 1 from pg_constraint where conname = 'club_requests_reviewed_by_fk') then
    alter table public.club_requests
      add constraint club_requests_reviewed_by_fk
      foreign key (reviewed_by)
      references public.profiles(id)
      on delete set null;
  end if;

  if not exists (select 1 from pg_constraint where conname = 'trainer_requests_user_id_fk') then
    alter table public.trainer_requests
      add constraint trainer_requests_user_id_fk
      foreign key (user_id)
      references public.profiles(id)
      on delete cascade;
  end if;

  if not exists (select 1 from pg_constraint where conname = 'trainer_requests_club_id_fk') then
    alter table public.trainer_requests
      add constraint trainer_requests_club_id_fk
      foreign key (club_id)
      references public.clubs(id)
      on delete set null;
  end if;

  if not exists (select 1 from pg_constraint where conname = 'training_groups_club_id_fk') then
    alter table public.training_groups
      add constraint training_groups_club_id_fk
      foreign key (club_id)
      references public.clubs(id)
      on delete cascade;
  end if;

  if not exists (select 1 from pg_constraint where conname = 'training_groups_coach_id_fk') then
    alter table public.training_groups
      add constraint training_groups_coach_id_fk
      foreign key (coach_id)
      references public.profiles(id)
      on delete set null;
  end if;

  if not exists (select 1 from pg_constraint where conname = 'group_members_group_id_fk') then
    alter table public.group_members
      add constraint group_members_group_id_fk
      foreign key (group_id)
      references public.training_groups(id)
      on delete cascade;
  end if;

  if not exists (select 1 from pg_constraint where conname = 'group_members_athlete_id_fk') then
    alter table public.group_members
      add constraint group_members_athlete_id_fk
      foreign key (athlete_id)
      references public.profiles(id)
      on delete cascade;
  end if;
end;
$$;

alter table public.clubs enable row level security;
alter table public.club_requests enable row level security;
alter table public.trainer_requests enable row level security;
alter table public.training_groups enable row level security;
alter table public.group_members enable row level security;

drop policy if exists "trainer_requests_scope_select" on public.trainer_requests;
create policy "trainer_requests_scope_select" on public.trainer_requests
  for select
  using (
    user_id = auth.uid()
    or public.is_admin()
    or (
      public.has_role('Coach')
      and club_id is not null
      and club_id = public.current_user_club_id()
    )
  );

drop policy if exists "trainer_requests_self_insert" on public.trainer_requests;
create policy "trainer_requests_self_insert" on public.trainer_requests
  for insert
  to authenticated
  with check (user_id = auth.uid());

drop policy if exists "trainer_requests_admin_update" on public.trainer_requests;
create policy "trainer_requests_admin_update" on public.trainer_requests
  for update
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "training_groups_scope_select" on public.training_groups;
create policy "training_groups_scope_select" on public.training_groups
  for select
  using (
    public.is_admin()
    or club_id = public.current_user_club_id()
  );

drop policy if exists "training_groups_coach_write" on public.training_groups;
create policy "training_groups_coach_write" on public.training_groups
  for all
  using (
    public.is_admin()
    or (
      (public.has_role('Coach') or public.has_role('TeamAdmin'))
      and club_id = public.current_user_club_id()
    )
  )
  with check (
    public.is_admin()
    or (
      (public.has_role('Coach') or public.has_role('TeamAdmin'))
      and club_id = public.current_user_club_id()
    )
  );

drop policy if exists "group_members_scope_select" on public.group_members;
create policy "group_members_scope_select" on public.group_members
  for select
  using (
    athlete_id = auth.uid()
    or public.is_admin()
    or exists (
      select 1 from public.training_groups g
      where g.id = group_members.group_id
        and g.club_id = public.current_user_club_id()
        and (public.has_role('Coach') or public.has_role('TeamAdmin'))
    )
  );

drop policy if exists "group_members_coach_write" on public.group_members;
create policy "group_members_coach_write" on public.group_members
  for all
  using (
    public.is_admin()
    or exists (
      select 1 from public.training_groups g
      join public.profiles p on p.id = group_members.athlete_id
      where g.id = group_members.group_id
        and g.club_id = public.current_user_club_id()
        and p.club_id = public.current_user_club_id()
        and (public.has_role('Coach') or public.has_role('TeamAdmin'))
    )
  )
  with check (
    public.is_admin()
    or exists (
      select 1 from public.training_groups g
      join public.profiles p on p.id = group_members.athlete_id
      where g.id = group_members.group_id
        and g.club_id = public.current_user_club_id()
        and p.club_id = public.current_user_club_id()
        and (public.has_role('Coach') or public.has_role('TeamAdmin'))
    )
  );

notify pgrst, 'reload schema';
