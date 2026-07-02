do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'competition_results_competition_id_fk') then
    alter table public.competition_results
      add constraint competition_results_competition_id_fk
      foreign key (competition_id)
      references public.competitions(id)
      on delete cascade;
  end if;

  if not exists (select 1 from pg_constraint where conname = 'competition_results_athlete_id_fk') then
    alter table public.competition_results
      add constraint competition_results_athlete_id_fk
      foreign key (athlete_id)
      references public.profiles(id)
      on delete cascade;
  end if;

  if not exists (select 1 from pg_constraint where conname = 'competitions_club_id_fk') then
    alter table public.competitions
      add constraint competitions_club_id_fk
      foreign key (club_id)
      references public.clubs(id)
      on delete set null;
  end if;
end;
$$;

notify pgrst, 'reload schema';
