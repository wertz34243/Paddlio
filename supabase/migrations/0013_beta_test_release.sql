create table if not exists public.beta_feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  club_id uuid references public.clubs(id) on delete set null,
  user_role text,
  app_version text not null default '4.0.0-beta',
  category text not null,
  priority text not null default 'normal',
  title text not null,
  description text not null,
  page_path text,
  device_info text,
  browser_info text,
  status text not null default 'open',
  admin_note text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted_at timestamptz,
  constraint beta_feedback_category_check check (category in ('Fehler', 'Verbesserung', 'Design', 'Verstaendnisproblem', 'Wunsch', 'Sonstiges')),
  constraint beta_feedback_priority_check check (priority in ('niedrig', 'normal', 'hoch', 'kritisch')),
  constraint beta_feedback_status_check check (status in ('open', 'in_review', 'planned', 'fixed', 'rejected'))
);

create table if not exists public.beta_testers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  club_id uuid references public.clubs(id) on delete set null,
  tester_role text,
  status text not null default 'active',
  invited_at timestamptz default now(),
  last_seen_at timestamptz,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint beta_testers_status_check check (status in ('invited', 'active', 'paused', 'finished')),
  constraint beta_testers_user_unique unique (user_id)
);

create index if not exists beta_feedback_user_id_idx on public.beta_feedback(user_id);
create index if not exists beta_feedback_club_id_idx on public.beta_feedback(club_id);
create index if not exists beta_feedback_status_idx on public.beta_feedback(status);
create index if not exists beta_testers_user_id_idx on public.beta_testers(user_id);
create index if not exists beta_testers_club_id_idx on public.beta_testers(club_id);

create or replace function public.paddlio_is_admin()
returns boolean
language sql
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
      and 'Admin' = any(roles)
  );
$$;

create or replace function public.paddlio_current_club_id()
returns uuid
language sql
stable
as $$
  select club_id from public.profiles where id = auth.uid();
$$;

create or replace function public.paddlio_is_club_admin_like()
returns boolean
language sql
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
      and (roles && array['ClubAdmin', 'Admin'])
  );
$$;

do $$
begin
  if exists (select 1 from pg_proc where proname = 'set_updated_at') then
    execute 'drop trigger if exists set_beta_feedback_updated_at on public.beta_feedback';
    execute 'create trigger set_beta_feedback_updated_at before update on public.beta_feedback for each row execute function public.set_updated_at()';
    execute 'drop trigger if exists set_beta_testers_updated_at on public.beta_testers';
    execute 'create trigger set_beta_testers_updated_at before update on public.beta_testers for each row execute function public.set_updated_at()';
  end if;
end $$;

alter table public.beta_feedback enable row level security;
alter table public.beta_testers enable row level security;

drop policy if exists "beta feedback scoped select" on public.beta_feedback;
create policy "beta feedback scoped select" on public.beta_feedback
for select using (
  public.paddlio_is_admin()
  or user_id = auth.uid()
  or (public.paddlio_is_club_admin_like() and club_id = public.paddlio_current_club_id())
);

drop policy if exists "beta feedback own insert" on public.beta_feedback;
create policy "beta feedback own insert" on public.beta_feedback
for insert with check (
  public.paddlio_is_admin()
  or user_id = auth.uid()
);

drop policy if exists "beta feedback scoped update" on public.beta_feedback;
create policy "beta feedback scoped update" on public.beta_feedback
for update using (
  public.paddlio_is_admin()
  or user_id = auth.uid()
  or (public.paddlio_is_club_admin_like() and club_id = public.paddlio_current_club_id())
) with check (
  public.paddlio_is_admin()
  or user_id = auth.uid()
  or (public.paddlio_is_club_admin_like() and club_id = public.paddlio_current_club_id())
);

drop policy if exists "beta testers scoped select" on public.beta_testers;
create policy "beta testers scoped select" on public.beta_testers
for select using (
  public.paddlio_is_admin()
  or user_id = auth.uid()
  or (public.paddlio_is_club_admin_like() and club_id = public.paddlio_current_club_id())
);

drop policy if exists "beta testers admin write" on public.beta_testers;
create policy "beta testers admin write" on public.beta_testers
for all using (public.paddlio_is_admin())
with check (public.paddlio_is_admin());
