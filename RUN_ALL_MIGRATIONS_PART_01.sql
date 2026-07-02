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
