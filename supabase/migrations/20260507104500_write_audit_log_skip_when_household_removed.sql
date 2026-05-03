-- During CASCADE delete of households, Postgres may tear down referencing rows before all
-- AFTER triggers finish; auditors can then try to INSERT audit_logs referencing a household
-- row that is already gone. Skip those inserts — audits are best-effort during teardown.

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
  -- Household already removed (mid–CASCADE teardown): nothing to anchor an audit FK to.
  if not exists (select 1 from public.households h where h.id = p_household_id) then
    return;
  end if;

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
