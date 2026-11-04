-- Phase 4: cart, orders and stock reservation.
-- Stock is deducted when the order is placed (ledger 'sale' movements linked
-- to the order) and returned ('return') on cancellation. Clients never write
-- orders directly: only through the functions below.
--
-- Custom SQLSTATEs raised by place_order:
--   MH001 empty cart | MH002 inactive/unknown product | MH003 insufficient stock
--   MH004 below the minimum order amount | MH006 profile without razón social
-- cancel_order / admin_set_order_status: MH005 invalid state change.

create type public.order_status as enum
  ('pending', 'confirmed', 'preparing', 'shipped', 'delivered', 'cancelled');

-- Settings (single row)

create table public.settings (
  id boolean primary key default true check (id),
  min_order_net numeric(14, 2) not null default 0 check (min_order_net >= 0),
  updated_at timestamptz not null default now()
);

insert into public.settings (id) values (true);

create trigger settings_set_updated_at
before update on public.settings
for each row execute function public.set_updated_at();

-- Cart

create table public.cart_items (
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete cascade,
  quantity integer not null check (quantity between 1 and 9999),
  updated_at timestamptz not null default now(),
  primary key (user_id, product_id)
);

create trigger cart_items_set_updated_at
before update on public.cart_items
for each row execute function public.set_updated_at();

-- Orders

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  number bigint generated always as identity unique,
  customer_id uuid not null references public.profiles (id) on delete restrict,
  status public.order_status not null default 'pending',
  note text check (note is null or length(note) <= 500),
  customer_razon_social text not null,
  customer_cuit text,
  customer_tax_condition public.tax_condition,
  subtotal_net numeric(14, 2) not null check (subtotal_net >= 0),
  vat_total numeric(14, 2) not null check (vat_total >= 0),
  total numeric(14, 2) not null check (total >= 0),
  cancel_reason text check (cancel_reason is null or length(cancel_reason) <= 500),
  cancelled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index orders_customer_idx on public.orders (customer_id, created_at desc);
create index orders_status_idx on public.orders (status, created_at);

create trigger orders_set_updated_at
before update on public.orders
for each row execute function public.set_updated_at();

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete restrict,
  sku text not null,
  name text not null,
  quantity integer not null check (quantity > 0),
  unit_price_net numeric(14, 2) not null check (unit_price_net >= 0),
  vat_rate numeric(4, 2) not null,
  line_net numeric(14, 2) not null check (line_net >= 0),
  unique (order_id, product_id)
);

create table public.order_events (
  id bigint generated always as identity primary key,
  order_id uuid not null references public.orders (id) on delete cascade,
  status public.order_status not null,
  actor uuid default auth.uid() references public.profiles (id) on delete set null,
  note text check (note is null or length(note) <= 500),
  created_at timestamptz not null default now()
);

create index order_events_order_idx on public.order_events (order_id, id);

alter table public.stock_movements
  add column order_id uuid references public.orders (id) on delete restrict;
create index stock_movements_order_idx on public.stock_movements (order_id);

-- Effective net price of a product for a user (same rule as catalog_products).
create function public.effective_price(p_product_id uuid, p_user_id uuid)
returns numeric
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(i.price, round(p.base_price * (1 - coalesce(l.discount_pct, 0) / 100), 2))
  from public.products p
  left join public.profiles pr on pr.id = p_user_id
  left join public.price_lists l on l.id = pr.price_list_id
  left join public.price_list_items i on i.product_id = p.id and i.price_list_id = l.id
  where p.id = p_product_id;
$$;

revoke execute on function public.effective_price(uuid, uuid) from public, anon, authenticated;

-- Place an order from the caller's cart. Atomic: any failure rolls back
-- the order, its lines and the stock movements.
create function public.place_order(p_note text default null)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_profile public.profiles;
  v_min numeric;
  v_subtotal numeric := 0;
  v_vat numeric := 0;
  v_line numeric;
  v_order_id uuid;
  v_number bigint;
  r record;
begin
  if v_uid is null or not public.is_approved_client() then
    raise exception 'only approved clients can place orders' using errcode = '42501';
  end if;
  select * into v_profile from public.profiles where id = v_uid;
  if v_profile.razon_social is null or btrim(v_profile.razon_social) = '' then
    raise exception 'the profile needs a razon social to place orders' using errcode = 'MH006';
  end if;

  -- Lock the products in a fixed order (no deadlocks between concurrent orders).
  perform 1
    from public.products p
    join public.cart_items c on c.product_id = p.id
    where c.user_id = v_uid
    order by p.id
    for update of p;

  for r in
    select c.product_id, c.quantity, p.sku, p.vat_rate, p.active, p.stock_on_hand
    from public.cart_items c
    join public.products p on p.id = c.product_id
    where c.user_id = v_uid
    order by c.product_id
  loop
    if not r.active then
      raise exception 'product % is not available', r.sku using errcode = 'MH002';
    end if;
    if r.stock_on_hand < r.quantity then
      raise exception 'insufficient stock for %', r.sku using errcode = 'MH003';
    end if;
    v_line := round(public.effective_price(r.product_id, v_uid) * r.quantity, 2);
    v_subtotal := v_subtotal + v_line;
    v_vat := v_vat + round(v_line * r.vat_rate / 100, 2);
  end loop;

  if not found then
    raise exception 'the cart is empty' using errcode = 'MH001';
  end if;

  select min_order_net into v_min from public.settings;
  if v_subtotal < v_min then
    raise exception 'the order is below the minimum amount' using errcode = 'MH004';
  end if;

  insert into public.orders (customer_id, note, customer_razon_social, customer_cuit,
                             customer_tax_condition, subtotal_net, vat_total, total)
  values (v_uid, nullif(btrim(p_note), ''), v_profile.razon_social, v_profile.cuit,
          v_profile.tax_condition, v_subtotal, v_vat, v_subtotal + v_vat)
  returning id, number into v_order_id, v_number;

  insert into public.order_items (order_id, product_id, sku, name, quantity,
                                  unit_price_net, vat_rate, line_net)
  select v_order_id, c.product_id, p.sku, p.name, c.quantity,
         public.effective_price(c.product_id, v_uid), p.vat_rate,
         round(public.effective_price(c.product_id, v_uid) * c.quantity, 2)
  from public.cart_items c
  join public.products p on p.id = c.product_id
  where c.user_id = v_uid;

  insert into public.stock_movements (product_id, delta, reason, note, order_id, created_by)
  select c.product_id, -c.quantity, 'sale', 'Pedido #' || v_number, v_order_id, v_uid
  from public.cart_items c
  where c.user_id = v_uid
  order by c.product_id;

  insert into public.order_events (order_id, status, actor) values (v_order_id, 'pending', v_uid);
  delete from public.cart_items where user_id = v_uid;
  return v_order_id;
end;
$$;

-- Cancel an order and return its stock. Owner: only while pending. Admin: until shipped.
create function public.cancel_order(p_order_id uuid, p_reason text default null)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_order public.orders;
  v_is_admin boolean := public.is_admin();
begin
  select * into v_order from public.orders where id = p_order_id for update;
  if not found or v_uid is null or not (v_is_admin or v_order.customer_id = v_uid) then
    raise exception 'order not found' using errcode = '42501';
  end if;
  if not (
    v_order.status = 'pending'
    or (v_is_admin and v_order.status in ('confirmed', 'preparing'))
  ) then
    raise exception 'the order cannot be cancelled in status %', v_order.status using errcode = 'MH005';
  end if;

  insert into public.stock_movements (product_id, delta, reason, note, order_id, created_by)
  select oi.product_id, oi.quantity, 'return', 'Cancelación pedido #' || v_order.number, v_order.id, v_uid
  from public.order_items oi
  where oi.order_id = v_order.id
  order by oi.product_id;

  update public.orders
    set status = 'cancelled', cancelled_at = now(), cancel_reason = nullif(btrim(p_reason), '')
    where id = v_order.id;
  insert into public.order_events (order_id, status, actor, note)
    values (v_order.id, 'cancelled', v_uid, nullif(btrim(p_reason), ''));
end;
$$;

-- Admin advances an order one step: pending > confirmed > preparing > shipped > delivered.
create function public.admin_set_order_status(p_order_id uuid, p_status public.order_status)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order public.orders;
begin
  if not public.is_admin() then
    raise exception 'only admins can change order status' using errcode = '42501';
  end if;
  select * into v_order from public.orders where id = p_order_id for update;
  if not found then
    raise exception 'order not found' using errcode = '42501';
  end if;
  if not (
    (v_order.status = 'pending' and p_status = 'confirmed')
    or (v_order.status = 'confirmed' and p_status = 'preparing')
    or (v_order.status = 'preparing' and p_status = 'shipped')
    or (v_order.status = 'shipped' and p_status = 'delivered')
  ) then
    raise exception 'invalid change from % to %', v_order.status, p_status using errcode = 'MH005';
  end if;
  update public.orders set status = p_status where id = v_order.id;
  insert into public.order_events (order_id, status, actor) values (v_order.id, p_status, (select auth.uid()));
end;
$$;

revoke execute on function public.place_order(text) from public, anon;
revoke execute on function public.cancel_order(uuid, text) from public, anon;
revoke execute on function public.admin_set_order_status(uuid, public.order_status) from public, anon;
grant execute on function public.place_order(text) to authenticated;
grant execute on function public.cancel_order(uuid, text) to authenticated;
grant execute on function public.admin_set_order_status(uuid, public.order_status) to authenticated;

-- RLS and grants

alter table public.settings enable row level security;
alter table public.cart_items enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.order_events enable row level security;

revoke all on public.settings, public.cart_items, public.orders,
  public.order_items, public.order_events from anon, authenticated;

grant select, update on public.settings to authenticated;
grant select, insert, update, delete on public.cart_items to authenticated;
grant select on public.orders, public.order_items, public.order_events to authenticated;

create policy settings_select on public.settings
  for select to authenticated
  using ((select public.is_admin()) or (select public.is_approved_client()));
create policy settings_update_admin on public.settings
  for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

create policy cart_own on public.cart_items
  for all to authenticated
  using (user_id = (select auth.uid()) and (select public.is_approved_client()))
  with check (user_id = (select auth.uid()) and (select public.is_approved_client()));

create policy orders_select on public.orders
  for select to authenticated
  using (customer_id = (select auth.uid()) or (select public.is_admin()));

create policy order_items_select on public.order_items
  for select to authenticated
  using (exists (
    select 1 from public.orders o
    where o.id = order_id and (o.customer_id = (select auth.uid()) or (select public.is_admin()))
  ));

create policy order_events_select on public.order_events
  for select to authenticated
  using (exists (
    select 1 from public.orders o
    where o.id = order_id and (o.customer_id = (select auth.uid()) or (select public.is_admin()))
  ));
