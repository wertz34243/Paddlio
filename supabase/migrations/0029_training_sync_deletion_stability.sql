-- Paddlio 5.0 beta stabilization: stable training deletion sync.
-- Safe for existing databases. No data is deleted and no table is dropped.

alter table if exists public.training_plan_items
  add column if not exists deleted_at timestamptz;

create index if not exists idx_training_plan_items_deleted_at_0029
  on public.training_plan_items(deleted_at);

create index if not exists idx_training_plan_items_active_date_0029
  on public.training_plan_items(club_id, date)
  where deleted_at is null;

comment on column public.training_plan_items.deleted_at is
  'Soft-delete timestamp used by Paddlio sync so deleted trainings do not reappear from local cache or offline queues.';
