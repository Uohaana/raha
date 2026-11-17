create or replace function public.place_order (p_items jsonb, p_shipping jsonb) returns table (order_id uuid, total numeric) language plpgsql security definer
set
  search_path = public as $$
declare
  v_user_id uuid := auth.uid();
  v_email text;
  v_order_id uuid;
  v_total numeric(10,2);
  v_requested_count integer;
  v_valid_count integer;
  v_name text := left(trim(coalesce(p_shipping->>'name','')), 120);
  v_address text := left(trim(coalesce(p_shipping->>'address','')), 300);
begin
  if v_user_id is null then raise exception 'You must be signed in to place an order'; end if;
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then raise exception 'Your bag is empty'; end if;
  if v_name = '' or v_address = '' then raise exception 'Delivery name and address are required'; end if;
  select email into v_email from auth.users where id = v_user_id;
  if v_email is null then raise exception 'Customer email is missing'; end if;
  select count(*) into v_requested_count from jsonb_to_recordset(p_items) as x(perfume_id uuid, quantity integer);
  if exists(select 1 from jsonb_to_recordset(p_items) as x(perfume_id uuid, quantity integer) where x.perfume_id is null or x.quantity is null or x.quantity < 1 or x.quantity > 10) then raise exception 'Each item quantity must be between 1 and 10'; end if;
  perform 1 from public.perfumes p join jsonb_to_recordset(p_items) as x(perfume_id uuid, quantity integer) on x.perfume_id = p.id where p.status = 'published' for update;
  select count(*) into v_valid_count from public.perfumes p join jsonb_to_recordset(p_items) as x(perfume_id uuid, quantity integer) on x.perfume_id = p.id where p.status = 'published';
  if v_valid_count <> v_requested_count then raise exception 'One or more fragrances are no longer available'; end if;
  if exists(select 1 from public.perfumes p join jsonb_to_recordset(p_items) as x(perfume_id uuid, quantity integer) on x.perfume_id = p.id where p.stock < x.quantity) then raise exception 'One or more fragrances are out of stock'; end if;
  select coalesce(sum(p.price * x.quantity), 0)::numeric(10,2) into v_total from public.perfumes p join jsonb_to_recordset(p_items) as x(perfume_id uuid, quantity integer) on x.perfume_id = p.id where p.status = 'published';
  insert into public.orders(user_id, email, total, status, shipping) values(v_user_id, v_email, v_total, 'pending', jsonb_build_object('name', v_name, 'address', v_address)) returning id into v_order_id;
  insert into public.order_items(order_id, perfume_id, product_name, unit_price, quantity) select v_order_id, p.id, p.name, p.price, x.quantity from public.perfumes p join jsonb_to_recordset(p_items) as x(perfume_id uuid, quantity integer) on x.perfume_id = p.id where p.status = 'published';
  update public.perfumes p set stock = p.stock - x.quantity from jsonb_to_recordset(p_items) as x(perfume_id uuid, quantity integer) where p.id = x.perfume_id;
  return query select v_order_id, v_total;
end;
$$;

revoke all on function public.place_order (jsonb, jsonb)
from
  public;

revoke
execute on function public.place_order (jsonb, jsonb)
from
  anon;

grant
execute on function public.place_order (jsonb, jsonb) to authenticated;

drop policy if exists "customers create own orders" on public.orders;

drop policy if exists "customers create own order items" on public.order_items;

revoke insert on public.orders
from
  anon,
  authenticated;

revoke insert on public.order_items
from
  anon,
  authenticated;
