-- Paddlio 5.0 beta RLS hardening
-- Idempotent security patch for existing databases.
-- No table drops. No data resets.

create or replace function public.paddlio_is_admin_0031()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and coalesce(p.status, 'active') = 'active'
      and (
        p.primary_role = 'Admin'
        or p.roles && array['Admin']::text[]
        or lower(coalesce(p.email, '')) = 't.kanu@outlook.com'
      )
  );
$$;

create or replace function public.paddlio_user_has_club_role_0031(target_club_id text, allowed_roles text[])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.paddlio_is_admin_0031()
    or (
      target_club_id is not null
      and target_club_id <> ''
      and (
        exists (
          select 1
          from public.profiles p
          where p.id = auth.uid()
            and coalesce(p.status, 'active') = 'active'
            and (
              p.club_id::text = target_club_id
              or p.active_club_id::text = target_club_id
            )
            and p.roles && allowed_roles
        )
        or exists (
          select 1
          from public.club_memberships cm
          where cm.user_id = auth.uid()
            and cm.club_id::text = target_club_id
            and cm.status = 'active'
            and cm.role = any(allowed_roles)
        )
      )
    );
$$;

create or replace function public.paddlio_can_read_academy_course_0031(course_id text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.academy_courses c
    where c.id = course_id
      and (
        (
          c.status = 'published'
          and (
            c.club_id is null
            or c.club_id = ''
            or public.paddlio_user_has_club_role_0031(c.club_id, array['Athlete','Coach','TeamAdmin','ClubAdmin','Admin'])
          )
        )
        or c.created_by = auth.uid()::text
        or public.paddlio_user_has_club_role_0031(c.club_id, array['Coach','TeamAdmin','ClubAdmin','Admin'])
      )
  );
$$;

create or replace function public.paddlio_can_read_academy_lesson_0031(lesson_id text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.academy_lessons l
    where l.id = lesson_id
      and (
        (
          l.status = 'published'
          and (
            l.club_id is null
            or l.club_id = ''
            or public.paddlio_user_has_club_role_0031(l.club_id, array['Athlete','Coach','TeamAdmin','ClubAdmin','Admin'])
          )
        )
        or l.created_by = auth.uid()::text
        or public.paddlio_user_has_club_role_0031(l.club_id, array['Coach','TeamAdmin','ClubAdmin','Admin'])
        or (
          l.course_id is not null
          and public.paddlio_can_read_academy_course_0031(l.course_id)
        )
      )
  );
$$;

drop policy if exists "competitions_authenticated_select" on public.competitions;

drop policy if exists "academy courses readable" on public.academy_courses;
create policy "academy courses readable"
  on public.academy_courses
  for select
  to authenticated
  using (public.paddlio_can_read_academy_course_0031(id));

drop policy if exists "academy lessons readable" on public.academy_lessons;
create policy "academy lessons readable"
  on public.academy_lessons
  for select
  to authenticated
  using (public.paddlio_can_read_academy_lesson_0031(id));

drop policy if exists "academy blocks readable" on public.academy_content_blocks;
create policy "academy blocks readable"
  on public.academy_content_blocks
  for select
  to authenticated
  using (public.paddlio_can_read_academy_lesson_0031(lesson_id));

drop policy if exists "academy paths readable" on public.academy_learning_paths;
create policy "academy paths readable"
  on public.academy_learning_paths
  for select
  to authenticated
  using (
    is_active = true
    and (
      club_id is null
      or club_id = ''
      or public.paddlio_user_has_club_role_0031(club_id, array['Athlete','Coach','TeamAdmin','ClubAdmin','Admin'])
    )
  );

drop policy if exists "academy path items readable" on public.academy_learning_path_items;
create policy "academy path items readable"
  on public.academy_learning_path_items
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.academy_learning_paths p
      where p.id = academy_learning_path_items.learning_path_id
        and p.is_active = true
        and (
          p.club_id is null
          or p.club_id = ''
          or public.paddlio_user_has_club_role_0031(p.club_id, array['Athlete','Coach','TeamAdmin','ClubAdmin','Admin'])
        )
    )
    and (
      lesson_id is null
      or public.paddlio_can_read_academy_lesson_0031(lesson_id)
    )
    and (
      course_id is null
      or public.paddlio_can_read_academy_course_0031(course_id)
    )
  );

drop policy if exists "academy quizzes readable" on public.academy_quizzes;
create policy "academy quizzes readable"
  on public.academy_quizzes
  for select
  to authenticated
  using (public.paddlio_can_read_academy_lesson_0031(lesson_id));

drop policy if exists "academy quiz questions readable" on public.academy_quiz_questions;
create policy "academy quiz questions readable"
  on public.academy_quiz_questions
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.academy_quizzes q
      where q.id = academy_quiz_questions.quiz_id
        and public.paddlio_can_read_academy_lesson_0031(q.lesson_id)
    )
  );

drop policy if exists "academy media readable" on public.academy_media;
create policy "academy media readable"
  on public.academy_media
  for select
  to authenticated
  using (
    club_id is null
    or club_id = ''
    or public.paddlio_user_has_club_role_0031(club_id, array['Athlete','Coach','TeamAdmin','ClubAdmin','Admin'])
  );
