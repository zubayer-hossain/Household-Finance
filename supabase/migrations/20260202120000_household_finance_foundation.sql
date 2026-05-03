-- ============================================================================
-- Household Financial Operating System — database foundation (Document 03)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Internal schema (SECURITY DEFINER helpers; not exposed to API clients)
-- ----------------------------------------------------------------------------
create schema if not exists private;
revoke all on schema private from public;

-- ----------------------------------------------------------------------------
-- Extensions
-- ----------------------------------------------------------------------------
create extension if not exists pgcrypto with schema extensions;

-- ----------------------------------------------------------------------------
-- Updated-at helper
-- ----------------------------------------------------------------------------
create or replace function private.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ----------------------------------------------------------------------------
-- public.users (extends auth.users)
-- ----------------------------------------------------------------------------
create table public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null,
  avatar_url text,
  preferred_language text not null default 'en'
    check (preferred_language in ('en', 'bn')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger users_set_updated_at
before update on public.users
for each row execute function private.set_updated_at();

-- Sync profile on auth signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, full_name, avatar_url)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'name',
      split_part(new.email, '@', 1),
      'User'
    ),
    null
  );
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- ----------------------------------------------------------------------------
-- households
-- ----------------------------------------------------------------------------
create table public.households (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  base_currency text not null default 'BDT',
  timezone text not null default 'Asia/Dhaka',
  created_by uuid not null references public.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger households_set_updated_at
before update on public.households
for each row execute function private.set_updated_at();

-- ----------------------------------------------------------------------------
-- household_members
-- ----------------------------------------------------------------------------
create table public.household_members (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  user_id uuid not null references public.users (id) on delete cascade,
  role text not null check (role in ('owner', 'admin', 'contributor', 'viewer')),
  status text not null check (status in ('invited', 'active', 'removed')),
  invited_by uuid references public.users (id),
  joined_at timestamptz,
  created_at timestamptz not null default now(),
  unique (household_id, user_id)
);

-- Creator becomes owner (active) — household-first bootstrap
create or replace function private.create_household_owner_membership()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.household_members (
    household_id,
    user_id,
    role,
    status,
    invited_by,
    joined_at
  )
  values (
    new.id,
    new.created_by,
    'owner',
    'active',
    new.created_by,
    now()
  );
  return new;
end;
$$;

create trigger trg_households_owner_member
after insert on public.households
for each row execute function private.create_household_owner_membership();

-- ----------------------------------------------------------------------------
-- monthly_budgets
-- ----------------------------------------------------------------------------
create table public.monthly_budgets (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  year int not null,
  month int not null check (month between 1 and 12),
  total_budget numeric(12, 2) not null,
  total_spent numeric(12, 2) not null default 0,
  total_remaining numeric(12, 2) not null default 0,
  forecast_spent numeric(12, 2) not null default 0,
  forecast_savings numeric(12, 2) not null default 0,
  status text not null check (status in ('draft', 'active', 'closed')) default 'draft',
  approved_by uuid references public.users (id),
  approved_at timestamptz,
  closed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (household_id, year, month)
);

create trigger monthly_budgets_set_updated_at
before update on public.monthly_budgets
for each row execute function private.set_updated_at();

-- ----------------------------------------------------------------------------
-- budget_categories
-- ----------------------------------------------------------------------------
create table public.budget_categories (
  id uuid primary key default gen_random_uuid(),
  monthly_budget_id uuid not null references public.monthly_budgets (id) on delete cascade,
  household_id uuid not null references public.households (id) on delete cascade,
  name text not null,
  slug text not null,
  category_type text not null check (category_type in ('fixed', 'variable')),
  planned_amount numeric(12, 2) not null,
  adjusted_amount numeric(12, 2) not null,
  spent_amount numeric(12, 2) not null default 0,
  remaining_amount numeric(12, 2) not null default 0,
  usage_percent numeric(5, 2) not null default 0,
  display_order int not null default 0,
  color_token text,
  icon_name text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (monthly_budget_id, slug)
);

create trigger budget_categories_set_updated_at
before update on public.budget_categories
for each row execute function private.set_updated_at();

-- ----------------------------------------------------------------------------
-- transactions
-- ----------------------------------------------------------------------------
create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  monthly_budget_id uuid not null references public.monthly_budgets (id) on delete cascade,
  budget_category_id uuid not null references public.budget_categories (id),
  created_by uuid not null references public.users (id),
  amount numeric(12, 2) not null check (amount > 0),
  note text,
  transaction_date date not null,
  source_type text not null check (
    source_type in ('manual', 'recurring', 'ai_draft', 'ai_approved')
  ),
  status text not null check (status in ('draft', 'posted', 'archived')) default 'posted',
  attachment_count int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create trigger transactions_set_updated_at
before update on public.transactions
for each row execute function private.set_updated_at();

-- ----------------------------------------------------------------------------
-- transaction_attachments
-- ----------------------------------------------------------------------------
create table public.transaction_attachments (
  id uuid primary key default gen_random_uuid(),
  transaction_id uuid not null references public.transactions (id) on delete cascade,
  household_id uuid not null references public.households (id) on delete cascade,
  file_url text not null,
  file_name text not null,
  mime_type text not null,
  file_size int not null check (file_size > 0),
  uploaded_by uuid not null references public.users (id),
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- recurring_expenses
-- ----------------------------------------------------------------------------
create table public.recurring_expenses (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  budget_category_id uuid not null references public.budget_categories (id),
  title text not null,
  amount numeric(12, 2) not null check (amount > 0),
  repeat_cycle text not null check (repeat_cycle in ('monthly')),
  start_date date not null,
  end_date date,
  auto_create_draft boolean not null default true,
  auto_post boolean not null default false,
  is_active boolean not null default true,
  last_generated_at timestamptz,
  created_by uuid not null references public.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger recurring_expenses_set_updated_at
before update on public.recurring_expenses
for each row execute function private.set_updated_at();

-- ----------------------------------------------------------------------------
-- budget_adjustments
-- ----------------------------------------------------------------------------
create table public.budget_adjustments (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  monthly_budget_id uuid not null references public.monthly_budgets (id) on delete cascade,
  budget_category_id uuid not null references public.budget_categories (id) on delete cascade,
  previous_amount numeric(12, 2) not null,
  new_amount numeric(12, 2) not null,
  delta_amount numeric(12, 2) not null,
  reason text,
  changed_by uuid not null references public.users (id),
  created_at timestamptz not null default now(),
  check (delta_amount = new_amount - previous_amount)
);

-- ----------------------------------------------------------------------------
-- budget_reallocations
-- ----------------------------------------------------------------------------
create table public.budget_reallocations (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  monthly_budget_id uuid not null references public.monthly_budgets (id) on delete cascade,
  from_category_id uuid not null references public.budget_categories (id),
  to_category_id uuid not null references public.budget_categories (id),
  amount numeric(12, 2) not null check (amount > 0),
  reason text,
  moved_by uuid not null references public.users (id),
  created_at timestamptz not null default now(),
  check (from_category_id <> to_category_id)
);

-- ----------------------------------------------------------------------------
-- monthly_insights
-- ----------------------------------------------------------------------------
create table public.monthly_insights (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  monthly_budget_id uuid not null references public.monthly_budgets (id) on delete cascade,
  top_spending_category_id uuid references public.budget_categories (id),
  overspending_risk_level text not null
    check (overspending_risk_level in ('low', 'medium', 'high')) default 'low',
  overspending_amount numeric(12, 2) not null default 0,
  savings_projection numeric(12, 2) not null default 0,
  burn_rate_score numeric(5, 2) not null default 0,
  generated_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- notifications
-- ----------------------------------------------------------------------------
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  user_id uuid not null references public.users (id) on delete cascade,
  type text not null,
  title text not null,
  body text not null,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- audit_logs
-- ----------------------------------------------------------------------------
create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  actor_user_id uuid not null references public.users (id),
  entity_type text not null,
  entity_id uuid not null,
  action text not null,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- ============================================================================
-- Indexes (per spec)
-- ============================================================================
create index idx_transactions_household_date
  on public.transactions (household_id, transaction_date);

create index idx_transactions_budget_category
  on public.transactions (monthly_budget_id, budget_category_id);

create index idx_budget_categories_monthly_budget
  on public.budget_categories (monthly_budget_id);

create index idx_recurring_expenses_household_active
  on public.recurring_expenses (household_id, is_active);

create index idx_monthly_budgets_household_period
  on public.monthly_budgets (household_id, year, month);

create index idx_audit_logs_household_created_at
  on public.audit_logs (household_id, created_at desc);

-- ============================================================================
-- RLS helper functions (session / invoker — use auth.uid())
-- ============================================================================
create or replace function public.is_household_member(p_household_id uuid)
returns boolean
language sql
stable
security invoker
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

create or replace function public.household_role(p_household_id uuid)
returns text
language sql
stable
security invoker
set search_path = public
as $$
  select hm.role
  from public.household_members hm
  where hm.household_id = p_household_id
    and hm.user_id = auth.uid()
    and hm.status = 'active'
  limit 1;
$$;

create or replace function public.can_manage_household(p_household_id uuid)
returns boolean
language sql
stable
security invoker
set search_path = public
as $$
  select public.household_role(p_household_id) in ('owner', 'admin');
$$;

create or replace function public.can_manage_members(p_household_id uuid)
returns boolean
language sql
stable
security invoker
set search_path = public
as $$
  select public.household_role(p_household_id) in ('owner', 'admin');
$$;

create or replace function public.can_manage_budget(p_household_id uuid)
returns boolean
language sql
stable
security invoker
set search_path = public
as $$
  select public.household_role(p_household_id) in ('owner', 'admin', 'contributor');
$$;

create or replace function public.is_month_closed(p_monthly_budget_id uuid)
returns boolean
language sql
stable
security invoker
set search_path = public
as $$
  select exists (
    select 1
    from public.monthly_budgets mb
    where mb.id = p_monthly_budget_id
      and mb.status = 'closed'
  );
$$;

create or replace function public.is_budget_elevated(p_household_id uuid)
returns boolean
language sql
stable
security invoker
set search_path = public
as $$
  select public.household_role(p_household_id) in ('owner', 'admin');
$$;

-- ============================================================================
-- Integrity: category & household alignment
-- ============================================================================
create or replace function private.enforce_transaction_integrity()
returns trigger
language plpgsql
security invoker
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

create trigger trg_transactions_integrity
before insert or update on public.transactions
for each row execute function private.enforce_transaction_integrity();

create or replace function private.enforce_recurring_category_household()
returns trigger
language plpgsql
security invoker
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

create trigger trg_recurring_category_household
before insert or update on public.recurring_expenses
for each row execute function private.enforce_recurring_category_household();

create or replace function private.enforce_attachment_household()
returns trigger
language plpgsql
security invoker
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

create trigger trg_transaction_attachments_household
before insert or update on public.transaction_attachments
for each row execute function private.enforce_attachment_household();

-- ============================================================================
-- Cross-period alignment (single enforcement path shared by triggers below)
-- ============================================================================
create or replace function private.assert_budget_period_not_closed(p_monthly_budget_id uuid)
returns void
language plpgsql
security invoker
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
security invoker
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

create trigger trg_budget_categories_house_month
before insert or update on public.budget_categories
for each row execute function private.enforce_budget_category_house_month();

create or replace function private.enforce_budget_adjustment_alignment()
returns trigger
language plpgsql
security invoker
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

create trigger trg_budget_adjustments_align
before insert on public.budget_adjustments
for each row execute function private.enforce_budget_adjustment_alignment();

create or replace function private.enforce_budget_reallocation_alignment()
returns trigger
language plpgsql
security invoker
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

create trigger trg_budget_reallocations_align
before insert on public.budget_reallocations
for each row execute function private.enforce_budget_reallocation_alignment();

-- ----------------------------------------------------------------------------
-- Closed month: enforced only via triggers (RLS trusts these for period lock)
-- ----------------------------------------------------------------------------
create or replace function private.enforce_monthly_budget_not_closed_row()
returns trigger
language plpgsql
security invoker
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
security invoker
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
security invoker
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
security invoker
set search_path = public
as $$
begin
  if old.status = 'closed' and new is distinct from old then
    raise exception 'Closed monthly budget cannot be modified';
  end if;
  return new;
end;
$$;

create trigger trg_monthly_budgets_immutable_when_closed
before update on public.monthly_budgets
for each row execute function private.enforce_monthly_budget_self_closed();

create trigger trg_budget_categories_not_closed
before insert or update or delete on public.budget_categories
for each row execute function private.enforce_monthly_budget_not_closed_row();

create trigger trg_transactions_not_closed
before insert or update on public.transactions
for each row execute function private.enforce_monthly_budget_not_closed_row();

create trigger trg_budget_adjustments_not_closed
before insert on public.budget_adjustments
for each row execute function private.enforce_monthly_budget_not_closed_row();

create trigger trg_budget_reallocations_not_closed
before insert on public.budget_reallocations
for each row execute function private.enforce_monthly_budget_not_closed_row();

create trigger trg_transaction_attachments_period_open
before insert or update or delete on public.transaction_attachments
for each row execute function private.enforce_transaction_attachments_period_open();

create trigger trg_monthly_insights_period_open
before insert or update or delete on public.monthly_insights
for each row execute function private.enforce_monthly_insights_period_open();

create or replace function private.enforce_recurring_budget_period_open()
returns trigger
language plpgsql
security invoker
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

create trigger trg_recurring_not_closed
before insert or update or delete on public.recurring_expenses
for each row execute function private.enforce_recurring_budget_period_open();

-- ============================================================================
-- Approvals: status / approval fields — owner & admin only
-- ============================================================================
create or replace function private.enforce_monthly_budget_approval_fields()
returns trigger
language plpgsql
security invoker
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

create trigger trg_monthly_budgets_approval_guard
before update on public.monthly_budgets
for each row execute function private.enforce_monthly_budget_approval_fields();

-- ============================================================================
-- Transactions: no hard delete; posted-row field immutability for non-elevated
-- ============================================================================
create or replace function private.enforce_transaction_update_rules()
returns trigger
language plpgsql
security invoker
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

create trigger trg_transactions_update_rules
before update on public.transactions
for each row execute function private.enforce_transaction_update_rules();

-- ============================================================================
-- Audit logging (SECURITY DEFINER — bypasses RLS on audit_logs)
-- ============================================================================
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
begin
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
    auth.uid(),
    p_entity_type,
    p_entity_id,
    p_action,
    coalesce(p_meta, '{}'::jsonb)
  );
end;
$$;

create or replace function private.audit_monthly_budgets()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_action text;
begin
  if tg_op = 'INSERT' then
    perform private.write_audit_log(
      new.household_id,
      'budget.period',
      new.id,
      'budget.period.created',
      jsonb_build_object('year', new.year, 'month', new.month, 'status', new.status)
    );
    return new;
  end if;

  if new.status = 'closed' and old.status is distinct from 'closed' then
    v_action := 'budget.period.closed';
  elsif new.approved_at is distinct from old.approved_at
     or new.approved_by is distinct from old.approved_by
     or (new.status = 'active' and old.status is distinct from 'active') then
    v_action := 'budget.period.approved';
  else
    v_action := 'budget.period.updated';
  end if;

  perform private.write_audit_log(
    new.household_id,
    'budget.period',
    new.id,
    v_action,
    jsonb_build_object(
      'before', jsonb_build_object(
        'status', old.status,
        'total_budget', old.total_budget,
        'approved_by', old.approved_by,
        'closed_at', old.closed_at
      ),
      'after', jsonb_build_object(
        'status', new.status,
        'total_budget', new.total_budget,
        'approved_by', new.approved_by,
        'closed_at', new.closed_at
      )
    )
  );
  return new;
end;
$$;

create trigger trg_audit_monthly_budgets
after insert or update on public.monthly_budgets
for each row execute function private.audit_monthly_budgets();

create or replace function private.audit_budget_categories()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    perform private.write_audit_log(
      new.household_id,
      'budget.category',
      new.id,
      'budget.category.created',
      jsonb_build_object('monthly_budget_id', new.monthly_budget_id, 'slug', new.slug)
    );
  elsif tg_op = 'UPDATE' then
    perform private.write_audit_log(
      new.household_id,
      'budget.category',
      new.id,
      'budget.category.updated',
      jsonb_build_object(
        'before', jsonb_build_object(
          'planned_amount', old.planned_amount,
          'adjusted_amount', old.adjusted_amount,
          'is_active', old.is_active
        ),
        'after', jsonb_build_object(
          'planned_amount', new.planned_amount,
          'adjusted_amount', new.adjusted_amount,
          'is_active', new.is_active
        )
      )
    );
  elsif tg_op = 'DELETE' then
    perform private.write_audit_log(
      old.household_id,
      'budget.category',
      old.id,
      'budget.category.deleted',
      jsonb_build_object('monthly_budget_id', old.monthly_budget_id, 'slug', old.slug)
    );
  end if;
  return coalesce(new, old);
end;
$$;

create trigger trg_audit_budget_categories
after insert or update or delete on public.budget_categories
for each row execute function private.audit_budget_categories();

create or replace function private.audit_budget_adjustments()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform private.write_audit_log(
    new.household_id,
    'budget.adjustment',
    new.id,
    'budget.adjustment.created',
    jsonb_build_object(
      'monthly_budget_id', new.monthly_budget_id,
      'budget_category_id', new.budget_category_id,
      'delta_amount', new.delta_amount
    )
  );
  return new;
end;
$$;

create trigger trg_audit_budget_adjustments
after insert on public.budget_adjustments
for each row execute function private.audit_budget_adjustments();

create or replace function private.audit_budget_reallocations()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform private.write_audit_log(
    new.household_id,
    'budget.reallocation',
    new.id,
    'budget.reallocation.created',
    jsonb_build_object(
      'monthly_budget_id', new.monthly_budget_id,
      'from_category_id', new.from_category_id,
      'to_category_id', new.to_category_id,
      'amount', new.amount
    )
  );
  return new;
end;
$$;

create trigger trg_audit_budget_reallocations
after insert on public.budget_reallocations
for each row execute function private.audit_budget_reallocations();

create or replace function private.audit_transactions()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    perform private.write_audit_log(
      new.household_id,
      'transaction',
      new.id,
      'transaction.created',
      jsonb_build_object(
        'monthly_budget_id', new.monthly_budget_id,
        'amount', new.amount,
        'status', new.status,
        'source_type', new.source_type
      )
    );
  elsif tg_op = 'UPDATE' then
    perform private.write_audit_log(
      new.household_id,
      'transaction',
      new.id,
      'transaction.updated',
      jsonb_build_object(
        'before', jsonb_build_object(
          'amount', old.amount,
          'note', old.note,
          'deleted_at', old.deleted_at,
          'status', old.status
        ),
        'after', jsonb_build_object(
          'amount', new.amount,
          'note', new.note,
          'deleted_at', new.deleted_at,
          'status', new.status
        )
      )
    );
  end if;
  return coalesce(new, old);
end;
$$;

create trigger trg_audit_transactions
after insert or update on public.transactions
for each row execute function private.audit_transactions();

create or replace function private.audit_recurring_expenses()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    perform private.write_audit_log(
      new.household_id,
      'recurring',
      new.id,
      'recurring.created',
      jsonb_build_object('title', new.title, 'is_active', new.is_active)
    );
  elsif tg_op = 'UPDATE' then
    perform private.write_audit_log(
      new.household_id,
      'recurring',
      new.id,
      'recurring.updated',
      jsonb_build_object(
        'before', jsonb_build_object(
          'is_active', old.is_active,
          'auto_create_draft', old.auto_create_draft,
          'auto_post', old.auto_post,
          'amount', old.amount
        ),
        'after', jsonb_build_object(
          'is_active', new.is_active,
          'auto_create_draft', new.auto_create_draft,
          'auto_post', new.auto_post,
          'amount', new.amount
        )
      )
    );
  elsif tg_op = 'DELETE' then
    perform private.write_audit_log(
      old.household_id,
      'recurring',
      old.id,
      'recurring.deleted',
      jsonb_build_object('title', old.title)
    );
  end if;
  return coalesce(new, old);
end;
$$;

create trigger trg_audit_recurring_expenses
after insert or update or delete on public.recurring_expenses
for each row execute function private.audit_recurring_expenses();

create or replace function private.audit_household_members()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    perform private.write_audit_log(
      new.household_id,
      'member',
      new.id,
      'member.created',
      jsonb_build_object(
        'user_id', new.user_id,
        'role', new.role,
        'status', new.status
      )
    );
  elsif tg_op = 'UPDATE' then
    perform private.write_audit_log(
      new.household_id,
      'member',
      new.id,
      'member.updated',
      jsonb_build_object(
        'before', jsonb_build_object('role', old.role, 'status', old.status),
        'after', jsonb_build_object('role', new.role, 'status', new.status)
      )
    );
  elsif tg_op = 'DELETE' then
    perform private.write_audit_log(
      old.household_id,
      'member',
      old.id,
      'member.deleted',
      jsonb_build_object('user_id', old.user_id, 'role', old.role)
    );
  end if;
  return coalesce(new, old);
end;
$$;

create trigger trg_audit_household_members
after insert or update or delete on public.household_members
for each row execute function private.audit_household_members();

create or replace function private.audit_households()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'UPDATE' then
    perform private.write_audit_log(
      new.id,
      'household',
      new.id,
      'household.updated',
      jsonb_build_object(
        'before', jsonb_build_object('name', old.name, 'slug', old.slug),
        'after', jsonb_build_object('name', new.name, 'slug', new.slug)
      )
    );
  end if;
  return new;
end;
$$;

create trigger trg_audit_households
after update on public.households
for each row execute function private.audit_households();

-- ============================================================================
-- Row Level Security
-- ============================================================================
alter table public.users enable row level security;
alter table public.households enable row level security;
alter table public.household_members enable row level security;
alter table public.monthly_budgets enable row level security;
alter table public.budget_categories enable row level security;
alter table public.transactions enable row level security;
alter table public.transaction_attachments enable row level security;
alter table public.recurring_expenses enable row level security;
alter table public.budget_adjustments enable row level security;
alter table public.budget_reallocations enable row level security;
alter table public.monthly_insights enable row level security;
alter table public.notifications enable row level security;
alter table public.audit_logs enable row level security;

-- users
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
        and hm1.status = 'active'
        and hm2.status = 'active'
    )
  );

create policy users_update_self
  on public.users
  for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- households
create policy households_select_member
  on public.households
  for select
  to authenticated
  using (public.is_household_member(id));

create policy households_insert_creator
  on public.households
  for insert
  to authenticated
  with check (created_by = auth.uid());

create policy households_update_admin
  on public.households
  for update
  to authenticated
  using (public.can_manage_household(id))
  with check (public.can_manage_household(id));

create policy households_delete_owner
  on public.households
  for delete
  to authenticated
  using (public.household_role(id) = 'owner');

-- household_members
create policy household_members_select_member
  on public.household_members
  for select
  to authenticated
  using (public.is_household_member(household_id));

create policy household_members_insert_admin
  on public.household_members
  for insert
  to authenticated
  with check (public.can_manage_members(household_id));

create policy household_members_update_admin
  on public.household_members
  for update
  to authenticated
  using (public.can_manage_members(household_id))
  with check (public.can_manage_members(household_id));

create policy household_members_delete_admin
  on public.household_members
  for delete
  to authenticated
  using (public.can_manage_members(household_id));

-- monthly_budgets
create policy monthly_budgets_select_member
  on public.monthly_budgets
  for select
  to authenticated
  using (public.is_household_member(household_id));

create policy monthly_budgets_insert_elevated
  on public.monthly_budgets
  for insert
  to authenticated
  with check (public.is_budget_elevated(household_id));

create policy monthly_budgets_update_elevated
  on public.monthly_budgets
  for update
  to authenticated
  using (
    public.is_budget_elevated(household_id)
    and status <> 'closed'
  )
  with check (public.is_budget_elevated(household_id));

-- budget_categories
create policy budget_categories_select_member
  on public.budget_categories
  for select
  to authenticated
  using (public.is_household_member(household_id));

create policy budget_categories_insert_budget_role
  on public.budget_categories
  for insert
  to authenticated
  with check (public.can_manage_budget(household_id));

create policy budget_categories_update_budget_role
  on public.budget_categories
  for update
  to authenticated
  using (public.can_manage_budget(household_id))
  with check (public.can_manage_budget(household_id));

create policy budget_categories_delete_elevated
  on public.budget_categories
  for delete
  to authenticated
  using (public.is_budget_elevated(household_id));

-- transactions
create policy transactions_select_member
  on public.transactions
  for select
  to authenticated
  using (public.is_household_member(household_id));

create policy transactions_insert_budget_role
  on public.transactions
  for insert
  to authenticated
  with check (
    public.can_manage_budget(household_id)
    and created_by = auth.uid()
  );

create policy transactions_update_rules
  on public.transactions
  for update
  to authenticated
  using (
    public.is_household_member(household_id)
    and (
      public.is_budget_elevated(household_id)
      or created_by = auth.uid()
    )
  )
  with check (
    public.is_household_member(household_id)
    and (
      public.is_budget_elevated(household_id)
      or created_by = auth.uid()
    )
  );

create policy transactions_no_hard_delete
  on public.transactions
  for delete
  to authenticated
  using (false);

-- transaction_attachments
create policy transaction_attachments_select_member
  on public.transaction_attachments
  for select
  to authenticated
  using (public.is_household_member(household_id));

create policy transaction_attachments_insert_budget_role
  on public.transaction_attachments
  for insert
  to authenticated
  with check (
    public.can_manage_budget(household_id)
    and uploaded_by = auth.uid()
  );

create policy transaction_attachments_update_owner_elevated
  on public.transaction_attachments
  for update
  to authenticated
  using (
    public.can_manage_budget(household_id)
    and (
      public.is_budget_elevated(household_id)
      or uploaded_by = auth.uid()
    )
  )
  with check (
    public.can_manage_budget(household_id)
    and (
      public.is_budget_elevated(household_id)
      or uploaded_by = auth.uid()
    )
  );

create policy transaction_attachments_delete_elevated_or_uploader
  on public.transaction_attachments
  for delete
  to authenticated
  using (
    public.can_manage_budget(household_id)
    and (
      public.is_budget_elevated(household_id)
      or uploaded_by = auth.uid()
    )
  );

-- recurring_expenses
create policy recurring_select_member
  on public.recurring_expenses
  for select
  to authenticated
  using (public.is_household_member(household_id));

create policy recurring_insert_elevated
  on public.recurring_expenses
  for insert
  to authenticated
  with check (
    public.is_budget_elevated(household_id)
    and created_by = auth.uid()
  );

create policy recurring_update_elevated
  on public.recurring_expenses
  for update
  to authenticated
  using (public.is_budget_elevated(household_id))
  with check (public.is_budget_elevated(household_id));

create policy recurring_delete_elevated
  on public.recurring_expenses
  for delete
  to authenticated
  using (public.is_budget_elevated(household_id));

-- budget_adjustments
create policy budget_adjustments_select_member
  on public.budget_adjustments
  for select
  to authenticated
  using (public.is_household_member(household_id));

create policy budget_adjustments_insert_elevated
  on public.budget_adjustments
  for insert
  to authenticated
  with check (
    public.is_budget_elevated(household_id)
    and changed_by = auth.uid()
  );

-- budget_reallocations (owner/admin only)
create policy budget_reallocations_select_member
  on public.budget_reallocations
  for select
  to authenticated
  using (public.is_household_member(household_id));

create policy budget_reallocations_insert_elevated
  on public.budget_reallocations
  for insert
  to authenticated
  with check (
    public.is_budget_elevated(household_id)
    and moved_by = auth.uid()
  );

-- monthly_insights
create policy monthly_insights_select_member
  on public.monthly_insights
  for select
  to authenticated
  using (public.is_household_member(household_id));

create policy monthly_insights_write_budget_role
  on public.monthly_insights
  for insert
  to authenticated
  with check (public.can_manage_budget(household_id));

create policy monthly_insights_update_budget_role
  on public.monthly_insights
  for update
  to authenticated
  using (public.can_manage_budget(household_id))
  with check (public.can_manage_budget(household_id));

create policy monthly_insights_delete_elevated
  on public.monthly_insights
  for delete
  to authenticated
  using (public.is_budget_elevated(household_id));

-- notifications
create policy notifications_select_own
  on public.notifications
  for select
  to authenticated
  using (
    user_id = auth.uid()
    and public.is_household_member(household_id)
  );

create policy notifications_insert_admin_members
  on public.notifications
  for insert
  to authenticated
  with check (
    public.can_manage_members(household_id)
    and public.is_household_member(user_id)
  );

create policy notifications_update_read_own
  on public.notifications
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- audit_logs (read members; inserts only via private.write_audit_log / triggers)
create policy audit_logs_select_member
  on public.audit_logs
  for select
  to authenticated
  using (public.is_household_member(household_id));

-- ============================================================================
-- Grants: helpers for API (PostgREST)
-- ============================================================================
grant usage on schema public to postgres, anon, authenticated, service_role;

grant select, insert, update, delete on all tables in schema public to postgres, service_role;
grant select, insert, update on all tables in schema public to authenticated;

revoke delete on public.transactions from authenticated;
revoke insert, update, delete on public.audit_logs from authenticated;

grant execute on function public.is_household_member(uuid) to authenticated;
grant execute on function public.household_role(uuid) to authenticated;
grant execute on function public.can_manage_household(uuid) to authenticated;
grant execute on function public.can_manage_members(uuid) to authenticated;
grant execute on function public.can_manage_budget(uuid) to authenticated;
grant execute on function public.is_month_closed(uuid) to authenticated;
grant execute on function public.is_budget_elevated(uuid) to authenticated;

-- ============================================================================
-- Storage buckets (private)
-- ============================================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  (
    'avatars',
    'avatars',
    false,
    5242880,
    array['image/jpeg', 'image/png', 'image/webp']::text[]
  ),
  (
    'receipts',
    'receipts',
    false,
    10485760,
    array[
      'image/jpeg',
      'image/png',
      'image/webp',
      'application/pdf'
    ]::text[]
  )
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Storage RLS policies
create policy avatars_select_own
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy avatars_insert_own
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy avatars_update_own
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy avatars_delete_own
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy receipts_select_household_member
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'receipts'
    and coalesce(array_length(storage.foldername(name), 1), 0) >= 2
    and public.is_household_member((storage.foldername(name))[1]::uuid)
  );

create policy receipts_insert_uploader_budget_role
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'receipts'
    and coalesce(array_length(storage.foldername(name), 1), 0) >= 2
    and public.can_manage_budget((storage.foldername(name))[1]::uuid)
    and (storage.foldername(name))[2] = auth.uid()::text
  );

create policy receipts_update_owner_or_elevated
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'receipts'
    and coalesce(array_length(storage.foldername(name), 1), 0) >= 2
    and public.can_manage_budget((storage.foldername(name))[1]::uuid)
    and (
      public.is_budget_elevated((storage.foldername(name))[1]::uuid)
      or (storage.foldername(name))[2] = auth.uid()::text
    )
  )
  with check (
    bucket_id = 'receipts'
    and coalesce(array_length(storage.foldername(name), 1), 0) >= 2
    and public.can_manage_budget((storage.foldername(name))[1]::uuid)
    and (
      public.is_budget_elevated((storage.foldername(name))[1]::uuid)
      or (storage.foldername(name))[2] = auth.uid()::text
    )
  );

create policy receipts_delete_owner_or_elevated
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'receipts'
    and coalesce(array_length(storage.foldername(name), 1), 0) >= 2
    and public.can_manage_budget((storage.foldername(name))[1]::uuid)
    and (
      public.is_budget_elevated((storage.foldername(name))[1]::uuid)
      or (storage.foldername(name))[2] = auth.uid()::text
    )
  );
