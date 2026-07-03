create table if not exists public.smart_coach_recommendations (
  id text primary key,
  owner_user_id uuid not null references public.profiles(id) on delete cascade,
  created_for_user_id uuid not null references public.profiles(id) on delete cascade,
  created_by_system boolean not null default true,
  club_id uuid references public.clubs(id) on delete set null,
  category text not null,
  priority text not null default 'medium',
  title text not null,
  message text,
  reason text,
  suggested_action text,
  status text not null default 'open',
  related_entity_type text,
  related_entity_id text,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint smart_coach_category_check check (category in ('training', 'regeneration', 'technik', 'ausdauer', 'kraft', 'wettkampf', 'ziele', 'material', 'warnung', 'motivation')),
  constraint smart_coach_priority_check check (priority in ('low', 'medium', 'high')),
  constraint smart_coach_status_check check (status in ('open', 'done', 'dismissed'))
);

create index if not exists smart_coach_owner_idx on public.smart_coach_recommendations(owner_user_id);
create index if not exists smart_coach_created_for_idx on public.smart_coach_recommendations(created_for_user_id);
create index if not exists smart_coach_club_idx on public.smart_coach_recommendations(club_id);
create index if not exists smart_coach_status_idx on public.smart_coach_recommendations(status);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists smart_coach_recommendations_updated_at on public.smart_coach_recommendations;
create trigger smart_coach_recommendations_updated_at
before update on public.smart_coach_recommendations
for each row
execute function public.set_updated_at();

alter table public.smart_coach_recommendations enable row level security;

drop policy if exists "Athletes read own smart coach recommendations" on public.smart_coach_recommendations;
create policy "Athletes read own smart coach recommendations"
on public.smart_coach_recommendations
for select
to authenticated
using (
  created_for_user_id = auth.uid()
  or owner_user_id = auth.uid()
  or exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and 'Admin' = any(p.roles)
  )
  or exists (
    select 1
    from public.profiles coach
    join public.profiles athlete on athlete.id = smart_coach_recommendations.created_for_user_id
    where coach.id = auth.uid()
      and (('Coach' = any(coach.roles)) or ('TeamAdmin' = any(coach.roles)))
      and coach.club_id is not null
      and coach.club_id = athlete.club_id
  )
);

drop policy if exists "Users create permitted smart coach recommendations" on public.smart_coach_recommendations;
create policy "Users create permitted smart coach recommendations"
on public.smart_coach_recommendations
for insert
to authenticated
with check (
  owner_user_id = auth.uid()
  and (
    created_for_user_id = auth.uid()
    or exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and 'Admin' = any(p.roles)
    )
    or exists (
      select 1
      from public.profiles coach
      join public.profiles athlete on athlete.id = smart_coach_recommendations.created_for_user_id
      where coach.id = auth.uid()
        and (('Coach' = any(coach.roles)) or ('TeamAdmin' = any(coach.roles)))
        and coach.club_id is not null
        and coach.club_id = athlete.club_id
    )
  )
);

drop policy if exists "Users update permitted smart coach recommendations" on public.smart_coach_recommendations;
create policy "Users update permitted smart coach recommendations"
on public.smart_coach_recommendations
for update
to authenticated
using (
  created_for_user_id = auth.uid()
  or owner_user_id = auth.uid()
  or exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and 'Admin' = any(p.roles)
  )
  or exists (
    select 1
    from public.profiles coach
    join public.profiles athlete on athlete.id = smart_coach_recommendations.created_for_user_id
    where coach.id = auth.uid()
      and (('Coach' = any(coach.roles)) or ('TeamAdmin' = any(coach.roles)))
      and coach.club_id is not null
      and coach.club_id = athlete.club_id
  )
)
with check (
  owner_user_id = auth.uid()
  or created_for_user_id = auth.uid()
  or exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and 'Admin' = any(p.roles)
  )
  or exists (
    select 1
    from public.profiles coach
    join public.profiles athlete on athlete.id = smart_coach_recommendations.created_for_user_id
    where coach.id = auth.uid()
      and (('Coach' = any(coach.roles)) or ('TeamAdmin' = any(coach.roles)))
      and coach.club_id is not null
      and coach.club_id = athlete.club_id
  )
);
