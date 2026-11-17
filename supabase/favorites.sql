-- RAHA account favourites.
create table if not exists public.favorites (
  user_id uuid not null references auth.users(id) on delete cascade,
  perfume_id uuid not null references public.perfumes(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, perfume_id)
);

alter table public.favorites enable row level security;

drop policy if exists "customers read own favorites" on public.favorites;
create policy "customers read own favorites"
  on public.favorites for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "customers create own favorites" on public.favorites;
create policy "customers create own favorites"
  on public.favorites for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "customers delete own favorites" on public.favorites;
create policy "customers delete own favorites"
  on public.favorites for delete to authenticated
  using ((select auth.uid()) = user_id);

create index if not exists idx_favorites_perfume_id on public.favorites(perfume_id);
