-- Paddlio beta profile/role audit
-- Read-only. Safe to run in the Supabase SQL Editor.

with auth_accounts as (
  select
    id as auth_user_id,
    lower(trim(email)) as email,
    email as auth_email,
    created_at,
    email_confirmed_at is not null as confirmed
  from auth.users
),
profile_rows as (
  select
    p.id as profile_id,
    lower(trim(p.email)) as email,
    p.email as profile_email,
    p.first_name,
    p.last_name,
    p.display_name,
    p.roles,
    p.status,
    p.club_id,
    c.name as club_name,
    p.age_category,
    p.boat_classes,
    p.updated_at
  from public.profiles p
  left join public.clubs c on c.id = p.club_id
)
select
  'auth_profile_join' as section,
  a.email,
  a.auth_user_id,
  p.profile_id,
  a.confirmed,
  p.display_name,
  p.first_name,
  p.last_name,
  p.roles,
  p.status,
  p.club_name,
  p.age_category,
  p.boat_classes,
  case
    when p.profile_id is null then 'missing_profile'
    when p.profile_id <> a.auth_user_id then 'profile_id_mismatch'
    else 'ok'
  end as state
from auth_accounts a
left join profile_rows p on p.email = a.email
order by a.email, a.created_at;

select
  'duplicate_profile_email' as section,
  lower(trim(email)) as email,
  count(*) as profile_count,
  array_agg(id order by updated_at desc nulls last) as profile_ids
from public.profiles
group by lower(trim(email))
having count(*) > 1
order by profile_count desc, email;

select
  'profile_role_summary' as section,
  lower(trim(p.email)) as email,
  p.display_name,
  p.roles,
  c.name as club_name,
  cm.role as club_role,
  cm.status as membership_status
from public.profiles p
left join public.clubs c on c.id = p.club_id
left join public.club_memberships cm on cm.user_id = p.id and cm.club_id = p.club_id
order by lower(trim(p.email));
