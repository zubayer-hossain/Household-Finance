-- RLS policies on household_members (and others) call is_household_member() / household_role().
-- Those helpers were SECURITY INVOKER, so each internal SELECT re-applied RLS on household_members
-- → infinite recursion → "stack depth limit exceeded" (e.g. invite flow member check, list members).
-- Run these reads as SECURITY DEFINER (owner bypasses RLS); auth.uid() still scopes rows.

create or replace function public.is_household_member(p_household_id uuid)
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

create or replace function public.household_role(p_household_id uuid)
returns text
language sql
stable
security definer
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
security definer
set search_path = public
as $$
  select public.household_role(p_household_id) in ('owner', 'admin');
$$;

create or replace function public.can_manage_members(p_household_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.household_role(p_household_id) in ('owner', 'admin');
$$;

create or replace function public.can_manage_budget(p_household_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.household_role(p_household_id) in ('owner', 'admin', 'contributor');
$$;

create or replace function public.is_month_closed(p_monthly_budget_id uuid)
returns boolean
language sql
stable
security definer
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
security definer
set search_path = public
as $$
  select public.household_role(p_household_id) in ('owner', 'admin');
$$;
