-- Paddlio DEV P0 schema reconciliation.
-- Bundles repository-defined active modules missing from paddlio-dev.
-- Uses the UUID-normalized 0016 baseline; legacy text-key migrations are intentionally excluded.
-- Additive/idempotent source migrations only; no tables or user data are deleted.

-- BEGIN SOURCE 0016_schema_sync_413.sql
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
-- END SOURCE 0016_schema_sync_413.sql

-- BEGIN SOURCE 0017_external_beta_readiness_414.sql
-- Paddlio 4.1.4 External Beta Readiness Fix
-- Idempotent schema and RLS compatibility patch for the external beta.

alter table if exists public.competitions
  add column if not exists course text;

alter table if exists public.competitions
  add column if not exists organizer text;

alter table if exists public.competitions
  add column if not exists level text;

alter table if exists public.competitions
  add column if not exists source text default 'manual';

alter table if exists public.competitions
  add column if not exists external_id text;

alter table if exists public.competitions
  add column if not exists source_url text;

alter table if exists public.profiles enable row level security;

create or replace function public.paddlio_is_admin_414()
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
      and 'Admin' = any(roles)
      and status = 'active'
  );
$$;

drop policy if exists profiles_own_select_414 on public.profiles;
create policy profiles_own_select_414 on public.profiles
  for select
  to authenticated
  using (id = auth.uid());

drop policy if exists profiles_own_insert_414 on public.profiles;
create policy profiles_own_insert_414 on public.profiles
  for insert
  to authenticated
  with check (id = auth.uid());

drop policy if exists profiles_own_update_414 on public.profiles;
create policy profiles_own_update_414 on public.profiles
  for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

drop policy if exists profiles_admin_all_414 on public.profiles;
create policy profiles_admin_all_414 on public.profiles
  for all
  to authenticated
  using (public.paddlio_is_admin_414())
  with check (public.paddlio_is_admin_414());

create index if not exists competitions_course_idx on public.competitions(course);
-- END SOURCE 0017_external_beta_readiness_414.sql

-- BEGIN SOURCE 0022_training_journal_cloud_sync_415.sql
-- Paddlio 4.1.5 - Training journal cloud sync
-- Safe, idempotent and non-destructive.

create table if not exists public.training_journal_entries (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid not null references public.profiles(id) on delete cascade,
  training_id uuid,
  date date not null,
  training_rating integer,
  feeling integer,
  fatigue integer,
  sleep integer,
  motivation integer,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint training_journal_scale_check check (
    (training_rating is null or training_rating between 1 and 10)
    and (feeling is null or feeling between 1 and 10)
    and (fatigue is null or fatigue between 1 and 10)
    and (sleep is null or sleep between 1 and 10)
    and (motivation is null or motivation between 1 and 10)
  )
);

alter table public.training_journal_entries add column if not exists athlete_id uuid references public.profiles(id) on delete cascade;
alter table public.training_journal_entries add column if not exists training_id uuid;
alter table public.training_journal_entries add column if not exists date date;
alter table public.training_journal_entries add column if not exists training_rating integer;
alter table public.training_journal_entries add column if not exists feeling integer;
alter table public.training_journal_entries add column if not exists fatigue integer;
alter table public.training_journal_entries add column if not exists sleep integer;
alter table public.training_journal_entries add column if not exists motivation integer;
alter table public.training_journal_entries add column if not exists notes text;
alter table public.training_journal_entries add column if not exists created_at timestamptz default now();
alter table public.training_journal_entries add column if not exists updated_at timestamptz default now();

create index if not exists idx_training_journal_athlete_date
  on public.training_journal_entries(athlete_id, date desc);

create index if not exists idx_training_journal_training_id
  on public.training_journal_entries(training_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_training_journal_entries_updated_at on public.training_journal_entries;
create trigger set_training_journal_entries_updated_at
  before update on public.training_journal_entries
  for each row
  execute function public.set_updated_at();

alter table public.training_journal_entries enable row level security;

drop policy if exists training_journal_select_415 on public.training_journal_entries;
create policy training_journal_select_415
  on public.training_journal_entries
  for select
  using (
    athlete_id = auth.uid()
    or public.current_user_is_admin()
    or exists (
      select 1
      from public.profiles p
      where p.id = public.training_journal_entries.athlete_id
        and p.club_id = public.current_user_club_id()
        and (
          public.has_role('Coach')
          or public.has_role('ClubAdmin')
          or public.has_role('TeamAdmin')
        )
    )
  );

drop policy if exists training_journal_write_415 on public.training_journal_entries;
create policy training_journal_write_415
  on public.training_journal_entries
  for all
  using (
    athlete_id = auth.uid()
    or public.current_user_is_admin()
  )
  with check (
    athlete_id = auth.uid()
    or public.current_user_is_admin()
  );

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    if not exists (
      select 1
      from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = 'training_journal_entries'
    ) then
      alter publication supabase_realtime add table public.training_journal_entries;
    end if;

    alter table public.training_journal_entries replica identity full;
  end if;
end $$;
-- END SOURCE 0022_training_journal_cloud_sync_415.sql

-- BEGIN SOURCE 0025_messages_feedback_visibility_fix.sql
-- Paddlio 5.0 direct message and feedback visibility fix.
-- Safe, idempotent and non-destructive.

alter table public.direct_messages enable row level security;

drop policy if exists direct_messages_own_or_club_413 on public.direct_messages;
drop policy if exists direct_messages_admin_all_413 on public.direct_messages;
drop policy if exists direct_messages_own_read on public.direct_messages;
drop policy if exists direct_messages_own_insert on public.direct_messages;
drop policy if exists "direct_messages_own_read" on public.direct_messages;
drop policy if exists "direct_messages_own_write" on public.direct_messages;
drop policy if exists direct_messages_select_0025 on public.direct_messages;
drop policy if exists direct_messages_insert_0025 on public.direct_messages;
drop policy if exists direct_messages_update_0025 on public.direct_messages;
drop policy if exists direct_messages_delete_0025 on public.direct_messages;

create policy direct_messages_select_0025
  on public.direct_messages
  for select
  to authenticated
  using (
    deleted_at is null
    and (
      sender_id = auth.uid()
      or receiver_id = auth.uid()
      or public.paddlio_is_admin_415()
      or public.current_user_is_admin()
    )
  );

create policy direct_messages_insert_0025
  on public.direct_messages
  for insert
  to authenticated
  with check (
    sender_id = auth.uid()
    or public.paddlio_is_admin_415()
    or public.current_user_is_admin()
  );

create policy direct_messages_update_0025
  on public.direct_messages
  for update
  to authenticated
  using (
    sender_id = auth.uid()
    or receiver_id = auth.uid()
    or public.paddlio_is_admin_415()
    or public.current_user_is_admin()
  )
  with check (
    sender_id = auth.uid()
    or receiver_id = auth.uid()
    or public.paddlio_is_admin_415()
    or public.current_user_is_admin()
  );

create policy direct_messages_delete_0025
  on public.direct_messages
  for delete
  to authenticated
  using (
    sender_id = auth.uid()
    or public.paddlio_is_admin_415()
    or public.current_user_is_admin()
  );

create index if not exists idx_direct_messages_sender_receiver_0025
  on public.direct_messages(sender_id, receiver_id, created_at desc)
  where deleted_at is null;

create index if not exists idx_direct_messages_receiver_sender_0025
  on public.direct_messages(receiver_id, sender_id, created_at desc)
  where deleted_at is null;
-- END SOURCE 0025_messages_feedback_visibility_fix.sql

-- BEGIN SOURCE 0026_academy_module.sql
-- Paddlio 5.0 Academy module
-- Idempotent migration for an existing Supabase database.
-- No destructive changes. No table drops. No data resets.

create extension if not exists pgcrypto;

create table if not exists public.academy_categories (
  id text primary key,
  slug text not null unique,
  title text not null,
  description text not null default '',
  icon text not null default '',
  color text not null default '#4bd8ff',
  sort_order integer not null default 0,
  target_groups text[] not null default '{}',
  subcategories text[] not null default '{}',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.academy_courses (
  id text primary key,
  category_id text references public.academy_categories(id) on delete set null,
  title text not null,
  description text not null default '',
  target_group text not null default '',
  difficulty text not null default 'beginner',
  estimated_minutes integer not null default 0,
  cover_image text,
  status text not null default 'draft',
  club_id text,
  created_by text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.academy_lessons (
  id text primary key,
  course_id text references public.academy_courses(id) on delete cascade,
  category_id text references public.academy_categories(id) on delete set null,
  slug text not null,
  title text not null,
  summary text not null default '',
  estimated_minutes integer not null default 0,
  lesson_type text not null default 'technique',
  difficulty text not null default 'beginner',
  boat_classes text[] not null default '{}',
  age_groups text[] not null default '{}',
  status text not null default 'draft',
  sort_order integer not null default 0,
  linked_training_template_ids text[] not null default '{}',
  club_id text,
  created_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.academy_content_blocks (
  id text primary key,
  lesson_id text not null references public.academy_lessons(id) on delete cascade,
  block_type text not null,
  title text,
  content text not null default '',
  items text[] not null default '{}',
  media_id text,
  metadata jsonb not null default '{}'::jsonb,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.academy_learning_paths (
  id text primary key,
  title text not null,
  description text not null default '',
  target_group text not null default '',
  badge text,
  club_id text,
  created_by text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.academy_learning_path_items (
  id text primary key,
  learning_path_id text not null references public.academy_learning_paths(id) on delete cascade,
  lesson_id text references public.academy_lessons(id) on delete cascade,
  course_id text references public.academy_courses(id) on delete cascade,
  sort_order integer not null default 0,
  is_required boolean not null default false
);

create table if not exists public.academy_progress (
  id text primary key,
  user_id text not null,
  lesson_id text not null references public.academy_lessons(id) on delete cascade,
  status text not null default 'not_started',
  progress_percent integer not null default 0,
  last_position text not null default '',
  started_at timestamptz,
  completed_at timestamptz,
  updated_at timestamptz not null default now(),
  unique (user_id, lesson_id)
);

create table if not exists public.academy_assignments (
  id text primary key,
  assigned_by text not null,
  assigned_to text,
  group_id text,
  lesson_id text references public.academy_lessons(id) on delete cascade,
  course_id text references public.academy_courses(id) on delete cascade,
  due_date date,
  status text not null default 'open',
  note text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.academy_quizzes (
  id text primary key,
  lesson_id text not null references public.academy_lessons(id) on delete cascade,
  title text not null,
  passing_score integer not null default 1
);

create table if not exists public.academy_quiz_questions (
  id text primary key,
  quiz_id text not null references public.academy_quizzes(id) on delete cascade,
  question_type text not null,
  question text not null,
  answers jsonb not null default '[]'::jsonb,
  correct_answer jsonb not null default 'null'::jsonb,
  explanation text not null default '',
  sort_order integer not null default 0
);

create table if not exists public.academy_quiz_attempts (
  id text primary key,
  quiz_id text not null references public.academy_quizzes(id) on delete cascade,
  user_id text not null,
  score integer not null default 0,
  answers jsonb not null default '{}'::jsonb,
  completed_at timestamptz not null default now()
);

create table if not exists public.academy_favorites (
  id text primary key,
  user_id text not null,
  lesson_id text not null references public.academy_lessons(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, lesson_id)
);

create table if not exists public.academy_media (
  id text primary key,
  title text not null,
  media_type text not null,
  storage_path text,
  external_url text,
  thumbnail_path text,
  duration_seconds integer,
  source text,
  copyright_status text not null default 'pending',
  club_id text,
  created_by text,
  created_at timestamptz not null default now()
);

alter table if exists public.training_templates
  add column if not exists academy_lesson_id text;

create index if not exists academy_courses_category_idx on public.academy_courses(category_id);
create index if not exists academy_lessons_course_idx on public.academy_lessons(course_id);
create index if not exists academy_lessons_category_idx on public.academy_lessons(category_id);
create index if not exists academy_content_blocks_lesson_idx on public.academy_content_blocks(lesson_id);
create index if not exists academy_progress_user_idx on public.academy_progress(user_id);
create index if not exists academy_assignments_assigned_to_idx on public.academy_assignments(assigned_to);
create index if not exists academy_favorites_user_idx on public.academy_favorites(user_id);

alter table public.academy_categories enable row level security;
alter table public.academy_courses enable row level security;
alter table public.academy_lessons enable row level security;
alter table public.academy_content_blocks enable row level security;
alter table public.academy_learning_paths enable row level security;
alter table public.academy_learning_path_items enable row level security;
alter table public.academy_progress enable row level security;
alter table public.academy_assignments enable row level security;
alter table public.academy_quizzes enable row level security;
alter table public.academy_quiz_questions enable row level security;
alter table public.academy_quiz_attempts enable row level security;
alter table public.academy_favorites enable row level security;
alter table public.academy_media enable row level security;

drop policy if exists "academy content readable" on public.academy_categories;
create policy "academy content readable" on public.academy_categories
  for select to authenticated
  using (is_active = true);

drop policy if exists "academy courses readable" on public.academy_courses;
create policy "academy courses readable" on public.academy_courses
  for select to authenticated
  using (status in ('draft', 'review', 'published') and (club_id is null or club_id = ''));

drop policy if exists "academy lessons readable" on public.academy_lessons;
create policy "academy lessons readable" on public.academy_lessons
  for select to authenticated
  using (status in ('draft', 'review', 'published') and (club_id is null or club_id = ''));

drop policy if exists "academy blocks readable" on public.academy_content_blocks;
create policy "academy blocks readable" on public.academy_content_blocks
  for select to authenticated
  using (
    exists (
      select 1 from public.academy_lessons l
      where l.id = academy_content_blocks.lesson_id
      and l.status in ('draft', 'review', 'published')
    )
  );

drop policy if exists "academy paths readable" on public.academy_learning_paths;
create policy "academy paths readable" on public.academy_learning_paths
  for select to authenticated
  using (is_active = true and (club_id is null or club_id = ''));

drop policy if exists "academy path items readable" on public.academy_learning_path_items;
create policy "academy path items readable" on public.academy_learning_path_items
  for select to authenticated
  using (true);

drop policy if exists "academy quizzes readable" on public.academy_quizzes;
create policy "academy quizzes readable" on public.academy_quizzes
  for select to authenticated
  using (true);

drop policy if exists "academy quiz questions readable" on public.academy_quiz_questions;
create policy "academy quiz questions readable" on public.academy_quiz_questions
  for select to authenticated
  using (true);

drop policy if exists "academy media readable" on public.academy_media;
create policy "academy media readable" on public.academy_media
  for select to authenticated
  using (club_id is null or club_id = '');

drop policy if exists "academy own progress read" on public.academy_progress;
create policy "academy own progress read" on public.academy_progress
  for select to authenticated
  using (user_id = auth.uid()::text);

drop policy if exists "academy own progress write" on public.academy_progress;
create policy "academy own progress write" on public.academy_progress
  for insert to authenticated
  with check (user_id = auth.uid()::text);

drop policy if exists "academy own progress update" on public.academy_progress;
create policy "academy own progress update" on public.academy_progress
  for update to authenticated
  using (user_id = auth.uid()::text)
  with check (user_id = auth.uid()::text);

drop policy if exists "academy own favorites read" on public.academy_favorites;
create policy "academy own favorites read" on public.academy_favorites
  for select to authenticated
  using (user_id = auth.uid()::text);

drop policy if exists "academy own favorites write" on public.academy_favorites;
create policy "academy own favorites write" on public.academy_favorites
  for insert to authenticated
  with check (user_id = auth.uid()::text);

drop policy if exists "academy own favorites delete" on public.academy_favorites;
create policy "academy own favorites delete" on public.academy_favorites
  for delete to authenticated
  using (user_id = auth.uid()::text);

drop policy if exists "academy own quiz attempts read" on public.academy_quiz_attempts;
create policy "academy own quiz attempts read" on public.academy_quiz_attempts
  for select to authenticated
  using (user_id = auth.uid()::text);

drop policy if exists "academy own quiz attempts write" on public.academy_quiz_attempts;
create policy "academy own quiz attempts write" on public.academy_quiz_attempts
  for insert to authenticated
  with check (user_id = auth.uid()::text);

drop policy if exists "academy assignments read" on public.academy_assignments;
create policy "academy assignments read" on public.academy_assignments
  for select to authenticated
  using (assigned_to = auth.uid()::text or assigned_by = auth.uid()::text);

drop policy if exists "academy assignments write" on public.academy_assignments;
create policy "academy assignments write" on public.academy_assignments
  for insert to authenticated
  with check (assigned_by = auth.uid()::text);

drop policy if exists "academy assignments update" on public.academy_assignments;
create policy "academy assignments update" on public.academy_assignments
  for update to authenticated
  using (assigned_to = auth.uid()::text or assigned_by = auth.uid()::text)
  with check (assigned_to = auth.uid()::text or assigned_by = auth.uid()::text);
-- END SOURCE 0026_academy_module.sql

-- BEGIN SOURCE 0031_role_rls_beta_hardening.sql
-- Paddlio 5.0 beta RLS hardening
-- Idempotent security patch for existing databases.
-- No table drops. No data resets.

create or replace function public.paddlio_is_admin_0031()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and coalesce(p.status, 'active') = 'active'
      and (
        p.primary_role = 'Admin'
        or p.roles && array['Admin']::text[]
        or lower(coalesce(p.email, '')) = 't.kanu@outlook.com'
      )
  );
$$;

create or replace function public.paddlio_user_has_club_role_0031(target_club_id text, allowed_roles text[])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.paddlio_is_admin_0031()
    or (
      target_club_id is not null
      and target_club_id <> ''
      and (
        exists (
          select 1
          from public.profiles p
          where p.id = auth.uid()
            and coalesce(p.status, 'active') = 'active'
            and (
              p.club_id::text = target_club_id
              or p.active_club_id::text = target_club_id
            )
            and p.roles && allowed_roles
        )
        or exists (
          select 1
          from public.club_memberships cm
          where cm.user_id = auth.uid()
            and cm.club_id::text = target_club_id
            and cm.status = 'active'
            and cm.role = any(allowed_roles)
        )
      )
    );
$$;

create or replace function public.paddlio_can_read_academy_course_0031(course_id text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.academy_courses c
    where c.id = course_id
      and (
        (
          c.status = 'published'
          and (
            c.club_id is null
            or c.club_id = ''
            or public.paddlio_user_has_club_role_0031(c.club_id, array['Athlete','Coach','TeamAdmin','ClubAdmin','Admin'])
          )
        )
        or c.created_by = auth.uid()::text
        or public.paddlio_user_has_club_role_0031(c.club_id, array['Coach','TeamAdmin','ClubAdmin','Admin'])
      )
  );
$$;

create or replace function public.paddlio_can_read_academy_lesson_0031(lesson_id text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.academy_lessons l
    where l.id = lesson_id
      and (
        (
          l.status = 'published'
          and (
            l.club_id is null
            or l.club_id = ''
            or public.paddlio_user_has_club_role_0031(l.club_id, array['Athlete','Coach','TeamAdmin','ClubAdmin','Admin'])
          )
        )
        or l.created_by = auth.uid()::text
        or public.paddlio_user_has_club_role_0031(l.club_id, array['Coach','TeamAdmin','ClubAdmin','Admin'])
        or (
          l.course_id is not null
          and public.paddlio_can_read_academy_course_0031(l.course_id)
        )
      )
  );
$$;

drop policy if exists "competitions_authenticated_select" on public.competitions;

drop policy if exists "academy courses readable" on public.academy_courses;
create policy "academy courses readable"
  on public.academy_courses
  for select
  to authenticated
  using (public.paddlio_can_read_academy_course_0031(id));

drop policy if exists "academy lessons readable" on public.academy_lessons;
create policy "academy lessons readable"
  on public.academy_lessons
  for select
  to authenticated
  using (public.paddlio_can_read_academy_lesson_0031(id));

drop policy if exists "academy blocks readable" on public.academy_content_blocks;
create policy "academy blocks readable"
  on public.academy_content_blocks
  for select
  to authenticated
  using (public.paddlio_can_read_academy_lesson_0031(lesson_id));

drop policy if exists "academy paths readable" on public.academy_learning_paths;
create policy "academy paths readable"
  on public.academy_learning_paths
  for select
  to authenticated
  using (
    is_active = true
    and (
      club_id is null
      or club_id = ''
      or public.paddlio_user_has_club_role_0031(club_id, array['Athlete','Coach','TeamAdmin','ClubAdmin','Admin'])
    )
  );

drop policy if exists "academy path items readable" on public.academy_learning_path_items;
create policy "academy path items readable"
  on public.academy_learning_path_items
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.academy_learning_paths p
      where p.id = academy_learning_path_items.learning_path_id
        and p.is_active = true
        and (
          p.club_id is null
          or p.club_id = ''
          or public.paddlio_user_has_club_role_0031(p.club_id, array['Athlete','Coach','TeamAdmin','ClubAdmin','Admin'])
        )
    )
    and (
      lesson_id is null
      or public.paddlio_can_read_academy_lesson_0031(lesson_id)
    )
    and (
      course_id is null
      or public.paddlio_can_read_academy_course_0031(course_id)
    )
  );

drop policy if exists "academy quizzes readable" on public.academy_quizzes;
create policy "academy quizzes readable"
  on public.academy_quizzes
  for select
  to authenticated
  using (public.paddlio_can_read_academy_lesson_0031(lesson_id));

drop policy if exists "academy quiz questions readable" on public.academy_quiz_questions;
create policy "academy quiz questions readable"
  on public.academy_quiz_questions
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.academy_quizzes q
      where q.id = academy_quiz_questions.quiz_id
        and public.paddlio_can_read_academy_lesson_0031(q.lesson_id)
    )
  );

drop policy if exists "academy media readable" on public.academy_media;
create policy "academy media readable"
  on public.academy_media
  for select
  to authenticated
  using (
    club_id is null
    or club_id = ''
    or public.paddlio_user_has_club_role_0031(club_id, array['Athlete','Coach','TeamAdmin','ClubAdmin','Admin'])
  );
-- END SOURCE 0031_role_rls_beta_hardening.sql

-- BEGIN SOURCE 0037_training_attendance_delete_permissions.sql
-- Athletes may answer and update their own attendance, while deletion of an
-- attendance set is reserved for trainer/admin roles in the same club.

drop policy if exists "training_attendance_scope_write" on public.training_attendance;
drop policy if exists "training_attendance_own" on public.training_attendance;
drop policy if exists "training_attendance_insert" on public.training_attendance;
drop policy if exists "training_attendance_update" on public.training_attendance;
drop policy if exists "training_attendance_delete" on public.training_attendance;

create policy "training_attendance_insert"
on public.training_attendance for insert to authenticated
with check (
  athlete_id = auth.uid()
  or public.is_admin()
  or (club_id = public.current_user_club_id() and (public.has_role('Coach') or public.has_role('ClubAdmin') or public.has_role('TeamAdmin')))
);

create policy "training_attendance_update"
on public.training_attendance for update to authenticated
using (
  athlete_id = auth.uid()
  or public.is_admin()
  or (club_id = public.current_user_club_id() and (public.has_role('Coach') or public.has_role('ClubAdmin') or public.has_role('TeamAdmin')))
)
with check (
  athlete_id = auth.uid()
  or public.is_admin()
  or (club_id = public.current_user_club_id() and (public.has_role('Coach') or public.has_role('ClubAdmin') or public.has_role('TeamAdmin')))
);

create policy "training_attendance_delete"
on public.training_attendance for delete to authenticated
using (
  (
    public.is_admin()
    or (club_id = public.current_user_club_id() and (public.has_role('Coach') or public.has_role('ClubAdmin') or public.has_role('TeamAdmin')))
  )
  and exists (
    select 1
    from public.training_plan_items training
    where training.id = training_attendance.training_id
      and (
        training.date
        + coalesce(
          training.end_time,
          training.start_time + make_interval(mins => greatest(training.duration_minutes, 0)),
          time '23:59'
        )
      ) < localtimestamp
  )
);
-- END SOURCE 0037_training_attendance_delete_permissions.sql

-- BEGIN SOURCE 0021_realtime_publication_full_sync_415.sql
-- Paddlio 4.1.5 - Full realtime publication sync
-- Safe, idempotent and non-destructive.
-- Run this in Supabase SQL Editor if live updates do not appear across devices.

do $$
declare
  table_name text;
  realtime_tables text[] := array[
    'profiles',
    'clubs',
    'club_memberships',
    'training_groups',
    'group_members',
    'group_memberships',
    'training_plan_items',
    'training_feedback',
    'training_journal_entries',
    'training_templates',
    'season_goals',
    'competitions',
    'competition_results',
    'materials',
    'notifications',
    'smart_coach_recommendations',
    'personal_bests',
    'result_imports',
    'external_connections',
    'external_training_sessions',
    'beta_readiness_checks',
    'beta_feedback',
    'beta_testers',
    'club_material',
    'boats',
    'club_events',
    'club_documents',
    'club_messages',
    'club_settings',
    'direct_messages',
    'group_messages',
    'club_posts',
    'tasks',
    'task_assignments',
    'training_attendance',
    'file_attachments',
    'trainer_requests',
    'club_requests'
  ];
begin
  if not exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    raise notice 'Publication supabase_realtime does not exist. Supabase Realtime may be disabled for this project.';
    return;
  end if;

  foreach table_name in array realtime_tables loop
    if to_regclass(format('public.%I', table_name)) is not null then
      if not exists (
        select 1
        from pg_publication_tables
        where pubname = 'supabase_realtime'
          and schemaname = 'public'
          and tablename = table_name
      ) then
        execute format('alter publication supabase_realtime add table public.%I', table_name);
      end if;

      execute format('alter table public.%I replica identity full', table_name);
    else
      raise notice 'Skipping missing table public.%', table_name;
    end if;
  end loop;
end $$;
-- END SOURCE 0021_realtime_publication_full_sync_415.sql

-- Competition columns used by the current read/write service. The legacy 0012
-- policies are intentionally not replayed because DEV already uses UUID ids.
alter table public.competitions
  add column if not exists user_id uuid references public.profiles(id) on delete set null,
  add column if not exists created_by uuid references public.profiles(id) on delete set null;

alter table public.competition_results
  add column if not exists club_id uuid references public.clubs(id) on delete set null,
  add column if not exists competition_name text,
  add column if not exists competition_date date,
  add column if not exists location text,
  add column if not exists course_name text,
  add column if not exists run1_time numeric,
  add column if not exists run1_penalties integer default 0,
  add column if not exists run1_total numeric,
  add column if not exists run2_time numeric,
  add column if not exists run2_penalties integer default 0,
  add column if not exists run2_total numeric,
  add column if not exists best_total numeric,
  add column if not exists created_by uuid references public.profiles(id) on delete set null;

create index if not exists idx_competitions_user_start_date_0043
  on public.competitions(user_id, start_date desc);
create index if not exists idx_competitions_created_by_0043
  on public.competitions(created_by);

alter table public.competitions enable row level security;
alter table public.competition_results enable row level security;

drop policy if exists competitions_select_own_club_admin_0043 on public.competitions;
create policy competitions_select_own_club_admin_0043 on public.competitions for select to authenticated
using (
  user_id = auth.uid() or created_by = auth.uid() or public.paddlio_is_admin_415()
  or (club_id is not null and public.paddlio_user_has_club_role_0024(club_id, array['Coach','ClubAdmin','Admin']))
);

drop policy if exists competitions_write_own_club_admin_0043 on public.competitions;
create policy competitions_write_own_club_admin_0043 on public.competitions for all to authenticated
using (
  user_id = auth.uid() or created_by = auth.uid() or public.paddlio_is_admin_415()
  or (club_id is not null and public.paddlio_user_has_club_role_0024(club_id, array['Coach','ClubAdmin','Admin']))
)
with check (
  user_id = auth.uid() or created_by = auth.uid() or public.paddlio_is_admin_415()
  or (club_id is not null and public.paddlio_user_has_club_role_0024(club_id, array['Coach','ClubAdmin','Admin']))
);

drop policy if exists competition_results_select_own_club_admin_0043 on public.competition_results;
create policy competition_results_select_own_club_admin_0043 on public.competition_results for select to authenticated
using (
  athlete_id = auth.uid() or created_by = auth.uid() or public.paddlio_is_admin_415()
  or (club_id is not null and public.paddlio_user_has_club_role_0024(club_id, array['Coach','ClubAdmin','Admin']))
);

drop policy if exists competition_results_write_own_club_admin_0043 on public.competition_results;
create policy competition_results_write_own_club_admin_0043 on public.competition_results for all to authenticated
using (
  athlete_id = auth.uid() or created_by = auth.uid() or public.paddlio_is_admin_415()
  or (club_id is not null and public.paddlio_user_has_club_role_0024(club_id, array['Coach','ClubAdmin','Admin']))
)
with check (
  athlete_id = auth.uid() or created_by = auth.uid() or public.paddlio_is_admin_415()
  or (club_id is not null and public.paddlio_user_has_club_role_0024(club_id, array['Coach','ClubAdmin','Admin']))
);

notify pgrst, 'reload schema';
