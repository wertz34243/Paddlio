-- Reconcile active import/export and Polar modules on Paddlio DEV.
-- Additive only: no tables or user data are removed.

create extension if not exists pgcrypto;

create table if not exists public.import_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  club_id uuid references public.clubs(id) on delete set null,
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
  profile_id uuid,
  errors jsonb not null default '[]'::jsonb,
  warnings jsonb not null default '[]'::jsonb,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.import_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  club_id uuid references public.clubs(id) on delete cascade,
  name text not null,
  import_type text not null,
  file_format text not null default 'unknown',
  sheet_name text,
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
  target_table text,
  target_id uuid,
  created_at timestamptz not null default now()
);

create table if not exists public.export_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  club_id uuid references public.clubs(id) on delete set null,
  export_type text not null,
  format text not null,
  filters jsonb not null default '{}'::jsonb,
  selected_columns jsonb not null default '[]'::jsonb,
  status text not null default 'created',
  row_count integer not null default 0,
  file_path text,
  file_name text,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create table if not exists public.device_connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  provider text not null,
  provider_user_id text,
  status text not null default 'disconnected',
  last_sync_at timestamptz,
  error_message text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint device_connections_status_check check (status in ('disconnected', 'prepared', 'connected', 'expired', 'error')),
  constraint device_connections_provider_check check (provider in ('polar', 'garmin_prepared', 'apple_health_prepared', 'strava_prepared', 'coros_prepared', 'suunto_prepared', 'manual')),
  constraint device_connections_user_provider_unique unique (user_id, provider)
);

create table if not exists public.polar_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  polar_user_id text,
  access_token_encrypted text,
  refresh_token_encrypted text,
  token_expires_at timestamptz,
  scope text,
  status text not null default 'disconnected',
  last_sync_at timestamptz,
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint polar_accounts_user_unique unique (user_id),
  constraint polar_accounts_status_check check (status in ('disconnected', 'prepared', 'connected', 'expired', 'error'))
);

create table if not exists public.polar_oauth_states (
  state text primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.polar_sync_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  polar_account_id uuid references public.polar_accounts(id) on delete set null,
  status text not null default 'queued',
  sync_type text not null default 'manual',
  imported_count integer not null default 0,
  updated_count integer not null default 0,
  skipped_count integer not null default 0,
  error_message text,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  constraint polar_sync_jobs_status_check check (status in ('queued', 'running', 'completed', 'failed')),
  constraint polar_sync_jobs_type_check check (sync_type in ('manual', 'automatic', 'webhook', 'delta', 'background'))
);

create table if not exists public.polar_training_imports (
  id text primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  polar_account_id uuid references public.polar_accounts(id) on delete set null,
  provider_activity_id text not null,
  title text,
  sport_type text not null default 'other',
  started_at timestamptz not null,
  duration_seconds integer,
  distance_meters numeric,
  avg_heart_rate integer,
  max_heart_rate integer,
  calories integer,
  training_load numeric,
  recovery_status text,
  cardio_load numeric,
  running_index numeric,
  training_benefit text,
  heart_rate_samples jsonb not null default '[]'::jsonb,
  heart_rate_zones jsonb not null default '[]'::jsonb,
  gps_route jsonb not null default '[]'::jsonb,
  zone_summary jsonb not null default '{}'::jsonb,
  material_context jsonb not null default '{}'::jsonb,
  raw_data jsonb not null default '{}'::jsonb,
  linked_training_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint polar_training_imports_user_activity_unique unique (user_id, provider_activity_id)
);

create index if not exists import_jobs_user_id_idx on public.import_jobs(user_id);
create index if not exists import_jobs_club_id_idx on public.import_jobs(club_id);
create index if not exists import_profiles_user_id_idx on public.import_profiles(user_id);
create index if not exists import_rows_import_job_id_idx on public.import_rows(import_job_id);
create index if not exists export_jobs_user_id_idx on public.export_jobs(user_id);
create index if not exists idx_device_connections_user_provider on public.device_connections(user_id, provider);
create index if not exists idx_polar_accounts_user on public.polar_accounts(user_id);
create index if not exists idx_polar_oauth_states_user on public.polar_oauth_states(user_id);
create index if not exists idx_polar_sync_jobs_user_created on public.polar_sync_jobs(user_id, created_at desc);
create index if not exists idx_polar_training_imports_user_started on public.polar_training_imports(user_id, started_at desc);

alter table public.import_jobs enable row level security;
alter table public.import_profiles enable row level security;
alter table public.import_rows enable row level security;
alter table public.export_jobs enable row level security;
alter table public.device_connections enable row level security;
alter table public.polar_accounts enable row level security;
alter table public.polar_oauth_states enable row level security;
alter table public.polar_sync_jobs enable row level security;
alter table public.polar_training_imports enable row level security;

drop policy if exists import_jobs_owner_club_0044 on public.import_jobs;
create policy import_jobs_owner_club_0044 on public.import_jobs for all to authenticated
using (user_id = (select auth.uid()) or public.paddlio_can_manage_club_415(club_id))
with check (user_id = (select auth.uid()) or public.paddlio_can_manage_club_415(club_id));

drop policy if exists import_profiles_available_0044 on public.import_profiles;
create policy import_profiles_available_0044 on public.import_profiles for select to authenticated
using (is_system or user_id = (select auth.uid()) or public.paddlio_can_manage_club_415(club_id));
drop policy if exists import_profiles_write_0044 on public.import_profiles;
create policy import_profiles_write_0044 on public.import_profiles for all to authenticated
using (not is_system and (user_id = (select auth.uid()) or public.paddlio_can_manage_club_415(club_id)))
with check (not is_system and (user_id = (select auth.uid()) or public.paddlio_can_manage_club_415(club_id)));

drop policy if exists import_rows_via_job_0044 on public.import_rows;
create policy import_rows_via_job_0044 on public.import_rows for all to authenticated
using (exists (select 1 from public.import_jobs job where job.id = import_job_id))
with check (exists (select 1 from public.import_jobs job where job.id = import_job_id));

drop policy if exists export_jobs_owner_club_0044 on public.export_jobs;
create policy export_jobs_owner_club_0044 on public.export_jobs for all to authenticated
using (user_id = (select auth.uid()) or public.paddlio_can_manage_club_415(club_id))
with check (user_id = (select auth.uid()) or public.paddlio_can_manage_club_415(club_id));

drop policy if exists device_connections_owner_0044 on public.device_connections;
create policy device_connections_owner_0044 on public.device_connections for all to authenticated
using (user_id = (select auth.uid()) or public.paddlio_is_admin_415())
with check (user_id = (select auth.uid()) or public.paddlio_is_admin_415());

-- OAuth token/state tables deliberately remain inaccessible to authenticated clients.
drop policy if exists polar_sync_jobs_owner_0044 on public.polar_sync_jobs;
create policy polar_sync_jobs_owner_0044 on public.polar_sync_jobs for select to authenticated
using (user_id = (select auth.uid()) or public.paddlio_is_admin_415());

drop policy if exists polar_training_imports_owner_0044 on public.polar_training_imports;
create policy polar_training_imports_owner_0044 on public.polar_training_imports for all to authenticated
using (user_id = (select auth.uid()) or public.paddlio_is_admin_415())
with check (user_id = (select auth.uid()) or public.paddlio_is_admin_415());

grant select, insert, update, delete on public.import_jobs, public.import_profiles, public.import_rows,
  public.export_jobs, public.device_connections, public.polar_training_imports to authenticated;
grant select on public.polar_sync_jobs to authenticated;

do $$
declare
  table_name text;
begin
  foreach table_name in array array['device_connections', 'polar_sync_jobs', 'polar_training_imports']
  loop
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = table_name
    ) then
      execute format('alter publication supabase_realtime add table public.%I', table_name);
    end if;
    execute format('alter table public.%I replica identity full', table_name);
  end loop;
end $$;

notify pgrst, 'reload schema';
