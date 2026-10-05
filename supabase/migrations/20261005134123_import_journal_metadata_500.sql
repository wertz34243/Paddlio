-- Persist imported training metadata in the journal source of truth so that
-- another device can render the same entry without a device-local session row.
alter table public.training_journal_entries
  add column if not exists title text,
  add column if not exists training_type text,
  add column if not exists boat_class text;

alter table public.training_journal_entries
  drop constraint if exists training_journal_entries_boat_class_500;
alter table public.training_journal_entries
  add constraint training_journal_entries_boat_class_500
  check (boat_class is null or boat_class in ('K1', 'C1'));

alter table public.training_journal_entries enable row level security;
notify pgrst, 'reload schema';
