-- Allow contributors to edit financial fields on their own posted transactions while
-- the monthly budget period remains open (closure enforced by other triggers).
-- Elevated users retain unrestricted edits.

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
      if old.created_by is distinct from auth.uid() then
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
  end if;

  return new;
end;
$$;
