-- Household category templates + safe draft monthly budget deletion.

-- ----------------------------------------------------------------------------
-- household_categories (templates; not tied to a month)
-- ----------------------------------------------------------------------------
create table public.household_categories (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  name text not null,
  slug text not null,
  category_type text not null check (category_type in ('fixed', 'variable')),
  default_amount numeric(12, 2) not null default 0 check (default_amount >= 0),
  display_order int not null default 0,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (household_id, slug)
);

create index idx_household_categories_household_order
  on public.household_categories (household_id, display_order);

create index idx_household_categories_household_active
  on public.household_categories (household_id)
  where archived_at is null;

create trigger household_categories_set_updated_at
before update on public.household_categories
for each row execute function private.set_updated_at();

alter table public.household_categories enable row level security;

create policy household_categories_select_member
  on public.household_categories
  for select
  to authenticated
  using (public.is_household_member(household_id));

create policy household_categories_insert_manage
  on public.household_categories
  for insert
  to authenticated
  with check (public.can_manage_budget(household_id));

create policy household_categories_update_manage
  on public.household_categories
  for update
  to authenticated
  using (public.can_manage_budget(household_id))
  with check (public.can_manage_budget(household_id));

-- No DELETE policy: categories are archived, not removed.

-- ----------------------------------------------------------------------------
-- Draft monthly budget delete guard + policy
-- ----------------------------------------------------------------------------
create or replace function private.enforce_monthly_budget_draft_delete()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if old.status is distinct from 'draft' then
    raise exception 'Only draft budgets can be deleted';
  end if;
  if exists (
    select 1
    from public.transactions t
    where t.monthly_budget_id = old.id
      and t.deleted_at is null
  ) then
    raise exception 'Cannot delete a draft budget while expenses exist for that month';
  end if;
  return old;
end;
$$;

create trigger trg_monthly_budgets_draft_delete_guard
before delete on public.monthly_budgets
for each row execute function private.enforce_monthly_budget_draft_delete();

create policy monthly_budgets_delete_draft
  on public.monthly_budgets
  for delete
  to authenticated
  using (
    public.can_manage_budget(household_id)
    and status = 'draft'
  );
