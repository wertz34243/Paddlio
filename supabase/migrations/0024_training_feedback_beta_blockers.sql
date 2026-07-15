-- Paddlio Beta blocker fix: training plan RLS, feedback RLS, MKC club aliases.
-- Safe to run repeatedly on an existing Supabase database.

create table if not exists public.club_aliases (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.clubs(id) on delete cascade,
  alias text not null,
  created_at timestamptz default now(),
  constraint club_aliases_unique unique (club_id, alias)
);

do $$
declare
  canonical_club_id uuid;
begin
  select id
    into canonical_club_id
  from public.clubs
  where lower(name) in ('mkc monheim', 'monheimer kanu club')
     or lower(coalesce(short_name, '')) in ('mkc', 'mkc monheim')
  order by
    case when lower(name) = 'mkc monheim' then 0 else 1 end,
    created_at asc
  limit 1;

  if canonical_club_id is null then
    insert into public.clubs (name, short_name, city, status, created_at, updated_at)
    values ('MKC Monheim', 'MKC', 'Monheim', 'active', now(), now())
    returning id into canonical_club_id;
  end if;

  update public.clubs
  set name = 'MKC Monheim',
      short_name = 'MKC',
      city = coalesce(nullif(city, ''), 'Monheim'),
      status = 'active',
      updated_at = now()
  where id = canonical_club_id;

  insert into public.club_aliases (club_id, alias)
  values
    (canonical_club_id, 'mkc monheim'),
    (canonical_club_id, 'monheimer kanu club'),
    (canonical_club_id, 'mohnheim'),
    (canonical_club_id, 'mkc')
  on conflict (club_id, alias) do nothing;

  insert into public.club_memberships (club_id, user_id, role, status, created_at, updated_at)
  select distinct canonical_club_id, cm.user_id, cm.role, cm.status, now(), now()
  from public.club_memberships cm
  join public.clubs c on c.id = cm.club_id
  where cm.club_id <> canonical_club_id
    and (
      lower(c.name) in ('monheimer kanu club', 'mohnheim', 'mkc monheim')
      or lower(coalesce(c.short_name, '')) in ('mkc', 'mohnheim')
    )
  on conflict (club_id, user_id) do update
  set role = excluded.role,
      status = case
        when public.club_memberships.status = 'active' then 'active'
        else excluded.status
      end,
      updated_at = now();

  update public.profiles
  set club_id = canonical_club_id,
      active_club_id = canonical_club_id,
      updated_at = now()
  where club_id in (
    select id
    from public.clubs
    where id <> canonical_club_id
      and (
        lower(name) in ('monheimer kanu club', 'mohnheim', 'mkc monheim')
        or lower(coalesce(short_name, '')) in ('mkc', 'mohnheim')
      )
  );

  update public.training_groups
  set club_id = canonical_club_id,
      updated_at = now()
  where club_id in (
    select id
    from public.clubs
    where id <> canonical_club_id
      and (
        lower(name) in ('monheimer kanu club', 'mohnheim', 'mkc monheim')
        or lower(coalesce(short_name, '')) in ('mkc', 'mohnheim')
      )
  );

  update public.training_plan_items
  set club_id = canonical_club_id,
      updated_at = now()
  where club_id in (
    select id
    from public.clubs
    where id <> canonical_club_id
      and (
        lower(name) in ('monheimer kanu club', 'mohnheim', 'mkc monheim')
        or lower(coalesce(short_name, '')) in ('mkc', 'mohnheim')
      )
  );

  update public.club_memberships
  set status = 'inactive',
      updated_at = now()
  where club_id in (
    select id
    from public.clubs
    where id <> canonical_club_id
      and (
        lower(name) in ('monheimer kanu club', 'mohnheim', 'mkc monheim')
        or lower(coalesce(short_name, '')) in ('mkc', 'mohnheim')
      )
  )
  and exists (
    select 1
    from public.club_memberships active_cm
    where active_cm.club_id = canonical_club_id
      and active_cm.user_id = public.club_memberships.user_id
  );

  update public.clubs
  set status = 'inactive',
      updated_at = now()
  where id <> canonical_club_id
    and (
      lower(name) in ('monheimer kanu club', 'mohnheim', 'mkc monheim')
      or lower(coalesce(short_name, '')) in ('mkc', 'mohnheim')
    );
end $$;

create or replace function public.paddlio_user_has_club_role_0024(target_club_id uuid, allowed_roles text[])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.status = 'active'
      and (
        p.club_id = target_club_id
        or p.active_club_id = target_club_id
      )
      and p.roles && allowed_roles
  )
  or exists (
    select 1
    from public.club_memberships cm
    where cm.club_id = target_club_id
      and cm.user_id = auth.uid()
      and cm.status = 'active'
      and cm.role = any(allowed_roles)
  );
$$;

create or replace function public.paddlio_can_read_training_item_0024(item public.training_plan_items)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.paddlio_is_admin_415()
    or item.owner_id = auth.uid()
    or item.coach_id = auth.uid()
    or item.assigned_athlete_id = auth.uid()
    or (
      item.club_id is not null
      and public.paddlio_user_has_club_role_0024(item.club_id, array['Coach','ClubAdmin','Admin'])
    )
    or (
      item.assigned_group_id is not null
      and exists (
        select 1
        from public.group_memberships gm
        where gm.group_id = item.assigned_group_id
          and gm.user_id = auth.uid()
          and gm.status = 'active'
      )
    )
    or (
      item.assigned_group_id is not null
      and exists (
        select 1
        from public.group_members gm
        where gm.group_id = item.assigned_group_id
          and coalesce(gm.user_id, gm.athlete_id) = auth.uid()
          and coalesce(gm.status, 'active') = 'active'
      )
    );
$$;

create or replace function public.paddlio_can_write_training_item_0024(item public.training_plan_items)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.paddlio_is_admin_415()
    or item.owner_id = auth.uid()
    or item.coach_id = auth.uid()
    or item.assigned_athlete_id = auth.uid()
    or (
      item.club_id is not null
      and public.paddlio_user_has_club_role_0024(item.club_id, array['Coach','ClubAdmin','Admin'])
    );
$$;

create or replace function public.paddlio_can_read_training_feedback_0024(item public.training_feedback)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.paddlio_is_admin_415()
    or item.athlete_id = auth.uid()
    or item.coach_id = auth.uid()
    or exists (
      select 1
      from public.training_plan_items t
      where t.id = item.training_plan_item_id
        and public.paddlio_can_read_training_item_0024(t)
    );
$$;

create or replace function public.paddlio_can_write_training_feedback_0024(item public.training_feedback)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.paddlio_is_admin_415()
    or item.athlete_id = auth.uid()
    or item.coach_id = auth.uid()
    or exists (
      select 1
      from public.training_plan_items t
      where t.id = item.training_plan_item_id
        and (
          t.assigned_athlete_id = auth.uid()
          or t.owner_id = auth.uid()
          or t.coach_id = auth.uid()
          or (
            t.club_id is not null
            and public.paddlio_user_has_club_role_0024(t.club_id, array['Coach','ClubAdmin','Admin'])
          )
        )
    );
$$;

alter table public.training_plan_items enable row level security;
alter table public.training_feedback enable row level security;

drop policy if exists training_plan_items_select_0024 on public.training_plan_items;
create policy training_plan_items_select_0024
  on public.training_plan_items
  for select
  to authenticated
  using (public.paddlio_can_read_training_item_0024(training_plan_items));

drop policy if exists training_plan_items_insert_0024 on public.training_plan_items;
create policy training_plan_items_insert_0024
  on public.training_plan_items
  for insert
  to authenticated
  with check (public.paddlio_can_write_training_item_0024(training_plan_items));

drop policy if exists training_plan_items_update_0024 on public.training_plan_items;
create policy training_plan_items_update_0024
  on public.training_plan_items
  for update
  to authenticated
  using (public.paddlio_can_read_training_item_0024(training_plan_items))
  with check (public.paddlio_can_write_training_item_0024(training_plan_items));

drop policy if exists training_plan_items_delete_0024 on public.training_plan_items;
create policy training_plan_items_delete_0024
  on public.training_plan_items
  for delete
  to authenticated
  using (
    public.paddlio_is_admin_415()
    or owner_id = auth.uid()
    or coach_id = auth.uid()
    or (
      club_id is not null
      and public.paddlio_user_has_club_role_0024(club_id, array['ClubAdmin','Admin'])
    )
  );

drop policy if exists training_feedback_select_0024 on public.training_feedback;
create policy training_feedback_select_0024
  on public.training_feedback
  for select
  to authenticated
  using (public.paddlio_can_read_training_feedback_0024(training_feedback));

drop policy if exists training_feedback_insert_0024 on public.training_feedback;
create policy training_feedback_insert_0024
  on public.training_feedback
  for insert
  to authenticated
  with check (public.paddlio_can_write_training_feedback_0024(training_feedback));

drop policy if exists training_feedback_update_0024 on public.training_feedback;
create policy training_feedback_update_0024
  on public.training_feedback
  for update
  to authenticated
  using (public.paddlio_can_read_training_feedback_0024(training_feedback))
  with check (public.paddlio_can_write_training_feedback_0024(training_feedback));

drop policy if exists training_feedback_delete_0024 on public.training_feedback;
create policy training_feedback_delete_0024
  on public.training_feedback
  for delete
  to authenticated
  using (
    public.paddlio_is_admin_415()
    or athlete_id = auth.uid()
    or coach_id = auth.uid()
  );

create index if not exists idx_training_plan_items_club_date_0024
  on public.training_plan_items(club_id, date);

create index if not exists idx_training_plan_items_assigned_athlete_0024
  on public.training_plan_items(assigned_athlete_id);

create index if not exists idx_training_feedback_training_athlete_0024
  on public.training_feedback(training_plan_item_id, athlete_id);
