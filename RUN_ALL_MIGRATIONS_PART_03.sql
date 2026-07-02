create index group_members_group_id_idx on public.group_members(group_id);
create index group_members_athlete_id_idx on public.group_members(athlete_id);
create index season_goals_athlete_id_idx on public.season_goals(athlete_id);
create index training_plan_items_owner_id_idx on public.training_plan_items(owner_id);
create index training_plan_items_club_id_idx on public.training_plan_items(club_id);
create index training_plan_items_assigned_athlete_id_idx on public.training_plan_items(assigned_athlete_id);
create index training_feedback_athlete_id_idx on public.training_feedback(athlete_id);
create index competition_results_athlete_id_idx on public.competition_results(athlete_id);
create index materials_athlete_id_idx on public.materials(athlete_id);
create index notifications_user_id_idx on public.notifications(user_id);
create index audit_logs_actor_id_idx on public.audit_logs(actor_id);
create index training_templates_owner_id_idx on public.training_templates(owner_id);
create index training_templates_club_id_idx on public.training_templates(club_id);
create index training_templates_visibility_idx on public.training_templates(visibility);

create or replace view public.athlete_profiles
with (security_invoker = true)
as
select
  id,
  email,
  first_name,
  last_name,
  display_name,
  club_id,
  roles,
  status,
  avatar_url,
  age_category,
  boat_classes,
  paddle_side,
  created_at,
  updated_at
from public.profiles
where 'Athlete' = any(roles);

create or replace view public.coach_profiles
with (security_invoker = true)
as
select
  id,
  email,
  first_name,
  last_name,
  display_name,
  club_id,
  roles,
  status,
  avatar_url,
  age_category,
  boat_classes,
  paddle_side,
  created_at,
  updated_at
from public.profiles
where 'Coach' = any(roles)
   or 'TeamAdmin' = any(roles)
   or 'Admin' = any(roles);

alter table public.profiles enable row level security;
alter table public.clubs enable row level security;
alter table public.club_requests enable row level security;
alter table public.trainer_requests enable row level security;
alter table public.training_groups enable row level security;
alter table public.group_members enable row level security;
alter table public.season_goals enable row level security;
alter table public.training_plan_items enable row level security;
alter table public.training_feedback enable row level security;
alter table public.competitions enable row level security;
alter table public.competition_results enable row level security;
alter table public.materials enable row level security;
alter table public.notifications enable row level security;
alter table public.audit_logs enable row level security;
alter table public.training_templates enable row level security;

create policy "profiles_self_select" on public.profiles
  for select
  using (
    id = auth.uid()
    or public.is_admin()
    or (
      public.has_role('Coach')
      and club_id is not null
      and club_id = public.current_user_club_id()
    )
  );

create policy "profiles_self_insert" on public.profiles
  for insert
  with check (
    id = auth.uid()
    and (
      roles <@ array['Athlete']::text[]
      or (lower(email) = 't.kanu@outlook.com' and roles <@ array['Athlete', 'Coach', 'Admin']::text[])
    )
  );

create policy "profiles_self_limited_update" on public.profiles
  for update
  using (id = auth.uid())
  with check (
    id = auth.uid()
    and roles = (select roles from public.profiles where id = auth.uid())
    and status = (select status from public.profiles where id = auth.uid())
  );

create policy "profiles_admin_all" on public.profiles
  for all
  using (public.is_admin())
  with check (public.is_admin());

create policy "clubs_authenticated_select" on public.clubs
  for select
  to authenticated
  using (status = 'active' or public.is_admin());

create policy "clubs_admin_all" on public.clubs
  for all
  using (public.is_admin())
  with check (public.is_admin());

create policy "club_requests_own_or_admin_select" on public.club_requests
  for select
  using (requested_by = auth.uid() or public.is_admin());

create policy "club_requests_insert" on public.club_requests
  for insert
  with check (requested_by = auth.uid());

create policy "club_requests_admin_all" on public.club_requests
  for all
  using (public.is_admin())
  with check (public.is_admin());

create policy "trainer_requests_own_or_admin_select" on public.trainer_requests
  for select
  using (user_id = auth.uid() or public.is_admin());

create policy "trainer_requests_insert" on public.trainer_requests
  for insert
  with check (user_id = auth.uid());

create policy "trainer_requests_admin_all" on public.trainer_requests
  for all
  using (public.is_admin())
  with check (public.is_admin());

create policy "training_groups_club_coach_or_admin_select" on public.training_groups
  for select
  using (club_id = public.current_user_club_id() or coach_id = auth.uid() or public.is_admin());

create policy "training_groups_coach_or_admin_write" on public.training_groups
  for all
  using ((public.has_role('Coach') and club_id = public.current_user_club_id()) or public.is_admin())
  with check ((public.has_role('Coach') and club_id = public.current_user_club_id()) or public.is_admin());

create policy "group_members_related_select" on public.group_members
  for select
  using (
    athlete_id = auth.uid()
    or public.is_admin()
    or exists (
      select 1 from public.training_groups g
      where g.id = group_members.group_id
        and (g.club_id = public.current_user_club_id() or g.coach_id = auth.uid())
    )
  );

create policy "group_members_coach_or_admin_write" on public.group_members
  for all
  using (
    public.is_admin()
    or exists (
      select 1 from public.training_groups g
      where g.id = group_members.group_id
        and g.club_id = public.current_user_club_id()
        and public.has_role('Coach')
    )
  )
  with check (
    public.is_admin()
    or exists (
      select 1 from public.training_groups g
      where g.id = group_members.group_id
        and g.club_id = public.current_user_club_id()
        and public.has_role('Coach')
    )
  );

create policy "season_goals_scope_select" on public.season_goals
  for select
  using (
    athlete_id = auth.uid()
    or assigned_by = auth.uid()
    or public.is_admin()
    or exists (
      select 1 from public.profiles p
      where p.id = season_goals.athlete_id
        and p.club_id is not null
        and p.club_id = public.current_user_club_id()
        and public.has_role('Coach')
    )
  );

create policy "season_goals_scope_write" on public.season_goals
  for all
  using (
    athlete_id = auth.uid()
    or public.is_admin()
    or exists (
      select 1 from public.profiles p
      where p.id = season_goals.athlete_id
        and p.club_id is not null
        and p.club_id = public.current_user_club_id()
        and public.has_role('Coach')
    )
  )
  with check (
    athlete_id = auth.uid()
    or public.is_admin()
    or exists (
      select 1 from public.profiles p
      where p.id = season_goals.athlete_id
        and p.club_id is not null
        and p.club_id = public.current_user_club_id()
        and public.has_role('Coach')
    )
  );

create policy "training_plan_items_scope_select" on public.training_plan_items
  for select
  using (
    owner_id = auth.uid()
    or assigned_athlete_id = auth.uid()
    or coach_id = auth.uid()
    or public.is_admin()
    or (
      public.has_role('Coach')
      and club_id is not null
      and club_id = public.current_user_club_id()
    )
  );
