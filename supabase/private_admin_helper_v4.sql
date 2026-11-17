-- Final RAHA admin RLS helper.
-- The helper lives outside the exposed public schema and is callable only during authenticated policy evaluation.
create schema if not exists private;

create or replace function private.is_admin () returns boolean language sql stable security definer
set
  search_path = public as $$
  select exists (select 1 from public.admin_profiles where id = (select auth.uid()) and role in ('admin', 'editor'));
$$;

revoke all on function private.is_admin ()
from
  public,
  anon;

grant usage on schema private to authenticated;

grant
execute on function private.is_admin () to authenticated;

revoke all on function public.is_admin ()
from
  public,
  anon,
  authenticated;

revoke all on function public.handle_raha_admin_signup ()
from
  public,
  anon,
  authenticated;

-- Policies in this migration use (select private.is_admin()) and are scoped to authenticated users for mutations.
