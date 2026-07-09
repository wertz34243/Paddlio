-- Paddlio 4.1.5 - Full realtime publication sync
-- Safe, idempotent and non-destructive.
-- Run this in Supabase SQL Editor if live updates do not appear across devices.

do $$
declare
  table_name text;
  realtime_tables text[] := array[
    'profiles',
    'clubs',
    'club_memberships',
    'training_groups',
    'group_members',
    'group_memberships',
    'training_plan_items',
    'training_feedback',
    'training_journal_entries',
    'training_templates',
    'season_goals',
    'competitions',
    'competition_results',
    'materials',
    'notifications',
    'smart_coach_recommendations',
    'personal_bests',
    'result_imports',
    'external_connections',
    'external_training_sessions',
    'beta_readiness_checks',
    'beta_feedback',
    'beta_testers',
    'club_material',
    'boats',
    'club_events',
    'club_documents',
    'club_messages',
    'club_settings',
    'direct_messages',
    'group_messages',
    'club_posts',
    'tasks',
    'task_assignments',
    'training_attendance',
    'file_attachments',
    'trainer_requests',
    'club_requests'
  ];
begin
  if not exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    raise notice 'Publication supabase_realtime does not exist. Supabase Realtime may be disabled for this project.';
    return;
  end if;

  foreach table_name in array realtime_tables loop
    if to_regclass(format('public.%I', table_name)) is not null then
      if not exists (
        select 1
        from pg_publication_tables
        where pubname = 'supabase_realtime'
          and schemaname = 'public'
          and tablename = table_name
      ) then
        execute format('alter publication supabase_realtime add table public.%I', table_name);
      end if;

      execute format('alter table public.%I replica identity full', table_name);
    else
      raise notice 'Skipping missing table public.%', table_name;
    end if;
  end loop;
end $$;
