-- Paddlio 3.2 - Trainingsplanung 2.0 and coach workflow foundation
-- Additive migration: keeps existing data intact and prepares fast coach/athlete planning queries.

create index if not exists idx_training_plan_items_date
  on public.training_plan_items (date);

create index if not exists idx_training_plan_items_athlete_date
  on public.training_plan_items (athlete_id, date);

create index if not exists idx_training_plan_items_club_date
  on public.training_plan_items (club_id, date);

create index if not exists idx_training_plan_items_created_by_date
  on public.training_plan_items (created_by_user_id, date);

create index if not exists idx_training_plan_items_assigned_athletes
  on public.training_plan_items using gin (assigned_athlete_ids);

create index if not exists idx_training_plan_items_assigned_groups
  on public.training_plan_items using gin (assigned_group_ids);

create index if not exists idx_training_feedback_training_id
  on public.training_feedback (training_id);

create index if not exists idx_training_feedback_athlete_user_id
  on public.training_feedback (athlete_user_id);

create index if not exists idx_training_templates_owner
  on public.training_templates (owner_user_id);

create index if not exists idx_training_templates_club_visibility
  on public.training_templates (club_id, visibility);

create index if not exists idx_training_groups_club_status
  on public.training_groups (club_id, status);

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = 'training_plan_items'
    ) then
      alter publication supabase_realtime add table public.training_plan_items;
    end if;

    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = 'training_feedback'
    ) then
      alter publication supabase_realtime add table public.training_feedback;
    end if;

    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = 'training_templates'
    ) then
      alter publication supabase_realtime add table public.training_templates;
    end if;
  end if;
end $$;
