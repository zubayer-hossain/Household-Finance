-- Same class of issue as households INSERT: client REST + RLS + embedded resources
-- can return empty rows even when memberships exist. Aggregate in a SECURITY DEFINER
-- helper so listing is reliable while still scoping to auth.uid().

create or replace function public.list_my_household_memberships()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'household_id', hm.household_id,
        'role', hm.role,
        'household', to_jsonb(h)
      )
      order by h.name
    ),
    '[]'::jsonb
  )
  from public.household_members hm
  inner join public.households h on h.id = hm.household_id
  where hm.user_id = auth.uid()
    and hm.status = 'active';
$$;

revoke all on function public.list_my_household_memberships() from public;
grant execute on function public.list_my_household_memberships() to authenticated;
