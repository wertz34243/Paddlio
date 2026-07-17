-- Paddlio 5.x Import/Export module
-- Safe for existing databases: no destructive changes, no table drops.

create table if not exists public.import_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  club_id uuid null,
  import_type text not null,
  source_type text not null default 'file',
  file_name text not null default '',
  file_format text not null default 'unknown',
  status text not null default 'draft',
  total_rows integer not null default 0,
  valid_rows integer not null default 0,
  warning_rows integer not null default 0,
  error_rows integer not null default 0,
  created_rows integer not null default 0,
  updated_rows integer not null default 0,
  skipped_rows integer not null default 0,
  profile_id uuid null,
  errors jsonb not null default '[]'::jsonb,
  warnings jsonb not null default '[]'::jsonb,
  started_at timestamptz null,
  completed_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.import_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid null,
  club_id uuid null,
  name text not null,
  import_type text not null,
  file_format text not null default 'unknown',
  sheet_name text null,
  header_row integer not null default 0,
  mapping jsonb not null default '[]'::jsonb,
  transformations jsonb not null default '{}'::jsonb,
  defaults jsonb not null default '{}'::jsonb,
  conflict_rules jsonb not null default '{}'::jsonb,
  is_system boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.import_rows (
  id uuid primary key default gen_random_uuid(),
  import_job_id uuid not null references public.import_jobs(id) on delete cascade,
  row_number integer not null,
  status text not null default 'valid',
  source_data jsonb not null default '{}'::jsonb,
  transformed_data jsonb not null default '{}'::jsonb,
  errors jsonb not null default '[]'::jsonb,
  warnings jsonb not null default '[]'::jsonb,
  target_table text null,
  target_id uuid null,
  created_at timestamptz not null default now()
);

create table if not exists public.export_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  club_id uuid null,
  export_type text not null,
  format text not null,
  filters jsonb not null default '{}'::jsonb,
  selected_columns jsonb not null default '[]'::jsonb,
  status text not null default 'created',
  row_count integer not null default 0,
  file_path text null,
  file_name text null,
  created_at timestamptz not null default now(),
  completed_at timestamptz null
);

alter table public.import_jobs add column if not exists source_type text not null default 'file';
alter table public.import_jobs add column if not exists errors jsonb not null default '[]'::jsonb;
alter table public.import_jobs add column if not exists warnings jsonb not null default '[]'::jsonb;
alter table public.import_jobs add column if not exists updated_at timestamptz not null default now();
alter table public.import_profiles add column if not exists is_active boolean not null default true;
alter table public.export_jobs add column if not exists file_name text null;

create index if not exists import_jobs_user_id_idx on public.import_jobs(user_id);
create index if not exists import_jobs_club_id_idx on public.import_jobs(club_id);
create index if not exists import_jobs_created_at_idx on public.import_jobs(created_at desc);
create index if not exists import_profiles_user_id_idx on public.import_profiles(user_id);
create index if not exists import_profiles_club_id_idx on public.import_profiles(club_id);
create index if not exists import_rows_import_job_id_idx on public.import_rows(import_job_id);
create index if not exists export_jobs_user_id_idx on public.export_jobs(user_id);
create index if not exists export_jobs_club_id_idx on public.export_jobs(club_id);

alter table public.import_jobs enable row level security;
alter table public.import_profiles enable row level security;
alter table public.import_rows enable row level security;
alter table public.export_jobs enable row level security;

drop policy if exists "import_jobs_select_own_or_club" on public.import_jobs;
create policy "import_jobs_select_own_or_club"
on public.import_jobs
for select
to authenticated
using (
  user_id = auth.uid()
  or exists (
    select 1
    from public.club_memberships cm
    where cm.user_id = auth.uid()
      and cm.club_id = import_jobs.club_id
      and cm.status = 'active'
      and lower(cm.role) in ('coach', 'clubadmin', 'admin')
  )
);

drop policy if exists "import_jobs_insert_own" on public.import_jobs;
create policy "import_jobs_insert_own"
on public.import_jobs
for insert
to authenticated
with check (
  user_id = auth.uid()
  or exists (
    select 1
    from public.club_memberships cm
    where cm.user_id = auth.uid()
      and cm.club_id = import_jobs.club_id
      and cm.status = 'active'
      and lower(cm.role) in ('coach', 'clubadmin', 'admin')
  )
);

drop policy if exists "import_jobs_update_own_or_club" on public.import_jobs;
create policy "import_jobs_update_own_or_club"
on public.import_jobs
for update
to authenticated
using (
  user_id = auth.uid()
  or exists (
    select 1
    from public.club_memberships cm
    where cm.user_id = auth.uid()
      and cm.club_id = import_jobs.club_id
      and cm.status = 'active'
      and lower(cm.role) in ('coach', 'clubadmin', 'admin')
  )
)
with check (
  user_id = auth.uid()
  or exists (
    select 1
    from public.club_memberships cm
    where cm.user_id = auth.uid()
      and cm.club_id = import_jobs.club_id
      and cm.status = 'active'
      and lower(cm.role) in ('coach', 'clubadmin', 'admin')
  )
);

drop policy if exists "import_profiles_select_available" on public.import_profiles;
create policy "import_profiles_select_available"
on public.import_profiles
for select
to authenticated
using (
  is_system = true
  or user_id = auth.uid()
  or exists (
    select 1
    from public.club_memberships cm
    where cm.user_id = auth.uid()
      and cm.club_id = import_profiles.club_id
      and cm.status = 'active'
  )
);

drop policy if exists "import_profiles_write_own_or_admin" on public.import_profiles;
create policy "import_profiles_write_own_or_admin"
on public.import_profiles
for all
to authenticated
using (
  is_system = false
  and (
    user_id = auth.uid()
    or exists (
      select 1
      from public.club_memberships cm
      where cm.user_id = auth.uid()
        and cm.club_id = import_profiles.club_id
        and cm.status = 'active'
        and lower(cm.role) in ('coach', 'clubadmin', 'admin')
    )
  )
)
with check (
  is_system = false
  and (
    user_id = auth.uid()
    or exists (
      select 1
      from public.club_memberships cm
      where cm.user_id = auth.uid()
        and cm.club_id = import_profiles.club_id
        and cm.status = 'active'
        and lower(cm.role) in ('coach', 'clubadmin', 'admin')
    )
  )
);

drop policy if exists "import_rows_select_via_job" on public.import_rows;
create policy "import_rows_select_via_job"
on public.import_rows
for select
to authenticated
using (
  exists (
    select 1
    from public.import_jobs job
    where job.id = import_rows.import_job_id
      and (
        job.user_id = auth.uid()
        or exists (
          select 1
          from public.club_memberships cm
          where cm.user_id = auth.uid()
            and cm.club_id = job.club_id
            and cm.status = 'active'
            and lower(cm.role) in ('coach', 'clubadmin', 'admin')
        )
      )
  )
);

drop policy if exists "import_rows_insert_via_job" on public.import_rows;
create policy "import_rows_insert_via_job"
on public.import_rows
for insert
to authenticated
with check (
  exists (
    select 1
    from public.import_jobs job
    where job.id = import_rows.import_job_id
      and job.user_id = auth.uid()
  )
);

drop policy if exists "export_jobs_select_own_or_club" on public.export_jobs;
create policy "export_jobs_select_own_or_club"
on public.export_jobs
for select
to authenticated
using (
  user_id = auth.uid()
  or exists (
    select 1
    from public.club_memberships cm
    where cm.user_id = auth.uid()
      and cm.club_id = export_jobs.club_id
      and cm.status = 'active'
      and lower(cm.role) in ('coach', 'clubadmin', 'admin')
  )
);

drop policy if exists "export_jobs_insert_own_or_club" on public.export_jobs;
create policy "export_jobs_insert_own_or_club"
on public.export_jobs
for insert
to authenticated
with check (
  user_id = auth.uid()
  or exists (
    select 1
    from public.club_memberships cm
    where cm.user_id = auth.uid()
      and cm.club_id = export_jobs.club_id
      and cm.status = 'active'
      and lower(cm.role) in ('coach', 'clubadmin', 'admin')
  )
);
