-- Allow audit rows without a JWT actor (dashboard / service tooling) while still preferring auth.uid().
-- Fix write_audit_log to fall back to household.created_by when auth.uid() is null.

alter table public.audit_logs
  alter column actor_user_id drop not null;

comment on column public.audit_logs.actor_user_id is
  'User who triggered the change. Null when no JWT session (e.g. SQL dashboard) — see meta for context.';

create or replace function private.write_audit_log(
  p_household_id uuid,
  p_entity_type text,
  p_entity_id uuid,
  p_action text,
  p_meta jsonb default '{}'::jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid;
begin
  v_actor := auth.uid();
  if v_actor is null then
    select h.created_by
    into v_actor
    from public.households h
    where h.id = p_household_id;
  end if;

  insert into public.audit_logs (
    household_id,
    actor_user_id,
    entity_type,
    entity_id,
    action,
    meta
  )
  values (
    p_household_id,
    v_actor,
    p_entity_type,
    p_entity_id,
    p_action,
    coalesce(p_meta, '{}'::jsonb)
  );
end;
$$;

-- Server-side deletion guard (owner + data checks); bypasses RLS count quirks from the browser.
create or replace function public.household_deletion_assessment(p_household_id uuid)
returns jsonb
language plpgsql
stable
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

comment on function public.household_deletion_assessment(uuid) is
  'Returns {allowed, reasons} for UI and client-side delete flow; enforces membership + owner role.';

revoke all on function public.household_deletion_assessment(uuid) from public;
grant execute on function public.household_deletion_assessment(uuid) to authenticated;
