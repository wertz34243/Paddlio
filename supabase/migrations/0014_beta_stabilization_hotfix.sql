-- Paddlio 4.1.1 Beta Stabilization Hotfix
-- Idempotent optional schema repair. Safe to run multiple times.

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

create or replace function public.current_profile_roles()
returns text[]
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select roles from public.profiles where id = auth.uid()), array['Athlete']::text[]);
$$;

create or replace function public.current_user_is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_profile_roles() && array['Admin']::text[];
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

create table if not exists public.smart_coach_recommendations (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid references public.profiles(id) on delete cascade,
  created_for_user_id uuid references public.profiles(id) on delete cascade,
  created_by_system boolean default true,
  club_id uuid references public.clubs(id) on delete set null,
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
  updated_at timestamptz default now()
);

create table if not exists public.club_material (
  id uuid primary key default gen_random_uuid(),
  club_id uuid references public.clubs(id) on delete cascade,
  name text not null default '',
  category text not null default 'Vereinsmaterial',
  inventory_number text,
  condition text,
  owner_id uuid references public.profiles(id) on delete set null,
  photo_url text,
  last_check date,
  note text,
  status text not null default 'active',
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted_at timestamptz
);

create table if not exists public.boats (
  id uuid primary key default gen_random_uuid(),
  club_id uuid references public.clubs(id) on delete set null,
  owner_id uuid references public.profiles(id) on delete set null,
  manufacturer text,
  model text,
  boat_class text,
  length_cm numeric,
  weight_kg numeric,
  build_year integer,
  is_club_boat boolean default false,
  status text not null default 'active',
  note text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted_at timestamptz
);

create table if not exists public.club_events (
  id uuid primary key default gen_random_uuid(),
  club_id uuid references public.clubs(id) on delete cascade,
  title text not null default '',
  category text not null default 'organization',
  starts_at timestamptz,
  ends_at timestamptz,
  location text,
  description text,
  group_id uuid references public.training_groups(id) on delete set null,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted_at timestamptz
);

create table if not exists public.club_messages (
  id uuid primary key default gen_random_uuid(),
  club_id uuid references public.clubs(id) on delete cascade,
  sender_id uuid references public.profiles(id) on delete set null,
  title text not null default '',
  message text not null default '',
  target_type text not null default 'club',
  target_group_id uuid references public.training_groups(id) on delete set null,
  target_user_id uuid references public.profiles(id) on delete cascade,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted_at timestamptz
);

create table if not exists public.direct_messages (
  id uuid primary key default gen_random_uuid(),
  club_id uuid references public.clubs(id) on delete set null,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  receiver_id uuid not null references public.profiles(id) on delete cascade,
  message text not null,
  is_read boolean default false,
  read_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted_at timestamptz
);

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  club_id uuid references public.clubs(id) on delete cascade,
  created_by uuid references public.profiles(id) on delete set null,
  title text not null default '',
  description text,
  task_type text default 'general',
  priority text default 'normal',
  due_date date,
  related_training_id uuid references public.training_plan_items(id) on delete set null,
  related_competition_id uuid references public.competitions(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted_at timestamptz
);

create table if not exists public.task_assignments (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  assigned_to uuid not null references public.profiles(id) on delete cascade,
  status text default 'open',
  completed_at timestamptz,
  response_note text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.training_attendance (
  id uuid primary key default gen_random_uuid(),
  training_id uuid not null references public.training_plan_items(id) on delete cascade,
  athlete_id uuid not null references public.profiles(id) on delete cascade,
  club_id uuid references public.clubs(id) on delete set null,
  group_id uuid references public.training_groups(id) on delete set null,
  status text default 'pending',
  reason text,
  note text,
  responded_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(training_id, athlete_id)
);

create table if not exists public.file_attachments (
  id uuid primary key default gen_random_uuid(),
  club_id uuid references public.clubs(id) on delete set null,
  owner_id uuid not null references public.profiles(id) on delete cascade,
  related_type text not null,
  related_id uuid not null,
  file_name text not null,
  file_path text not null,
  file_type text,
  file_size bigint,
  created_at timestamptz default now(),
  deleted_at timestamptz
);

create table if not exists public.beta_feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  club_id uuid references public.clubs(id) on delete set null,
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
  updated_at timestamptz default now()
);

create table if not exists public.beta_testers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  club_id uuid references public.clubs(id) on delete set null,
  tester_type text default 'athlete',
  status text default 'active',
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id)
);

alter table if exists public.competitions add column if not exists organizer text;

alter table public.smart_coach_recommendations enable row level security;
alter table public.club_material enable row level security;
alter table public.boats enable row level security;
alter table public.club_events enable row level security;
alter table public.club_messages enable row level security;
alter table public.direct_messages enable row level security;
alter table public.tasks enable row level security;
alter table public.task_assignments enable row level security;
alter table public.training_attendance enable row level security;
alter table public.file_attachments enable row level security;
alter table public.beta_feedback enable row level security;
alter table public.beta_testers enable row level security;

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'smart_coach_recommendations',
    'club_material',
    'boats',
    'club_events',
    'club_messages',
    'direct_messages',
    'tasks',
    'task_assignments',
    'training_attendance',
    'file_attachments',
    'beta_feedback',
    'beta_testers'
  ]
  loop
    if not exists (
      select 1 from pg_policies
      where schemaname = 'public'
        and tablename = table_name
        and policyname = table_name || '_admin_all'
    ) then
      execute format('create policy %I on public.%I for all using (public.current_user_is_admin()) with check (public.current_user_is_admin())', table_name || '_admin_all', table_name);
    end if;
  end loop;
end $$;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'direct_messages' and policyname = 'direct_messages_own_read') then
    create policy direct_messages_own_read on public.direct_messages
      for select using (sender_id = auth.uid() or receiver_id = auth.uid() or public.current_user_is_admin());
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'direct_messages' and policyname = 'direct_messages_own_insert') then
    create policy direct_messages_own_insert on public.direct_messages
      for insert with check (sender_id = auth.uid() or public.current_user_is_admin());
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'training_attendance' and policyname = 'training_attendance_own') then
    create policy training_attendance_own on public.training_attendance
      for all using (athlete_id = auth.uid() or club_id = public.current_user_club_id() or public.current_user_is_admin())
      with check (athlete_id = auth.uid() or club_id = public.current_user_club_id() or public.current_user_is_admin());
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'tasks' and policyname = 'tasks_club_read') then
    create policy tasks_club_read on public.tasks
      for select using (club_id = public.current_user_club_id() or created_by = auth.uid() or public.current_user_is_admin());
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'task_assignments' and policyname = 'task_assignments_own_or_club') then
    create policy task_assignments_own_or_club on public.task_assignments
      for select using (
        assigned_to = auth.uid()
        or exists (
          select 1 from public.tasks t
          where t.id = task_id and t.club_id = public.current_user_club_id()
        )
        or public.current_user_is_admin()
      );
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'beta_feedback' and policyname = 'beta_feedback_own_insert_read') then
    create policy beta_feedback_own_insert_read on public.beta_feedback
      for all using (user_id = auth.uid() or public.current_user_is_admin())
      with check (user_id = auth.uid() or public.current_user_is_admin());
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'smart_coach_recommendations' and policyname = 'smart_coach_owner_or_club') then
    create policy smart_coach_owner_or_club on public.smart_coach_recommendations
      for all using (created_for_user_id = auth.uid() or owner_user_id = auth.uid() or club_id = public.current_user_club_id() or public.current_user_is_admin())
      with check (created_for_user_id = auth.uid() or owner_user_id = auth.uid() or club_id = public.current_user_club_id() or public.current_user_is_admin());
  end if;
end $$;

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'smart_coach_recommendations',
    'club_material',
    'boats',
    'club_events',
    'club_messages',
    'direct_messages',
    'tasks',
    'task_assignments',
    'training_attendance',
    'beta_feedback',
    'beta_testers'
  ]
  loop
    if exists (
      select 1 from information_schema.columns
      where table_schema = 'public' and table_name = table_name and column_name = 'updated_at'
    ) then
      execute format('drop trigger if exists set_%I_updated_at on public.%I', table_name, table_name);
      execute format('create trigger set_%I_updated_at before update on public.%I for each row execute function public.set_updated_at()', table_name, table_name);
    end if;
  end loop;
end $$;
