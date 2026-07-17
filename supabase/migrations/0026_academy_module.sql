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
