-- Paddlio 5.0 profile sync: store full editable profile fields without
-- changing existing profile identity, role or club relations.
alter table if exists public.profiles
  add column if not exists profile_data jsonb not null default '{}'::jsonb;
