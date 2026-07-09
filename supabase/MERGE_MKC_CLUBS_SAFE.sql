-- Paddlio MKC Club Merge - Safe
-- Merges duplicate MKC club records into one canonical club without deleting data.
-- Canonical club:
--   name       = Monheimer Kanu Club
--   short_name = MKC
--   city       = Monheim am Rhein

do $$
declare
  canonical_club_id uuid;
  duplicate_club_id uuid;
  club_record record;
begin
  if to_regclass('public.clubs') is null then
    raise exception 'public.clubs does not exist. Run the Paddlio safe sync first.';
  end if;

  select id
  into canonical_club_id
  from public.clubs
  where lower(name) = 'monheimer kanu club'
     or lower(name) = 'mkc monheim'
     or lower(coalesce(short_name, '')) = 'mkc'
  order by
    case when lower(name) = 'monheimer kanu club' then 0 else 1 end,
    created_at asc nulls last
  limit 1;

  if canonical_club_id is null then
    insert into public.clubs (name, short_name, city, status, created_at, updated_at)
    values ('Monheimer Kanu Club', 'MKC', 'Monheim am Rhein', 'active', now(), now())
    returning id into canonical_club_id;
  end if;

  update public.clubs
  set name = 'Monheimer Kanu Club',
      short_name = 'MKC',
      city = coalesce(nullif(city, ''), 'Monheim am Rhein'),
      status = 'active',
      updated_at = now()
  where id = canonical_club_id;

  for club_record in
    select id
    from public.clubs
    where id <> canonical_club_id
      and (
        lower(name) in ('monheimer kanu club', 'mkc monheim')
        or lower(coalesce(short_name, '')) = 'mkc'
      )
  loop
    duplicate_club_id := club_record.id;

    if to_regclass('public.profiles') is not null then
      update public.profiles
      set club_id = canonical_club_id,
          updated_at = now()
      where club_id = duplicate_club_id;

      if exists (
        select 1 from information_schema.columns
        where table_schema = 'public'
          and table_name = 'profiles'
          and column_name = 'active_club_id'
      ) then
        update public.profiles
        set active_club_id = canonical_club_id,
            updated_at = now()
        where active_club_id = duplicate_club_id;
      end if;
    end if;

    if to_regclass('public.training_groups') is not null then
      update public.training_groups
      set club_id = canonical_club_id,
          updated_at = now()
      where club_id = duplicate_club_id;
    end if;

    if to_regclass('public.club_memberships') is not null then
      update public.club_memberships existing
      set role = case
            when existing.role = 'Admin' or duplicate_membership.role = 'Admin' then 'Admin'
            when existing.role = 'ClubAdmin' or duplicate_membership.role = 'ClubAdmin' then 'ClubAdmin'
            when existing.role = 'Coach' or duplicate_membership.role = 'Coach' then 'Coach'
            else existing.role
          end,
          status = case
            when existing.status = 'active' or duplicate_membership.status = 'active' then 'active'
            else existing.status
          end,
          updated_at = now()
      from public.club_memberships duplicate_membership
      where existing.club_id = canonical_club_id
        and duplicate_membership.club_id = duplicate_club_id
        and existing.user_id = duplicate_membership.user_id;

      update public.club_memberships
      set club_id = canonical_club_id,
          updated_at = now()
      where club_id = duplicate_club_id
        and not exists (
          select 1
          from public.club_memberships existing
          where existing.club_id = canonical_club_id
            and existing.user_id = club_memberships.user_id
        );

      update public.club_memberships
      set status = 'inactive',
          updated_at = now()
      where club_id = duplicate_club_id;
    end if;

    update public.clubs
    set name = name || ' (zusammengeführt)',
        status = 'inactive',
        updated_at = now()
    where id = duplicate_club_id;
  end loop;

  raise notice 'MKC club merge completed. canonical_club_id=%', canonical_club_id;
end;
$$;

select
  'canonical_club' as section,
  id,
  name,
  short_name,
  city,
  status,
  updated_at
from public.clubs
where lower(name) = 'monheimer kanu club'
  and lower(coalesce(short_name, '')) = 'mkc'
order by updated_at desc;

select
  'admin_profile' as section,
  p.id,
  p.email,
  p.display_name,
  p.club_id,
  c.name as club_name,
  p.roles,
  p.status
from public.profiles p
left join public.clubs c on c.id = p.club_id
where lower(trim(p.email)) = 't.kanu@outlook.com';

select
  'admin_membership' as section,
  cm.id,
  cm.user_id,
  cm.club_id,
  c.name as club_name,
  cm.role,
  cm.status
from public.club_memberships cm
left join public.clubs c on c.id = cm.club_id
where cm.user_id in (
  select id from public.profiles where lower(trim(email)) = 't.kanu@outlook.com'
);
