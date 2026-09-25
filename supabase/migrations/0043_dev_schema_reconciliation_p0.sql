-- Paddlio DEV P0 schema reconciliation.
-- Bundles repository-defined active modules missing from paddlio-dev.
-- Additive/idempotent source migrations only; no tables or user data are deleted.

-- BEGIN SOURCE 0010_club_management_portal.sql
do $$
begin
  alter table public.profiles drop constraint if exists profiles_roles_check;
  alter table public.profiles add constraint profiles_roles_check
    check (roles <@ array['Athlete', 'Coach', 'TeamAdmin', 'ClubAdmin', 'Admin']::text[]);
exception when duplicate_object then null;
end $$;

create or replace function public.is_club_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.has_role('ClubAdmin') or public.has_role('TeamAdmin') or public.is_admin();
$$;

create or replace function public.can_manage_own_club(target_club_id text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_admin()
    or (
      target_club_id is not null
      and target_club_id = public.current_user_club_id()::text
      and (public.has_role('Coach') or public.has_role('TeamAdmin') or public.has_role('ClubAdmin'))
    );
$$;

create table if not exists public.club_material (
  id text primary key,
  club_id text not null,
  inventory_number text,
  category text not null,
  name text not null,
  condition text,
  owner_user_id text,
  owner_name text,
  photo_url text,
  last_inspection_date date,
  remark text,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint club_material_status_check check (status in ('active', 'inactive'))
);

create table if not exists public.boats (
  id text primary key,
  club_id text not null,
  manufacturer text,
  model text,
  boat_class text not null default 'K1',
  length_cm numeric,
  weight_kg numeric,
  build_year integer,
  owner_user_id text,
  owner_name text,
  is_club_boat boolean not null default true,
  linked_athlete_ids text[] not null default array[]::text[],
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint boats_status_check check (status in ('active', 'inactive')),
  constraint boats_class_check check (boat_class in ('K1', 'C1', 'C2', 'Mannschaft'))
);

create table if not exists public.club_events (
  id text primary key,
  club_id text not null,
  title text not null,
  date date not null,
  time time,
  category text not null default 'training',
  group_id text,
  trainer_user_id text,
  athlete_user_id text,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint club_events_category_check check (category in ('training', 'competition', 'meeting', 'club_party', 'workday'))
);

create table if not exists public.club_documents (
  id text primary key,
  club_id text not null,
  folder text not null default 'Formulare',
  title text not null,
  file_name text,
  file_url text,
  mime_type text,
  visible_for_roles text[] not null default array['Coach', 'TeamAdmin', 'ClubAdmin', 'Admin']::text[],
  uploaded_by_user_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint club_documents_folder_check check (folder in ('Trainer', 'Sportler', 'Vorstand', 'Wettkaempfe', 'Formulare'))
);

create table if not exists public.club_messages (
  id text primary key,
  club_id text not null,
  sender_user_id text not null,
  audience text not null default 'club',
  group_id text,
  recipient_user_id text,
  title text not null,
  body text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint club_messages_audience_check check (audience in ('club', 'coaches', 'athletes', 'group', 'athlete'))
);

create table if not exists public.club_settings (
  club_id text primary key,
  logo_url text,
  primary_color text,
  secondary_color text,
  address text,
  homepage text,
  contact_name text,
  contact_email text,
  club_number text,
  imprint text,
  updated_at timestamptz not null default now()
);

create index if not exists club_material_club_id_idx on public.club_material(club_id);
create index if not exists boats_club_id_idx on public.boats(club_id);
create index if not exists club_events_club_id_date_idx on public.club_events(club_id, date);
create index if not exists club_documents_club_id_idx on public.club_documents(club_id);
create index if not exists club_messages_club_id_idx on public.club_messages(club_id);

drop trigger if exists club_material_updated_at on public.club_material;
create trigger club_material_updated_at before update on public.club_material for each row execute function public.set_updated_at();
drop trigger if exists boats_updated_at on public.boats;
create trigger boats_updated_at before update on public.boats for each row execute function public.set_updated_at();
drop trigger if exists club_events_updated_at on public.club_events;
create trigger club_events_updated_at before update on public.club_events for each row execute function public.set_updated_at();
drop trigger if exists club_documents_updated_at on public.club_documents;
create trigger club_documents_updated_at before update on public.club_documents for each row execute function public.set_updated_at();
drop trigger if exists club_messages_updated_at on public.club_messages;
create trigger club_messages_updated_at before update on public.club_messages for each row execute function public.set_updated_at();
drop trigger if exists club_settings_updated_at on public.club_settings;
create trigger club_settings_updated_at before update on public.club_settings for each row execute function public.set_updated_at();

alter table public.club_material enable row level security;
alter table public.boats enable row level security;
alter table public.club_events enable row level security;
alter table public.club_documents enable row level security;
alter table public.club_messages enable row level security;
alter table public.club_settings enable row level security;

drop policy if exists "club_material_read" on public.club_material;
create policy "club_material_read" on public.club_material for select to authenticated using (public.can_manage_own_club(club_id));
drop policy if exists "club_material_write" on public.club_material;
create policy "club_material_write" on public.club_material for all to authenticated using (public.can_manage_own_club(club_id)) with check (public.can_manage_own_club(club_id));

drop policy if exists "boats_read" on public.boats;
create policy "boats_read" on public.boats for select to authenticated using (public.can_manage_own_club(club_id));
drop policy if exists "boats_write" on public.boats;
create policy "boats_write" on public.boats for all to authenticated using (public.can_manage_own_club(club_id)) with check (public.can_manage_own_club(club_id));

drop policy if exists "club_events_read" on public.club_events;
create policy "club_events_read" on public.club_events for select to authenticated using (public.can_manage_own_club(club_id));
drop policy if exists "club_events_write" on public.club_events;
create policy "club_events_write" on public.club_events for all to authenticated using (public.can_manage_own_club(club_id)) with check (public.can_manage_own_club(club_id));

drop policy if exists "club_documents_read" on public.club_documents;
create policy "club_documents_read" on public.club_documents for select to authenticated using (public.can_manage_own_club(club_id));
drop policy if exists "club_documents_write" on public.club_documents;
create policy "club_documents_write" on public.club_documents for all to authenticated using (public.is_club_admin() and public.can_manage_own_club(club_id)) with check (public.is_club_admin() and public.can_manage_own_club(club_id));

drop policy if exists "club_messages_read" on public.club_messages;
create policy "club_messages_read" on public.club_messages for select to authenticated using (public.can_manage_own_club(club_id));
drop policy if exists "club_messages_write" on public.club_messages;
create policy "club_messages_write" on public.club_messages for all to authenticated using (public.can_manage_own_club(club_id)) with check (public.can_manage_own_club(club_id));

drop policy if exists "club_settings_read" on public.club_settings;
create policy "club_settings_read" on public.club_settings for select to authenticated using (public.can_manage_own_club(club_id));
drop policy if exists "club_settings_write" on public.club_settings;
create policy "club_settings_write" on public.club_settings for all to authenticated using (public.is_club_admin() and public.can_manage_own_club(club_id)) with check (public.is_club_admin() and public.can_manage_own_club(club_id));
-- END SOURCE 0010_club_management_portal.sql

-- BEGIN SOURCE 0011_communication_team_system.sql
create table if not exists public.direct_messages (
  id uuid primary key default gen_random_uuid(),
  club_id uuid references public.clubs(id) on delete set null,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  receiver_id uuid not null references public.profiles(id) on delete cascade,
  message text not null,
  is_read boolean not null default false,
  read_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.group_messages (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.clubs(id) on delete cascade,
  group_id uuid not null references public.training_groups(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  message text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.club_posts (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.clubs(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  content text not null,
  category text not null default 'info',
  priority text not null default 'normal',
  target_type text not null default 'club',
  target_group_id uuid references public.training_groups(id) on delete set null,
  target_user_id uuid references public.profiles(id) on delete set null,
  expires_at timestamptz,
  is_pinned boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint club_posts_category_check check (category in ('info', 'training', 'competition', 'material', 'urgent', 'organization')),
  constraint club_posts_priority_check check (priority in ('normal', 'important', 'urgent')),
  constraint club_posts_target_check check (target_type in ('club', 'coaches', 'group', 'athlete'))
);

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.clubs(id) on delete cascade,
  created_by uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  description text,
  task_type text not null default 'general',
  priority text not null default 'normal',
  due_date date,
  related_training_id uuid references public.training_plan_items(id) on delete set null,
  related_competition_id uuid references public.competitions(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint tasks_type_check check (task_type in ('general', 'technique', 'material', 'video', 'competition', 'training', 'mental', 'recovery')),
  constraint tasks_priority_check check (priority in ('normal', 'important', 'urgent'))
);

create table if not exists public.task_assignments (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  assigned_to uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'open',
  completed_at timestamptz,
  response_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint task_assignments_status_check check (status in ('open', 'in_progress', 'done', 'skipped'))
);

create table if not exists public.training_attendance (
  id uuid primary key default gen_random_uuid(),
  training_id uuid not null references public.training_plan_items(id) on delete cascade,
  athlete_id uuid not null references public.profiles(id) on delete cascade,
  club_id uuid references public.clubs(id) on delete set null,
  group_id uuid references public.training_groups(id) on delete set null,
  status text not null default 'pending',
  reason text,
  note text,
  responded_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(training_id, athlete_id),
  constraint training_attendance_status_check check (status in ('pending', 'attending', 'not_attending', 'unsure'))
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
  created_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint file_attachments_related_type_check check (related_type in ('direct_message', 'group_message', 'club_post', 'task', 'training', 'competition'))
);

create index if not exists direct_messages_sender_idx on public.direct_messages(sender_id);
create index if not exists direct_messages_receiver_idx on public.direct_messages(receiver_id);
create index if not exists group_messages_group_idx on public.group_messages(group_id);
create index if not exists club_posts_club_idx on public.club_posts(club_id);
create index if not exists tasks_club_idx on public.tasks(club_id);
create index if not exists task_assignments_assigned_to_idx on public.task_assignments(assigned_to);
create index if not exists training_attendance_training_idx on public.training_attendance(training_id);
create index if not exists file_attachments_related_idx on public.file_attachments(related_type, related_id);

drop trigger if exists direct_messages_updated_at on public.direct_messages;
create trigger direct_messages_updated_at before update on public.direct_messages for each row execute function public.set_updated_at();
drop trigger if exists group_messages_updated_at on public.group_messages;
create trigger group_messages_updated_at before update on public.group_messages for each row execute function public.set_updated_at();
drop trigger if exists club_posts_updated_at on public.club_posts;
create trigger club_posts_updated_at before update on public.club_posts for each row execute function public.set_updated_at();
drop trigger if exists tasks_updated_at on public.tasks;
create trigger tasks_updated_at before update on public.tasks for each row execute function public.set_updated_at();
drop trigger if exists task_assignments_updated_at on public.task_assignments;
create trigger task_assignments_updated_at before update on public.task_assignments for each row execute function public.set_updated_at();
drop trigger if exists training_attendance_updated_at on public.training_attendance;
create trigger training_attendance_updated_at before update on public.training_attendance for each row execute function public.set_updated_at();

alter table public.direct_messages enable row level security;
alter table public.group_messages enable row level security;
alter table public.club_posts enable row level security;
alter table public.tasks enable row level security;
alter table public.task_assignments enable row level security;
alter table public.training_attendance enable row level security;
alter table public.file_attachments enable row level security;

drop policy if exists "direct_messages_own_read" on public.direct_messages;
create policy "direct_messages_own_read" on public.direct_messages for select to authenticated using (
  deleted_at is null and (sender_id = auth.uid() or receiver_id = auth.uid() or public.is_admin())
);
drop policy if exists "direct_messages_own_write" on public.direct_messages;
create policy "direct_messages_own_write" on public.direct_messages for all to authenticated using (
  sender_id = auth.uid() or receiver_id = auth.uid() or public.is_admin()
) with check (
  sender_id = auth.uid() or public.is_admin()
);

drop policy if exists "group_messages_scope_read" on public.group_messages;
create policy "group_messages_scope_read" on public.group_messages for select to authenticated using (
  deleted_at is null and (
    public.is_admin()
    or exists (select 1 from public.training_groups g where g.id = group_messages.group_id and g.club_id = public.current_user_club_id())
    or exists (select 1 from public.group_members m where m.group_id = group_messages.group_id and m.athlete_id = auth.uid())
  )
);
drop policy if exists "group_messages_scope_write" on public.group_messages;
create policy "group_messages_scope_write" on public.group_messages for all to authenticated using (
  sender_id = auth.uid() or public.is_admin()
) with check (
  sender_id = auth.uid()
  and (
    public.is_admin()
    or exists (select 1 from public.training_groups g where g.id = group_messages.group_id and g.club_id = public.current_user_club_id())
    or exists (select 1 from public.group_members m where m.group_id = group_messages.group_id and m.athlete_id = auth.uid())
  )
);

drop policy if exists "club_posts_scope_read" on public.club_posts;
create policy "club_posts_scope_read" on public.club_posts for select to authenticated using (
  deleted_at is null and (
    public.is_admin()
    or club_id = public.current_user_club_id()
    or target_user_id = auth.uid()
    or exists (select 1 from public.group_members m where m.group_id = club_posts.target_group_id and m.athlete_id = auth.uid())
  )
);
drop policy if exists "club_posts_scope_write" on public.club_posts;
create policy "club_posts_scope_write" on public.club_posts for all to authenticated using (
  public.is_admin() or (club_id = public.current_user_club_id() and (public.has_role('Coach') or public.has_role('ClubAdmin') or public.has_role('TeamAdmin')))
) with check (
  public.is_admin() or (club_id = public.current_user_club_id() and (public.has_role('Coach') or public.has_role('ClubAdmin') or public.has_role('TeamAdmin')))
);

drop policy if exists "tasks_scope_read" on public.tasks;
create policy "tasks_scope_read" on public.tasks for select to authenticated using (
  deleted_at is null and (
    public.is_admin()
    or created_by = auth.uid()
    or club_id = public.current_user_club_id()
    or exists (select 1 from public.task_assignments a where a.task_id = tasks.id and a.assigned_to = auth.uid())
  )
);
drop policy if exists "tasks_scope_write" on public.tasks;
create policy "tasks_scope_write" on public.tasks for all to authenticated using (
  public.is_admin() or created_by = auth.uid() or (club_id = public.current_user_club_id() and (public.has_role('Coach') or public.has_role('ClubAdmin') or public.has_role('TeamAdmin')))
) with check (
  public.is_admin() or created_by = auth.uid() or (club_id = public.current_user_club_id() and (public.has_role('Coach') or public.has_role('ClubAdmin') or public.has_role('TeamAdmin')))
);

drop policy if exists "task_assignments_scope_read" on public.task_assignments;
create policy "task_assignments_scope_read" on public.task_assignments for select to authenticated using (
  assigned_to = auth.uid()
  or public.is_admin()
  or exists (select 1 from public.tasks t where t.id = task_assignments.task_id and t.club_id = public.current_user_club_id() and (public.has_role('Coach') or public.has_role('ClubAdmin') or public.has_role('TeamAdmin')))
);
drop policy if exists "task_assignments_scope_write" on public.task_assignments;
create policy "task_assignments_scope_write" on public.task_assignments for all to authenticated using (
  assigned_to = auth.uid()
  or public.is_admin()
  or exists (select 1 from public.tasks t where t.id = task_assignments.task_id and t.created_by = auth.uid())
) with check (
  assigned_to = auth.uid()
  or public.is_admin()
  or exists (select 1 from public.tasks t where t.id = task_assignments.task_id and t.created_by = auth.uid())
);

drop policy if exists "training_attendance_scope_read" on public.training_attendance;
create policy "training_attendance_scope_read" on public.training_attendance for select to authenticated using (
  athlete_id = auth.uid() or public.is_admin() or club_id = public.current_user_club_id()
);
drop policy if exists "training_attendance_scope_write" on public.training_attendance;
create policy "training_attendance_scope_write" on public.training_attendance for all to authenticated using (
  athlete_id = auth.uid() or public.is_admin() or (club_id = public.current_user_club_id() and (public.has_role('Coach') or public.has_role('ClubAdmin') or public.has_role('TeamAdmin')))
) with check (
  athlete_id = auth.uid() or public.is_admin() or (club_id = public.current_user_club_id() and (public.has_role('Coach') or public.has_role('ClubAdmin') or public.has_role('TeamAdmin')))
);

drop policy if exists "file_attachments_scope_read" on public.file_attachments;
create policy "file_attachments_scope_read" on public.file_attachments for select to authenticated using (
  deleted_at is null and (owner_id = auth.uid() or public.is_admin() or club_id = public.current_user_club_id())
);
drop policy if exists "file_attachments_scope_write" on public.file_attachments;
create policy "file_attachments_scope_write" on public.file_attachments for all to authenticated using (
  owner_id = auth.uid() or public.is_admin()
) with check (
  owner_id = auth.uid() or public.is_admin()
);

insert into storage.buckets (id, name, public)
values ('paddlio-files', 'paddlio-files', false)
on conflict (id) do nothing;
-- END SOURCE 0011_communication_team_system.sql

-- BEGIN SOURCE 0012_results_polar_beta_readiness.sql
create table if not exists public.competition_results (
  id text primary key,
  athlete_id text not null,
  competition_id text,
  boat_class text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.competition_results add column if not exists club_id uuid references public.clubs(id);
alter table public.competition_results add column if not exists competition_name text;
alter table public.competition_results add column if not exists competition_date date;
alter table public.competition_results add column if not exists location text;
alter table public.competition_results add column if not exists course_name text;
alter table public.competition_results add column if not exists age_class text;
alter table public.competition_results add column if not exists run1_time numeric;
alter table public.competition_results add column if not exists run1_penalties integer default 0;
alter table public.competition_results add column if not exists run1_total numeric;
alter table public.competition_results add column if not exists run2_time numeric;
alter table public.competition_results add column if not exists run2_penalties integer default 0;
alter table public.competition_results add column if not exists run2_total numeric;
alter table public.competition_results add column if not exists best_total numeric;
alter table public.competition_results add column if not exists ranking integer;
alter table public.competition_results add column if not exists starter_count integer;
alter table public.competition_results add column if not exists gap_to_winner numeric;
alter table public.competition_results add column if not exists gap_to_podium numeric;
alter table public.competition_results add column if not exists gap_to_personal_best numeric;
alter table public.competition_results add column if not exists source_url text;
alter table public.competition_results add column if not exists source_type text;
alter table public.competition_results add column if not exists coach_note text;
alter table public.competition_results add column if not exists created_by uuid references public.profiles(id);
alter table public.competition_results add column if not exists deleted_at timestamptz;

create table if not exists public.personal_bests (
  id text primary key,
  athlete_id text not null,
  club_id uuid references public.clubs(id),
  boat_class text not null,
  course_name text,
  location text,
  best_time numeric not null,
  result_id text,
  achieved_at date not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.result_imports (
  id text primary key,
  club_id uuid references public.clubs(id),
  uploaded_by uuid not null references public.profiles(id),
  source_type text not null,
  source_name text,
  source_url text,
  file_path text,
  import_status text not null default 'draft',
  detected_results_count integer default 0,
  imported_results_count integer default 0,
  error_message text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint result_imports_status_check check (import_status in ('draft', 'preview', 'imported', 'failed')),
  constraint result_imports_source_check check (source_type in ('csv', 'excel', 'pdf', 'web', 'manual'))
);

create table if not exists public.external_connections (
  id text primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  provider text not null,
  provider_user_id text,
  access_token_encrypted text,
  refresh_token_encrypted text,
  expires_at timestamptz,
  status text not null default 'disconnected',
  last_sync_at timestamptz,
  error_message text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint external_connections_provider_check check (provider in ('polar', 'garmin_prepared', 'apple_health_prepared', 'manual')),
  constraint external_connections_status_check check (status in ('disconnected', 'prepared', 'connected', 'expired', 'error'))
);

create table if not exists public.external_training_sessions (
  id text primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  athlete_id text,
  club_id uuid references public.clubs(id),
  provider text not null,
  provider_activity_id text,
  title text,
  sport_type text,
  started_at timestamptz not null,
  duration_seconds integer,
  distance_meters numeric,
  avg_heart_rate integer,
  max_heart_rate integer,
  calories integer,
  training_load numeric,
  recovery_status text,
  raw_data jsonb,
  linked_training_id text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint external_training_provider_check check (provider in ('polar', 'garmin_prepared', 'apple_health_prepared', 'manual')),
  constraint external_training_sport_check check (sport_type in ('paddling', 'kayak', 'canoe', 'strength', 'running', 'cycling', 'mobility', 'other'))
);

create table if not exists public.beta_readiness_checks (
  id text primary key,
  checked_by uuid references public.profiles(id),
  check_key text not null,
  status text not null,
  message text,
  created_at timestamptz default now(),
  constraint beta_readiness_status_check check (status in ('ok', 'warning', 'error', 'manual'))
);

create or replace function public.paddlio_is_admin()
returns boolean
language sql
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
      and 'Admin' = any(roles)
  );
$$;

create or replace function public.paddlio_current_club_id()
returns uuid
language sql
stable
as $$
  select club_id from public.profiles where id = auth.uid();
$$;

create or replace function public.paddlio_is_coach_like()
returns boolean
language sql
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
      and (roles && array['Coach', 'TeamAdmin', 'ClubAdmin', 'Admin'])
  );
$$;

do $$
begin
  if exists (select 1 from pg_proc where proname = 'set_updated_at') then
    execute 'drop trigger if exists set_personal_bests_updated_at on public.personal_bests';
    execute 'create trigger set_personal_bests_updated_at before update on public.personal_bests for each row execute function public.set_updated_at()';
    execute 'drop trigger if exists set_result_imports_updated_at on public.result_imports';
    execute 'create trigger set_result_imports_updated_at before update on public.result_imports for each row execute function public.set_updated_at()';
    execute 'drop trigger if exists set_external_connections_updated_at on public.external_connections';
    execute 'create trigger set_external_connections_updated_at before update on public.external_connections for each row execute function public.set_updated_at()';
    execute 'drop trigger if exists set_external_training_sessions_updated_at on public.external_training_sessions';
    execute 'create trigger set_external_training_sessions_updated_at before update on public.external_training_sessions for each row execute function public.set_updated_at()';
  end if;
end $$;

alter table public.competition_results enable row level security;
alter table public.personal_bests enable row level security;
alter table public.result_imports enable row level security;
alter table public.external_connections enable row level security;
alter table public.external_training_sessions enable row level security;
alter table public.beta_readiness_checks enable row level security;

drop policy if exists "competition results scoped access" on public.competition_results;
create policy "competition results scoped access" on public.competition_results
for all using (
  public.paddlio_is_admin()
  or athlete_id = auth.uid()::text
  or created_by = auth.uid()
  or (public.paddlio_is_coach_like() and club_id = public.paddlio_current_club_id())
) with check (
  public.paddlio_is_admin()
  or athlete_id = auth.uid()::text
  or created_by = auth.uid()
  or (public.paddlio_is_coach_like() and club_id = public.paddlio_current_club_id())
);

drop policy if exists "personal bests scoped access" on public.personal_bests;
create policy "personal bests scoped access" on public.personal_bests
for all using (
  public.paddlio_is_admin()
  or athlete_id = auth.uid()::text
  or (public.paddlio_is_coach_like() and club_id = public.paddlio_current_club_id())
) with check (
  public.paddlio_is_admin()
  or athlete_id = auth.uid()::text
  or (public.paddlio_is_coach_like() and club_id = public.paddlio_current_club_id())
);

drop policy if exists "result imports scoped access" on public.result_imports;
create policy "result imports scoped access" on public.result_imports
for all using (
  public.paddlio_is_admin()
  or uploaded_by = auth.uid()
  or (public.paddlio_is_coach_like() and club_id = public.paddlio_current_club_id())
) with check (
  public.paddlio_is_admin()
  or uploaded_by = auth.uid()
  or (public.paddlio_is_coach_like() and club_id = public.paddlio_current_club_id())
);

drop policy if exists "external connections own user" on public.external_connections;
create policy "external connections own user" on public.external_connections
for all using (public.paddlio_is_admin() or user_id = auth.uid())
with check (public.paddlio_is_admin() or user_id = auth.uid());

drop policy if exists "external training scoped access" on public.external_training_sessions;
create policy "external training scoped access" on public.external_training_sessions
for all using (
  public.paddlio_is_admin()
  or user_id = auth.uid()
  or athlete_id = auth.uid()::text
  or (public.paddlio_is_coach_like() and club_id = public.paddlio_current_club_id())
) with check (
  public.paddlio_is_admin()
  or user_id = auth.uid()
  or athlete_id = auth.uid()::text
  or (public.paddlio_is_coach_like() and club_id = public.paddlio_current_club_id())
);

drop policy if exists "beta readiness admin only" on public.beta_readiness_checks;
create policy "beta readiness admin only" on public.beta_readiness_checks
for all using (public.paddlio_is_admin())
with check (public.paddlio_is_admin());
-- END SOURCE 0012_results_polar_beta_readiness.sql

-- BEGIN SOURCE 0013_beta_test_release.sql
create table if not exists public.beta_feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  club_id uuid references public.clubs(id) on delete set null,
  user_role text,
  app_version text not null default '4.0.0-beta',
  category text not null,
  priority text not null default 'normal',
  title text not null,
  description text not null,
  page_path text,
  device_info text,
  browser_info text,
  status text not null default 'open',
  admin_note text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted_at timestamptz,
  constraint beta_feedback_category_check check (category in ('Fehler', 'Verbesserung', 'Design', 'Verstaendnisproblem', 'Wunsch', 'Sonstiges')),
  constraint beta_feedback_priority_check check (priority in ('niedrig', 'normal', 'hoch', 'kritisch')),
  constraint beta_feedback_status_check check (status in ('open', 'in_review', 'planned', 'fixed', 'rejected'))
);

create table if not exists public.beta_testers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  club_id uuid references public.clubs(id) on delete set null,
  tester_role text,
  status text not null default 'active',
  invited_at timestamptz default now(),
  last_seen_at timestamptz,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint beta_testers_status_check check (status in ('invited', 'active', 'paused', 'finished')),
  constraint beta_testers_user_unique unique (user_id)
);

create index if not exists beta_feedback_user_id_idx on public.beta_feedback(user_id);
create index if not exists beta_feedback_club_id_idx on public.beta_feedback(club_id);
create index if not exists beta_feedback_status_idx on public.beta_feedback(status);
create index if not exists beta_testers_user_id_idx on public.beta_testers(user_id);
create index if not exists beta_testers_club_id_idx on public.beta_testers(club_id);

create or replace function public.paddlio_is_admin()
returns boolean
language sql
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
      and 'Admin' = any(roles)
  );
$$;

create or replace function public.paddlio_current_club_id()
returns uuid
language sql
stable
as $$
  select club_id from public.profiles where id = auth.uid();
$$;

create or replace function public.paddlio_is_club_admin_like()
returns boolean
language sql
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
      and (roles && array['ClubAdmin', 'Admin'])
  );
$$;

do $$
begin
  if exists (select 1 from pg_proc where proname = 'set_updated_at') then
    execute 'drop trigger if exists set_beta_feedback_updated_at on public.beta_feedback';
    execute 'create trigger set_beta_feedback_updated_at before update on public.beta_feedback for each row execute function public.set_updated_at()';
    execute 'drop trigger if exists set_beta_testers_updated_at on public.beta_testers';
    execute 'create trigger set_beta_testers_updated_at before update on public.beta_testers for each row execute function public.set_updated_at()';
  end if;
end $$;

alter table public.beta_feedback enable row level security;
alter table public.beta_testers enable row level security;

drop policy if exists "beta feedback scoped select" on public.beta_feedback;
create policy "beta feedback scoped select" on public.beta_feedback
for select using (
  public.paddlio_is_admin()
  or user_id = auth.uid()
  or (public.paddlio_is_club_admin_like() and club_id = public.paddlio_current_club_id())
);

drop policy if exists "beta feedback own insert" on public.beta_feedback;
create policy "beta feedback own insert" on public.beta_feedback
for insert with check (
  public.paddlio_is_admin()
  or user_id = auth.uid()
);

drop policy if exists "beta feedback scoped update" on public.beta_feedback;
create policy "beta feedback scoped update" on public.beta_feedback
for update using (
  public.paddlio_is_admin()
  or user_id = auth.uid()
  or (public.paddlio_is_club_admin_like() and club_id = public.paddlio_current_club_id())
) with check (
  public.paddlio_is_admin()
  or user_id = auth.uid()
  or (public.paddlio_is_club_admin_like() and club_id = public.paddlio_current_club_id())
);

drop policy if exists "beta testers scoped select" on public.beta_testers;
create policy "beta testers scoped select" on public.beta_testers
for select using (
  public.paddlio_is_admin()
  or user_id = auth.uid()
  or (public.paddlio_is_club_admin_like() and club_id = public.paddlio_current_club_id())
);

drop policy if exists "beta testers admin write" on public.beta_testers;
create policy "beta testers admin write" on public.beta_testers
for all using (public.paddlio_is_admin())
with check (public.paddlio_is_admin());
-- END SOURCE 0013_beta_test_release.sql

-- BEGIN SOURCE 0014_beta_stabilization_hotfix.sql
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
-- END SOURCE 0014_beta_stabilization_hotfix.sql

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

notify pgrst, 'reload schema';
