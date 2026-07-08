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
