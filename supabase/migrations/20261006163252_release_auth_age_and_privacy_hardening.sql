-- Paddlio 5.0 release hardening:
-- 1. server-side minimum age gate for self-registration via Supabase Auth hook;
-- 2. preserve shared conversations after account deletion by anonymizing identity links.

create or replace function public.paddlio_before_user_created_500(event jsonb)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  birth_date_text text := nullif(event -> 'user' -> 'user_metadata' ->> 'birthDate', '');
  birth_date_value date;
begin
  if birth_date_text is null or birth_date_text !~ '^\d{4}-\d{2}-\d{2}$' then
    return jsonb_build_object(
      'error', jsonb_build_object(
        'http_code', 400,
        'message', 'Für die Registrierung ist ein gültiges Geburtsdatum erforderlich.'
      )
    );
  end if;

  begin
    birth_date_value := birth_date_text::date;
  exception when others then
    return jsonb_build_object(
      'error', jsonb_build_object(
        'http_code', 400,
        'message', 'Für die Registrierung ist ein gültiges Geburtsdatum erforderlich.'
      )
    );
  end;

  if to_char(birth_date_value, 'YYYY-MM-DD') <> birth_date_text
     or birth_date_value > current_date - interval '16 years' then
    return jsonb_build_object(
      'error', jsonb_build_object(
        'http_code', 403,
        'message', 'Die selbstständige Registrierung ist ab 16 Jahren möglich.'
      )
    );
  end if;

  return '{}'::jsonb;
end;
$$;

revoke all on function public.paddlio_before_user_created_500(jsonb) from public, anon, authenticated;
grant execute on function public.paddlio_before_user_created_500(jsonb) to supabase_auth_admin;
comment on function public.paddlio_before_user_created_500(jsonb) is
  'Supabase Before User Created hook enforcing the Paddlio 16+ self-registration policy.';

alter table if exists public.direct_messages alter column sender_id drop not null;
alter table if exists public.direct_messages alter column receiver_id drop not null;
alter table if exists public.group_messages alter column sender_id drop not null;

alter table if exists public.direct_messages drop constraint if exists direct_messages_sender_id_fkey;
alter table if exists public.direct_messages
  add constraint direct_messages_sender_id_fkey foreign key (sender_id) references public.profiles(id) on delete set null;
alter table if exists public.direct_messages drop constraint if exists direct_messages_receiver_id_fkey;
alter table if exists public.direct_messages
  add constraint direct_messages_receiver_id_fkey foreign key (receiver_id) references public.profiles(id) on delete set null;

alter table if exists public.group_messages drop constraint if exists group_messages_sender_id_fkey;
alter table if exists public.group_messages
  add constraint group_messages_sender_id_fkey foreign key (sender_id) references public.profiles(id) on delete set null;

alter table if exists public.club_messages drop constraint if exists club_messages_sender_id_fkey;
alter table if exists public.club_messages
  add constraint club_messages_sender_id_fkey foreign key (sender_id) references public.profiles(id) on delete set null;
alter table if exists public.club_messages drop constraint if exists club_messages_target_user_id_fkey;
alter table if exists public.club_messages
  add constraint club_messages_target_user_id_fkey foreign key (target_user_id) references public.profiles(id) on delete set null;

alter table if exists public.club_posts drop constraint if exists club_posts_author_id_fkey;
alter table if exists public.club_posts
  add constraint club_posts_author_id_fkey foreign key (author_id) references public.profiles(id) on delete set null;
alter table if exists public.club_posts drop constraint if exists club_posts_target_user_id_fkey;
alter table if exists public.club_posts
  add constraint club_posts_target_user_id_fkey foreign key (target_user_id) references public.profiles(id) on delete set null;

notify pgrst, 'reload schema';
