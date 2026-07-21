-- Paddlio training repeat series support.
-- Adds a stable client-generated series id so recurring trainings can be deleted together.

alter table if exists public.training_plan_items
  add column if not exists repeat_series_id text;

create index if not exists idx_training_plan_items_repeat_series_id_0033
  on public.training_plan_items(repeat_series_id)
  where repeat_series_id is not null;

comment on column public.training_plan_items.repeat_series_id is
  'Stable Paddlio repeat-series identifier used to edit or soft-delete recurring training entries together.';
