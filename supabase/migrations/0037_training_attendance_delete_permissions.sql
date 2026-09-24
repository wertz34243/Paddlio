-- Athletes may answer and update their own attendance, while deletion of an
-- attendance set is reserved for trainer/admin roles in the same club.

drop policy if exists "training_attendance_scope_write" on public.training_attendance;
drop policy if exists "training_attendance_own" on public.training_attendance;
drop policy if exists "training_attendance_insert" on public.training_attendance;
drop policy if exists "training_attendance_update" on public.training_attendance;
drop policy if exists "training_attendance_delete" on public.training_attendance;

create policy "training_attendance_insert"
on public.training_attendance for insert to authenticated
with check (
  athlete_id = auth.uid()
  or public.is_admin()
  or (club_id = public.current_user_club_id() and (public.has_role('Coach') or public.has_role('ClubAdmin') or public.has_role('TeamAdmin')))
);

create policy "training_attendance_update"
on public.training_attendance for update to authenticated
using (
  athlete_id = auth.uid()
  or public.is_admin()
  or (club_id = public.current_user_club_id() and (public.has_role('Coach') or public.has_role('ClubAdmin') or public.has_role('TeamAdmin')))
)
with check (
  athlete_id = auth.uid()
  or public.is_admin()
  or (club_id = public.current_user_club_id() and (public.has_role('Coach') or public.has_role('ClubAdmin') or public.has_role('TeamAdmin')))
);

create policy "training_attendance_delete"
on public.training_attendance for delete to authenticated
using (
  (
    public.is_admin()
    or (club_id = public.current_user_club_id() and (public.has_role('Coach') or public.has_role('ClubAdmin') or public.has_role('TeamAdmin')))
  )
  and exists (
    select 1
    from public.training_plan_items training
    where training.id = training_attendance.training_id
      and (
        training.date
        + coalesce(
          training.end_time,
          training.start_time + make_interval(mins => greatest(training.duration_minutes, 0)),
          time '23:59'
        )
      ) < localtimestamp
  )
);
