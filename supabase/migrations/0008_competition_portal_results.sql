-- Paddlio 3.4 - Competition portal and result management
-- Additive migration: keeps existing competitions and results intact.

alter table public.competitions
  add column if not exists organizer text,
  add column if not exists course text,
  add column if not exists source text default 'manual',
  add column if not exists external_id text,
  add column if not exists source_url text;

alter table public.competition_results
  add column if not exists starter_field integer;

create index if not exists idx_competitions_club_start_date
  on public.competitions (club_id, start_date desc);

create index if not exists idx_competitions_source_external
  on public.competitions (source, external_id);

create index if not exists idx_competition_results_athlete_boat
  on public.competition_results (athlete_id, boat_class);

create index if not exists idx_competition_results_best_total
  on public.competition_results (best_total_seconds);

do $$
declare
  table_name text;
  realtime_tables text[] := array[
    'competitions',
    'competition_results'
  ];
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    foreach table_name in array realtime_tables loop
      if not exists (
        select 1
        from pg_publication_tables
        where pubname = 'supabase_realtime'
          and schemaname = 'public'
          and tablename = table_name
      ) then
        execute format('alter publication supabase_realtime add table public.%I', table_name);
      end if;
    end loop;
  end if;
end $$;

drop policy if exists "competitions_club_or_admin_select" on public.competitions;
create policy "competitions_club_or_admin_select"
  on public.competitions
  for select
  using (
    club_id = public.current_user_club_id()
    or public.is_admin()
  );

drop policy if exists "competition_results_owner_club_or_admin_select" on public.competition_results;
create policy "competition_results_owner_club_or_admin_select"
  on public.competition_results
  for select
  using (
    athlete_id = auth.uid()
    or public.is_admin()
    or exists (
      select 1
      from public.profiles athlete_profile
      where athlete_profile.id = competition_results.athlete_id
        and athlete_profile.club_id = public.current_user_club_id()
        and public.has_role('Coach')
    )
  );
