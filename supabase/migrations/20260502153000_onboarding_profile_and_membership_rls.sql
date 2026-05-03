-- Backfill onboarding for accounts without public.users rows, and ensure the
-- initial owner membership can be inserted even when SECURITY DEFINER triggers
-- are subject to household_members INSERT RLS.

-- ----------------------------------------------------------------------------
-- Ensures auth.uid() has a row in public.users (required FK for households.created_by).
-- ----------------------------------------------------------------------------
create or replace function public.ensure_my_user_profile()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  if not exists (select 1 from auth.users where id = auth.uid()) then
    raise exception 'Authenticated user missing from auth.users';
  end if;

  insert into public.users (id, full_name, avatar_url, preferred_language)
  select
    au.id,
    coalesce(
      au.raw_user_meta_data->>'full_name',
      au.raw_user_meta_data->>'name',
      split_part(au.email, '@', 1),
      'User'
    ),
    null,
    case
      when coalesce(au.raw_user_meta_data->>'preferred_language', 'en') in ('en', 'bn')
      then coalesce(au.raw_user_meta_data->>'preferred_language', 'en')
      else 'en'
    end
  from auth.users au
  where au.id = auth.uid()
  on conflict (id) do nothing;
end;
$$;

revoke all on function public.ensure_my_user_profile() from public;
grant execute on function public.ensure_my_user_profile() to authenticated;

-- ----------------------------------------------------------------------------
-- Bootstrap: creator becomes active owner (trigger + any invoker path).
-- Complements household_members_insert_admin for post-membership operations.
-- ----------------------------------------------------------------------------
create policy household_members_insert_creator_bootstrap
  on public.household_members
  for insert
  to authenticated
  with check (
    user_id = auth.uid()
    and role = 'owner'
    and status = 'active'
    and invited_by = auth.uid()
    and exists (
      select 1
      from public.households h
      where h.id = household_members.household_id
        and h.created_by = auth.uid()
    )
  );
