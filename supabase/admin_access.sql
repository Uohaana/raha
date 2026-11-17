-- Restore the confirmed RAHA admin identity.
-- Passwords are managed by Supabase Auth and are intentionally not stored here.
insert into public.admin_profiles (id, display_name, role)
values ('a2b1f0d2-d4f4-485e-98de-a8a2068d53af'::uuid, 'RAHA Admin', 'admin')
on conflict (id) do update
set display_name = excluded.display_name,
    role = excluded.role;

-- Admin RLS uses private.is_admin() from private_admin_helper_v4.sql.
-- Do not grant EXECUTE on the public helper to anon or authenticated roles.
