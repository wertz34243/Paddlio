create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
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

create table if not exists public.clubs (
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

create table if not exists public.training_templates (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid,
  owner_id uuid,
  club_id uuid,
  created_by_user_id uuid,
  created_by uuid,
  title text not null,
  category text not null default 'Allgemein',
  training_area text,
  training_type text,
  boat_class text,
  default_duration_minutes integer,
  default_intensity text not null default 'mittel',
  focus text,
  description text,
  notes text,
  tags text[] not null default array[]::text[],
  is_favorite boolean not null default false,
  visibility text not null default 'private',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint training_templates_category_check check (
    category in ('K1', 'C1', 'Ausdauer', 'Kraft', 'Technik', 'Regeneration', 'Wettkampf', 'Allgemein')
  ),
  constraint training_templates_boat_class_check check (
    boat_class is null or boat_class in ('K1', 'C1', 'K1+C1', 'none')
  ),
  constraint training_templates_intensity_check check (
    default_intensity in ('locker', 'mittel', 'hart', 'maximal')
  ),
  constraint training_templates_visibility_check check (visibility in ('private', 'club'))
);

create table if not exists public.training_plan_items (
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
  constraint training_plan_items_boat_class_check check (
    boat_class is null or boat_class in ('K1', 'C1', 'K1+C1', 'none')
  ),
  constraint training_plan_items_intensity_check check (
    intensity is null or intensity in ('locker', 'mittel', 'hart', 'maximal')
  )
);

create table if not exists public.season_goals (
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

create table if not exists public.training_groups (
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

create table if not exists public.group_members (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null,
  athlete_id uuid not null,
  created_at timestamptz not null default now(),
  unique (group_id, athlete_id)
);

create table if not exists public.trainer_requests (
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

create table if not exists public.club_requests (
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

create table if not exists public.training_feedback (
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

create table if not exists public.competitions (
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

create table if not exists public.competition_results (
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

create table if not exists public.materials (
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

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  title text not null,
  body text,
  type text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid,
  action text not null,
  table_name text,
  record_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'profiles_club_id_fk') then
    alter table public.profiles add constraint profiles_club_id_fk foreign key (club_id) references public.clubs(id);
  end if;

  if not exists (select 1 from pg_constraint where conname = 'training_templates_owner_user_id_fk') then
    alter table public.training_templates add constraint training_templates_owner_user_id_fk foreign key (owner_user_id) references public.profiles(id) on delete cascade;
  end if;

  if not exists (select 1 from pg_constraint where conname = 'training_templates_owner_id_fk') then
    alter table public.training_templates add constraint training_templates_owner_id_fk foreign key (owner_id) references public.profiles(id) on delete cascade;
  end if;

  if not exists (select 1 from pg_constraint where conname = 'training_templates_created_by_user_id_fk') then
    alter table public.training_templates add constraint training_templates_created_by_user_id_fk foreign key (created_by_user_id) references public.profiles(id) on delete set null;
  end if;

  if not exists (select 1 from pg_constraint where conname = 'training_templates_created_by_fk') then
    alter table public.training_templates add constraint training_templates_created_by_fk foreign key (created_by) references public.profiles(id) on delete set null;
  end if;

  if not exists (select 1 from pg_constraint where conname = 'training_templates_club_id_fk') then
    alter table public.training_templates add constraint training_templates_club_id_fk foreign key (club_id) references public.clubs(id) on delete cascade;
  end if;

  if not exists (select 1 from pg_constraint where conname = 'training_plan_items_owner_id_fk') then
    alter table public.training_plan_items add constraint training_plan_items_owner_id_fk foreign key (owner_id) references public.profiles(id) on delete cascade;
  end if;

  if not exists (select 1 from pg_constraint where conname = 'training_plan_items_club_id_fk') then
    alter table public.training_plan_items add constraint training_plan_items_club_id_fk foreign key (club_id) references public.clubs(id) on delete set null;
  end if;

  if not exists (select 1 from pg_constraint where conname = 'training_plan_items_coach_id_fk') then
    alter table public.training_plan_items add constraint training_plan_items_coach_id_fk foreign key (coach_id) references public.profiles(id) on delete set null;
  end if;

  if not exists (select 1 from pg_constraint where conname = 'season_goals_athlete_id_fk') then
    alter table public.season_goals add constraint season_goals_athlete_id_fk foreign key (athlete_id) references public.profiles(id) on delete cascade;
  end if;

  if not exists (select 1 from pg_constraint where conname = 'season_goals_assigned_by_fk') then
    alter table public.season_goals add constraint season_goals_assigned_by_fk foreign key (assigned_by) references public.profiles(id) on delete set null;
  end if;

  if not exists (select 1 from pg_constraint where conname = 'competition_results_competition_id_fk') then
    alter table public.competition_results add constraint competition_results_competition_id_fk foreign key (competition_id) references public.competitions(id) on delete cascade;
  end if;

  if not exists (select 1 from pg_constraint where conname = 'competition_results_athlete_id_fk') then
    alter table public.competition_results add constraint competition_results_athlete_id_fk foreign key (athlete_id) references public.profiles(id) on delete cascade;
  end if;

  if not exists (select 1 from pg_constraint where conname = 'competitions_club_id_fk') then
    alter table public.competitions add constraint competitions_club_id_fk foreign key (club_id) references public.clubs(id) on delete set null;
  end if;
end;
$$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.default_roles_for_email(email text)
returns text[]
language sql
immutable
as $$
  select array['Athlete']::text[];
$$;

create or replace function public.has_role(required_role text)
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
      and required_role = any(roles)
      and status = 'active'
  );
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.has_role('Admin');
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

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  metadata_club_id text;
  metadata_club_name text;
  safe_club_id uuid;
  new_display_name text;
begin
  metadata_club_id := nullif(new.raw_user_meta_data ->> 'clubId', '');
  metadata_club_name := nullif(trim(coalesce(new.raw_user_meta_data ->> 'club', '')), '');

  if metadata_club_id ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$' then
    safe_club_id := metadata_club_id::uuid;
  else
    safe_club_id := null;
  end if;

  new_display_name := coalesce(
    nullif(trim(coalesce(new.raw_user_meta_data ->> 'firstName', '') || ' ' || coalesce(new.raw_user_meta_data ->> 'lastName', '')), ''),
    new.email
  );

  insert into public.profiles (
    id,
    email,
    first_name,
    last_name,
    display_name,
    club_id,
    roles,
    status,
    boat_classes
  )
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'firstName', ''),
    coalesce(new.raw_user_meta_data ->> 'lastName', ''),
    new_display_name,
    safe_club_id,
    public.default_roles_for_email(new.email),
    'active',
    array['K1']::text[]
  )
  on conflict (id) do update
    set email = excluded.email,
        first_name = coalesce(nullif(public.profiles.first_name, ''), excluded.first_name),
        last_name = coalesce(nullif(public.profiles.last_name, ''), excluded.last_name),
        display_name = coalesce(nullif(public.profiles.display_name, ''), excluded.display_name, excluded.email),
        updated_at = now();

  if metadata_club_name is not null and safe_club_id is null then
    insert into public.club_requests (
      requested_by,
      name,
      message,
      status
    )
    values (
      new.id,
      metadata_club_name,
      'Automatischer Vereinsvorschlag aus der Registrierung von ' || new_display_name || ' (' || new.email || ').',
      'open'
    );
  end if;

  insert into public.notifications (
    user_id,
    title,
    body,
    type
  )
  select
    admin_profile.id,
    'Neue Registrierung',
    new_display_name || ' (' || new.email || ') hat ein Konto erstellt und wartet auf Admin-Pruefung.',
    'registration_request'
  from public.profiles admin_profile
  where 'Admin' = any(admin_profile.roles)
    and admin_profile.status = 'active';

  return new;
end;
$$;

create or replace function public.sync_training_template_user_columns()
returns trigger
language plpgsql
as $$
begin
  new.owner_user_id := coalesce(new.owner_user_id, new.owner_id);
  new.owner_id := coalesce(new.owner_id, new.owner_user_id);
  new.created_by_user_id := coalesce(new.created_by_user_id, new.created_by);
  new.created_by := coalesce(new.created_by, new.created_by_user_id);
  return new;
end;
$$;

create or replace function public.protect_profile_privileged_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.is_admin() then
    return new;
  end if;

  if auth.uid() = old.id then
    new.roles := old.roles;
    new.status := old.status;
  end if;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_auth_user();

drop trigger if exists sync_training_template_user_columns on public.training_templates;
create trigger sync_training_template_user_columns
before insert or update on public.training_templates
for each row execute function public.sync_training_template_user_columns();

drop trigger if exists protect_profile_privileged_fields on public.profiles;
create trigger protect_profile_privileged_fields
before update on public.profiles
for each row execute function public.protect_profile_privileged_fields();

do $$
declare
  target_table text;
begin
  foreach target_table in array array[
    'clubs',
    'profiles',
    'training_templates',
    'training_plan_items',
    'season_goals',
    'training_groups',
    'training_feedback',
    'competitions',
    'competition_results',
    'materials'
  ]
  loop
    execute format('drop trigger if exists set_%s_updated_at on public.%I', target_table, target_table);
    execute format('create trigger set_%s_updated_at before update on public.%I for each row execute function public.set_updated_at()', target_table, target_table);
  end loop;
end;
$$;

create index if not exists profiles_club_id_idx on public.profiles(club_id);
create index if not exists profiles_roles_idx on public.profiles using gin(roles);
create index if not exists clubs_status_idx on public.clubs(status);
create index if not exists training_templates_owner_user_id_idx on public.training_templates(owner_user_id);
create index if not exists training_templates_owner_id_idx on public.training_templates(owner_id);
create index if not exists training_templates_club_id_idx on public.training_templates(club_id);
create index if not exists training_templates_visibility_idx on public.training_templates(visibility);
create index if not exists training_plan_items_owner_id_idx on public.training_plan_items(owner_id);
create index if not exists training_plan_items_club_id_idx on public.training_plan_items(club_id);
create index if not exists season_goals_athlete_id_idx on public.season_goals(athlete_id);

create or replace view public.athlete_profiles (
  id,
  email,
  first_name,
  last_name,
  display_name,
  club_id,
  roles,
  status,
  avatar_url,
  age_category,
  boat_classes,
  paddle_side,
  created_at,
  updated_at
) as
select
  id,
  email,
  first_name,
  last_name,
  display_name,
  club_id,
  roles,
  status,
  avatar_url,
  age_category,
  boat_classes,
  paddle_side,
  created_at,
  updated_at
from public.profiles
where 'Athlete' = any(roles);

create or replace view public.coach_profiles (
  id,
  email,
  first_name,
  last_name,
  display_name,
  club_id,
  roles,
  status,
  avatar_url,
  age_category,
  boat_classes,
  paddle_side,
  created_at,
  updated_at
) as
select
  id,
  email,
  first_name,
  last_name,
  display_name,
  club_id,
  roles,
  status,
  avatar_url,
  age_category,
  boat_classes,
  paddle_side,
  created_at,
  updated_at
from public.profiles
where 'Coach' = any(roles)
   or 'TeamAdmin' = any(roles)
   or 'Admin' = any(roles);

alter table public.profiles enable row level security;
alter table public.clubs enable row level security;
alter table public.training_templates enable row level security;
alter table public.training_plan_items enable row level security;
alter table public.season_goals enable row level security;
alter table public.training_groups enable row level security;
alter table public.group_members enable row level security;
alter table public.trainer_requests enable row level security;
alter table public.club_requests enable row level security;
alter table public.training_feedback enable row level security;
alter table public.competitions enable row level security;
alter table public.competition_results enable row level security;
alter table public.materials enable row level security;
alter table public.notifications enable row level security;
alter table public.audit_logs enable row level security;

drop policy if exists "profiles_self_select" on public.profiles;
create policy "profiles_self_select" on public.profiles
  for select
  using (
    id = auth.uid()
    or public.is_admin()
    or (
      public.has_role('Coach')
      and club_id is not null
      and club_id = public.current_user_club_id()
    )
  );

drop policy if exists "profiles_self_insert" on public.profiles;
create policy "profiles_self_insert" on public.profiles
  for insert
  with check (
    id = auth.uid()
    and roles <@ array['Athlete']::text[]
  );

drop policy if exists "profiles_self_limited_update" on public.profiles;
create policy "profiles_self_limited_update" on public.profiles
  for update
  using (id = auth.uid())
  with check (id = auth.uid());

drop policy if exists "profiles_admin_all" on public.profiles;
create policy "profiles_admin_all" on public.profiles
  for all
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "clubs_authenticated_select" on public.clubs;
create policy "clubs_authenticated_select" on public.clubs
  for select
  to authenticated
  using (status = 'active' or public.is_admin());

drop policy if exists "clubs_admin_all" on public.clubs;
create policy "clubs_admin_all" on public.clubs
  for all
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "club_requests_self_insert" on public.club_requests;
create policy "club_requests_self_insert" on public.club_requests
  for insert
  to authenticated
  with check (requested_by = auth.uid());

drop policy if exists "club_requests_admin_all" on public.club_requests;
create policy "club_requests_admin_all" on public.club_requests
  for all
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "notifications_self_select" on public.notifications;
create policy "notifications_self_select" on public.notifications
  for select
  using (user_id = auth.uid() or public.is_admin());

drop policy if exists "notifications_self_update" on public.notifications;
create policy "notifications_self_update" on public.notifications
  for update
  using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());

drop policy if exists "training_templates_scope_select" on public.training_templates;
create policy "training_templates_scope_select" on public.training_templates
  for select
  using (
    coalesce(owner_user_id, owner_id) = auth.uid()
    or public.is_admin()
    or (
      visibility = 'club'
      and club_id is not null
      and club_id = public.current_user_club_id()
      and (public.has_role('Coach') or public.has_role('TeamAdmin'))
    )
  );

drop policy if exists "training_templates_scope_insert" on public.training_templates;
create policy "training_templates_scope_insert" on public.training_templates
  for insert
  with check (
    coalesce(owner_user_id, owner_id) = auth.uid()
    or public.is_admin()
    or (
      visibility = 'club'
      and club_id is not null
      and club_id = public.current_user_club_id()
      and (public.has_role('Coach') or public.has_role('TeamAdmin'))
    )
  );

drop policy if exists "training_templates_scope_update" on public.training_templates;
create policy "training_templates_scope_update" on public.training_templates
  for update
  using (
    coalesce(owner_user_id, owner_id) = auth.uid()
    or public.is_admin()
    or (
      visibility = 'club'
      and club_id is not null
      and club_id = public.current_user_club_id()
      and (public.has_role('Coach') or public.has_role('TeamAdmin'))
    )
  )
  with check (
    coalesce(owner_user_id, owner_id) = auth.uid()
    or public.is_admin()
    or (
      visibility = 'club'
      and club_id is not null
      and club_id = public.current_user_club_id()
      and (public.has_role('Coach') or public.has_role('TeamAdmin'))
    )
  );

drop policy if exists "training_templates_scope_delete" on public.training_templates;
create policy "training_templates_scope_delete" on public.training_templates
  for delete
  using (
    coalesce(owner_user_id, owner_id) = auth.uid()
    or public.is_admin()
    or (
      visibility = 'club'
      and club_id is not null
      and club_id = public.current_user_club_id()
      and (public.has_role('Coach') or public.has_role('TeamAdmin'))
    )
  );

drop policy if exists "training_plan_items_scope_select" on public.training_plan_items;
create policy "training_plan_items_scope_select" on public.training_plan_items
  for select
  using (
    owner_id = auth.uid()
    or assigned_athlete_id = auth.uid()
    or coach_id = auth.uid()
    or public.is_admin()
    or (
      public.has_role('Coach')
      and club_id is not null
      and club_id = public.current_user_club_id()
    )
  );

drop policy if exists "training_plan_items_scope_write" on public.training_plan_items;
create policy "training_plan_items_scope_write" on public.training_plan_items
  for all
  using (
    owner_id = auth.uid()
    or coach_id = auth.uid()
    or public.is_admin()
    or (
      public.has_role('Coach')
      and club_id is not null
      and club_id = public.current_user_club_id()
    )
  )
  with check (
    owner_id = auth.uid()
    or coach_id = auth.uid()
    or public.is_admin()
    or (
      public.has_role('Coach')
      and club_id is not null
      and club_id = public.current_user_club_id()
    )
  );

drop policy if exists "season_goals_scope_select" on public.season_goals;
create policy "season_goals_scope_select" on public.season_goals
  for select
  using (
    athlete_id = auth.uid()
    or assigned_by = auth.uid()
    or public.is_admin()
    or exists (
      select 1 from public.profiles p
      where p.id = season_goals.athlete_id
        and p.club_id is not null
        and p.club_id = public.current_user_club_id()
        and public.has_role('Coach')
    )
  );

drop policy if exists "season_goals_scope_write" on public.season_goals;
create policy "season_goals_scope_write" on public.season_goals
  for all
  using (
    athlete_id = auth.uid()
    or public.is_admin()
    or exists (
      select 1 from public.profiles p
      where p.id = season_goals.athlete_id
        and p.club_id is not null
        and p.club_id = public.current_user_club_id()
        and public.has_role('Coach')
    )
  )
  with check (
    athlete_id = auth.uid()
    or public.is_admin()
    or exists (
      select 1 from public.profiles p
      where p.id = season_goals.athlete_id
        and p.club_id is not null
        and p.club_id = public.current_user_club_id()
        and public.has_role('Coach')
    )
  );
