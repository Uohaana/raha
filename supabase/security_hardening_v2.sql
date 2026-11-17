-- RAHA security hardening v2.
-- Keep the admin helper callable only inside RLS evaluation and remove the old public grant.
create or replace function public.is_admin () returns boolean language sql stable security definer
set
  search_path = public as $$
  select exists (
    select 1
    from public.admin_profiles
    where id = (select auth.uid())
      and role in ('admin', 'editor')
  );
$$;

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

-- Public catalog reads remain public; mutations are authenticated-admin only.
drop policy if exists "published perfumes are public" on public.perfumes;

drop policy if exists "admins manage perfumes" on public.perfumes;

create policy "published perfumes are public" on public.perfumes for
select
  to anon,
  authenticated using (
    status = 'published'
    or (
      select
        public.is_admin ()
    )
  );

create policy "admins insert perfumes" on public.perfumes for insert to authenticated
with
  check (
    (
      select
        public.is_admin ()
    )
  );

create policy "admins update perfumes" on public.perfumes
for update
  to authenticated using (
    (
      select
        public.is_admin ()
    )
  )
with
  check (
    (
      select
        public.is_admin ()
    )
  );

create policy "admins delete perfumes" on public.perfumes for delete to authenticated using (
  (
    select
      public.is_admin ()
  )
);

-- Restrict all commerce mutations to authenticated users and allow only owners/admins to read.
drop policy if exists "customers read own orders" on public.orders;

drop policy if exists "customers create own orders" on public.orders;

drop policy if exists "admins update orders" on public.orders;

create policy "customers read own orders" on public.orders for
select
  to authenticated using (
    (
      select
        auth.uid ()
    ) = user_id
    or (
      select
        public.is_admin ()
    )
  );

create policy "customers create own orders" on public.orders for insert to authenticated
with
  check (
    (
      select
        auth.uid ()
    ) = user_id
  );

create policy "admins update orders" on public.orders
for update
  to authenticated using (
    (
      select
        public.is_admin ()
    )
  )
with
  check (
    (
      select
        public.is_admin ()
    )
  );

drop policy if exists "customers read own order items" on public.order_items;

drop policy if exists "customers create own order items" on public.order_items;

create policy "customers read own order items" on public.order_items for
select
  to authenticated using (
    exists (
      select
        1
      from
        public.orders o
      where
        o.id = order_id
        and (
          o.user_id = (
            select
              auth.uid ()
          )
          or (
            select
              public.is_admin ()
          )
        )
    )
  );

create policy "customers create own order items" on public.order_items for insert to authenticated
with
  check (
    exists (
      select
        1
      from
        public.orders o
      where
        o.id = order_id
        and o.user_id = (
          select
            auth.uid ()
        )
    )
  );

-- One update policy prevents customers from changing moderation state while admins may moderate.
drop policy if exists "public read approved reviews" on public.reviews;

drop policy if exists "customers create reviews" on public.reviews;

drop policy if exists "customers edit own pending reviews" on public.reviews;

drop policy if exists "admins moderate reviews" on public.reviews;

create policy "public read approved reviews" on public.reviews for
select
  to anon,
  authenticated using (
    status = 'approved'
    or user_id = (
      select
        auth.uid ()
    )
    or (
      select
        public.is_admin ()
    )
  );

create policy "customers create reviews" on public.reviews for insert to authenticated
with
  check (
    (
      select
        auth.uid ()
    ) = user_id
    and status = 'pending'
  );

create policy "review owners and admins update reviews" on public.reviews
for update
  to authenticated using (
    (
      select
        public.is_admin ()
    )
    or (
      (
        select
          auth.uid ()
      ) = user_id
      and status = 'pending'
    )
  )
with
  check (
    (
      select
        public.is_admin ()
    )
    or (
      (
        select
          auth.uid ()
      ) = user_id
      and status = 'pending'
    )
  );

-- Keep the private profile readable only by its signed-in owner.
drop policy if exists "admins read their profile" on public.admin_profiles;

create policy "admins read their profile" on public.admin_profiles for
select
  to authenticated using (
    (
      select
        auth.uid ()
    ) = id
  );
