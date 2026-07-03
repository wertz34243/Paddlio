-- Paddlio 3.3 - Realtime, notifications and offline queue foundation
-- Additive migration: keeps existing data intact.

alter table public.notifications
  add column if not exists message text,
  add column if not exists read boolean not null default false,
  add column if not exists related_entity_type text,
  add column if not exists related_entity_id uuid;

update public.notifications
set message = coalesce(message, body),
    read = coalesce(read, read_at is not null)
where message is null or read is null;

create index if not exists idx_notifications_user_read_created
  on public.notifications (user_id, read, created_at desc);

create index if not exists idx_notifications_related_entity
  on public.notifications (related_entity_type, related_entity_id);

create index if not exists idx_training_feedback_coach_id
  on public.training_feedback (coach_id);

create index if not exists idx_group_members_athlete_id
  on public.group_members (athlete_id);

do $$
declare
  table_name text;
  realtime_tables text[] := array[
    'training_plan_items',
    'training_feedback',
    'season_goals',
    'notifications',
    'training_groups',
    'group_members',
    'profiles'
  ];
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    foreach table_name in array realtime_tables loop
      if not exists (
        select 1
        from pg_publication_tables
        where pubname = 'supabase_realtime'
          and schemaname = 'public'
          and tablename = table_name
      ) then
        execute format('alter publication supabase_realtime add table public.%I', table_name);
      end if;
    end loop;
  end if;
end $$;

drop policy if exists "notifications owner read" on public.notifications;
create policy "notifications owner read"
  on public.notifications
  for select
  using (
    user_id = auth.uid()
    or public.is_admin()
  );

drop policy if exists "notifications owner update" on public.notifications;
create policy "notifications owner update"
  on public.notifications
  for update
  using (
    user_id = auth.uid()
    or public.is_admin()
  )
  with check (
    user_id = auth.uid()
    or public.is_admin()
  );

drop policy if exists "notifications service insert" on public.notifications;
create policy "notifications service insert"
  on public.notifications
  for insert
  with check (
    auth.uid() is not null
  );
