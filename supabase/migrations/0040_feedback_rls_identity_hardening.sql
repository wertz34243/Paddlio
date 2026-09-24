-- Use current profile roles for admin authorization and enforce explicit
-- athlete/trainer authorship for feedback writes.

create or replace function public.paddlio_is_admin_415()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and 'Admin' = any(roles)
      and status = 'active'
  );
$$;

create or replace function public.paddlio_sync_training_feedback_0030()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.training_plan_item_id := coalesce(new.training_plan_item_id, new.training_id);
  new.training_id := coalesce(new.training_id, new.training_plan_item_id);
  new.athlete_id := coalesce(new.athlete_id, new.athlete_user_id);
  new.athlete_user_id := coalesce(new.athlete_user_id, new.athlete_id);
  new.feedback_type := coalesce(new.feedback_type, 'athlete');

  if new.feedback_type = 'athlete' then
    new.author_id := coalesce(new.author_id, new.athlete_id);
  elsif new.feedback_type = 'trainer' then
    new.author_id := coalesce(new.author_id, auth.uid());
    new.coach_id := coalesce(new.coach_id, auth.uid());
  end if;

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
  select (
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
            public.paddlio_is_admin_415()
            or t.owner_id = auth.uid()
            or t.coach_id = auth.uid()
            or (
              t.club_id is not null
              and public.paddlio_user_has_club_role_0024(t.club_id, array['Coach','ClubAdmin','Admin'])
            )
          )
      )
    );
$$;

notify pgrst, 'reload schema';
