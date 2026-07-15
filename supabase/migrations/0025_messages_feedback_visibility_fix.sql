-- Paddlio 5.0 direct message and feedback visibility fix.
-- Safe, idempotent and non-destructive.

alter table public.direct_messages enable row level security;

drop policy if exists direct_messages_own_or_club_413 on public.direct_messages;
drop policy if exists direct_messages_admin_all_413 on public.direct_messages;
drop policy if exists direct_messages_own_read on public.direct_messages;
drop policy if exists direct_messages_own_insert on public.direct_messages;
drop policy if exists "direct_messages_own_read" on public.direct_messages;
drop policy if exists "direct_messages_own_write" on public.direct_messages;
drop policy if exists direct_messages_select_0025 on public.direct_messages;
drop policy if exists direct_messages_insert_0025 on public.direct_messages;
drop policy if exists direct_messages_update_0025 on public.direct_messages;
drop policy if exists direct_messages_delete_0025 on public.direct_messages;

create policy direct_messages_select_0025
  on public.direct_messages
  for select
  to authenticated
  using (
    deleted_at is null
    and (
      sender_id = auth.uid()
      or receiver_id = auth.uid()
      or public.paddlio_is_admin_415()
      or public.current_user_is_admin()
    )
  );

create policy direct_messages_insert_0025
  on public.direct_messages
  for insert
  to authenticated
  with check (
    sender_id = auth.uid()
    or public.paddlio_is_admin_415()
    or public.current_user_is_admin()
  );

create policy direct_messages_update_0025
  on public.direct_messages
  for update
  to authenticated
  using (
    sender_id = auth.uid()
    or receiver_id = auth.uid()
    or public.paddlio_is_admin_415()
    or public.current_user_is_admin()
  )
  with check (
    sender_id = auth.uid()
    or receiver_id = auth.uid()
    or public.paddlio_is_admin_415()
    or public.current_user_is_admin()
  );

create policy direct_messages_delete_0025
  on public.direct_messages
  for delete
  to authenticated
  using (
    sender_id = auth.uid()
    or public.paddlio_is_admin_415()
    or public.current_user_is_admin()
  );

create index if not exists idx_direct_messages_sender_receiver_0025
  on public.direct_messages(sender_id, receiver_id, created_at desc)
  where deleted_at is null;

create index if not exists idx_direct_messages_receiver_sender_0025
  on public.direct_messages(receiver_id, sender_id, created_at desc)
  where deleted_at is null;
