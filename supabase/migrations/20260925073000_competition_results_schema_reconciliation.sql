-- Complete the competition_results shape used by the active competition service.
-- DEV received only the reduced 0043 subset of the historical 0012 additions.

alter table public.competition_results
  add column if not exists age_class text,
  add column if not exists ranking integer,
  add column if not exists starter_count integer,
  add column if not exists gap_to_winner numeric,
  add column if not exists gap_to_podium numeric,
  add column if not exists gap_to_personal_best numeric,
  add column if not exists source_url text,
  add column if not exists source_type text,
  add column if not exists coach_note text,
  add column if not exists deleted_at timestamptz;

create index if not exists idx_competition_results_deleted_at_0045
  on public.competition_results(deleted_at);

alter table public.competition_results enable row level security;

notify pgrst, 'reload schema';
