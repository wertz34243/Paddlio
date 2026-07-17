-- Paddlio 5.0 Polar AccessLink integration.
-- Safe/idempotent migration. No destructive changes.

alter table public.profiles
  add column if not exists primary_role text,
  add column if not exists active_club_id uuid references public.clubs(id) on delete set null;

create or replace function public.paddlio_is_admin()
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and (
        primary_role = 'Admin'
        or 'Admin' = any(coalesce(roles, array[]::text[]))
        or lower(coalesce(email, '')) = 't.kanu@outlook.com'
      )
  );
$$;

create or replace function public.paddlio_current_club_id()
returns uuid
language sql
stable
as $$
  select coalesce(active_club_id, club_id)
  from public.profiles
  where id = auth.uid()
  limit 1;
$$;

create or replace function public.paddlio_is_coach_like()
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and (
        primary_role in ('Coach', 'TeamAdmin', 'ClubAdmin', 'Admin')
        or coalesce(roles, array[]::text[]) && array['Coach', 'TeamAdmin', 'ClubAdmin', 'Admin']
      )
  );
$$;

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

alter table public.external_training_sessions
  add column if not exists cardio_load numeric,
  add column if not exists running_index numeric,
  add column if not exists training_benefit text,
  add column if not exists heart_rate_samples jsonb not null default '[]'::jsonb,
  add column if not exists heart_rate_zones jsonb not null default '[]'::jsonb,
  add column if not exists gps_route jsonb not null default '[]'::jsonb,
  add column if not exists zone_summary jsonb not null default '{}'::jsonb,
  add column if not exists material_context jsonb not null default '{}'::jsonb;

create index if not exists idx_device_connections_user_provider on public.device_connections(user_id, provider);
create index if not exists idx_polar_accounts_user on public.polar_accounts(user_id);
create index if not exists idx_polar_oauth_states_user on public.polar_oauth_states(user_id);
create index if not exists idx_polar_sync_jobs_user_created on public.polar_sync_jobs(user_id, created_at desc);
create index if not exists idx_polar_training_imports_user_started on public.polar_training_imports(user_id, started_at desc);
create index if not exists idx_polar_training_imports_activity on public.polar_training_imports(provider_activity_id);

do $$
begin
  if exists (select 1 from pg_proc where proname = 'set_updated_at') then
    execute 'drop trigger if exists set_device_connections_updated_at on public.device_connections';
    execute 'create trigger set_device_connections_updated_at before update on public.device_connections for each row execute function public.set_updated_at()';
    execute 'drop trigger if exists set_polar_accounts_updated_at on public.polar_accounts';
    execute 'create trigger set_polar_accounts_updated_at before update on public.polar_accounts for each row execute function public.set_updated_at()';
    execute 'drop trigger if exists set_polar_training_imports_updated_at on public.polar_training_imports';
    execute 'create trigger set_polar_training_imports_updated_at before update on public.polar_training_imports for each row execute function public.set_updated_at()';
  end if;
end $$;

alter table public.device_connections enable row level security;
alter table public.polar_accounts enable row level security;
alter table public.polar_oauth_states enable row level security;
alter table public.polar_sync_jobs enable row level security;
alter table public.polar_training_imports enable row level security;

drop policy if exists "device connections owner read" on public.device_connections;
create policy "device connections owner read" on public.device_connections
for select using (
  user_id = auth.uid()
  or public.paddlio_is_admin()
);

drop policy if exists "device connections owner update" on public.device_connections;
create policy "device connections owner update" on public.device_connections
for update using (user_id = auth.uid() or public.paddlio_is_admin())
with check (user_id = auth.uid() or public.paddlio_is_admin());

drop policy if exists "device connections owner insert" on public.device_connections;
create policy "device connections owner insert" on public.device_connections
for insert with check (user_id = auth.uid() or public.paddlio_is_admin());

-- polar_accounts and polar_oauth_states intentionally have no authenticated user policies.
-- They contain OAuth secrets/state and are only written/read by trusted server-side functions.

drop policy if exists "polar sync jobs owner read" on public.polar_sync_jobs;
create policy "polar sync jobs owner read" on public.polar_sync_jobs
for select using (user_id = auth.uid() or public.paddlio_is_admin());

drop policy if exists "polar training owner read" on public.polar_training_imports;
create policy "polar training owner read" on public.polar_training_imports
for select using (
  user_id = auth.uid()
  or public.paddlio_is_admin()
  or (
    public.paddlio_is_coach_like()
    and exists (
      select 1 from public.profiles p
      where p.id = public.polar_training_imports.user_id
        and p.club_id = public.paddlio_current_club_id()
    )
  )
);

drop policy if exists "polar training owner write" on public.polar_training_imports;
create policy "polar training owner write" on public.polar_training_imports
for all using (user_id = auth.uid() or public.paddlio_is_admin())
with check (user_id = auth.uid() or public.paddlio_is_admin());
