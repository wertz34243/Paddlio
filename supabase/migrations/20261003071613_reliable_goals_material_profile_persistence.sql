-- Persist every field exposed by the current goals and profile forms.
-- Additive only: existing rows and access policies remain unchanged.

alter table public.profiles
  add column if not exists profile_data jsonb not null default '{}'::jsonb;

alter table public.season_goals
  add column if not exists category text not null default 'personal',
  add column if not exists metric text not null default 'manual',
  add column if not exists direction text not null default 'over',
  add column if not exists priority text not null default 'medium',
  add column if not exists start_date date,
  add column if not exists coach_note text,
  add column if not exists athlete_note text;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'season_goals_category_20261003_check') then
    alter table public.season_goals add constraint season_goals_category_20261003_check
      check (category in ('performance', 'training', 'penalty', 'technical', 'personal'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'season_goals_metric_20261003_check') then
    alter table public.season_goals add constraint season_goals_metric_20261003_check
      check (metric in ('bestK1Total', 'bestC1Total', 'averagePenalty', 'trainingCount', 'trainingMinutes', 'manual'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'season_goals_direction_20261003_check') then
    alter table public.season_goals add constraint season_goals_direction_20261003_check
      check (direction in ('under', 'over', 'equal'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'season_goals_priority_20261003_check') then
    alter table public.season_goals add constraint season_goals_priority_20261003_check
      check (priority in ('low', 'medium', 'high'));
  end if;
end
$$;

notify pgrst, 'reload schema';
