
create policy "training_plan_items_scope_write" on public.training_plan_items
  for all
  using (
    owner_id = auth.uid()
    or coach_id = auth.uid()
    or public.is_admin()
    or (
      public.has_role('Coach')
      and club_id is not null
      and club_id = public.current_user_club_id()
    )
  )
  with check (
    owner_id = auth.uid()
    or coach_id = auth.uid()
    or public.is_admin()
    or (
      public.has_role('Coach')
      and club_id is not null
      and club_id = public.current_user_club_id()
    )
  );

create policy "training_feedback_scope_select" on public.training_feedback
  for select
  using (
    athlete_id = auth.uid()
    or coach_id = auth.uid()
    or public.is_admin()
    or exists (
      select 1 from public.profiles p
      where p.id = training_feedback.athlete_id
        and p.club_id = public.current_user_club_id()
        and public.has_role('Coach')
    )
  );

create policy "training_feedback_scope_write" on public.training_feedback
  for all
  using (athlete_id = auth.uid() or coach_id = auth.uid() or public.is_admin())
  with check (athlete_id = auth.uid() or coach_id = auth.uid() or public.is_admin());

create policy "competitions_authenticated_select" on public.competitions
  for select
  to authenticated
  using (true);

create policy "competitions_coach_or_admin_write" on public.competitions
  for all
  using (public.has_role('Coach') or public.is_admin())
  with check (public.has_role('Coach') or public.is_admin());

create policy "competition_results_scope_select" on public.competition_results
  for select
  using (
    athlete_id = auth.uid()
    or public.is_admin()
    or exists (
      select 1 from public.profiles p
      where p.id = competition_results.athlete_id
        and p.club_id = public.current_user_club_id()
        and public.has_role('Coach')
    )
  );

create policy "competition_results_scope_write" on public.competition_results
  for all
  using (athlete_id = auth.uid() or public.is_admin())
  with check (athlete_id = auth.uid() or public.is_admin());

create policy "materials_owner_or_admin_select" on public.materials
  for select
  using (athlete_id = auth.uid() or public.is_admin());

create policy "materials_owner_or_admin_write" on public.materials
  for all
  using (athlete_id = auth.uid() or public.is_admin())
  with check (athlete_id = auth.uid() or public.is_admin());

create policy "notifications_owner_select" on public.notifications
  for select
  using (user_id = auth.uid() or public.is_admin());

create policy "notifications_owner_update" on public.notifications
  for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "notifications_admin_all" on public.notifications
  for all
  using (public.is_admin())
  with check (public.is_admin());

create policy "audit_logs_admin_select" on public.audit_logs
  for select
  using (public.is_admin());

create policy "audit_logs_admin_insert" on public.audit_logs
  for insert
  with check (public.is_admin());

create policy "training_templates_scope_select" on public.training_templates
  for select
  using (
    owner_id = auth.uid()
    or public.is_admin()
    or (
      visibility = 'club'
      and club_id = public.current_user_club_id()
      and (public.has_role('Coach') or public.has_role('TeamAdmin'))
    )
  );

create policy "training_templates_scope_write" on public.training_templates
  for all
  using (
    owner_id = auth.uid()
    or public.is_admin()
    or (
      visibility = 'club'
      and club_id = public.current_user_club_id()
      and (public.has_role('Coach') or public.has_role('TeamAdmin'))
    )
  )
  with check (
    owner_id = auth.uid()
    or public.is_admin()
    or (
      visibility = 'club'
      and club_id = public.current_user_club_id()
      and (public.has_role('Coach') or public.has_role('TeamAdmin'))
    )
  );
