create extension if not exists pgcrypto;

create table if not exists public.perfumes (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  tagline text not null,
  notes text not null,
  price numeric(10, 2) not null default 0,
  image_url text not null,
  stock integer not null default 0,
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  created_at timestamptz not null default now()
);

create table if not exists public.admin_profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null default 'RAHA Admin',
  role text not null default 'admin' check (role in ('admin', 'editor')),
  created_at timestamptz not null default now()
);

alter table public.perfumes enable row level security;

alter table public.admin_profiles enable row level security;

create or replace function public.is_admin () returns boolean language sql stable security definer
set
  search_path = public as $$ select exists(select 1 from public.admin_profiles where id=auth.uid() and role in ('admin','editor')); $$;

drop policy if exists "published perfumes are public" on public.perfumes;

create policy "published perfumes are public" on public.perfumes for
select
  using (
    status = 'published'
    or public.is_admin ()
  );

drop policy if exists "admins manage perfumes" on public.perfumes;

create policy "admins manage perfumes" on public.perfumes for all using (public.is_admin ())
with
  check (public.is_admin ());

drop policy if exists "admins read their profile" on public.admin_profiles;

create policy "admins read their profile" on public.admin_profiles for
select
  using (id = auth.uid ());

insert into
  public.perfumes (
    slug,
    name,
    tagline,
    notes,
    price,
    image_url,
    stock,
    status
  )
values
  (
    'nocturne',
    'Nocturne',
    'Black amber / smoked woods',
    'Saffron · amber · vetiver',
    145,
    '/media/perfumes/nocturne.jpg',
    24,
    'published'
  ),
  (
    'saffron-veil',
    'Saffron Veil',
    'Bright spice / honeyed skin',
    'Saffron · osmanthus · suede',
    128,
    '/media/perfumes/saffron-veil.jpg',
    18,
    'published'
  ),
  (
    'velvet-oud',
    'Velvet Oud',
    'Plum smoke / polished oud',
    'Plum · oud · incense',
    162,
    '/media/perfumes/velvet-oud.jpg',
    11,
    'published'
  ),
  (
    'dawn-resin',
    'Dawn Resin',
    'Soft light / pale resins',
    'Bergamot · rose resin · cedar',
    134,
    '/media/perfumes/dawn-resin.jpg',
    31,
    'published'
  ),
  (
    'ember-bloom',
    'Ember Bloom',
    'Radiant spice / dark petals',
    'Pink pepper · rose · amberwood',
    152,
    '/media/perfumes/ember-bloom.jpg',
    16,
    'published'
  ),
  (
    'mineral-veil',
    'Mineral Veil',
    'Cold stone / clean musk',
    'Iris · mineral accord · white musk',
    119,
    '/media/perfumes/mineral-veil.jpg',
    27,
    'published'
  ),
  (
    'cinder-rose',
    'Cinder Rose',
    'Charred petals / warm skin',
    'Damask rose · incense · leather',
    158,
    '/media/perfumes/cinder-rose.jpg',
    13,
    'published'
  ),
  (
    'golden-hour',
    'Golden Hour',
    'Sun-warmed resin / soft light',
    'Bergamot · benzoin · cedar',
    139,
    '/media/perfumes/golden-hour.jpg',
    22,
    'published'
  )
on conflict (slug) do update
set
  image_url = excluded.image_url;

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  email text not null,
  total numeric(10, 2) not null default 0,
  status text not null default 'pending' check (
    status in (
      'pending',
      'confirmed',
      'packed',
      'shipped',
      'completed',
      'cancelled'
    )
  ),
  shipping jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  perfume_id uuid references public.perfumes (id) on delete set null,
  product_name text not null,
  unit_price numeric(10, 2) not null,
  quantity integer not null check (quantity > 0),
  created_at timestamptz not null default now()
);

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  perfume_id uuid not null references public.perfumes (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  rating integer not null check (rating between 1 and 5),
  title text not null,
  body text not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now(),
  unique (perfume_id, user_id)
);

alter table public.orders enable row level security;

alter table public.order_items enable row level security;

alter table public.reviews enable row level security;

drop policy if exists "customers read own orders" on public.orders;

create policy "customers read own orders" on public.orders for
select
  using (
    user_id = auth.uid ()
    or public.is_admin ()
  );

drop policy if exists "customers create own orders" on public.orders;

create policy "customers create own orders" on public.orders for insert
with
  check (user_id = auth.uid ());

drop policy if exists "admins update orders" on public.orders;

create policy "admins update orders" on public.orders
for update
  using (public.is_admin ())
with
  check (public.is_admin ());

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
          o.user_id = auth.uid ()
          or public.is_admin ()
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
        and o.user_id = auth.uid ()
    )
  );

drop policy if exists "public read approved reviews" on public.reviews;

create policy "public read approved reviews" on public.reviews for
select
  using (
    status = 'approved'
    or user_id = auth.uid ()
    or public.is_admin ()
  );

drop policy if exists "customers create reviews" on public.reviews;

create policy "customers create reviews" on public.reviews for insert
with
  check (user_id = auth.uid ());

drop policy if exists "customers edit own pending reviews" on public.reviews;

create policy "customers edit own pending reviews" on public.reviews
for update
  using (
    user_id = auth.uid ()
    and status = 'pending'
  )
with
  check (
    user_id = auth.uid ()
    and status = 'pending'
  );

drop policy if exists "admins moderate reviews" on public.reviews;

create policy "admins moderate reviews" on public.reviews
for update
  using (public.is_admin ())
with
  check (public.is_admin ());

insert into
  public.perfumes (
    slug,
    name,
    tagline,
    notes,
    price,
    image_url,
    stock,
    status
  )
values
  (
    'ash-and-iris',
    'Ash & Iris',
    'Charcoal air / pale petals',
    'Iris · black pepper · ashwood',
    149,
    '/manus-storage/async-images/2xrK2EqF9LXlwl4orrEICS/image-1.webp',
    14,
    'published'
  ),
  (
    'silk-atlas',
    'Silk Atlas',
    'Ivory warmth / honeyed silk',
    'Vanilla · amber · sandalwood',
    141,
    '/manus-storage/async-images/2xrK2EqF9LXlwl4orrEICS/image-2.webp',
    20,
    'published'
  ),
  (
    'fig-noir',
    'Fig Noir',
    'Dark fruit / green shadow',
    'Black fig · violet leaf · suede',
    155,
    '/manus-storage/async-images/2xrK2EqF9LXlwl4orrEICS/image-3.webp',
    17,
    'published'
  ),
  (
    'solar-musk',
    'Solar Musk',
    'Sunlit skin / pale mineral',
    'Bergamot · clean musk · cedar',
    132,
    '/manus-storage/async-images/2xrK2EqF9LXlwl4orrEICS/image-4.webp',
    25,
    'published'
  )
on conflict (slug) do update
set
  image_url = excluded.image_url,
  name = excluded.name,
  tagline = excluded.tagline,
  notes = excluded.notes,
  price = excluded.price,
  stock = excluded.stock,
  status = excluded.status;
