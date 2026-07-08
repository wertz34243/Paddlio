create table if not exists public.direct_messages (
  id uuid primary key default gen_random_uuid(),
  club_id uuid references public.clubs(id) on delete set null,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  receiver_id uuid not null references public.profiles(id) on delete cascade,
  message text not null,
  is_read boolean not null default false,
  read_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.group_messages (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.clubs(id) on delete cascade,
  group_id uuid not null references public.training_groups(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  message text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.club_posts (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.clubs(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  content text not null,
  category text not null default 'info',
  priority text not null default 'normal',
  target_type text not null default 'club',
  target_group_id uuid references public.training_groups(id) on delete set null,
  target_user_id uuid references public.profiles(id) on delete set null,
  expires_at timestamptz,
  is_pinned boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint club_posts_category_check check (category in ('info', 'training', 'competition', 'material', 'urgent', 'organization')),
  constraint club_posts_priority_check check (priority in ('normal', 'important', 'urgent')),
  constraint club_posts_target_check check (target_type in ('club', 'coaches', 'group', 'athlete'))
);

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.clubs(id) on delete cascade,
  created_by uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  description text,
  task_type text not null default 'general',
  priority text not null default 'normal',
  due_date date,
  related_training_id uuid references public.training_plan_items(id) on delete set null,
  related_competition_id uuid references public.competitions(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint tasks_type_check check (task_type in ('general', 'technique', 'material', 'video', 'competition', 'training', 'mental', 'recovery')),
  constraint tasks_priority_check check (priority in ('normal', 'important', 'urgent'))
);

create table if not exists public.task_assignments (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  assigned_to uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'open',
  completed_at timestamptz,
  response_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint task_assignments_status_check check (status in ('open', 'in_progress', 'done', 'skipped'))
);

create table if not exists public.training_attendance (
  id uuid primary key default gen_random_uuid(),
  training_id uuid not null references public.training_plan_items(id) on delete cascade,
  athlete_id uuid not null references public.profiles(id) on delete cascade,
  club_id uuid references public.clubs(id) on delete set null,
  group_id uuid references public.training_groups(id) on delete set null,
  status text not null default 'pending',
  reason text,
  note text,
  responded_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(training_id, athlete_id),
  constraint training_attendance_status_check check (status in ('pending', 'attending', 'not_attending', 'unsure'))
);

create table if not exists public.file_attachments (
  id uuid primary key default gen_random_uuid(),
  club_id uuid references public.clubs(id) on delete set null,
  owner_id uuid not null references public.profiles(id) on delete cascade,
  related_type text not null,
  related_id uuid not null,
  file_name text not null,
  file_path text not null,
  file_type text,
  file_size bigint,
  created_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint file_attachments_related_type_check check (related_type in ('direct_message', 'group_message', 'club_post', 'task', 'training', 'competition'))
);

create index if not exists direct_messages_sender_idx on public.direct_messages(sender_id);
create index if not exists direct_messages_receiver_idx on public.direct_messages(receiver_id);
create index if not exists group_messages_group_idx on public.group_messages(group_id);
create index if not exists club_posts_club_idx on public.club_posts(club_id);
create index if not exists tasks_club_idx on public.tasks(club_id);
create index if not exists task_assignments_assigned_to_idx on public.task_assignments(assigned_to);
create index if not exists training_attendance_training_idx on public.training_attendance(training_id);
create index if not exists file_attachments_related_idx on public.file_attachments(related_type, related_id);

drop trigger if exists direct_messages_updated_at on public.direct_messages;
create trigger direct_messages_updated_at before update on public.direct_messages for each row execute function public.set_updated_at();
drop trigger if exists group_messages_updated_at on public.group_messages;
create trigger group_messages_updated_at before update on public.group_messages for each row execute function public.set_updated_at();
drop trigger if exists club_posts_updated_at on public.club_posts;
create trigger club_posts_updated_at before update on public.club_posts for each row execute function public.set_updated_at();
drop trigger if exists tasks_updated_at on public.tasks;
create trigger tasks_updated_at before update on public.tasks for each row execute function public.set_updated_at();
drop trigger if exists task_assignments_updated_at on public.task_assignments;
create trigger task_assignments_updated_at before update on public.task_assignments for each row execute function public.set_updated_at();
drop trigger if exists training_attendance_updated_at on public.training_attendance;
create trigger training_attendance_updated_at before update on public.training_attendance for each row execute function public.set_updated_at();

alter table public.direct_messages enable row level security;
alter table public.group_messages enable row level security;
alter table public.club_posts enable row level security;
alter table public.tasks enable row level security;
alter table public.task_assignments enable row level security;
alter table public.training_attendance enable row level security;
alter table public.file_attachments enable row level security;

drop policy if exists "direct_messages_own_read" on public.direct_messages;
create policy "direct_messages_own_read" on public.direct_messages for select to authenticated using (
  deleted_at is null and (sender_id = auth.uid() or receiver_id = auth.uid() or public.is_admin())
);
drop policy if exists "direct_messages_own_write" on public.direct_messages;
create policy "direct_messages_own_write" on public.direct_messages for all to authenticated using (
  sender_id = auth.uid() or receiver_id = auth.uid() or public.is_admin()
) with check (
  sender_id = auth.uid() or public.is_admin()
);

drop policy if exists "group_messages_scope_read" on public.group_messages;
create policy "group_messages_scope_read" on public.group_messages for select to authenticated using (
  deleted_at is null and (
    public.is_admin()
    or exists (select 1 from public.training_groups g where g.id = group_messages.group_id and g.club_id = public.current_user_club_id())
    or exists (select 1 from public.group_members m where m.group_id = group_messages.group_id and m.athlete_id = auth.uid())
  )
);
drop policy if exists "group_messages_scope_write" on public.group_messages;
create policy "group_messages_scope_write" on public.group_messages for all to authenticated using (
  sender_id = auth.uid() or public.is_admin()
) with check (
  sender_id = auth.uid()
  and (
    public.is_admin()
    or exists (select 1 from public.training_groups g where g.id = group_messages.group_id and g.club_id = public.current_user_club_id())
    or exists (select 1 from public.group_members m where m.group_id = group_messages.group_id and m.athlete_id = auth.uid())
  )
);

drop policy if exists "club_posts_scope_read" on public.club_posts;
create policy "club_posts_scope_read" on public.club_posts for select to authenticated using (
  deleted_at is null and (
    public.is_admin()
    or club_id = public.current_user_club_id()
    or target_user_id = auth.uid()
    or exists (select 1 from public.group_members m where m.group_id = club_posts.target_group_id and m.athlete_id = auth.uid())
  )
);
drop policy if exists "club_posts_scope_write" on public.club_posts;
create policy "club_posts_scope_write" on public.club_posts for all to authenticated using (
  public.is_admin() or (club_id = public.current_user_club_id() and (public.has_role('Coach') or public.has_role('ClubAdmin') or public.has_role('TeamAdmin')))
) with check (
  public.is_admin() or (club_id = public.current_user_club_id() and (public.has_role('Coach') or public.has_role('ClubAdmin') or public.has_role('TeamAdmin')))
);

drop policy if exists "tasks_scope_read" on public.tasks;
create policy "tasks_scope_read" on public.tasks for select to authenticated using (
  deleted_at is null and (
    public.is_admin()
    or created_by = auth.uid()
    or club_id = public.current_user_club_id()
    or exists (select 1 from public.task_assignments a where a.task_id = tasks.id and a.assigned_to = auth.uid())
  )
);
drop policy if exists "tasks_scope_write" on public.tasks;
create policy "tasks_scope_write" on public.tasks for all to authenticated using (
  public.is_admin() or created_by = auth.uid() or (club_id = public.current_user_club_id() and (public.has_role('Coach') or public.has_role('ClubAdmin') or public.has_role('TeamAdmin')))
) with check (
  public.is_admin() or created_by = auth.uid() or (club_id = public.current_user_club_id() and (public.has_role('Coach') or public.has_role('ClubAdmin') or public.has_role('TeamAdmin')))
);

drop policy if exists "task_assignments_scope_read" on public.task_assignments;
create policy "task_assignments_scope_read" on public.task_assignments for select to authenticated using (
  assigned_to = auth.uid()
  or public.is_admin()
  or exists (select 1 from public.tasks t where t.id = task_assignments.task_id and t.club_id = public.current_user_club_id() and (public.has_role('Coach') or public.has_role('ClubAdmin') or public.has_role('TeamAdmin')))
);
drop policy if exists "task_assignments_scope_write" on public.task_assignments;
create policy "task_assignments_scope_write" on public.task_assignments for all to authenticated using (
  assigned_to = auth.uid()
  or public.is_admin()
  or exists (select 1 from public.tasks t where t.id = task_assignments.task_id and t.created_by = auth.uid())
) with check (
  assigned_to = auth.uid()
  or public.is_admin()
  or exists (select 1 from public.tasks t where t.id = task_assignments.task_id and t.created_by = auth.uid())
);

drop policy if exists "training_attendance_scope_read" on public.training_attendance;
create policy "training_attendance_scope_read" on public.training_attendance for select to authenticated using (
  athlete_id = auth.uid() or public.is_admin() or club_id = public.current_user_club_id()
);
drop policy if exists "training_attendance_scope_write" on public.training_attendance;
create policy "training_attendance_scope_write" on public.training_attendance for all to authenticated using (
  athlete_id = auth.uid() or public.is_admin() or (club_id = public.current_user_club_id() and (public.has_role('Coach') or public.has_role('ClubAdmin') or public.has_role('TeamAdmin')))
) with check (
  athlete_id = auth.uid() or public.is_admin() or (club_id = public.current_user_club_id() and (public.has_role('Coach') or public.has_role('ClubAdmin') or public.has_role('TeamAdmin')))
);

drop policy if exists "file_attachments_scope_read" on public.file_attachments;
create policy "file_attachments_scope_read" on public.file_attachments for select to authenticated using (
  deleted_at is null and (owner_id = auth.uid() or public.is_admin() or club_id = public.current_user_club_id())
);
drop policy if exists "file_attachments_scope_write" on public.file_attachments;
create policy "file_attachments_scope_write" on public.file_attachments for all to authenticated using (
  owner_id = auth.uid() or public.is_admin()
) with check (
  owner_id = auth.uid() or public.is_admin()
);

insert into storage.buckets (id, name, public)
values ('paddlio-files', 'paddlio-files', false)
on conflict (id) do nothing;
