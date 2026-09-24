-- Reconcile schema drift found on paddlio-dev after the real iPhone sync test.
-- Additive/idempotent: no table is dropped and existing application data is retained.

alter table if exists public.notifications
  add column if not exists message text,
  add column if not exists read boolean not null default false,
  add column if not exists related_entity_type text,
  add column if not exists related_entity_id uuid;

update public.notifications
set message = coalesce(message, body),
    read = coalesce(read, read_at is not null)
where message is null or read is null;

create index if not exists idx_notifications_user_read_created
  on public.notifications(user_id, read, created_at desc);

create index if not exists idx_notifications_related_entity
  on public.notifications(related_entity_type, related_entity_id);

alter table if exists public.training_plan_items
  add column if not exists deleted_at timestamptz,
  add column if not exists repeat_series_id text;

create index if not exists idx_training_plan_items_deleted_at_0029
  on public.training_plan_items(deleted_at);

create index if not exists idx_training_plan_items_active_date_0029
  on public.training_plan_items(club_id, date)
  where deleted_at is null;

create index if not exists idx_training_plan_items_repeat_series_id_0033
  on public.training_plan_items(repeat_series_id)
  where repeat_series_id is not null;

alter table if exists public.training_feedback
  add column if not exists feedback_type text not null default 'athlete',
  add column if not exists author_id uuid references public.profiles(id) on delete set null,
  add column if not exists technical_assessment text,
  add column if not exists goal_achievement text,
  add column if not exists load_assessment text,
  add column if not exists observation text,
  add column if not exists improvement_point text;

update public.training_feedback
set feedback_type = 'athlete',
    author_id = coalesce(author_id, athlete_id)
where feedback_type is null or author_id is null;

alter table public.training_feedback
  drop constraint if exists training_feedback_feedback_type_check,
  drop constraint if exists training_feedback_goal_achievement_check,
  drop constraint if exists training_feedback_load_assessment_check;

alter table public.training_feedback
  add constraint training_feedback_feedback_type_check check (feedback_type in ('athlete', 'trainer')),
  add constraint training_feedback_goal_achievement_check check (goal_achievement is null or goal_achievement in ('yes', 'partly', 'no')),
  add constraint training_feedback_load_assessment_check check (load_assessment is null or load_assessment in ('too_low', 'appropriate', 'too_high'));

with ranked as (
  select id,
         row_number() over (
           partition by training_plan_item_id, athlete_id, feedback_type
           order by updated_at desc nulls last, created_at desc nulls last, id desc
         ) as duplicate_rank
  from public.training_feedback
)
delete from public.training_feedback feedback
using ranked
where feedback.id = ranked.id and ranked.duplicate_rank > 1;

do $$
declare
  constraint_name text;
begin
  for constraint_name in
    select con.conname
    from pg_constraint con
    join pg_class rel on rel.oid = con.conrelid
    join pg_namespace nsp on nsp.oid = rel.relnamespace
    where nsp.nspname = 'public'
      and rel.relname = 'training_feedback'
      and con.contype = 'u'
      and pg_get_constraintdef(con.oid) = 'UNIQUE (training_plan_item_id, athlete_id)'
  loop
    execute format('alter table public.training_feedback drop constraint %I', constraint_name);
  end loop;
end
$$;

create unique index if not exists training_feedback_identity_0036
  on public.training_feedback(training_plan_item_id, athlete_id, feedback_type);

create index if not exists training_feedback_author_0036
  on public.training_feedback(author_id);

create or replace function public.paddlio_sync_training_feedback_0030()
returns trigger
language plpgsql
as $$
begin
  new.training_plan_item_id := coalesce(new.training_plan_item_id, new.training_id);
  new.training_id := coalesce(new.training_id, new.training_plan_item_id);
  new.athlete_id := coalesce(new.athlete_id, new.athlete_user_id);
  new.athlete_user_id := coalesce(new.athlete_user_id, new.athlete_id);
  new.feedback_type := coalesce(new.feedback_type, 'athlete');
  new.author_id := coalesce(
    new.author_id,
    case when new.feedback_type = 'trainer' then new.coach_id else new.athlete_id end
  );
  return new;
end;
$$;

create or replace function public.paddlio_can_write_training_feedback_0024(item public.training_feedback)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.paddlio_is_admin_415()
    or (
      item.feedback_type = 'athlete'
      and item.athlete_id = auth.uid()
      and item.author_id = auth.uid()
    )
    or (
      item.feedback_type = 'trainer'
      and item.author_id = auth.uid()
      and item.coach_id = auth.uid()
      and exists (
        select 1
        from public.training_plan_items t
        where t.id = item.training_plan_item_id
          and (
            t.owner_id = auth.uid()
            or t.coach_id = auth.uid()
            or (
              t.club_id is not null
              and public.paddlio_user_has_club_role_0024(t.club_id, array['Coach','ClubAdmin','Admin'])
            )
          )
      )
    );
$$;

drop policy if exists "training_feedback_scope_write" on public.training_feedback;

notify pgrst, 'reload schema';
