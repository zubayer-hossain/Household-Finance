-- Cascaded deletes from the PostgREST client run as authenticated, so strict RLS on child
-- tables interacts with BEFORE/AFTER triggers and can blow max_stack_depth. Delete as a
-- SECURITY DEFINER routine (table owner bypasses RLS) after the same safeguards as assessment.

create or replace function public.household_deletion_assessment(p_household_id uuid)
returns jsonb
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_role text;
  v_reasons text[] := array[]::text[];
  n_members int;
  n_budgets int;
  n_tx int;
  n_rec int;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  select public.household_role(p_household_id) into v_role;

  if v_role is null then
    raise exception 'Household not found or access denied';
  end if;

  if v_role <> 'owner' then
    return jsonb_build_object(
      'allowed', false,
      'reasons', jsonb_build_array('Only the owner can delete this household.')
    );
  end if;

  select count(*)::int
  into n_members
  from public.household_members hm
  where hm.household_id = p_household_id
    and hm.status = 'active';

  if n_members > 1 then
    v_reasons := array_append(
      v_reasons,
      'Other active members belong to this household. Remove teammates or deactivate their memberships before deleting.'
    );
  end if;

  select count(*)::int into n_budgets
  from public.monthly_budgets mb
  where mb.household_id = p_household_id;

  if n_budgets > 0 then
    v_reasons := array_append(
      v_reasons,
      'Budget periods exist for this household. Clearing financial history isn’t supported from this screen yet.'
    );
  end if;

  select count(*)::int into n_tx
  from public.transactions t
  where t.household_id = p_household_id
    and t.deleted_at is null;

  if n_tx > 0 then
    v_reasons := array_append(
      v_reasons,
      'Posted or draft transactions exist. Delete isn’t allowed while records remain.'
    );
  end if;

  select count(*)::int into n_rec
  from public.recurring_expenses r
  where r.household_id = p_household_id;

  if n_rec > 0 then
    v_reasons := array_append(
      v_reasons,
      'Recurring expense templates exist for this household. Remove them before deleting.'
    );
  end if;

  return jsonb_build_object(
    'allowed', coalesce(array_length(v_reasons, 1), 0) = 0,
    'reasons', to_jsonb(v_reasons)
  );
end;
$$;

create or replace function public.delete_my_household(p_household_id uuid)
returns void
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v jsonb;
  v_msg text;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  v := public.household_deletion_assessment(p_household_id);

  if not coalesce((v->>'allowed')::boolean, false) then
    select coalesce(string_agg(r, E'\n'), 'Delete not allowed.')
    into v_msg
    from jsonb_array_elements_text(coalesce(v->'reasons', '[]'::jsonb)) as elems(r);

    raise exception '%', v_msg;
  end if;

  delete from public.households
  where id = p_household_id;

  if not found then
    raise exception 'Household not found';
  end if;
end;
$$;

comment on function public.delete_my_household(uuid) is
  'Owner-only guarded delete with CASCADE; runs definer-privileged deletes to avoid RLS/stack blowups from the API client.';

revoke all on function public.delete_my_household(uuid) from public;
grant execute on function public.delete_my_household(uuid) to authenticated;
