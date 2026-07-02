create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.has_role(required_role text)
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
      and required_role = any(roles)
      and status = 'active'
  );
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.has_role('Admin');
$$;

create or replace function public.current_user_club_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select club_id from public.profiles where id = auth.uid();
$$;

create table if not exists public.training_templates (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid,
  club_id uuid,
  created_by_user_id uuid,
  title text not null,
  category text not null default 'Allgemein',
  training_area text,
  training_type text,
  boat_class text,
  default_duration_minutes integer,
  default_intensity text not null default 'mittel',
  focus text,
  description text,
  notes text,
  tags text[] not null default array[]::text[],
  is_favorite boolean not null default false,
  visibility text not null default 'private',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  owner_id uuid,
  created_by uuid,
  constraint training_templates_category_check check (
    category in ('K1', 'C1', 'Ausdauer', 'Kraft', 'Technik', 'Regeneration', 'Wettkampf', 'Allgemein')
  ),
  constraint training_templates_boat_class_check check (
    boat_class is null or boat_class in ('K1', 'C1', 'K1+C1', 'none')
  ),
  constraint training_templates_intensity_check check (
    default_intensity in ('locker', 'mittel', 'hart', 'maximal')
  ),
  constraint training_templates_visibility_check check (
    visibility in ('private', 'club')
  )
);

alter table public.training_templates
  add column if not exists owner_user_id uuid;

alter table public.training_templates
  add column if not exists club_id uuid;

alter table public.training_templates
  add column if not exists created_by_user_id uuid;

alter table public.training_templates
  add column if not exists title text;

alter table public.training_templates
  add column if not exists category text not null default 'Allgemein';

alter table public.training_templates
  add column if not exists training_area text;

alter table public.training_templates
  add column if not exists training_type text;

alter table public.training_templates
  add column if not exists boat_class text;

alter table public.training_templates
  add column if not exists default_duration_minutes integer;

alter table public.training_templates
  add column if not exists default_intensity text not null default 'mittel';

alter table public.training_templates
  add column if not exists focus text;

alter table public.training_templates
  add column if not exists description text;

alter table public.training_templates
  add column if not exists notes text;

alter table public.training_templates
  add column if not exists tags text[] not null default array[]::text[];

alter table public.training_templates
  add column if not exists is_favorite boolean not null default false;

alter table public.training_templates
  add column if not exists visibility text not null default 'private';

alter table public.training_templates
  add column if not exists created_at timestamptz not null default now();

alter table public.training_templates
  add column if not exists updated_at timestamptz not null default now();

alter table public.training_templates
  add column if not exists owner_id uuid;

alter table public.training_templates
  add column if not exists created_by uuid;

create or replace function public.sync_training_template_user_columns()
returns trigger
language plpgsql
as $$
begin
  new.owner_user_id := coalesce(new.owner_user_id, new.owner_id);
  new.owner_id := coalesce(new.owner_id, new.owner_user_id);
  new.created_by_user_id := coalesce(new.created_by_user_id, new.created_by);
  new.created_by := coalesce(new.created_by, new.created_by_user_id);
  return new;
end;
$$;

drop trigger if exists sync_training_template_user_columns on public.training_templates;
create trigger sync_training_template_user_columns
before insert or update on public.training_templates
for each row execute function public.sync_training_template_user_columns();

drop trigger if exists set_training_templates_updated_at on public.training_templates;
create trigger set_training_templates_updated_at
before update on public.training_templates
for each row execute function public.set_updated_at();

create index if not exists training_templates_owner_user_id_idx on public.training_templates(owner_user_id);
create index if not exists training_templates_owner_id_idx on public.training_templates(owner_id);
create index if not exists training_templates_club_id_idx on public.training_templates(club_id);
create index if not exists training_templates_visibility_idx on public.training_templates(visibility);
create index if not exists training_templates_category_idx on public.training_templates(category);

do $$
begin
  if exists (
    select 1
    from information_schema.tables
    where table_schema = 'public'
      and table_name = 'profiles'
  ) then
    if not exists (
      select 1
      from information_schema.table_constraints
      where table_schema = 'public'
        and table_name = 'training_templates'
        and constraint_name = 'training_templates_owner_user_id_fk'
    ) then
      alter table public.training_templates
        add constraint training_templates_owner_user_id_fk
        foreign key (owner_user_id) references public.profiles(id) on delete cascade;
    end if;

    if not exists (
      select 1
      from information_schema.table_constraints
      where table_schema = 'public'
        and table_name = 'training_templates'
        and constraint_name = 'training_templates_owner_id_fk'
    ) then
      alter table public.training_templates
        add constraint training_templates_owner_id_fk
        foreign key (owner_id) references public.profiles(id) on delete cascade;
    end if;

    if not exists (
      select 1
      from information_schema.table_constraints
      where table_schema = 'public'
        and table_name = 'training_templates'
        and constraint_name = 'training_templates_created_by_user_id_fk'
    ) then
      alter table public.training_templates
        add constraint training_templates_created_by_user_id_fk
        foreign key (created_by_user_id) references public.profiles(id) on delete set null;
    end if;

    if not exists (
      select 1
      from information_schema.table_constraints
      where table_schema = 'public'
        and table_name = 'training_templates'
        and constraint_name = 'training_templates_created_by_fk'
    ) then
      alter table public.training_templates
        add constraint training_templates_created_by_fk
        foreign key (created_by) references public.profiles(id) on delete set null;
    end if;
  end if;

  if exists (
    select 1
    from information_schema.tables
    where table_schema = 'public'
      and table_name = 'clubs'
  ) then
    if not exists (
      select 1
      from information_schema.table_constraints
      where table_schema = 'public'
        and table_name = 'training_templates'
        and constraint_name = 'training_templates_club_id_fk'
    ) then
      alter table public.training_templates
        add constraint training_templates_club_id_fk
        foreign key (club_id) references public.clubs(id) on delete cascade;
    end if;
  end if;
end;
$$;

alter table public.training_templates enable row level security;

drop policy if exists "training_templates_scope_select" on public.training_templates;
create policy "training_templates_scope_select" on public.training_templates
  for select
  using (
    coalesce(owner_user_id, owner_id) = auth.uid()
    or public.is_admin()
    or (
      visibility = 'club'
      and club_id is not null
      and club_id = public.current_user_club_id()
      and (public.has_role('Coach') or public.has_role('TeamAdmin'))
    )
  );

drop policy if exists "training_templates_scope_insert" on public.training_templates;
create policy "training_templates_scope_insert" on public.training_templates
  for insert
  with check (
    coalesce(owner_user_id, owner_id) = auth.uid()
    or public.is_admin()
    or (
      visibility = 'club'
      and club_id is not null
      and club_id = public.current_user_club_id()
      and (public.has_role('Coach') or public.has_role('TeamAdmin'))
    )
  );

drop policy if exists "training_templates_scope_update" on public.training_templates;
create policy "training_templates_scope_update" on public.training_templates
  for update
  using (
    coalesce(owner_user_id, owner_id) = auth.uid()
    or public.is_admin()
    or (
      visibility = 'club'
      and club_id is not null
      and club_id = public.current_user_club_id()
      and (public.has_role('Coach') or public.has_role('TeamAdmin'))
    )
  )
  with check (
    coalesce(owner_user_id, owner_id) = auth.uid()
    or public.is_admin()
    or (
      visibility = 'club'
      and club_id is not null
      and club_id = public.current_user_club_id()
      and (public.has_role('Coach') or public.has_role('TeamAdmin'))
    )
  );

drop policy if exists "training_templates_scope_delete" on public.training_templates;
create policy "training_templates_scope_delete" on public.training_templates
  for delete
  using (
    coalesce(owner_user_id, owner_id) = auth.uid()
    or public.is_admin()
    or (
      visibility = 'club'
      and club_id is not null
      and club_id = public.current_user_club_id()
      and (public.has_role('Coach') or public.has_role('TeamAdmin'))
    )
  );
