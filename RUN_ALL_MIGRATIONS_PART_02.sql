
create table public.training_templates (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null,
  club_id uuid,
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
  constraint training_templates_category_check check (category in ('K1', 'C1', 'Ausdauer', 'Kraft', 'Technik', 'Regeneration', 'Wettkampf', 'Allgemein')),
  constraint training_templates_boat_class_check check (boat_class is null or boat_class in ('K1', 'C1', 'K1+C1', 'none')),
  constraint training_templates_intensity_check check (default_intensity in ('locker', 'mittel', 'hart', 'maximal')),
  constraint training_templates_visibility_check check (visibility in ('private', 'club'))
);

alter table public.profiles
  add constraint profiles_auth_user_id_fk foreign key (id) references auth.users(id) on delete cascade;

alter table public.profiles
  add constraint profiles_club_id_fk foreign key (club_id) references public.clubs(id);

alter table public.club_requests
  add constraint club_requests_requested_by_fk foreign key (requested_by) references public.profiles(id);

alter table public.club_requests
  add constraint club_requests_reviewed_by_fk foreign key (reviewed_by) references public.profiles(id);

alter table public.trainer_requests
  add constraint trainer_requests_user_id_fk foreign key (user_id) references public.profiles(id) on delete cascade;

alter table public.trainer_requests
  add constraint trainer_requests_club_id_fk foreign key (club_id) references public.clubs(id);

alter table public.trainer_requests
  add constraint trainer_requests_reviewed_by_fk foreign key (reviewed_by) references public.profiles(id);

alter table public.training_groups
  add constraint training_groups_club_id_fk foreign key (club_id) references public.clubs(id) on delete cascade;

alter table public.training_groups
  add constraint training_groups_coach_id_fk foreign key (coach_id) references public.profiles(id) on delete set null;

alter table public.group_members
  add constraint group_members_group_id_fk foreign key (group_id) references public.training_groups(id) on delete cascade;

alter table public.group_members
  add constraint group_members_athlete_id_fk foreign key (athlete_id) references public.profiles(id) on delete cascade;

alter table public.season_goals
  add constraint season_goals_athlete_id_fk foreign key (athlete_id) references public.profiles(id) on delete cascade;

alter table public.season_goals
  add constraint season_goals_assigned_by_fk foreign key (assigned_by) references public.profiles(id) on delete set null;

alter table public.training_plan_items
  add constraint training_plan_items_owner_id_fk foreign key (owner_id) references public.profiles(id) on delete cascade;

alter table public.training_plan_items
  add constraint training_plan_items_club_id_fk foreign key (club_id) references public.clubs(id) on delete set null;

alter table public.training_plan_items
  add constraint training_plan_items_coach_id_fk foreign key (coach_id) references public.profiles(id) on delete set null;

alter table public.training_plan_items
  add constraint training_plan_items_assigned_athlete_id_fk foreign key (assigned_athlete_id) references public.profiles(id) on delete cascade;

alter table public.training_plan_items
  add constraint training_plan_items_assigned_group_id_fk foreign key (assigned_group_id) references public.training_groups(id) on delete cascade;

alter table public.training_feedback
  add constraint training_feedback_training_plan_item_id_fk foreign key (training_plan_item_id) references public.training_plan_items(id) on delete cascade;

alter table public.training_feedback
  add constraint training_feedback_athlete_id_fk foreign key (athlete_id) references public.profiles(id) on delete cascade;

alter table public.training_feedback
  add constraint training_feedback_coach_id_fk foreign key (coach_id) references public.profiles(id) on delete set null;

alter table public.competitions
  add constraint competitions_club_id_fk foreign key (club_id) references public.clubs(id) on delete set null;

alter table public.competition_results
  add constraint competition_results_competition_id_fk foreign key (competition_id) references public.competitions(id) on delete cascade;

alter table public.competition_results
  add constraint competition_results_athlete_id_fk foreign key (athlete_id) references public.profiles(id) on delete cascade;

alter table public.materials
  add constraint materials_athlete_id_fk foreign key (athlete_id) references public.profiles(id) on delete cascade;

alter table public.notifications
  add constraint notifications_user_id_fk foreign key (user_id) references public.profiles(id) on delete cascade;

alter table public.audit_logs
  add constraint audit_logs_actor_id_fk foreign key (actor_id) references public.profiles(id) on delete set null;

alter table public.training_templates
  add constraint training_templates_owner_id_fk foreign key (owner_id) references public.profiles(id) on delete cascade;

alter table public.training_templates
  add constraint training_templates_club_id_fk foreign key (club_id) references public.clubs(id) on delete cascade;

alter table public.training_templates
  add constraint training_templates_created_by_fk foreign key (created_by) references public.profiles(id) on delete set null;

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
  select case
    when lower(email) = 't.kanu@outlook.com' then array['Athlete', 'Coach', 'Admin']::text[]
    else array['Athlete']::text[]
  end;
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
  safe_club_id uuid;
begin
  metadata_club_id := nullif(new.raw_user_meta_data ->> 'clubId', '');

  if metadata_club_id ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$' then
    safe_club_id := metadata_club_id::uuid;
  else
    safe_club_id := null;
  end if;

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
    coalesce(nullif(trim(coalesce(new.raw_user_meta_data ->> 'firstName', '') || ' ' || coalesce(new.raw_user_meta_data ->> 'lastName', '')), ''), new.email),
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
        roles = case
          when lower(excluded.email) = 't.kanu@outlook.com' then public.default_roles_for_email(excluded.email)
          else public.profiles.roles
        end,
        updated_at = now();

  return new;
end;
$$;

create trigger set_clubs_updated_at before update on public.clubs for each row execute function public.set_updated_at();
create trigger set_profiles_updated_at before update on public.profiles for each row execute function public.set_updated_at();
create trigger set_training_groups_updated_at before update on public.training_groups for each row execute function public.set_updated_at();
create trigger set_season_goals_updated_at before update on public.season_goals for each row execute function public.set_updated_at();
create trigger set_training_plan_items_updated_at before update on public.training_plan_items for each row execute function public.set_updated_at();
create trigger set_training_feedback_updated_at before update on public.training_feedback for each row execute function public.set_updated_at();
create trigger set_competitions_updated_at before update on public.competitions for each row execute function public.set_updated_at();
create trigger set_competition_results_updated_at before update on public.competition_results for each row execute function public.set_updated_at();
create trigger set_materials_updated_at before update on public.materials for each row execute function public.set_updated_at();
create trigger set_training_templates_updated_at before update on public.training_templates for each row execute function public.set_updated_at();

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_auth_user();

create index clubs_status_idx on public.clubs(status);
create index profiles_club_id_idx on public.profiles(club_id);
create index profiles_roles_idx on public.profiles using gin(roles);
create index club_requests_status_idx on public.club_requests(status);
create index trainer_requests_status_idx on public.trainer_requests(status);
create index training_groups_club_id_idx on public.training_groups(club_id);
