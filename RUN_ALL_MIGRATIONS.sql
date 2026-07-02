create extension if not exists pgcrypto;

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
  id uuid primary key,
  email text not null,
  first_name text,
  last_name text,
  display_name text,
  club_id uuid,
  roles text[] not null default array['Athlete']::text[],
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
  requested_by uuid,
  name text not null,
  short_name text,
  city text,
  message text,
  status text not null default 'open',
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  constraint club_requests_status_check check (status in ('open', 'approved', 'rejected'))
);

create table public.trainer_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  club_id uuid,
  club_name text,
  message text,
  has_license boolean not null default false,
  license_number text,
  qualification text,
  phone text,
  status text not null default 'open',
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  constraint trainer_requests_status_check check (status in ('open', 'approved', 'rejected'))
);

create table public.training_groups (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null,
  coach_id uuid,
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
  group_id uuid not null,
  athlete_id uuid not null,
  created_at timestamptz not null default now(),
  unique (group_id, athlete_id)
);

create table public.season_goals (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid not null,
  assigned_by uuid,
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
  owner_id uuid not null,
  club_id uuid,
  coach_id uuid,
  assigned_athlete_id uuid,
  assigned_group_id uuid,
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
  training_plan_item_id uuid not null,
  athlete_id uuid not null,
  coach_id uuid,
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
  club_id uuid,
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
  competition_id uuid not null,
  athlete_id uuid not null,
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
  athlete_id uuid not null,
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
  user_id uuid not null,
  title text not null,
  body text,
  type text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid,
  action text not null,
  table_name text,
  record_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.training_templates (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null,
  club_id uuid,
  created_by uuid,
  title text not null,
  category text not null default 'Allgemein',
  training_area text,
  training_type text,
  boat_class text,
  default_duration_minutes integer,
  default_intensity text not null default 'mittel',
  focus text,
  description text,
  notes text,
  tags text[] not null default array[]::text[],
  is_favorite boolean not null default false,
  visibility text not null default 'private',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint training_templates_category_check check (category in ('K1', 'C1', 'Ausdauer', 'Kraft', 'Technik', 'Regeneration', 'Wettkampf', 'Allgemein')),
  constraint training_templates_boat_class_check check (boat_class is null or boat_class in ('K1', 'C1', 'K1+C1', 'none')),
  constraint training_templates_intensity_check check (default_intensity in ('locker', 'mittel', 'hart', 'maximal')),
  constraint training_templates_visibility_check check (visibility in ('private', 'club'))
);

alter table public.profiles
  add constraint profiles_auth_user_id_fk foreign key (id) references auth.users(id) on delete cascade;

alter table public.profiles
  add constraint profiles_club_id_fk foreign key (club_id) references public.clubs(id);

alter table public.club_requests
  add constraint club_requests_requested_by_fk foreign key (requested_by) references public.profiles(id);

alter table public.club_requests
  add constraint club_requests_reviewed_by_fk foreign key (reviewed_by) references public.profiles(id);

alter table public.trainer_requests
  add constraint trainer_requests_user_id_fk foreign key (user_id) references public.profiles(id) on delete cascade;

alter table public.trainer_requests
  add constraint trainer_requests_club_id_fk foreign key (club_id) references public.clubs(id);

alter table public.trainer_requests
  add constraint trainer_requests_reviewed_by_fk foreign key (reviewed_by) references public.profiles(id);

alter table public.training_groups
  add constraint training_groups_club_id_fk foreign key (club_id) references public.clubs(id) on delete cascade;

alter table public.training_groups
  add constraint training_groups_coach_id_fk foreign key (coach_id) references public.profiles(id) on delete set null;

alter table public.group_members
  add constraint group_members_group_id_fk foreign key (group_id) references public.training_groups(id) on delete cascade;

alter table public.group_members
  add constraint group_members_athlete_id_fk foreign key (athlete_id) references public.profiles(id) on delete cascade;

alter table public.season_goals
  add constraint season_goals_athlete_id_fk foreign key (athlete_id) references public.profiles(id) on delete cascade;

alter table public.season_goals
  add constraint season_goals_assigned_by_fk foreign key (assigned_by) references public.profiles(id) on delete set null;

alter table public.training_plan_items
  add constraint training_plan_items_owner_id_fk foreign key (owner_id) references public.profiles(id) on delete cascade;

alter table public.training_plan_items
  add constraint training_plan_items_club_id_fk foreign key (club_id) references public.clubs(id) on delete set null;

alter table public.training_plan_items
  add constraint training_plan_items_coach_id_fk foreign key (coach_id) references public.profiles(id) on delete set null;

alter table public.training_plan_items
  add constraint training_plan_items_assigned_athlete_id_fk foreign key (assigned_athlete_id) references public.profiles(id) on delete cascade;

alter table public.training_plan_items
  add constraint training_plan_items_assigned_group_id_fk foreign key (assigned_group_id) references public.training_groups(id) on delete cascade;

alter table public.training_feedback
  add constraint training_feedback_training_plan_item_id_fk foreign key (training_plan_item_id) references public.training_plan_items(id) on delete cascade;

alter table public.training_feedback
  add constraint training_feedback_athlete_id_fk foreign key (athlete_id) references public.profiles(id) on delete cascade;

alter table public.training_feedback
  add constraint training_feedback_coach_id_fk foreign key (coach_id) references public.profiles(id) on delete set null;

alter table public.competitions
  add constraint competitions_club_id_fk foreign key (club_id) references public.clubs(id) on delete set null;

alter table public.competition_results
  add constraint competition_results_competition_id_fk foreign key (competition_id) references public.competitions(id) on delete cascade;

alter table public.competition_results
  add constraint competition_results_athlete_id_fk foreign key (athlete_id) references public.profiles(id) on delete cascade;

alter table public.materials
  add constraint materials_athlete_id_fk foreign key (athlete_id) references public.profiles(id) on delete cascade;

alter table public.notifications
  add constraint notifications_user_id_fk foreign key (user_id) references public.profiles(id) on delete cascade;

alter table public.audit_logs
  add constraint audit_logs_actor_id_fk foreign key (actor_id) references public.profiles(id) on delete set null;

alter table public.training_templates
  add constraint training_templates_owner_id_fk foreign key (owner_id) references public.profiles(id) on delete cascade;

alter table public.training_templates
  add constraint training_templates_club_id_fk foreign key (club_id) references public.clubs(id) on delete cascade;

alter table public.training_templates
  add constraint training_templates_created_by_fk foreign key (created_by) references public.profiles(id) on delete set null;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.default_roles_for_email(email text)
returns text[]
language sql
immutable
as $$
  select case
    when lower(email) = 't.kanu@outlook.com' then array['Athlete', 'Coach', 'Admin']::text[]
    else array['Athlete']::text[]
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

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  metadata_club_id text;
  safe_club_id uuid;
begin
  metadata_club_id := nullif(new.raw_user_meta_data ->> 'clubId', '');

  if metadata_club_id ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$' then
    safe_club_id := metadata_club_id::uuid;
  else
    safe_club_id := null;
  end if;

  insert into public.profiles (
    id,
    email,
    first_name,
    last_name,
    display_name,
    club_id,
    roles,
    status,
    boat_classes
  )
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'firstName', ''),
    coalesce(new.raw_user_meta_data ->> 'lastName', ''),
    coalesce(nullif(trim(coalesce(new.raw_user_meta_data ->> 'firstName', '') || ' ' || coalesce(new.raw_user_meta_data ->> 'lastName', '')), ''), new.email),
    safe_club_id,
    public.default_roles_for_email(new.email),
    'active',
    array['K1']::text[]
  )
  on conflict (id) do update
    set email = excluded.email,
        first_name = coalesce(nullif(public.profiles.first_name, ''), excluded.first_name),
        last_name = coalesce(nullif(public.profiles.last_name, ''), excluded.last_name),
        display_name = coalesce(nullif(public.profiles.display_name, ''), excluded.display_name, excluded.email),
        roles = case
          when lower(excluded.email) = 't.kanu@outlook.com' then public.default_roles_for_email(excluded.email)
          else public.profiles.roles
        end,
        updated_at = now();

  return new;
end;
$$;

create trigger set_clubs_updated_at before update on public.clubs for each row execute function public.set_updated_at();
create trigger set_profiles_updated_at before update on public.profiles for each row execute function public.set_updated_at();
create trigger set_training_groups_updated_at before update on public.training_groups for each row execute function public.set_updated_at();
create trigger set_season_goals_updated_at before update on public.season_goals for each row execute function public.set_updated_at();
create trigger set_training_plan_items_updated_at before update on public.training_plan_items for each row execute function public.set_updated_at();
create trigger set_training_feedback_updated_at before update on public.training_feedback for each row execute function public.set_updated_at();
create trigger set_competitions_updated_at before update on public.competitions for each row execute function public.set_updated_at();
create trigger set_competition_results_updated_at before update on public.competition_results for each row execute function public.set_updated_at();
create trigger set_materials_updated_at before update on public.materials for each row execute function public.set_updated_at();
create trigger set_training_templates_updated_at before update on public.training_templates for each row execute function public.set_updated_at();

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_auth_user();

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
create index training_templates_owner_id_idx on public.training_templates(owner_id);
create index training_templates_club_id_idx on public.training_templates(club_id);
create index training_templates_visibility_idx on public.training_templates(visibility);

create or replace view public.athlete_profiles (
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
) as
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

create or replace view public.coach_profiles (
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
) as
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

alter view public.athlete_profiles set (security_invoker = true);
alter view public.coach_profiles set (security_invoker = true);

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

create policy "training_plan_items_scope_write" on public.training_plan_items
  for all
  using (
    owner_id = auth.uid()
    or coach_id = auth.uid()
    or public.is_admin()
    or (
      public.has_role('Coach')
      and club_id is not null
      and club_id = public.current_user_club_id()
    )
  )
  with check (
    owner_id = auth.uid()
    or coach_id = auth.uid()
    or public.is_admin()
    or (
      public.has_role('Coach')
      and club_id is not null
      and club_id = public.current_user_club_id()
    )
  );

create policy "training_feedback_scope_select" on public.training_feedback
  for select
  using (
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
  for all
  using (athlete_id = auth.uid() or coach_id = auth.uid() or public.is_admin())
  with check (athlete_id = auth.uid() or coach_id = auth.uid() or public.is_admin());

create policy "competitions_authenticated_select" on public.competitions
  for select
  to authenticated
  using (true);

create policy "competitions_coach_or_admin_write" on public.competitions
  for all
  using (public.has_role('Coach') or public.is_admin())
  with check (public.has_role('Coach') or public.is_admin());

create policy "competition_results_scope_select" on public.competition_results
  for select
  using (
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
  for all
  using (athlete_id = auth.uid() or public.is_admin())
  with check (athlete_id = auth.uid() or public.is_admin());

create policy "materials_owner_or_admin_select" on public.materials
  for select
  using (athlete_id = auth.uid() or public.is_admin());

create policy "materials_owner_or_admin_write" on public.materials
  for all
  using (athlete_id = auth.uid() or public.is_admin())
  with check (athlete_id = auth.uid() or public.is_admin());

create policy "notifications_owner_select" on public.notifications
  for select
  using (user_id = auth.uid() or public.is_admin());

create policy "notifications_owner_update" on public.notifications
  for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "notifications_admin_all" on public.notifications
  for all
  using (public.is_admin())
  with check (public.is_admin());

create policy "audit_logs_admin_select" on public.audit_logs
  for select
  using (public.is_admin());

create policy "audit_logs_admin_insert" on public.audit_logs
  for insert
  with check (public.is_admin());

create policy "training_templates_scope_select" on public.training_templates
  for select
  using (
    owner_id = auth.uid()
    or public.is_admin()
    or (
      visibility = 'club'
      and club_id = public.current_user_club_id()
      and (public.has_role('Coach') or public.has_role('TeamAdmin'))
    )
  );

create policy "training_templates_scope_write" on public.training_templates
  for all
  using (
    owner_id = auth.uid()
    or public.is_admin()
    or (
      visibility = 'club'
      and club_id = public.current_user_club_id()
      and (public.has_role('Coach') or public.has_role('TeamAdmin'))
    )
  )
  with check (
    owner_id = auth.uid()
    or public.is_admin()
    or (
      visibility = 'club'
      and club_id = public.current_user_club_id()
      and (public.has_role('Coach') or public.has_role('TeamAdmin'))
    )
  );
