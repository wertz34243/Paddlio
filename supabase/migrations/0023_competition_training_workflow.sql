-- Paddlio - Competition and training workflow hardening
-- Safe, idempotent and non-destructive.

alter table public.competitions
  add column if not exists user_id uuid references public.profiles(id) on delete set null,
  add column if not exists created_by uuid references public.profiles(id) on delete set null,
  add column if not exists course text,
  add column if not exists level text default 'general';

alter table public.training_plan_items
  add column if not exists owner_id uuid references public.profiles(id) on delete set null,
  add column if not exists coach_id uuid references public.profiles(id) on delete set null,
  add column if not exists assigned_athlete_id uuid references public.profiles(id) on delete set null,
  add column if not exists assigned_group_id uuid references public.training_groups(id) on delete set null,
  add column if not exists club_id uuid references public.clubs(id) on delete set null,
  add column if not exists status text default 'planned';

alter table public.competition_results
  add column if not exists run1_time numeric,
  add column if not exists run1_time_seconds numeric,
  add column if not exists run1_penalties integer default 0,
  add column if not exists run1_penalty_seconds numeric,
  add column if not exists run1_total numeric,
  add column if not exists run2_time numeric,
  add column if not exists run2_time_seconds numeric,
  add column if not exists run2_penalties integer default 0,
  add column if not exists run2_penalty_seconds numeric,
  add column if not exists run2_total numeric,
  add column if not exists best_total numeric,
  add column if not exists best_total_seconds numeric,
  add column if not exists created_by uuid references public.profiles(id) on delete set null,
  add column if not exists club_id uuid references public.clubs(id) on delete set null;

alter table public.training_journal_entries
  add column if not exists training_plan_entry_id uuid references public.training_plan_items(id) on delete set null,
  add column if not exists completion_status text default 'completed',
  add column if not exists actual_duration_minutes integer,
  add column if not exists actual_distance_km numeric,
  add column if not exists average_heart_rate integer,
  add column if not exists perceived_exertion integer,
  add column if not exists pain_notes text;

alter table public.training_plan_items
  drop constraint if exists training_plan_items_status_check;

alter table public.training_plan_items
  add constraint training_plan_items_status_check check (
    status in ('planned', 'in_progress', 'completed', 'partially_completed', 'done', 'skipped', 'cancelled', 'geplant', 'erledigt', 'ausgelassen')
  );

update public.competitions
set level = case
  when lower(coalesce(level, '')) in ('training', '') then 'general'
  when lower(level) in ('vereinsrennen', 'vereinswettkampf', 'club') then 'club'
  when lower(level) in ('bezirk', 'bezirksmeisterschaft', 'district') then 'district'
  when lower(level) in ('westdeutsch', 'landesmeisterschaft', 'state') then 'state'
  when lower(level) in ('dm', 'deutsche meisterschaft', 'national') then 'national'
  when lower(level) in ('international', 'internationaler wettkampf') then 'international'
  else level
end;

update public.competition_results
set
  run1_total = coalesce(run1_time, run1_time_seconds, 0) + greatest(coalesce(run1_penalties, run1_penalty_seconds, 0), 0),
  run2_total = coalesce(run2_time, run2_time_seconds, 0) + greatest(coalesce(run2_penalties, run2_penalty_seconds, 0), 0),
  best_total = least(
    coalesce(run1_time, run1_time_seconds, 0) + greatest(coalesce(run1_penalties, run1_penalty_seconds, 0), 0),
    coalesce(run2_time, run2_time_seconds, 0) + greatest(coalesce(run2_penalties, run2_penalty_seconds, 0), 0)
  ),
  best_total_seconds = least(
    coalesce(run1_time, run1_time_seconds, 0) + greatest(coalesce(run1_penalties, run1_penalty_seconds, 0), 0),
    coalesce(run2_time, run2_time_seconds, 0) + greatest(coalesce(run2_penalties, run2_penalty_seconds, 0), 0)
  );

create index if not exists idx_competitions_user_start_date
  on public.competitions(user_id, start_date desc);

create index if not exists idx_competitions_created_by
  on public.competitions(created_by);

create unique index if not exists training_journal_entries_plan_unique
  on public.training_journal_entries(athlete_id, training_plan_entry_id)
  where training_plan_entry_id is not null;

create index if not exists idx_training_journal_plan_entry
  on public.training_journal_entries(training_plan_entry_id);

alter table public.competitions enable row level security;
alter table public.competition_results enable row level security;
alter table public.training_plan_items enable row level security;
alter table public.training_journal_entries enable row level security;

drop policy if exists competitions_select_own_club_admin_0023 on public.competitions;
create policy competitions_select_own_club_admin_0023
  on public.competitions
  for select
  using (
    user_id = auth.uid()
    or created_by = auth.uid()
    or public.current_user_is_admin()
    or (
      club_id = public.current_user_club_id()
      and (
        public.has_role('Coach')
        or public.has_role('ClubAdmin')
        or public.has_role('TeamAdmin')
      )
    )
  );

drop policy if exists competitions_insert_own_0023 on public.competitions;
create policy competitions_insert_own_0023
  on public.competitions
  for insert
  with check (
    user_id = auth.uid()
    or created_by = auth.uid()
    or public.current_user_is_admin()
  );

drop policy if exists competitions_update_own_club_admin_0023 on public.competitions;
create policy competitions_update_own_club_admin_0023
  on public.competitions
  for update
  using (
    user_id = auth.uid()
    or created_by = auth.uid()
    or public.current_user_is_admin()
    or (
      club_id = public.current_user_club_id()
      and (
        public.has_role('Coach')
        or public.has_role('ClubAdmin')
        or public.has_role('TeamAdmin')
      )
    )
  )
  with check (
    user_id = auth.uid()
    or created_by = auth.uid()
    or public.current_user_is_admin()
  );

drop policy if exists competitions_delete_own_admin_0023 on public.competitions;
create policy competitions_delete_own_admin_0023
  on public.competitions
  for delete
  using (
    user_id = auth.uid()
    or created_by = auth.uid()
    or public.current_user_is_admin()
  );

drop policy if exists competition_results_write_own_0023 on public.competition_results;
create policy competition_results_write_own_0023
  on public.competition_results
  for all
  using (
    athlete_id = auth.uid()
    or created_by = auth.uid()
    or public.current_user_is_admin()
    or exists (
      select 1
      from public.profiles athlete_profile
      where athlete_profile.id = public.competition_results.athlete_id
        and athlete_profile.club_id = public.current_user_club_id()
        and (
          public.has_role('Coach')
          or public.has_role('ClubAdmin')
          or public.has_role('TeamAdmin')
        )
    )
  )
  with check (
    athlete_id = auth.uid()
    or created_by = auth.uid()
    or public.current_user_is_admin()
  );

drop policy if exists training_plan_items_update_status_0023 on public.training_plan_items;
create policy training_plan_items_update_status_0023
  on public.training_plan_items
  for update
  using (
    owner_id = auth.uid()
    or assigned_athlete_id = auth.uid()
    or coach_id = auth.uid()
    or public.current_user_is_admin()
    or (
      club_id = public.current_user_club_id()
      and (
        public.has_role('Coach')
        or public.has_role('ClubAdmin')
        or public.has_role('TeamAdmin')
      )
    )
  )
  with check (
    owner_id = auth.uid()
    or assigned_athlete_id = auth.uid()
    or coach_id = auth.uid()
    or public.current_user_is_admin()
  );
