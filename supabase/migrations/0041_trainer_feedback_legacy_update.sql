-- Permit an authorized trainer/admin to replace a legacy trainer-feedback row
-- whose old author fields fail the strict UPDATE USING check. The resulting row
-- must still satisfy the strict 0040 identity policy.

create or replace function public.paddlio_can_author_trainer_feedback_0041(target_training_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.training_plan_items t
    where t.id = target_training_id
      and (
        public.paddlio_is_admin_415()
        or t.owner_id = auth.uid()
        or t.coach_id = auth.uid()
        or (
          t.club_id is not null
          and public.paddlio_user_has_club_role_0024(t.club_id, array['Coach','ClubAdmin','Admin'])
        )
      )
  );
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
      and public.paddlio_can_author_trainer_feedback_0041(item.training_plan_item_id)
    );
$$;

drop policy if exists training_feedback_insert_0024 on public.training_feedback;
create policy training_feedback_insert_0024
  on public.training_feedback
  for insert
  to authenticated
  with check (public.paddlio_can_write_training_feedback_0024(training_feedback));

drop policy if exists training_feedback_update_0024 on public.training_feedback;
create policy training_feedback_update_0024
  on public.training_feedback
  for update
  to authenticated
  using (
    public.paddlio_can_write_training_feedback_0024(training_feedback)
    or (
      feedback_type = 'trainer'
      and public.paddlio_can_author_trainer_feedback_0041(training_plan_item_id)
    )
  )
  with check (public.paddlio_can_write_training_feedback_0024(training_feedback));

notify pgrst, 'reload schema';
