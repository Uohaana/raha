-- RAHA security and query-plan hardening.
-- Keep admin checks non-executable from the public API while preserving policy evaluation.
create or replace function public.is_admin () returns boolean language sql stable security invoker
set
  search_path = public as $$
  select exists(
    select 1
    from public.admin_profiles
    where id = (select auth.uid())
      and role in ('admin', 'editor')
  );
$$;

revoke all on function public.handle_raha_admin_signup ()
from
  public,
  anon,
  authenticated;

revoke all on function public.is_admin ()
from
  public,
  anon,
  authenticated;

drop index if exists public.idx_orders_user_id;

drop index if exists public.idx_order_items_order_id;

drop index if exists public.idx_order_items_perfume_id;

drop index if exists public.idx_reviews_user_id;

create index idx_orders_user_id on public.orders (user_id);

create index idx_order_items_order_id on public.order_items (order_id);

create index idx_order_items_perfume_id on public.order_items (perfume_id);

create index idx_reviews_user_id on public.reviews (user_id);

-- Policies use initplan-wrapped auth calls so the identity is evaluated once per statement.
drop policy if exists "admins read their profile" on public.admin_profiles;

create policy "admins read their profile" on public.admin_profiles for
select
  using (
    (
      select
        auth.uid ()
    ) = id
  );

drop policy if exists "customers read own orders" on public.orders;

create policy "customers read own orders" on public.orders for
select
  using (
    (
      select
        auth.uid ()
    ) = user_id
    or (
      select
        public.is_admin ()
    )
  );

drop policy if exists "customers create own orders" on public.orders;

create policy "customers create own orders" on public.orders for insert
with
  check (
    (
      select
        auth.uid ()
    ) = user_id
  );

drop policy if exists "admins update orders" on public.orders;

create policy "admins update orders" on public.orders
for update
  using (
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

create policy "customers read own order items" on public.order_items for
select
  using (
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

drop policy if exists "customers create own order items" on public.order_items;

create policy "customers create own order items" on public.order_items for insert
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

drop policy if exists "public read approved reviews" on public.reviews;

create policy "public read approved reviews" on public.reviews for
select
  using (
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

drop policy if exists "customers create reviews" on public.reviews;

create policy "customers create reviews" on public.reviews for insert
with
  check (
    (
      select
        auth.uid ()
    ) = user_id
  );

drop policy if exists "customers edit own pending reviews" on public.reviews;

create policy "customers edit own pending reviews" on public.reviews
for update
  using (
    (
      select
        auth.uid ()
    ) = user_id
    and status = 'pending'
  )
with
  check (
    (
      select
        auth.uid ()
    ) = user_id
    and status = 'pending'
  );

drop policy if exists "admins moderate reviews" on public.reviews;

create policy "admins moderate reviews" on public.reviews
for update
  using (
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
