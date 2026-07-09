-- Paddlio 4.1.5 - Training journal cloud sync
-- Safe, idempotent and non-destructive.

create table if not exists public.training_journal_entries (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid not null references public.profiles(id) on delete cascade,
  training_id uuid,
  date date not null,
  training_rating integer,
  feeling integer,
  fatigue integer,
  sleep integer,
  motivation integer,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint training_journal_scale_check check (
    (training_rating is null or training_rating between 1 and 10)
    and (feeling is null or feeling between 1 and 10)
    and (fatigue is null or fatigue between 1 and 10)
    and (sleep is null or sleep between 1 and 10)
    and (motivation is null or motivation between 1 and 10)
  )
);

alter table public.training_journal_entries add column if not exists athlete_id uuid references public.profiles(id) on delete cascade;
alter table public.training_journal_entries add column if not exists training_id uuid;
alter table public.training_journal_entries add column if not exists date date;
alter table public.training_journal_entries add column if not exists training_rating integer;
alter table public.training_journal_entries add column if not exists feeling integer;
alter table public.training_journal_entries add column if not exists fatigue integer;
alter table public.training_journal_entries add column if not exists sleep integer;
alter table public.training_journal_entries add column if not exists motivation integer;
alter table public.training_journal_entries add column if not exists notes text;
alter table public.training_journal_entries add column if not exists created_at timestamptz default now();
alter table public.training_journal_entries add column if not exists updated_at timestamptz default now();

create index if not exists idx_training_journal_athlete_date
  on public.training_journal_entries(athlete_id, date desc);

create index if not exists idx_training_journal_training_id
  on public.training_journal_entries(training_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_training_journal_entries_updated_at on public.training_journal_entries;
create trigger set_training_journal_entries_updated_at
  before update on public.training_journal_entries
  for each row
  execute function public.set_updated_at();

alter table public.training_journal_entries enable row level security;

drop policy if exists training_journal_select_415 on public.training_journal_entries;
create policy training_journal_select_415
  on public.training_journal_entries
  for select
  using (
    athlete_id = auth.uid()
    or public.current_user_is_admin()
    or exists (
      select 1
      from public.profiles p
      where p.id = public.training_journal_entries.athlete_id
        and p.club_id = public.current_user_club_id()
        and (
          public.has_role('Coach')
          or public.has_role('ClubAdmin')
          or public.has_role('TeamAdmin')
        )
    )
  );

drop policy if exists training_journal_write_415 on public.training_journal_entries;
create policy training_journal_write_415
  on public.training_journal_entries
  for all
  using (
    athlete_id = auth.uid()
    or public.current_user_is_admin()
  )
  with check (
    athlete_id = auth.uid()
    or public.current_user_is_admin()
  );

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    if not exists (
      select 1
      from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = 'training_journal_entries'
    ) then
      alter publication supabase_realtime add table public.training_journal_entries;
    end if;

    alter table public.training_journal_entries replica identity full;
  end if;
end $$;
