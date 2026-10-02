create table if not exists public.competition_start_entries (
  id uuid primary key default gen_random_uuid(),
  competition_id uuid not null references public.competitions(id) on delete cascade,
  club_id uuid references public.clubs(id) on delete set null,
  athlete_id uuid references public.profiles(id) on delete set null,
  created_by uuid not null references public.profiles(id) on delete cascade,
  start_number integer not null,
  display_name text not null,
  boat_class text not null default 'K1',
  age_class text,
  source text not null default 'file',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint competition_start_entries_start_number_check check (start_number > 0),
  constraint competition_start_entries_boat_class_check check (boat_class in ('K1', 'C1', 'C2', 'Mannschaft')),
  constraint competition_start_entries_identity_unique unique (competition_id, start_number, boat_class)
);

create index if not exists competition_start_entries_competition_idx
  on public.competition_start_entries(competition_id, start_number);
create index if not exists competition_start_entries_athlete_idx
  on public.competition_start_entries(athlete_id);

alter table public.competition_start_entries enable row level security;

drop policy if exists competition_start_entries_select_own_club_0046 on public.competition_start_entries;
create policy competition_start_entries_select_own_club_0046
on public.competition_start_entries for select to authenticated
using (
  athlete_id = (select auth.uid())
  or created_by = (select auth.uid())
  or public.paddlio_is_admin_415()
  or (
    club_id is not null
    and public.paddlio_user_has_club_role_0024(club_id, array['Coach','TeamAdmin','ClubAdmin','Admin'])
  )
);

drop policy if exists competition_start_entries_write_own_club_0046 on public.competition_start_entries;
create policy competition_start_entries_write_own_club_0046
on public.competition_start_entries for all to authenticated
using (
  created_by = (select auth.uid())
  or public.paddlio_is_admin_415()
  or (
    club_id is not null
    and public.paddlio_user_has_club_role_0024(club_id, array['Coach','TeamAdmin','ClubAdmin','Admin'])
  )
)
with check (
  created_by = (select auth.uid())
  and (
    club_id is null
    or public.paddlio_user_has_club_role_0024(club_id, array['Coach','TeamAdmin','ClubAdmin','Admin'])
    or public.paddlio_is_admin_415()
  )
);

grant select, insert, update, delete on public.competition_start_entries to authenticated;

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
    and not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'competition_start_entries'
    ) then
    alter publication supabase_realtime add table public.competition_start_entries;
  end if;
end $$;

alter table public.competition_start_entries replica identity full;

create table if not exists public.imported_club_members (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.clubs(id) on delete cascade,
  imported_by uuid not null references public.profiles(id) on delete cascade,
  first_name text,
  last_name text,
  display_name text not null,
  email text,
  birth_date date,
  age_category text,
  boat_classes text[] not null default array[]::text[],
  member_kind text not null default 'athlete',
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint imported_club_members_kind_check check (member_kind in ('athlete', 'club_member')),
  constraint imported_club_members_status_check check (status in ('pending', 'invited', 'linked', 'inactive')),
  constraint imported_club_members_boats_check check (boat_classes <@ array['K1','C1']::text[])
);

create unique index if not exists imported_club_members_email_unique
  on public.imported_club_members(club_id, lower(email)) where email is not null and email <> '';
create index if not exists imported_club_members_club_idx on public.imported_club_members(club_id, status);

alter table public.imported_club_members enable row level security;
drop policy if exists imported_club_members_manage_0046 on public.imported_club_members;
create policy imported_club_members_manage_0046
on public.imported_club_members for all to authenticated
using (
  public.paddlio_is_admin_415()
  or public.paddlio_user_has_club_role_0024(club_id, array['Coach','TeamAdmin','ClubAdmin','Admin'])
)
with check (
  imported_by = (select auth.uid())
  and (
    public.paddlio_is_admin_415()
    or public.paddlio_user_has_club_role_0024(club_id, array['Coach','TeamAdmin','ClubAdmin','Admin'])
  )
);
grant select, insert, update, delete on public.imported_club_members to authenticated;

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
    and not exists (
      select 1 from pg_publication_tables
      where pubname='supabase_realtime' and schemaname='public' and tablename='imported_club_members'
    ) then
    alter publication supabase_realtime add table public.imported_club_members;
  end if;
end $$;
alter table public.imported_club_members replica identity full;

alter table public.training_journal_entries
  add column if not exists training_plan_entry_id uuid references public.training_plan_items(id) on delete set null,
  add column if not exists completion_status text default 'completed',
  add column if not exists actual_duration_minutes integer,
  add column if not exists actual_distance_km numeric,
  add column if not exists average_heart_rate integer,
  add column if not exists perceived_exertion integer,
  add column if not exists pain_notes text;

create unique index if not exists training_journal_entries_plan_unique
  on public.training_journal_entries(athlete_id, training_plan_entry_id)
  where training_plan_entry_id is not null;
create index if not exists idx_training_journal_plan_entry
  on public.training_journal_entries(training_plan_entry_id);
notify pgrst, 'reload schema';
