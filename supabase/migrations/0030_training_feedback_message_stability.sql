-- Paddlio 5.0 beta stabilization: training feedback visibility and compatibility.
-- Safe for existing databases. No data is deleted and no table is dropped.

alter table if exists public.training_feedback
  add column if not exists training_id uuid;

alter table if exists public.training_feedback
  add column if not exists athlete_user_id uuid;

update public.training_feedback
set
  training_id = coalesce(training_id, training_plan_item_id),
  athlete_user_id = coalesce(athlete_user_id, athlete_id)
where training_id is null
   or athlete_user_id is null;

create or replace function public.paddlio_sync_training_feedback_0030()
returns trigger
language plpgsql
as $$
begin
  new.training_plan_item_id := coalesce(new.training_plan_item_id, new.training_id);
  new.training_id := coalesce(new.training_id, new.training_plan_item_id);
  new.athlete_id := coalesce(new.athlete_id, new.athlete_user_id);
  new.athlete_user_id := coalesce(new.athlete_user_id, new.athlete_id);
  return new;
end;
$$;

drop trigger if exists training_feedback_sync_0030 on public.training_feedback;
create trigger training_feedback_sync_0030
before insert or update on public.training_feedback
for each row execute function public.paddlio_sync_training_feedback_0030();

create index if not exists idx_training_feedback_training_id_0030
  on public.training_feedback(training_id);

create index if not exists idx_training_feedback_athlete_user_id_0030
  on public.training_feedback(athlete_user_id);

comment on function public.paddlio_sync_training_feedback_0030() is
  'Keeps canonical and legacy Paddlio training feedback columns aligned so coach/athlete feedback stays visible across migrated databases.';
