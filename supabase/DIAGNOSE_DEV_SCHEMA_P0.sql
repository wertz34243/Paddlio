-- READ-ONLY diagnosis for paddlio-dev (project ref nlllqsfdhfiwticrcrnp).
-- Do not run against production. This file changes no schema and no data.

create temporary table expected_paddlio_tables_0043 (table_name text primary key, source_migration text);

insert into expected_paddlio_tables_0043 (table_name, source_migration) values
  ('training_journal_entries', '0022_training_journal_cloud_sync_415.sql'),
  ('direct_messages', '0011_communication_team_system.sql'), ('group_messages', '0011_communication_team_system.sql'),
  ('tasks', '0011_communication_team_system.sql'), ('task_assignments', '0011_communication_team_system.sql'),
  ('training_attendance', '0011_communication_team_system.sql'), ('club_posts', '0011_communication_team_system.sql'),
  ('file_attachments', '0011/0014'), ('club_messages', '0010_club_management_portal.sql'),
  ('club_material', '0010_club_management_portal.sql'), ('boats', '0010/0014'),
  ('club_events', '0010_club_management_portal.sql'), ('club_documents', '0010_club_management_portal.sql'),
  ('club_settings', '0010_club_management_portal.sql'), ('personal_bests', '0012_results_polar_beta_readiness.sql'),
  ('result_imports', '0012_results_polar_beta_readiness.sql'), ('external_connections', '0012_results_polar_beta_readiness.sql'),
  ('external_training_sessions', '0012_results_polar_beta_readiness.sql'), ('beta_readiness_checks', '0012/0016'),
  ('beta_feedback', '0013/0014'), ('beta_testers', '0013_beta_test_release.sql'),
  ('academy_categories', '0026_academy_module.sql'), ('academy_courses', '0026_academy_module.sql'),
  ('academy_lessons', '0026_academy_module.sql'), ('academy_content_blocks', '0026_academy_module.sql'),
  ('academy_learning_paths', '0026_academy_module.sql'), ('academy_learning_path_items', '0026_academy_module.sql'),
  ('academy_progress', '0026_academy_module.sql'), ('academy_assignments', '0026_academy_module.sql'),
  ('academy_quizzes', '0026_academy_module.sql'), ('academy_quiz_questions', '0026_academy_module.sql'),
  ('academy_quiz_attempts', '0026_academy_module.sql'), ('academy_favorites', '0026_academy_module.sql'),
  ('academy_media', '0026_academy_module.sql');

-- Result 1: missing_table is real drift; present points to PostgREST cache/exposure.
select expected.table_name, expected.source_migration,
       case when tables.table_name is null then 'missing_table' else 'present' end as dev_state
from expected_paddlio_tables_0043 expected
left join information_schema.tables tables
  on tables.table_schema = 'public' and tables.table_name = expected.table_name
order by expected.source_migration, expected.table_name;

-- Result 2: actual columns.
select columns.table_name, columns.ordinal_position, columns.column_name, columns.data_type, columns.is_nullable
from information_schema.columns columns
join expected_paddlio_tables_0043 expected on expected.table_name = columns.table_name
where columns.table_schema = 'public'
order by columns.table_name, columns.ordinal_position;

-- Result 3: columns required by the current competition query and payload.
with expected_columns(table_name, column_name, source_migration) as (values
  ('competitions', 'organizer', '0008'), ('competitions', 'course', '0008'),
  ('competitions', 'source', '0008'), ('competitions', 'external_id', '0008'),
  ('competitions', 'source_url', '0008'), ('competitions', 'user_id', '0023'),
  ('competitions', 'created_by', '0023'), ('competitions', 'level', '0023'),
  ('competition_results', 'competition_name', '0016'), ('competition_results', 'competition_date', '0016'),
  ('competition_results', 'location', '0016'), ('competition_results', 'course_name', '0016'),
  ('competition_results', 'run1_time', '0023'), ('competition_results', 'run1_penalties', '0023'),
  ('competition_results', 'run1_total', '0023'), ('competition_results', 'run2_time', '0023'),
  ('competition_results', 'run2_penalties', '0023'), ('competition_results', 'run2_total', '0023'),
  ('competition_results', 'best_total', '0023'), ('competition_results', 'created_by', '0023'),
  ('competition_results', 'club_id', '0023'), ('competition_results', 'deleted_at', '0016')
)
select expected_columns.*,
       case when columns.column_name is null then 'missing_column' else 'present' end as dev_state
from expected_columns
left join information_schema.columns columns
  on columns.table_schema = 'public' and columns.table_name = expected_columns.table_name
 and columns.column_name = expected_columns.column_name
order by expected_columns.table_name, expected_columns.column_name;

-- Result 4: RLS and policies.
select expected.table_name, coalesce(classes.relrowsecurity, false) as rls_enabled,
       policies.policyname, policies.cmd, policies.roles, policies.qual, policies.with_check
from expected_paddlio_tables_0043 expected
left join pg_class classes on classes.oid = to_regclass(format('public.%I', expected.table_name))
left join pg_policies policies on policies.schemaname = 'public' and policies.tablename = expected.table_name
order by expected.table_name, policies.policyname;

-- Result 5: indexes and Realtime publication.
select expected.table_name, indexes.indexname, indexes.indexdef,
       exists (select 1 from pg_publication_tables publication
         where publication.pubname = 'supabase_realtime' and publication.schemaname = 'public'
           and publication.tablename = expected.table_name) as in_realtime_publication
from expected_paddlio_tables_0043 expected
left join pg_indexes indexes on indexes.schemaname = 'public' and indexes.tablename = expected.table_name
order by expected.table_name, indexes.indexname;

-- Result 6: migration history.
select version, name, statements from supabase_migrations.schema_migrations order by version;
