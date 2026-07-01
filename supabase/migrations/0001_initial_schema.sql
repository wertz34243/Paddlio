-- Paddlio 3.0.1 initial Supabase schema
-- This migration prepares the cloud database while the app continues to use LocalStorage.

create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.has_role(required_role text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and required_role = any(roles)
      and status = 'active'
  );
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.has_role('Admin');
$$;

create or replace function public.current_user_club_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select club_id from public.profiles where id = auth.uid();
$$;

create table public.clubs (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  short_name text,
  city text,
  contact_name text,
  contact_email text,
  website text,
  logo_url text,
  primary_color text,
  secondary_color text,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint clubs_status_check check (status in ('active', 'inactive'))
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  first_name text,
  last_name text,
  display_name text,
  club_id uuid references public.clubs(id),
  roles text[] not null default array['Athlete'],
  status text not null default 'active',
  avatar_url text,
  age_category text,
  boat_classes text[] not null default array[]::text[],
  paddle_side text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_roles_check check (roles <@ array['Athlete', 'Coach', 'TeamAdmin', 'Admin']::text[]),
  constraint profiles_status_check check (status in ('active', 'disabled')),
  constraint profiles_age_category_check check (
    age_category is null or age_category in ('U10', 'U12', 'U14', 'U16', 'U18', 'U23', 'Leistungsklasse', 'Masters')
  ),
  constraint profiles_boat_classes_check check (boat_classes <@ array['K1', 'C1']::text[]),
  constraint profiles_paddle_side_check check (paddle_side is null or paddle_side in ('Links', 'Rechts'))
);

create table public.club_requests (
  id uuid primary key default gen_random_uuid(),
  requested_by uuid references public.profiles(id),
  name text not null,
  short_name text,
  city text,
  message text,
  status text not null default 'open',
  reviewed_by uuid references public.profiles(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  constraint club_requests_status_check check (status in ('open', 'approved', 'rejected'))
);

create table public.trainer_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  club_id uuid references public.clubs(id),
  club_name text,
  message text,
  has_license boolean not null default false,
  license_number text,
  qualification text,
  phone text,
  status text not null default 'open',
  reviewed_by uuid references public.profiles(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  constraint trainer_requests_status_check check (status in ('open', 'approved', 'rejected'))
);

create table public.training_groups (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.clubs(id) on delete cascade,
  coach_id uuid references public.profiles(id) on delete set null,
  name text not null,
  description text,
  age_category text,
  boat_classes text[] not null default array[]::text[],
  training_focus text,
  color text,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint training_groups_age_category_check check (
    age_category is null or age_category in ('U10', 'U12', 'U14', 'U16', 'U18', 'U23', 'Leistungsklasse', 'Masters')
  ),
  constraint training_groups_boat_classes_check check (boat_classes <@ array['K1', 'C1']::text[]),
  constraint training_groups_status_check check (status in ('active', 'inactive'))
);

create table public.group_members (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.training_groups(id) on delete cascade,
  athlete_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (group_id, athlete_id)
);

create table public.season_goals (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid not null references public.profiles(id) on delete cascade,
  assigned_by uuid references public.profiles(id) on delete set null,
  title text not null,
  description text,
  goal_type text not null default 'text',
  target_value numeric,
  current_value numeric,
  unit text,
  status text not null default 'active',
  due_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint season_goals_goal_type_check check (goal_type in ('time', 'count', 'percent', 'text')),
  constraint season_goals_status_check check (status in ('active', 'paused', 'achieved', 'archived'))
);

create table public.training_plan_items (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  club_id uuid references public.clubs(id) on delete set null,
  coach_id uuid references public.profiles(id) on delete set null,
  assigned_athlete_id uuid references public.profiles(id) on delete cascade,
  assigned_group_id uuid references public.training_groups(id) on delete cascade,
  title text not null,
  date date not null,
  start_time time,
  end_time time,
  duration_minutes integer not null default 0,
  area text,
  training_type text,
  boat_class text,
  goal text,
  intensity text,
  status text not null default 'planned',
  repeat_rule text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint training_plan_items_status_check check (status in ('planned', 'done', 'skipped', 'cancelled')),
  constraint training_plan_items_duration_check check (duration_minutes >= 0),
  constraint training_plan_items_boat_class_check check (boat_class is null or boat_class in ('K1', 'C1', 'K1+C1', 'none')),
  constraint training_plan_items_intensity_check check (intensity is null or intensity in ('locker', 'mittel', 'hart', 'maximal'))
);

create table public.training_feedback (
  id uuid primary key default gen_random_uuid(),
  training_plan_item_id uuid not null references public.training_plan_items(id) on delete cascade,
  athlete_id uuid not null references public.profiles(id) on delete cascade,
  coach_id uuid references public.profiles(id) on delete set null,
  status text not null default 'done',
  feeling integer,
  difficulty integer,
  fatigue integer,
  motivation integer,
  sleep integer,
  reason text,
  comment text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (training_plan_item_id, athlete_id),
  constraint training_feedback_status_check check (status in ('done', 'skipped')),
  constraint training_feedback_scale_check check (
    (feeling is null or feeling between 1 and 10)
    and (difficulty is null or difficulty between 1 and 10)
    and (fatigue is null or fatigue between 1 and 10)
    and (motivation is null or motivation between 1 and 10)
    and (sleep is null or sleep between 1 and 10)
  )
);

create table public.competitions (
  id uuid primary key default gen_random_uuid(),
  club_id uuid references public.clubs(id) on delete set null,
  name text not null,
  location text,
  start_date date not null,
  end_date date,
  level text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.competition_results (
  id uuid primary key default gen_random_uuid(),
  competition_id uuid not null references public.competitions(id) on delete cascade,
  athlete_id uuid not null references public.profiles(id) on delete cascade,
  boat_class text not null,
  run1_time_seconds numeric,
  run1_penalty_seconds numeric,
  run2_time_seconds numeric,
  run2_penalty_seconds numeric,
  best_total_seconds numeric,
  rank integer,
  gap_to_winner_seconds numeric,
  feeling integer,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint competition_results_boat_class_check check (boat_class in ('K1', 'C1')),
  constraint competition_results_feeling_check check (feeling is null or feeling between 1 and 10)
);

create table public.materials (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid not null references public.profiles(id) on delete cascade,
  category text not null,
  name text not null,
  status text not null default 'bereit',
  weight_kg numeric,
  length_cm numeric,
  rating integer,
  image_url text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint materials_category_check check (category in ('Boot', 'Paddel', 'Zubehoer')),
  constraint materials_rating_check check (rating is null or rating between 1 and 10)
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  body text,
  type text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles(id) on delete set null,
  action text not null,
  table_name text,
  record_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create trigger set_clubs_updated_at before update on public.clubs for each row execute function public.set_updated_at();
create trigger set_profiles_updated_at before update on public.profiles for each row execute function public.set_updated_at();
create trigger set_training_groups_updated_at before update on public.training_groups for each row execute function public.set_updated_at();
create trigger set_season_goals_updated_at before update on public.season_goals for each row execute function public.set_updated_at();
create trigger set_training_plan_items_updated_at before update on public.training_plan_items for each row execute function public.set_updated_at();
create trigger set_training_feedback_updated_at before update on public.training_feedback for each row execute function public.set_updated_at();
create trigger set_competitions_updated_at before update on public.competitions for each row execute function public.set_updated_at();
create trigger set_competition_results_updated_at before update on public.competition_results for each row execute function public.set_updated_at();
create trigger set_materials_updated_at before update on public.materials for each row execute function public.set_updated_at();

create index clubs_status_idx on public.clubs(status);
create index profiles_club_id_idx on public.profiles(club_id);
create index profiles_roles_idx on public.profiles using gin(roles);
create index club_requests_status_idx on public.club_requests(status);
create index trainer_requests_status_idx on public.trainer_requests(status);
create index training_groups_club_id_idx on public.training_groups(club_id);
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

create policy "profiles_self_or_admin_select" on public.profiles for select using (id = auth.uid() or public.is_admin());
create policy "profiles_self_update" on public.profiles for update using (id = auth.uid()) with check (id = auth.uid());
create policy "profiles_admin_all" on public.profiles for all using (public.is_admin()) with check (public.is_admin());

create policy "clubs_authenticated_select" on public.clubs for select to authenticated using (true);
create policy "clubs_admin_all" on public.clubs for all using (public.is_admin()) with check (public.is_admin());

create policy "club_requests_own_or_admin_select" on public.club_requests for select using (requested_by = auth.uid() or public.is_admin());
create policy "club_requests_insert" on public.club_requests for insert with check (requested_by = auth.uid());
create policy "club_requests_admin_all" on public.club_requests for all using (public.is_admin()) with check (public.is_admin());

create policy "trainer_requests_own_or_admin_select" on public.trainer_requests for select using (user_id = auth.uid() or public.is_admin());
create policy "trainer_requests_insert" on public.trainer_requests for insert with check (user_id = auth.uid());
create policy "trainer_requests_admin_all" on public.trainer_requests for all using (public.is_admin()) with check (public.is_admin());

create policy "training_groups_club_coach_or_admin_select" on public.training_groups
  for select using (club_id = public.current_user_club_id() or coach_id = auth.uid() or public.is_admin());
create policy "training_groups_coach_or_admin_write" on public.training_groups
  for all using ((public.has_role('Coach') and club_id = public.current_user_club_id()) or public.is_admin())
  with check ((public.has_role('Coach') and club_id = public.current_user_club_id()) or public.is_admin());

create policy "group_members_related_select" on public.group_members
  for select using (
    athlete_id = auth.uid()
    or public.is_admin()
    or exists (
      select 1 from public.training_groups g
      where g.id = group_members.group_id
        and (g.club_id = public.current_user_club_id() or g.coach_id = auth.uid())
    )
  );
create policy "group_members_coach_or_admin_write" on public.group_members
  for all using (
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
  for select using (
    athlete_id = auth.uid()
    or assigned_by = auth.uid()
    or public.is_admin()
    or exists (
      select 1 from public.profiles p
      where p.id = season_goals.athlete_id
        and p.club_id = public.current_user_club_id()
        and public.has_role('Coach')
    )
  );
create policy "season_goals_scope_write" on public.season_goals
  for all using (
    athlete_id = auth.uid()
    or public.is_admin()
    or exists (
      select 1 from public.profiles p
      where p.id = season_goals.athlete_id
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
        and p.club_id = public.current_user_club_id()
        and public.has_role('Coach')
    )
  );

create policy "training_plan_items_scope_select" on public.training_plan_items
  for select using (
    owner_id = auth.uid()
    or assigned_athlete_id = auth.uid()
    or coach_id = auth.uid()
    or public.is_admin()
    or (club_id = public.current_user_club_id() and public.has_role('Coach'))
  );
create policy "training_plan_items_scope_write" on public.training_plan_items
  for all using (
    owner_id = auth.uid()
    or coach_id = auth.uid()
    or public.is_admin()
    or (club_id = public.current_user_club_id() and public.has_role('Coach'))
  )
  with check (
    owner_id = auth.uid()
    or coach_id = auth.uid()
    or public.is_admin()
    or (club_id = public.current_user_club_id() and public.has_role('Coach'))
  );

create policy "training_feedback_scope_select" on public.training_feedback
  for select using (
    athlete_id = auth.uid()
    or coach_id = auth.uid()
    or public.is_admin()
    or exists (
      select 1 from public.profiles p
      where p.id = training_feedback.athlete_id
        and p.club_id = public.current_user_club_id()
        and public.has_role('Coach')
    )
  );
create policy "training_feedback_scope_write" on public.training_feedback
  for all using (athlete_id = auth.uid() or coach_id = auth.uid() or public.is_admin())
  with check (athlete_id = auth.uid() or coach_id = auth.uid() or public.is_admin());

create policy "competitions_authenticated_select" on public.competitions for select to authenticated using (true);
create policy "competitions_coach_or_admin_write" on public.competitions
  for all using (public.has_role('Coach') or public.is_admin()) with check (public.has_role('Coach') or public.is_admin());

create policy "competition_results_scope_select" on public.competition_results
  for select using (
    athlete_id = auth.uid()
    or public.is_admin()
    or exists (
      select 1 from public.profiles p
      where p.id = competition_results.athlete_id
        and p.club_id = public.current_user_club_id()
        and public.has_role('Coach')
    )
  );
create policy "competition_results_scope_write" on public.competition_results
  for all using (athlete_id = auth.uid() or public.is_admin())
  with check (athlete_id = auth.uid() or public.is_admin());

create policy "materials_owner_or_admin_select" on public.materials for select using (athlete_id = auth.uid() or public.is_admin());
create policy "materials_owner_or_admin_write" on public.materials
  for all using (athlete_id = auth.uid() or public.is_admin()) with check (athlete_id = auth.uid() or public.is_admin());

create policy "notifications_owner_select" on public.notifications for select using (user_id = auth.uid() or public.is_admin());
create policy "notifications_owner_update" on public.notifications for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "notifications_admin_all" on public.notifications for all using (public.is_admin()) with check (public.is_admin());

create policy "audit_logs_admin_select" on public.audit_logs for select using (public.is_admin());
create policy "audit_logs_admin_insert" on public.audit_logs for insert with check (public.is_admin());
