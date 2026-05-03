-- Invited memberships use status='invited', but SELECT policy required is_household_member()
-- which only matches active rows — roster looked empty after "Invitation sent."

create or replace function public.actor_can_view_household_roster(p_household_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.household_members hm
    where hm.household_id = p_household_id
      and hm.user_id = auth.uid()
      and hm.status = 'active'
  );
$$;

comment on function public.actor_can_view_household_roster(uuid) is
  'True when caller is an active member; used for roster SELECT without RLS recursion.';

revoke all on function public.actor_can_view_household_roster(uuid) from public;
grant execute on function public.actor_can_view_household_roster(uuid) to authenticated;

drop policy if exists household_members_select_member on public.household_members;

create policy household_members_select_roster
  on public.household_members
  for select
  to authenticated
  using (
    public.actor_can_view_household_roster(household_id)
    or user_id = auth.uid()
  );

drop policy if exists users_select_self_or_peers on public.users;

create policy users_select_self_or_peers
  on public.users
  for select
  to authenticated
  using (
    id = auth.uid()
    or exists (
      select 1
      from public.household_members hm1
      join public.household_members hm2
        on hm1.household_id = hm2.household_id
       and hm2.user_id = public.users.id
      where hm1.user_id = auth.uid()
        and hm1.status in ('active', 'invited')
        and hm2.status in ('active', 'invited')
    )
  );
