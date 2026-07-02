-- Paddlio 3.0.3 cloud data sync foundation

create table if not exists public.training_templates (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  club_id uuid references public.clubs(id) on delete cascade,
  created_by uuid references public.profiles(id) on delete set null,
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
  constraint training_templates_category_check check (category in ('K1', 'C1', 'Ausdauer', 'Kraft', 'Technik', 'Regeneration', 'Wettkampf', 'Allgemein')),
  constraint training_templates_boat_class_check check (boat_class is null or boat_class in ('K1', 'C1', 'K1+C1', 'none')),
  constraint training_templates_intensity_check check (default_intensity in ('locker', 'mittel', 'hart', 'maximal')),
  constraint training_templates_visibility_check check (visibility in ('private', 'club'))
);

create trigger set_training_templates_updated_at
before update on public.training_templates
for each row execute function public.set_updated_at();

create index if not exists training_templates_owner_id_idx on public.training_templates(owner_id);
create index if not exists training_templates_club_id_idx on public.training_templates(club_id);
create index if not exists training_templates_visibility_idx on public.training_templates(visibility);

alter table public.training_templates enable row level security;

create policy "training_templates_scope_select" on public.training_templates
  for select using (
    owner_id = auth.uid()
    or public.is_admin()
    or (visibility = 'club' and club_id = public.current_user_club_id() and (public.has_role('Coach') or public.has_role('TeamAdmin')))
  );

create policy "training_templates_scope_write" on public.training_templates
  for all using (
    owner_id = auth.uid()
    or public.is_admin()
    or (visibility = 'club' and club_id = public.current_user_club_id() and (public.has_role('Coach') or public.has_role('TeamAdmin')))
  )
  with check (
    owner_id = auth.uid()
    or public.is_admin()
    or (visibility = 'club' and club_id = public.current_user_club_id() and (public.has_role('Coach') or public.has_role('TeamAdmin')))
  );
