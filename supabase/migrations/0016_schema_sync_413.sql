-- Paddlio 4.1.3 Schema Sync and Encoding Hotfix
-- Idempotent schema synchronization for beta optional modules.

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

create or replace function public.current_user_is_admin()
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
      and roles && array['Admin']::text[]
  );
$$;

create or replace function public.current_user_is_club_manager(target_club_id uuid)
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
      and club_id = target_club_id
      and roles && array['Coach','TeamAdmin','ClubAdmin','Admin']::text[]
  );
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

alter table if exists public.competitions add column if not exists organizer text;

create table if not exists public.club_settings (
  id uuid primary key default gen_random_uuid(),
  club_id uuid,
  name text,
  value jsonb default '{}'::jsonb,
  created_by uuid,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted_at timestamptz
);

create table if not exists public.group_messages (
  id uuid primary key default gen_random_uuid(),
  club_id uuid,
  group_id uuid,
  sender_id uuid,
  message text not null default '',
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted_at timestamptz
);

create table if not exists public.club_posts (
  id uuid primary key default gen_random_uuid(),
  club_id uuid,
  author_id uuid,
  title text not null default '',
  content text not null default '',
  category text not null default 'info',
  priority text default 'normal',
  target_type text default 'club',
  target_group_id uuid,
  target_user_id uuid,
  expires_at timestamptz,
  is_pinned boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted_at timestamptz
);

create table if not exists public.club_messages (
  id uuid primary key default gen_random_uuid(),
  club_id uuid,
  sender_id uuid,
  title text not null default '',
  message text not null default '',
  target_type text default 'club',
  target_group_id uuid,
  target_user_id uuid,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted_at timestamptz
);

create table if not exists public.direct_messages (
  id uuid primary key default gen_random_uuid(),
  club_id uuid,
  sender_id uuid not null,
  receiver_id uuid not null,
  message text not null,
  is_read boolean default false,
  read_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted_at timestamptz
);

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  club_id uuid,
  user_id uuid,
  owner_id uuid,
  created_by uuid,
  title text not null default '',
  description text,
  task_type text default 'general',
  priority text default 'normal',
  due_date date,
  related_training_id uuid,
  related_competition_id uuid,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted_at timestamptz
);

create table if not exists public.club_documents (
  id uuid primary key default gen_random_uuid(),
  club_id uuid,
  owner_id uuid,
  created_by uuid,
  title text not null default '',
  file_name text,
  file_path text,
  folder text,
  visibility text default 'club',
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted_at timestamptz
);

create table if not exists public.task_assignments (
  id uuid primary key default gen_random_uuid(),
  task_id uuid,
  assigned_to uuid,
  user_id uuid,
  status text default 'open',
  completed_at timestamptz,
  response_note text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted_at timestamptz
);

create table if not exists public.training_attendance (
  id uuid primary key default gen_random_uuid(),
  training_id uuid not null,
  athlete_id uuid,
  user_id uuid,
  club_id uuid,
  group_id uuid,
  status text default 'pending',
  reason text,
  note text,
  responded_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted_at timestamptz
);

create table if not exists public.file_attachments (
  id uuid primary key default gen_random_uuid(),
  club_id uuid,
  owner_id uuid,
  user_id uuid,
  related_type text not null default 'file',
  related_id uuid,
  file_name text not null default '',
  file_path text not null default '',
  file_type text,
  file_size bigint,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted_at timestamptz
);

create table if not exists public.result_imports (
  id uuid primary key default gen_random_uuid(),
  club_id uuid,
  user_id uuid,
  owner_id uuid,
  source text,
  source_url text,
  status text default 'prepared',
  file_name text,
  note text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted_at timestamptz
);

create table if not exists public.personal_bests (
  id uuid primary key default gen_random_uuid(),
  club_id uuid,
  user_id uuid,
  owner_id uuid,
  boat_class text,
  competition_id uuid,
  result_id uuid,
  best_time_seconds numeric,
  penalty_seconds numeric,
  achieved_at date,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted_at timestamptz
);

create table if not exists public.external_training_sessions (
  id uuid primary key default gen_random_uuid(),
  club_id uuid,
  user_id uuid,
  owner_id uuid,
  source text,
  external_id text,
  title text,
  activity_date date,
  duration_minutes integer,
  distance_meters numeric,
  load_score numeric,
  payload jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted_at timestamptz
);

create table if not exists public.beta_readiness_checks (
  id uuid primary key default gen_random_uuid(),
  club_id uuid,
  user_id uuid,
  category text,
  title text not null default '',
  status text default 'manual',
  severity text default 'info',
  note text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted_at timestamptz
);

create table if not exists public.beta_feedback (
  id uuid primary key default gen_random_uuid(),
  club_id uuid,
  user_id uuid,
  role text,
  category text not null default 'general',
  priority text not null default 'normal',
  title text not null default '',
  message text not null default '',
  device_info text,
  status text not null default 'open',
  admin_note text,
  app_version text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted_at timestamptz
);

create table if not exists public.external_connections (
  id uuid primary key default gen_random_uuid(),
  club_id uuid,
  user_id uuid,
  owner_id uuid,
  provider text not null default 'external',
  status text default 'prepared',
  display_name text,
  last_sync_at timestamptz,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted_at timestamptz
);

create table if not exists public.beta_testers (
  id uuid primary key default gen_random_uuid(),
  club_id uuid,
  user_id uuid,
  tester_type text default 'athlete',
  status text default 'active',
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted_at timestamptz
);

create table if not exists public.boats (
  id uuid primary key default gen_random_uuid(),
  club_id uuid,
  owner_id uuid,
  user_id uuid,
  manufacturer text,
  model text,
  boat_class text,
  length_cm numeric,
  weight_kg numeric,
  build_year integer,
  is_club_boat boolean default false,
  status text default 'active',
  note text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted_at timestamptz
);

create table if not exists public.club_material (
  id uuid primary key default gen_random_uuid(),
  club_id uuid,
  owner_id uuid,
  user_id uuid,
  name text not null default '',
  category text default 'Vereinsmaterial',
  inventory_number text,
  condition text,
  photo_url text,
  last_check date,
  note text,
  status text default 'active',
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted_at timestamptz
);

create table if not exists public.club_events (
  id uuid primary key default gen_random_uuid(),
  club_id uuid,
  user_id uuid,
  created_by uuid,
  title text not null default '',
  category text default 'organization',
  starts_at timestamptz,
  ends_at timestamptz,
  location text,
  description text,
  group_id uuid,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted_at timestamptz
);

create table if not exists public.smart_coach_recommendations (
  id uuid primary key default gen_random_uuid(),
  club_id uuid,
  owner_user_id uuid,
  created_for_user_id uuid,
  created_by_system boolean default true,
  category text not null default 'Training',
  priority text not null default 'mittel',
  title text not null default '',
  message text not null default '',
  reason text,
  suggested_action text,
  status text not null default 'open',
  related_entity_type text,
  related_entity_id uuid,
  note text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted_at timestamptz
);

create index if not exists idx_direct_messages_users on public.direct_messages(sender_id, receiver_id);
create index if not exists idx_group_messages_group on public.group_messages(group_id, created_at);
create index if not exists idx_club_posts_club on public.club_posts(club_id, created_at);
create index if not exists idx_tasks_club on public.tasks(club_id, due_date);
create index if not exists idx_task_assignments_user on public.task_assignments(assigned_to, status);
create index if not exists idx_training_attendance_training on public.training_attendance(training_id, athlete_id);
create index if not exists idx_beta_feedback_status on public.beta_feedback(status, created_at);
create index if not exists idx_smart_coach_user on public.smart_coach_recommendations(created_for_user_id, status);

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'club_settings','group_messages','club_posts','club_messages','direct_messages',
    'tasks','club_documents','task_assignments','training_attendance','file_attachments',
    'result_imports','personal_bests','external_training_sessions','beta_readiness_checks',
    'beta_feedback','external_connections','beta_testers','boats','club_material',
    'club_events','smart_coach_recommendations'
  ]
  loop
    execute format('alter table public.%I enable row level security', table_name);
    execute format('drop policy if exists %I on public.%I', table_name || '_admin_all_413', table_name);
    execute format('drop policy if exists %I on public.%I', table_name || '_own_or_club_413', table_name);
    execute format(
      'create policy %I on public.%I for all using (public.current_user_is_admin()) with check (public.current_user_is_admin())',
      table_name || '_admin_all_413',
      table_name
    );
    execute format(
      'create policy %I on public.%I for all using (auth.uid() is not null) with check (auth.uid() is not null)',
      table_name || '_own_or_club_413',
      table_name
    );
  end loop;
end $$;
