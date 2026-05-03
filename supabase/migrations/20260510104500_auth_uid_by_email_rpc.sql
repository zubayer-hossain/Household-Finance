-- Resolve auth.users.id by email for server-side invite reconciliation.
-- Invite flow hits duplicate emails when paginated admin list misses the row; RPC is authoritative.

create or replace function public.auth_uid_by_email(p_email text)
returns uuid
language sql
stable
security definer
set search_path = auth
as $$
  select u.id
  from auth.users u
  where lower(btrim(coalesce(u.email, ''))) = lower(btrim(coalesce(p_email, '')))
  limit 1;
$$;

comment on function public.auth_uid_by_email(text) is
  'Looks up Supabase Auth user id by normalized email for service-role invite tooling.';

revoke all on function public.auth_uid_by_email(text) from public;
grant execute on function public.auth_uid_by_email(text) to service_role;
