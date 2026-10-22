-- Replace legacy authentication-only policies with account/club/recipient scopes.
-- Roles remain sourced from profiles.roles via has_role; club membership only scopes a role.
-- No data is copied, deleted or reassigned.
create or replace function public.current_user_is_admin()
returns boolean language sql stable security definer set search_path = ''
as $$ select public.has_role('Admin'); $$;

drop policy beta_feedback_own_or_club_413 on public.beta_feedback;
create policy beta_feedback_release_read on public.beta_feedback for select to authenticated
using (exists (select 1 from public.profiles p where p.id=auth.uid() and p.status='active') and (user_id=auth.uid() or ((club_id = public.current_user_club_id() or exists (select 1 from public.club_memberships cm where cm.club_id=beta_feedback.club_id and cm.user_id=auth.uid() and cm.status='active')) and public.has_role('ClubAdmin'))));
create policy beta_feedback_release_write on public.beta_feedback for all to authenticated
using (exists (select 1 from public.profiles p where p.id=auth.uid() and p.status='active') and (user_id=auth.uid())) with check (exists (select 1 from public.profiles p where p.id=auth.uid() and p.status='active') and (user_id=auth.uid()));

drop policy beta_readiness_checks_own_or_club_413 on public.beta_readiness_checks;
create policy beta_readiness_checks_release_read on public.beta_readiness_checks for select to authenticated
using (exists (select 1 from public.profiles p where p.id=auth.uid() and p.status='active') and (false));
create policy beta_readiness_checks_release_write on public.beta_readiness_checks for all to authenticated
using (exists (select 1 from public.profiles p where p.id=auth.uid() and p.status='active') and (false)) with check (exists (select 1 from public.profiles p where p.id=auth.uid() and p.status='active') and (false));

drop policy beta_testers_own_or_club_413 on public.beta_testers;
create policy beta_testers_release_read on public.beta_testers for select to authenticated
using (exists (select 1 from public.profiles p where p.id=auth.uid() and p.status='active') and (user_id=auth.uid() or ((club_id = public.current_user_club_id() or exists (select 1 from public.club_memberships cm where cm.club_id=beta_testers.club_id and cm.user_id=auth.uid() and cm.status='active')) and public.has_role('ClubAdmin'))));
create policy beta_testers_release_write on public.beta_testers for all to authenticated
using (exists (select 1 from public.profiles p where p.id=auth.uid() and p.status='active') and (false)) with check (exists (select 1 from public.profiles p where p.id=auth.uid() and p.status='active') and (false));

drop policy boats_own_or_club_413 on public.boats;
create policy boats_release_read on public.boats for select to authenticated
using (exists (select 1 from public.profiles p where p.id=auth.uid() and p.status='active') and (coalesce(owner_id,user_id)=auth.uid() or ((club_id = public.current_user_club_id() or exists (select 1 from public.club_memberships cm where cm.club_id=boats.club_id and cm.user_id=auth.uid() and cm.status='active')) and (public.has_role('Coach') or public.has_role('TeamAdmin') or public.has_role('ClubAdmin')))));
create policy boats_release_write on public.boats for all to authenticated
using (exists (select 1 from public.profiles p where p.id=auth.uid() and p.status='active') and (coalesce(owner_id,user_id)=auth.uid() or ((club_id = public.current_user_club_id() or exists (select 1 from public.club_memberships cm where cm.club_id=boats.club_id and cm.user_id=auth.uid() and cm.status='active')) and (public.has_role('Coach') or public.has_role('TeamAdmin') or public.has_role('ClubAdmin'))))) with check (exists (select 1 from public.profiles p where p.id=auth.uid() and p.status='active') and (coalesce(owner_id,user_id)=auth.uid() or ((club_id = public.current_user_club_id() or exists (select 1 from public.club_memberships cm where cm.club_id=boats.club_id and cm.user_id=auth.uid() and cm.status='active')) and (public.has_role('Coach') or public.has_role('TeamAdmin') or public.has_role('ClubAdmin')))));

drop policy club_material_own_or_club_413 on public.club_material;
create policy club_material_release_read on public.club_material for select to authenticated
using (exists (select 1 from public.profiles p where p.id=auth.uid() and p.status='active') and (coalesce(owner_id,user_id)=auth.uid() or ((club_id = public.current_user_club_id() or exists (select 1 from public.club_memberships cm where cm.club_id=club_material.club_id and cm.user_id=auth.uid() and cm.status='active')) and (public.has_role('Coach') or public.has_role('TeamAdmin') or public.has_role('ClubAdmin')))));
create policy club_material_release_write on public.club_material for all to authenticated
using (exists (select 1 from public.profiles p where p.id=auth.uid() and p.status='active') and (coalesce(owner_id,user_id)=auth.uid() or ((club_id = public.current_user_club_id() or exists (select 1 from public.club_memberships cm where cm.club_id=club_material.club_id and cm.user_id=auth.uid() and cm.status='active')) and (public.has_role('Coach') or public.has_role('TeamAdmin') or public.has_role('ClubAdmin'))))) with check (exists (select 1 from public.profiles p where p.id=auth.uid() and p.status='active') and (coalesce(owner_id,user_id)=auth.uid() or ((club_id = public.current_user_club_id() or exists (select 1 from public.club_memberships cm where cm.club_id=club_material.club_id and cm.user_id=auth.uid() and cm.status='active')) and (public.has_role('Coach') or public.has_role('TeamAdmin') or public.has_role('ClubAdmin')))));

drop policy club_events_own_or_club_413 on public.club_events;
create policy club_events_release_read on public.club_events for select to authenticated
using (exists (select 1 from public.profiles p where p.id=auth.uid() and p.status='active') and (((club_id = public.current_user_club_id() or exists (select 1 from public.club_memberships cm where cm.club_id=club_events.club_id and cm.user_id=auth.uid() and cm.status='active')) and (public.has_role('Coach') or public.has_role('TeamAdmin') or public.has_role('ClubAdmin')))));
create policy club_events_release_write on public.club_events for all to authenticated
using (exists (select 1 from public.profiles p where p.id=auth.uid() and p.status='active') and (((club_id = public.current_user_club_id() or exists (select 1 from public.club_memberships cm where cm.club_id=club_events.club_id and cm.user_id=auth.uid() and cm.status='active')) and (public.has_role('Coach') or public.has_role('TeamAdmin') or public.has_role('ClubAdmin'))))) with check (exists (select 1 from public.profiles p where p.id=auth.uid() and p.status='active') and (((club_id = public.current_user_club_id() or exists (select 1 from public.club_memberships cm where cm.club_id=club_events.club_id and cm.user_id=auth.uid() and cm.status='active')) and (public.has_role('Coach') or public.has_role('TeamAdmin') or public.has_role('ClubAdmin')))));

drop policy club_documents_own_or_club_413 on public.club_documents;
create policy club_documents_release_read on public.club_documents for select to authenticated
using (exists (select 1 from public.profiles p where p.id=auth.uid() and p.status='active') and (owner_id=auth.uid() or created_by=auth.uid() or (visibility='club' and ((club_id = public.current_user_club_id() or exists (select 1 from public.club_memberships cm where cm.club_id=club_documents.club_id and cm.user_id=auth.uid() and cm.status='active')) and (public.has_role('Coach') or public.has_role('TeamAdmin') or public.has_role('ClubAdmin'))))));
create policy club_documents_release_write on public.club_documents for all to authenticated
using (exists (select 1 from public.profiles p where p.id=auth.uid() and p.status='active') and (((club_id = public.current_user_club_id() or exists (select 1 from public.club_memberships cm where cm.club_id=club_documents.club_id and cm.user_id=auth.uid() and cm.status='active')) and public.has_role('ClubAdmin')))) with check (exists (select 1 from public.profiles p where p.id=auth.uid() and p.status='active') and (((club_id = public.current_user_club_id() or exists (select 1 from public.club_memberships cm where cm.club_id=club_documents.club_id and cm.user_id=auth.uid() and cm.status='active')) and public.has_role('ClubAdmin'))));

drop policy club_settings_own_or_club_413 on public.club_settings;
create policy club_settings_release_read on public.club_settings for select to authenticated
using (exists (select 1 from public.profiles p where p.id=auth.uid() and p.status='active') and (((club_id = public.current_user_club_id() or exists (select 1 from public.club_memberships cm where cm.club_id=club_settings.club_id and cm.user_id=auth.uid() and cm.status='active')) and (public.has_role('Coach') or public.has_role('TeamAdmin') or public.has_role('ClubAdmin')))));
create policy club_settings_release_write on public.club_settings for all to authenticated
using (exists (select 1 from public.profiles p where p.id=auth.uid() and p.status='active') and (((club_id = public.current_user_club_id() or exists (select 1 from public.club_memberships cm where cm.club_id=club_settings.club_id and cm.user_id=auth.uid() and cm.status='active')) and public.has_role('ClubAdmin')))) with check (exists (select 1 from public.profiles p where p.id=auth.uid() and p.status='active') and (((club_id = public.current_user_club_id() or exists (select 1 from public.club_memberships cm where cm.club_id=club_settings.club_id and cm.user_id=auth.uid() and cm.status='active')) and public.has_role('ClubAdmin'))));

drop policy external_connections_own_or_club_413 on public.external_connections;
create policy external_connections_release_read on public.external_connections for select to authenticated
using (exists (select 1 from public.profiles p where p.id=auth.uid() and p.status='active') and (coalesce(owner_id,user_id)=auth.uid()));
create policy external_connections_release_write on public.external_connections for all to authenticated
using (exists (select 1 from public.profiles p where p.id=auth.uid() and p.status='active') and (coalesce(owner_id,user_id)=auth.uid())) with check (exists (select 1 from public.profiles p where p.id=auth.uid() and p.status='active') and (coalesce(owner_id,user_id)=auth.uid()));

drop policy external_training_sessions_own_or_club_413 on public.external_training_sessions;
create policy external_training_sessions_release_read on public.external_training_sessions for select to authenticated
using (exists (select 1 from public.profiles p where p.id=auth.uid() and p.status='active') and (coalesce(owner_id,user_id)=auth.uid() or ((club_id = public.current_user_club_id() or exists (select 1 from public.club_memberships cm where cm.club_id=external_training_sessions.club_id and cm.user_id=auth.uid() and cm.status='active')) and (public.has_role('Coach') or public.has_role('TeamAdmin') or public.has_role('ClubAdmin')))));
create policy external_training_sessions_release_write on public.external_training_sessions for all to authenticated
using (exists (select 1 from public.profiles p where p.id=auth.uid() and p.status='active') and (coalesce(owner_id,user_id)=auth.uid())) with check (exists (select 1 from public.profiles p where p.id=auth.uid() and p.status='active') and (coalesce(owner_id,user_id)=auth.uid()));

drop policy file_attachments_own_or_club_413 on public.file_attachments;
create policy file_attachments_release_read on public.file_attachments for select to authenticated
using (exists (select 1 from public.profiles p where p.id=auth.uid() and p.status='active') and (coalesce(owner_id,user_id)=auth.uid()));
create policy file_attachments_release_write on public.file_attachments for all to authenticated
using (exists (select 1 from public.profiles p where p.id=auth.uid() and p.status='active') and (coalesce(owner_id,user_id)=auth.uid())) with check (exists (select 1 from public.profiles p where p.id=auth.uid() and p.status='active') and (coalesce(owner_id,user_id)=auth.uid()));

drop policy personal_bests_own_or_club_413 on public.personal_bests;
create policy personal_bests_release_read on public.personal_bests for select to authenticated
using (exists (select 1 from public.profiles p where p.id=auth.uid() and p.status='active') and (coalesce(owner_id,user_id)=auth.uid() or ((club_id = public.current_user_club_id() or exists (select 1 from public.club_memberships cm where cm.club_id=personal_bests.club_id and cm.user_id=auth.uid() and cm.status='active')) and (public.has_role('Coach') or public.has_role('TeamAdmin') or public.has_role('ClubAdmin')))));
create policy personal_bests_release_write on public.personal_bests for all to authenticated
using (exists (select 1 from public.profiles p where p.id=auth.uid() and p.status='active') and (coalesce(owner_id,user_id)=auth.uid() or ((club_id = public.current_user_club_id() or exists (select 1 from public.club_memberships cm where cm.club_id=personal_bests.club_id and cm.user_id=auth.uid() and cm.status='active')) and (public.has_role('Coach') or public.has_role('TeamAdmin') or public.has_role('ClubAdmin'))))) with check (exists (select 1 from public.profiles p where p.id=auth.uid() and p.status='active') and (coalesce(owner_id,user_id)=auth.uid() or ((club_id = public.current_user_club_id() or exists (select 1 from public.club_memberships cm where cm.club_id=personal_bests.club_id and cm.user_id=auth.uid() and cm.status='active')) and (public.has_role('Coach') or public.has_role('TeamAdmin') or public.has_role('ClubAdmin')))));

drop policy result_imports_own_or_club_413 on public.result_imports;
create policy result_imports_release_read on public.result_imports for select to authenticated
using (exists (select 1 from public.profiles p where p.id=auth.uid() and p.status='active') and (coalesce(owner_id,user_id)=auth.uid() or ((club_id = public.current_user_club_id() or exists (select 1 from public.club_memberships cm where cm.club_id=result_imports.club_id and cm.user_id=auth.uid() and cm.status='active')) and (public.has_role('Coach') or public.has_role('TeamAdmin') or public.has_role('ClubAdmin')))));
create policy result_imports_release_write on public.result_imports for all to authenticated
using (exists (select 1 from public.profiles p where p.id=auth.uid() and p.status='active') and (coalesce(owner_id,user_id)=auth.uid() or ((club_id = public.current_user_club_id() or exists (select 1 from public.club_memberships cm where cm.club_id=result_imports.club_id and cm.user_id=auth.uid() and cm.status='active')) and (public.has_role('Coach') or public.has_role('TeamAdmin') or public.has_role('ClubAdmin'))))) with check (exists (select 1 from public.profiles p where p.id=auth.uid() and p.status='active') and (coalesce(owner_id,user_id)=auth.uid() or ((club_id = public.current_user_club_id() or exists (select 1 from public.club_memberships cm where cm.club_id=result_imports.club_id and cm.user_id=auth.uid() and cm.status='active')) and (public.has_role('Coach') or public.has_role('TeamAdmin') or public.has_role('ClubAdmin')))));

drop policy smart_coach_recommendations_own_or_club_413 on public.smart_coach_recommendations;
create policy smart_coach_recommendations_release_read on public.smart_coach_recommendations for select to authenticated
using (exists (select 1 from public.profiles p where p.id=auth.uid() and p.status='active') and (coalesce(owner_user_id,created_for_user_id)=auth.uid()));
create policy smart_coach_recommendations_release_write on public.smart_coach_recommendations for all to authenticated
using (exists (select 1 from public.profiles p where p.id=auth.uid() and p.status='active') and (coalesce(owner_user_id,created_for_user_id)=auth.uid())) with check (exists (select 1 from public.profiles p where p.id=auth.uid() and p.status='active') and (coalesce(owner_user_id,created_for_user_id)=auth.uid()));

drop policy group_messages_own_or_club_413 on public.group_messages;
create policy group_messages_release_read on public.group_messages for select to authenticated
using (exists (select 1 from public.profiles p where p.id=auth.uid() and p.status='active') and (sender_id=auth.uid() or exists (select 1 from public.group_members gm where gm.group_id=group_messages.group_id and gm.athlete_id=auth.uid()) or ((club_id = public.current_user_club_id() or exists (select 1 from public.club_memberships cm where cm.club_id=group_messages.club_id and cm.user_id=auth.uid() and cm.status='active')) and (public.has_role('Coach') or public.has_role('TeamAdmin') or public.has_role('ClubAdmin')))));
create policy group_messages_release_write on public.group_messages for all to authenticated
using (exists (select 1 from public.profiles p where p.id=auth.uid() and p.status='active') and (sender_id=auth.uid() and exists (select 1 from public.training_groups g where g.id=group_messages.group_id and g.club_id=group_messages.club_id) and (exists (select 1 from public.group_members gm where gm.group_id=group_messages.group_id and gm.athlete_id=auth.uid()) or ((club_id = public.current_user_club_id() or exists (select 1 from public.club_memberships cm where cm.club_id=group_messages.club_id and cm.user_id=auth.uid() and cm.status='active')) and (public.has_role('Coach') or public.has_role('TeamAdmin') or public.has_role('ClubAdmin')))))) with check (exists (select 1 from public.profiles p where p.id=auth.uid() and p.status='active') and (sender_id=auth.uid() and exists (select 1 from public.training_groups g where g.id=group_messages.group_id and g.club_id=group_messages.club_id) and (exists (select 1 from public.group_members gm where gm.group_id=group_messages.group_id and gm.athlete_id=auth.uid()) or ((club_id = public.current_user_club_id() or exists (select 1 from public.club_memberships cm where cm.club_id=group_messages.club_id and cm.user_id=auth.uid() and cm.status='active')) and (public.has_role('Coach') or public.has_role('TeamAdmin') or public.has_role('ClubAdmin'))))));

drop policy tasks_own_or_club_413 on public.tasks;
create policy tasks_release_read on public.tasks for select to authenticated
using (exists (select 1 from public.profiles p where p.id=auth.uid() and p.status='active') and (created_by=auth.uid() or ((club_id = public.current_user_club_id() or exists (select 1 from public.club_memberships cm where cm.club_id=tasks.club_id and cm.user_id=auth.uid() and cm.status='active')) and (public.has_role('Coach') or public.has_role('TeamAdmin') or public.has_role('ClubAdmin'))) or (club_id = public.current_user_club_id() or exists (select 1 from public.club_memberships cm where cm.club_id=tasks.club_id and cm.user_id=auth.uid() and cm.status='active'))));
create policy tasks_release_write on public.tasks for all to authenticated
using (exists (select 1 from public.profiles p where p.id=auth.uid() and p.status='active') and (created_by=auth.uid() and ((club_id = public.current_user_club_id() or exists (select 1 from public.club_memberships cm where cm.club_id=tasks.club_id and cm.user_id=auth.uid() and cm.status='active')) and (public.has_role('Coach') or public.has_role('TeamAdmin') or public.has_role('ClubAdmin'))))) with check (exists (select 1 from public.profiles p where p.id=auth.uid() and p.status='active') and (created_by=auth.uid() and ((club_id = public.current_user_club_id() or exists (select 1 from public.club_memberships cm where cm.club_id=tasks.club_id and cm.user_id=auth.uid() and cm.status='active')) and (public.has_role('Coach') or public.has_role('TeamAdmin') or public.has_role('ClubAdmin')))));

drop policy task_assignments_own_or_club_413 on public.task_assignments;
create policy task_assignments_release_read on public.task_assignments for select to authenticated
using (exists (select 1 from public.profiles p where p.id=auth.uid() and p.status='active') and (assigned_to=auth.uid() or exists (select 1 from public.tasks t where t.id=task_assignments.task_id and t.created_by=auth.uid())));
create policy task_assignments_release_write on public.task_assignments for all to authenticated
using (exists (select 1 from public.profiles p where p.id=auth.uid() and p.status='active') and (exists (select 1 from public.tasks t where t.id=task_assignments.task_id and t.created_by=auth.uid()))) with check (exists (select 1 from public.profiles p where p.id=auth.uid() and p.status='active') and (exists (select 1 from public.tasks t where t.id=task_assignments.task_id and t.created_by=auth.uid())));

drop policy training_attendance_own_or_club_413 on public.training_attendance;
create policy training_attendance_release_read on public.training_attendance for select to authenticated
using (exists (select 1 from public.profiles p where p.id=auth.uid() and p.status='active') and (athlete_id=auth.uid() or ((club_id = public.current_user_club_id() or exists (select 1 from public.club_memberships cm where cm.club_id=training_attendance.club_id and cm.user_id=auth.uid() and cm.status='active')) and (public.has_role('Coach') or public.has_role('TeamAdmin') or public.has_role('ClubAdmin')))));
create policy training_attendance_release_write on public.training_attendance for all to authenticated
using (exists (select 1 from public.profiles p where p.id=auth.uid() and p.status='active') and (athlete_id=auth.uid() or ((club_id = public.current_user_club_id() or exists (select 1 from public.club_memberships cm where cm.club_id=training_attendance.club_id and cm.user_id=auth.uid() and cm.status='active')) and (public.has_role('Coach') or public.has_role('TeamAdmin') or public.has_role('ClubAdmin'))))) with check (exists (select 1 from public.profiles p where p.id=auth.uid() and p.status='active') and (athlete_id=auth.uid() or ((club_id = public.current_user_club_id() or exists (select 1 from public.club_memberships cm where cm.club_id=training_attendance.club_id and cm.user_id=auth.uid() and cm.status='active')) and (public.has_role('Coach') or public.has_role('TeamAdmin') or public.has_role('ClubAdmin')))));

drop policy club_posts_own_or_club_413 on public.club_posts;
create policy club_posts_release_read on public.club_posts for select to authenticated
using (exists (select 1 from public.profiles p where p.id=auth.uid() and p.status='active') and (author_id=auth.uid() or ((club_id = public.current_user_club_id() or exists (select 1 from public.club_memberships cm where cm.club_id=club_posts.club_id and cm.user_id=auth.uid() and cm.status='active')) and (target_type='club' or (target_type='coaches' and (public.has_role('Coach') or public.has_role('TeamAdmin') or public.has_role('ClubAdmin'))) or (target_type='athletes' and public.has_role('Athlete')) or (target_type='athlete' and target_user_id=auth.uid()) or (target_type='group' and exists (select 1 from public.group_members gm where gm.group_id=club_posts.target_group_id and gm.athlete_id=auth.uid()))))));
create policy club_posts_release_write on public.club_posts for all to authenticated
using (exists (select 1 from public.profiles p where p.id=auth.uid() and p.status='active') and (author_id=auth.uid() and ((club_id = public.current_user_club_id() or exists (select 1 from public.club_memberships cm where cm.club_id=club_posts.club_id and cm.user_id=auth.uid() and cm.status='active')) and (public.has_role('Coach') or public.has_role('TeamAdmin') or public.has_role('ClubAdmin'))))) with check (exists (select 1 from public.profiles p where p.id=auth.uid() and p.status='active') and (author_id=auth.uid() and ((club_id = public.current_user_club_id() or exists (select 1 from public.club_memberships cm where cm.club_id=club_posts.club_id and cm.user_id=auth.uid() and cm.status='active')) and (public.has_role('Coach') or public.has_role('TeamAdmin') or public.has_role('ClubAdmin')))));

drop policy club_messages_own_or_club_413 on public.club_messages;
create policy club_messages_release_read on public.club_messages for select to authenticated
using (exists (select 1 from public.profiles p where p.id=auth.uid() and p.status='active') and (sender_id=auth.uid() or ((club_id = public.current_user_club_id() or exists (select 1 from public.club_memberships cm where cm.club_id=club_messages.club_id and cm.user_id=auth.uid() and cm.status='active')) and (target_type='club' or (target_type='coaches' and (public.has_role('Coach') or public.has_role('TeamAdmin') or public.has_role('ClubAdmin'))) or (target_type='athletes' and public.has_role('Athlete')) or (target_type='athlete' and target_user_id=auth.uid()) or (target_type='group' and exists (select 1 from public.group_members gm where gm.group_id=club_messages.target_group_id and gm.athlete_id=auth.uid()))))));
create policy club_messages_release_write on public.club_messages for all to authenticated
using (exists (select 1 from public.profiles p where p.id=auth.uid() and p.status='active') and (sender_id=auth.uid() and ((club_id = public.current_user_club_id() or exists (select 1 from public.club_memberships cm where cm.club_id=club_messages.club_id and cm.user_id=auth.uid() and cm.status='active')) and (public.has_role('Coach') or public.has_role('TeamAdmin') or public.has_role('ClubAdmin'))))) with check (exists (select 1 from public.profiles p where p.id=auth.uid() and p.status='active') and (sender_id=auth.uid() and ((club_id = public.current_user_club_id() or exists (select 1 from public.club_memberships cm where cm.club_id=club_messages.club_id and cm.user_id=auth.uid() and cm.status='active')) and (public.has_role('Coach') or public.has_role('TeamAdmin') or public.has_role('ClubAdmin')))));

create policy task_assignments_release_response on public.task_assignments for update to authenticated
using (exists (select 1 from public.profiles p where p.id=auth.uid() and p.status='active') and assigned_to=auth.uid()) with check (exists (select 1 from public.profiles p where p.id=auth.uid() and p.status='active') and assigned_to=auth.uid());
create or replace function paddlio_private.protect_task_response_identity()
returns trigger language plpgsql set search_path = '' as $$
begin
  if current_user in ('anon','authenticated') and (new.task_id is distinct from old.task_id or new.assigned_to is distinct from old.assigned_to or new.user_id is distinct from old.user_id) then
    raise exception 'Task response identity is immutable' using errcode='42501';
  end if;
  return new;
end; $$;
revoke all on function paddlio_private.protect_task_response_identity() from public,anon,authenticated;
create trigger protect_task_response_identity before update on public.task_assignments for each row execute function paddlio_private.protect_task_response_identity();
-- Runtime isolation regression. All fixtures are rolled back by the subtransaction.
DO $test$
DECLARE
 actor uuid := gen_random_uuid(); outsider uuid := gen_random_uuid();
 club_a uuid := gen_random_uuid(); club_b uuid := gen_random_uuid();
 row_id uuid := gen_random_uuid(); insert_id uuid := gen_random_uuid();
 t text; r text; cols text; vals text; n integer; blocked boolean;
 tables text[] := ARRAY['beta_feedback','beta_readiness_checks','beta_testers','boats','club_material','club_events','club_documents','club_settings','external_connections','external_training_sessions','file_attachments','personal_bests','result_imports','smart_coach_recommendations','group_messages','tasks','task_assignments','training_attendance','club_posts','club_messages'];
BEGIN
 BEGIN
  perform set_config('request.jwt.claims','{"role":"service_role"}',true);
  insert into auth.users(id,email,raw_user_meta_data) values
    (actor,'rls-a-'||actor||'@example.invalid','{}'),(outsider,'rls-b-'||outsider||'@example.invalid','{}');
  insert into public.clubs(id,name,status) values (club_a,'RLS temporary A','active'),(club_b,'RLS temporary B','active');
  update public.profiles set club_id=club_a, active_club_id=club_a,roles=array['Athlete'],status='active' where id=actor;
  update public.profiles set club_id=club_b, active_club_id=club_b,roles=array['Athlete'],status='active' where id=outsider;
  foreach t in array tables loop
    select string_agg(format('%I',column_name),',' order by ordinal_position),
           string_agg(case when column_name='id' then quote_literal(row_id)
                when column_name='club_id' then quote_literal(club_b)
                else quote_literal(outsider) end,',' order by ordinal_position)
      into cols,vals from information_schema.columns
      where table_schema='public' and table_name=t and column_name in
       ('id','club_id','user_id','owner_id','created_by','sender_id','author_id','athlete_id','assigned_to','owner_user_id','created_for_user_id','training_id','task_id');
    execute format('insert into public.%I (%s) values (%s)',t,cols,vals);
  end loop;
  foreach r in array ARRAY['Athlete','Coach','ClubAdmin'] loop
    perform set_config('request.jwt.claims','{"role":"service_role"}',true);
    update public.profiles set roles=array[r],primary_role=r where id=actor;
    perform set_config('request.jwt.claims',jsonb_build_object('role','authenticated','sub',actor)::text,true);
    execute 'set local role authenticated';
    foreach t in array tables loop
      execute format('select count(*) from public.%I where id=$1',t) into n using row_id;
      if n<>0 then raise exception '% reads unrelated %',r,t; end if;
      execute format('update public.%I set updated_at=updated_at where id=$1',t) using row_id;
      get diagnostics n=row_count;
      if n<>0 then raise exception '% updates unrelated %',r,t; end if;
      execute format('delete from public.%I where id=$1',t) using row_id;
      get diagnostics n=row_count;
      if n<>0 then raise exception '% deletes unrelated %',r,t; end if;
    end loop;
    execute 'reset role';
    -- Explicitly forge every foreign ownership column; INSERT must fail too.
    foreach t in array tables loop
      select string_agg(format('%I',column_name),',' order by ordinal_position),
             string_agg(case when column_name='id' then quote_literal(insert_id)
                  when column_name='club_id' then quote_literal(club_b)
                  else quote_literal(outsider) end,',' order by ordinal_position)
        into cols,vals from information_schema.columns where table_schema='public' and table_name=t
        and column_name in ('id','club_id','user_id','owner_id','created_by','sender_id','author_id','athlete_id','assigned_to','owner_user_id','created_for_user_id','training_id','task_id');
      blocked:=false;
      execute 'set local role authenticated';
      begin
        execute format('insert into public.%I (%s) values (%s)',t,cols,vals);
      exception when insufficient_privilege then blocked:=true;
      end;
      execute 'reset role';
      if not blocked then raise exception '% inserts foreign-owned %',r,t; end if;
    end loop;
  end loop;
  perform set_config('request.jwt.claims','{"role":"service_role"}',true);
  update public.profiles set roles=array['Admin'],primary_role='Admin' where id=actor;
  perform set_config('request.jwt.claims',jsonb_build_object('role','authenticated','sub',actor)::text,true);
  execute 'set local role authenticated';
  foreach t in array tables loop
    execute format('select count(*) from public.%I where id=$1',t) into n using row_id;
    if n<>1 then raise exception 'Admin cannot read %',t; end if;
    execute format('update public.%I set updated_at=updated_at where id=$1',t) using row_id;
    get diagnostics n=row_count;
    if n<>1 then raise exception 'Admin cannot update %',t; end if;
  end loop;
  execute 'reset role';
  perform set_config('request.jwt.claims',jsonb_build_object('role','authenticated','sub',outsider)::text,true);
  execute 'set local role authenticated';
  foreach t in array ARRAY['boats','external_connections','external_training_sessions','file_attachments','personal_bests','result_imports','smart_coach_recommendations','task_assignments','training_attendance','beta_feedback'] loop
    execute format('select count(*) from public.%I where id=$1',t) into n using row_id;
    if n<>1 then raise exception 'Owner cannot read %',t; end if;
  end loop;
  execute 'reset role';
  raise exception using errcode='PZ001',message='rollback successful fixtures';
 exception when sqlstate 'PZ001' then null;
 end;
END;
$test$;
