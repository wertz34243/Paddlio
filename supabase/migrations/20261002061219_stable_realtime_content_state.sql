-- Minimal contact directory for users who already share an authorized Paddlio context.
-- It deliberately excludes email addresses and all extended profile data.

create or replace function public.paddlio_visible_contact_profiles_20261002()
returns table (
  id uuid,
  first_name text,
  last_name text,
  display_name text,
  club_id uuid,
  roles text[]
)
language sql
stable
security definer
set search_path = ''
as $$
  with requester as (
    select p.id, p.club_id, p.roles, p.status
    from public.profiles p
    where p.id = (select auth.uid())
  )
  select
    contact.id,
    contact.first_name,
    contact.last_name,
    contact.display_name,
    contact.club_id,
    contact.roles
  from public.profiles contact
  cross join requester me
  where me.status = 'active'
    and contact.status = 'active'
    and (
      contact.id = me.id
      or ('Admin' = any(me.roles))
      or (
        me.club_id is not null
        and contact.club_id = me.club_id
        and me.roles && array['Coach', 'TeamAdmin', 'ClubAdmin']::text[]
      )
      or exists (
        select 1
        from public.direct_messages dm
        where dm.deleted_at is null
          and (
            (dm.sender_id = me.id and dm.receiver_id = contact.id)
            or (dm.receiver_id = me.id and dm.sender_id = contact.id)
          )
      )
      or exists (
        select 1
        from public.group_memberships mine
        join public.group_memberships theirs on theirs.group_id = mine.group_id
        where mine.user_id = me.id
          and theirs.user_id = contact.id
          and mine.status = 'active'
          and theirs.status = 'active'
      )
    )
  order by coalesce(contact.display_name, contact.first_name, contact.last_name, '');
$$;

revoke all on function public.paddlio_visible_contact_profiles_20261002() from public;
revoke all on function public.paddlio_visible_contact_profiles_20261002() from anon;
grant execute on function public.paddlio_visible_contact_profiles_20261002() to authenticated;

create index if not exists idx_group_memberships_user_group_active_20261002
  on public.group_memberships(user_id, group_id)
  where status = 'active';

notify pgrst, 'reload schema';
