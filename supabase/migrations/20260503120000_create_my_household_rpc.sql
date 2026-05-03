-- Client-side INSERT into households can fail RLS ("new row violates row-level security")
-- when the REST session does not reliably expose JWT claims to auth.uid() in some setups.
-- This RPC inserts as SECURITY DEFINER while still enforcing created_by = auth.uid() inside the function body.

create or replace function public.create_my_household(
  p_name text,
  p_slug text,
  p_base_currency text,
  p_timezone text
)
returns public.households
language plpgsql
security definer
set search_path = public
as $$
declare
  result public.households;
  v_name text := trim(coalesce(p_name, ''));
  v_slug text := trim(coalesce(p_slug, ''));
  v_ccy text := upper(trim(coalesce(p_base_currency, 'BDT')));
  v_tz text := trim(coalesce(p_timezone, 'UTC'));
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;
  if v_name = '' then
    raise exception 'Household name is required';
  end if;
  if v_slug = '' then
    raise exception 'Household slug is required';
  end if;

  perform public.ensure_my_user_profile();

  insert into public.households (name, slug, created_by, base_currency, timezone)
  values (v_name, v_slug, auth.uid(), v_ccy, v_tz)
  returning * into strict result;

  return result;
end;
$$;

revoke all on function public.create_my_household(text, text, text, text) from public;
grant execute on function public.create_my_household(text, text, text, text) to authenticated;
