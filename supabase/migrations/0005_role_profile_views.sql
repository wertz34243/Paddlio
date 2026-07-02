-- Paddlio role-specific profile views
-- These views keep Athlete/Coach profile access compatible with the main profiles table.

create or replace view public.athlete_profiles
with (security_invoker = true)
as
select
  id,
  email,
  first_name,
  last_name,
  display_name,
  club_id,
  roles,
  status,
  avatar_url,
  age_category,
  boat_classes,
  paddle_side,
  created_at,
  updated_at
from public.profiles
where 'Athlete' = any(roles);

create or replace view public.coach_profiles
with (security_invoker = true)
as
select
  id,
  email,
  first_name,
  last_name,
  display_name,
  club_id,
  roles,
  status,
  avatar_url,
  age_category,
  boat_classes,
  paddle_side,
  created_at,
  updated_at
from public.profiles
where 'Coach' = any(roles)
   or 'TeamAdmin' = any(roles)
   or 'Admin' = any(roles);
