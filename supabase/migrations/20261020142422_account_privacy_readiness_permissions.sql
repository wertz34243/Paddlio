-- Inspect catalog metadata without requiring USAGE on the private schema.
create or replace function public.account_deletion_ready()
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$
  select exists (
    select 1
    from pg_catalog.pg_trigger t
    join pg_catalog.pg_proc p on p.oid = t.tgfoid
    join pg_catalog.pg_namespace n on n.oid = p.pronamespace
    join pg_catalog.pg_class c on c.oid = t.tgrelid
    join pg_catalog.pg_namespace cn on cn.oid = c.relnamespace
    where cn.nspname = 'auth' and c.relname = 'users'
      and t.tgname = 'paddlio_cleanup_deleted_account'
      and t.tgenabled in ('O', 'A')
      and n.nspname = 'paddlio_private'
      and p.proname = 'cleanup_deleted_account'
      and p.pronargs = 0
      and t.tgtype = 11
  );
$$;
revoke all on function public.account_deletion_ready() from public, anon, authenticated;
grant execute on function public.account_deletion_ready() to service_role;
notify pgrst, 'reload schema';
