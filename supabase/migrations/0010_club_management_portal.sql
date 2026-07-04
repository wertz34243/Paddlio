do $$
begin
  alter table public.profiles drop constraint if exists profiles_roles_check;
  alter table public.profiles add constraint profiles_roles_check
    check (roles <@ array['Athlete', 'Coach', 'TeamAdmin', 'ClubAdmin', 'Admin']::text[]);
exception when duplicate_object then null;
end $$;

create or replace function public.is_club_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.has_role('ClubAdmin') or public.has_role('TeamAdmin') or public.is_admin();
$$;

create or replace function public.can_manage_own_club(target_club_id text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_admin()
    or (
      target_club_id is not null
      and target_club_id = public.current_user_club_id()::text
      and (public.has_role('Coach') or public.has_role('TeamAdmin') or public.has_role('ClubAdmin'))
    );
$$;

create table if not exists public.club_material (
  id text primary key,
  club_id text not null,
  inventory_number text,
  category text not null,
  name text not null,
  condition text,
  owner_user_id text,
  owner_name text,
  photo_url text,
  last_inspection_date date,
  remark text,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint club_material_status_check check (status in ('active', 'inactive'))
);

create table if not exists public.boats (
  id text primary key,
  club_id text not null,
  manufacturer text,
  model text,
  boat_class text not null default 'K1',
  length_cm numeric,
  weight_kg numeric,
  build_year integer,
  owner_user_id text,
  owner_name text,
  is_club_boat boolean not null default true,
  linked_athlete_ids text[] not null default array[]::text[],
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint boats_status_check check (status in ('active', 'inactive')),
  constraint boats_class_check check (boat_class in ('K1', 'C1', 'C2', 'Mannschaft'))
);

create table if not exists public.club_events (
  id text primary key,
  club_id text not null,
  title text not null,
  date date not null,
  time time,
  category text not null default 'training',
  group_id text,
  trainer_user_id text,
  athlete_user_id text,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint club_events_category_check check (category in ('training', 'competition', 'meeting', 'club_party', 'workday'))
);

create table if not exists public.club_documents (
  id text primary key,
  club_id text not null,
  folder text not null default 'Formulare',
  title text not null,
  file_name text,
  file_url text,
  mime_type text,
  visible_for_roles text[] not null default array['Coach', 'TeamAdmin', 'ClubAdmin', 'Admin']::text[],
  uploaded_by_user_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint club_documents_folder_check check (folder in ('Trainer', 'Sportler', 'Vorstand', 'Wettkaempfe', 'Formulare'))
);

create table if not exists public.club_messages (
  id text primary key,
  club_id text not null,
  sender_user_id text not null,
  audience text not null default 'club',
  group_id text,
  recipient_user_id text,
  title text not null,
  body text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint club_messages_audience_check check (audience in ('club', 'coaches', 'athletes', 'group', 'athlete'))
);

create table if not exists public.club_settings (
  club_id text primary key,
  logo_url text,
  primary_color text,
  secondary_color text,
  address text,
  homepage text,
  contact_name text,
  contact_email text,
  club_number text,
  imprint text,
  updated_at timestamptz not null default now()
);

create index if not exists club_material_club_id_idx on public.club_material(club_id);
create index if not exists boats_club_id_idx on public.boats(club_id);
create index if not exists club_events_club_id_date_idx on public.club_events(club_id, date);
create index if not exists club_documents_club_id_idx on public.club_documents(club_id);
create index if not exists club_messages_club_id_idx on public.club_messages(club_id);

drop trigger if exists club_material_updated_at on public.club_material;
create trigger club_material_updated_at before update on public.club_material for each row execute function public.set_updated_at();
drop trigger if exists boats_updated_at on public.boats;
create trigger boats_updated_at before update on public.boats for each row execute function public.set_updated_at();
drop trigger if exists club_events_updated_at on public.club_events;
create trigger club_events_updated_at before update on public.club_events for each row execute function public.set_updated_at();
drop trigger if exists club_documents_updated_at on public.club_documents;
create trigger club_documents_updated_at before update on public.club_documents for each row execute function public.set_updated_at();
drop trigger if exists club_messages_updated_at on public.club_messages;
create trigger club_messages_updated_at before update on public.club_messages for each row execute function public.set_updated_at();
drop trigger if exists club_settings_updated_at on public.club_settings;
create trigger club_settings_updated_at before update on public.club_settings for each row execute function public.set_updated_at();

alter table public.club_material enable row level security;
alter table public.boats enable row level security;
alter table public.club_events enable row level security;
alter table public.club_documents enable row level security;
alter table public.club_messages enable row level security;
alter table public.club_settings enable row level security;

drop policy if exists "club_material_read" on public.club_material;
create policy "club_material_read" on public.club_material for select to authenticated using (public.can_manage_own_club(club_id));
drop policy if exists "club_material_write" on public.club_material;
create policy "club_material_write" on public.club_material for all to authenticated using (public.can_manage_own_club(club_id)) with check (public.can_manage_own_club(club_id));

drop policy if exists "boats_read" on public.boats;
create policy "boats_read" on public.boats for select to authenticated using (public.can_manage_own_club(club_id));
drop policy if exists "boats_write" on public.boats;
create policy "boats_write" on public.boats for all to authenticated using (public.can_manage_own_club(club_id)) with check (public.can_manage_own_club(club_id));

drop policy if exists "club_events_read" on public.club_events;
create policy "club_events_read" on public.club_events for select to authenticated using (public.can_manage_own_club(club_id));
drop policy if exists "club_events_write" on public.club_events;
create policy "club_events_write" on public.club_events for all to authenticated using (public.can_manage_own_club(club_id)) with check (public.can_manage_own_club(club_id));

drop policy if exists "club_documents_read" on public.club_documents;
create policy "club_documents_read" on public.club_documents for select to authenticated using (public.can_manage_own_club(club_id));
drop policy if exists "club_documents_write" on public.club_documents;
create policy "club_documents_write" on public.club_documents for all to authenticated using (public.is_club_admin() and public.can_manage_own_club(club_id)) with check (public.is_club_admin() and public.can_manage_own_club(club_id));

drop policy if exists "club_messages_read" on public.club_messages;
create policy "club_messages_read" on public.club_messages for select to authenticated using (public.can_manage_own_club(club_id));
drop policy if exists "club_messages_write" on public.club_messages;
create policy "club_messages_write" on public.club_messages for all to authenticated using (public.can_manage_own_club(club_id)) with check (public.can_manage_own_club(club_id));

drop policy if exists "club_settings_read" on public.club_settings;
create policy "club_settings_read" on public.club_settings for select to authenticated using (public.can_manage_own_club(club_id));
drop policy if exists "club_settings_write" on public.club_settings;
create policy "club_settings_write" on public.club_settings for all to authenticated using (public.is_club_admin() and public.can_manage_own_club(club_id)) with check (public.is_club_admin() and public.can_manage_own_club(club_id));
