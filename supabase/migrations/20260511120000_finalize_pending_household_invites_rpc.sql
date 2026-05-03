-- Invite links authenticate the user via magic-link style tokens (no password yet).
-- After first session, promoted invited rows so list_my_household_memberships + RLS helpers apply.

create or replace function public.finalize_pending_household_invites()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  n integer := 0;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  update public.household_members hm
  set
    status = 'active',
    joined_at = coalesce(hm.joined_at, now())
  where hm.user_id = auth.uid()
    and hm.status = 'invited';

  get diagnostics n = row_count;
  return coalesce(n, 0);
end;
$$;

comment on function public.finalize_pending_household_invites() is
  'Call after invitee signs in via email link: marks their invited household_members rows as active.';

revoke all on function public.finalize_pending_household_invites() from public;
grant execute on function public.finalize_pending_household_invites() to authenticated;
