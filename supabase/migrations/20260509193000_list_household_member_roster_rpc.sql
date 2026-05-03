-- Reliable roster read bypassing brittle client + RLS edge cases on embedded users.

create or replace function public.list_household_member_roster(p_household_id uuid)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    jsonb_agg(
      roster.row_json
      order by
        roster.st_rank,
        roster.role_rank,
        roster.sort_name
    ),
    '[]'::jsonb
  )
  from (
    select
      jsonb_build_object(
        'id', hm.id,
        'user_id', hm.user_id,
        'role', hm.role,
        'status', hm.status,
        'joined_at', hm.joined_at,
        'users',
        case
          when u.id is null then null
          else jsonb_build_object(
            'id', u.id,
            'full_name', u.full_name,
            'avatar_url', u.avatar_url,
            'preferred_language', u.preferred_language
          )
        end
      ) as row_json,
      case hm.status
        when 'active' then 0
        when 'invited' then 1
        else 2
      end as st_rank,
      case hm.role
        when 'owner' then 0
        when 'admin' then 1
        when 'contributor' then 2
        else 3
      end as role_rank,
      coalesce(u.full_name, '') as sort_name
    from public.household_members hm
    left join public.users u on u.id = hm.user_id
    where hm.household_id = p_household_id
      and hm.status in ('active', 'invited')
      and exists (
        select 1
        from public.household_members me
        where me.household_id = p_household_id
          and me.user_id = auth.uid()
          and me.status in ('active', 'invited')
      )
  ) roster;
$$;

comment on function public.list_household_member_roster(uuid) is
  'Returns member rows with embedded users json for the roster UI (active or invited callers).';

revoke all on function public.list_household_member_roster(uuid) from public;
grant execute on function public.list_household_member_roster(uuid) to authenticated;
