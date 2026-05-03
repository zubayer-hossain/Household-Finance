-- Trigger helpers in schema `private` were SECURITY INVOKER while `USAGE` on
-- schema `private` is revoked from PUBLIC (see foundation migration).
-- Authenticated INSERT/UPDATE flows (e.g. budget_categories) therefore failed with:
-- "permission denied for schema private".
-- Run enforcement triggers as DEFINER with a fixed search_path; RLS on the
-- mutating table still applies to the session before triggers fire; nested
-- policy helpers in `public` continue to use auth.uid().

create or replace function private.set_updated_at()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create or replace function private.enforce_transaction_integrity()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1
    from public.budget_categories bc
    where bc.id = new.budget_category_id
      and bc.monthly_budget_id = new.monthly_budget_id
      and bc.household_id = new.household_id
  ) then
    raise exception 'budget_category_id must belong to the same monthly_budget_id and household_id';
  end if;
  return new;
end;
$$;

create or replace function private.enforce_recurring_category_household()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1
    from public.budget_categories bc
    where bc.id = new.budget_category_id
      and bc.household_id = new.household_id
  ) then
    raise exception 'recurring budget_category_id must belong to the same household_id';
  end if;
  return new;
end;
$$;

create or replace function private.enforce_attachment_household()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  h uuid;
begin
  select t.household_id into h
  from public.transactions t
  where t.id = new.transaction_id;

  if h is null then
    raise exception 'transaction not found';
  end if;

  if new.household_id is distinct from h then
    raise exception 'transaction_attachments.household_id must match transaction.household_id';
  end if;

  return new;
end;
$$;

create or replace function private.assert_budget_period_not_closed(p_monthly_budget_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_monthly_budget_id is not null and public.is_month_closed(p_monthly_budget_id) then
    raise exception 'Closed month is read-only';
  end if;
end;
$$;

create or replace function private.enforce_budget_category_house_month()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  mb_h uuid;
begin
  select mb.household_id
  into mb_h
  from public.monthly_budgets mb
  where mb.id = new.monthly_budget_id;

  if mb_h is null then
    raise exception 'monthly_budget_id must reference an existing monthly budget';
  end if;

  if new.household_id is distinct from mb_h then
    raise exception 'budget_categories.household_id must match the parent monthly_budget.household_id';
  end if;

  return new;
end;
$$;

create or replace function private.enforce_budget_adjustment_alignment()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  ch uuid;
  cm uuid;
begin
  select bc.household_id, bc.monthly_budget_id
  into ch, cm
  from public.budget_categories bc
  where bc.id = new.budget_category_id;

  if ch is null then
    raise exception 'budget_category_id must reference an existing category';
  end if;

  if ch is distinct from new.household_id
     or cm is distinct from new.monthly_budget_id then
    raise exception 'budget_adjustment rows must align with category household and monthly_budget_id';
  end if;

  return new;
end;
$$;

create or replace function private.enforce_budget_reallocation_alignment()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  from_h uuid;
  from_m uuid;
  to_h uuid;
  to_m uuid;
begin
  select bc.household_id, bc.monthly_budget_id
  into from_h, from_m
  from public.budget_categories bc
  where bc.id = new.from_category_id;

  select bc.household_id, bc.monthly_budget_id
  into to_h, to_m
  from public.budget_categories bc
  where bc.id = new.to_category_id;

  if from_h is null or to_h is null then
    raise exception 'from_category_id and to_category_id must reference existing categories';
  end if;

  if new.household_id is distinct from from_h
     or new.household_id is distinct from to_h
     or new.monthly_budget_id is distinct from from_m
     or new.monthly_budget_id is distinct from to_m
     or from_m is distinct from to_m then
    raise exception 'reallocation categories must belong to the same household and monthly_budget';
  end if;

  return new;
end;
$$;

create or replace function private.enforce_monthly_budget_not_closed_row()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  mid uuid;
begin
  mid := coalesce(new.monthly_budget_id, old.monthly_budget_id);
  perform private.assert_budget_period_not_closed(mid);
  return coalesce(new, old);
end;
$$;

create or replace function private.enforce_transaction_attachments_period_open()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  mid uuid;
begin
  select t.monthly_budget_id into mid
  from public.transactions t
  where t.id = coalesce(new.transaction_id, old.transaction_id);

  perform private.assert_budget_period_not_closed(mid);
  return coalesce(new, old);
end;
$$;

create or replace function private.enforce_monthly_insights_period_open()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  mid uuid;
begin
  mid := coalesce(new.monthly_budget_id, old.monthly_budget_id);
  perform private.assert_budget_period_not_closed(mid);
  return coalesce(new, old);
end;
$$;

create or replace function private.enforce_monthly_budget_self_closed()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.status = 'closed' and new is distinct from old then
    raise exception 'Closed monthly budget cannot be modified';
  end if;
  return new;
end;
$$;

create or replace function private.enforce_recurring_budget_period_open()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  mid uuid;
begin
  select bc.monthly_budget_id into mid
  from public.budget_categories bc
  where bc.id = coalesce(new.budget_category_id, old.budget_category_id);

  perform private.assert_budget_period_not_closed(mid);
  return coalesce(new, old);
end;
$$;

create or replace function private.enforce_monthly_budget_approval_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status is distinct from old.status
     or new.approved_by is distinct from old.approved_by
     or new.approved_at is distinct from old.approved_at
     or new.closed_at is distinct from old.closed_at
  then
    if not public.is_budget_elevated(new.household_id) then
      raise exception 'Only owner or admin can change budget approval or close state';
    end if;
  end if;
  return new;
end;
$$;

create or replace function private.enforce_transaction_update_rules()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  elevated boolean;
begin
  if tg_op <> 'UPDATE' then
    return new;
  end if;

  elevated := public.is_budget_elevated(new.household_id);

  if old.deleted_at is not null then
    if new is distinct from old
       and (new.deleted_at is not distinct from old.deleted_at) then
      raise exception 'Soft-deleted transaction cannot be modified';
    end if;
  end if;

  if not elevated then
    if new.created_by is distinct from auth.uid() then
      raise exception 'Cannot modify transaction created by another user';
    end if;

    if old.status = 'posted' then
      if new.amount is distinct from old.amount
         or new.budget_category_id is distinct from old.budget_category_id
         or new.monthly_budget_id is distinct from old.monthly_budget_id
         or new.transaction_date is distinct from old.transaction_date
         or new.source_type is distinct from old.source_type
         or new.status is distinct from old.status
         or new.household_id is distinct from old.household_id
         or new.created_by is distinct from old.created_by
      then
        raise exception 'Posted transaction financial fields are immutable for non-elevated members';
      end if;
    end if;
  end if;

  return new;
end;
$$;
