-- Phase 5: promotions, volume discounts and coupons.
-- Per order line the unit price is the LOWEST of: the client's price-list
-- price, and every matching promotion/volume rule (percentage over base_price).
-- Discounts never stack. The coupon is applied separately, on the whole order.
--
-- New custom SQLSTATEs (place_order): MH007 coupon invalid/expired/exhausted,
-- MH008 order below the coupon's minimum amount.

create table public.promotions (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(btrim(name)) between 1 and 80),
  -- Percentage off products.base_price.
  discount_pct numeric(5, 2) not null check (discount_pct > 0 and discount_pct <= 100),
  -- 1 = plain promotion; greater than 1 = volume discount from that quantity.
  min_qty integer not null default 1 check (min_qty between 1 and 9999),
  -- Target: one product, one category, or all products (both null).
  product_id uuid references public.products (id) on delete cascade,
  category_id uuid references public.categories (id) on delete cascade,
  -- Audience: one price list, or everyone (null).
  price_list_id uuid references public.price_lists (id) on delete cascade,
  starts_at timestamptz,
  ends_at timestamptz,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (product_id is null or category_id is null),
  check (starts_at is null or ends_at is null or starts_at < ends_at)
);

create index promotions_product_idx on public.promotions (product_id);
create index promotions_category_idx on public.promotions (category_id);

create trigger promotions_set_updated_at
before update on public.promotions
for each row execute function public.set_updated_at();

create table public.coupons (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code ~ '^[A-Z0-9_-]{3,30}$'),
  discount_pct numeric(5, 2) not null check (discount_pct > 0 and discount_pct <= 100),
  -- Net total before the coupon.
  min_order_net numeric(14, 2) not null default 0 check (min_order_net >= 0),
  max_uses integer check (max_uses is null or max_uses > 0),
  uses integer not null default 0 check (uses >= 0),
  starts_at timestamptz,
  ends_at timestamptz,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (starts_at is null or ends_at is null or starts_at < ends_at)
);

create trigger coupons_set_updated_at
before update on public.coupons
for each row execute function public.set_updated_at();

alter table public.orders
  add column coupon_code text,
  add column coupon_pct numeric(5, 2),
  add column discount_net numeric(14, 2) not null default 0 check (discount_net >= 0);
alter table public.order_items
  add column line_discount numeric(14, 2) not null default 0 check (line_discount >= 0);

-- Best unit price for a product, user and quantity.
create function public.price_breakdown(p_product_id uuid, p_user_id uuid, p_qty integer)
returns table (price numeric, list_price numeric, rule_name text)
language sql
stable
security definer
set search_path = ''
as $$
  with base as (
    select p.id, p.category_id, p.base_price, pr.price_list_id,
           coalesce(i.price, round(p.base_price * (1 - coalesce(l.discount_pct, 0) / 100), 2)) as list_price
    from public.products p
    left join public.profiles pr on pr.id = p_user_id
    left join public.price_lists l on l.id = pr.price_list_id
    left join public.price_list_items i on i.product_id = p.id and i.price_list_id = l.id
    where p.id = p_product_id
  ),
  cand as (
    select b.list_price as price, null::text as rule_name, 0 as ord from base b
    union all
    select round(b.base_price * (1 - pm.discount_pct / 100), 2), pm.name, 1
    from base b
    join public.promotions pm
      on pm.active
     and (pm.starts_at is null or pm.starts_at <= now())
     and (pm.ends_at is null or pm.ends_at > now())
     and pm.min_qty <= p_qty
     and (pm.price_list_id is null or pm.price_list_id = b.price_list_id)
     and ((pm.product_id is null and pm.category_id is null)
          or pm.product_id = b.id
          or pm.category_id = b.category_id)
  )
  select c.price, (select list_price from base), c.rule_name
  from cand c
  order by c.price, c.ord
  limit 1;
$$;

revoke execute on function public.price_breakdown(uuid, uuid, integer) from public, anon, authenticated;

-- Prices the user's whole cart: lines, rules applied, coupon and totals.
create function public.price_cart(p_user_id uuid, p_coupon text default null)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_lines jsonb := '[]'::jsonb;
  v_out jsonb := '[]'::jsonb;
  v_gross numeric := 0;
  v_disc numeric := 0;
  v_sub numeric := 0;
  v_vat numeric := 0;
  v_cpct numeric := 0;
  v_err text;
  v_code text;
  v_coupon public.coupons;
  v_line numeric;
  v_after numeric;
  v_ld numeric;
  r record;
  el jsonb;
begin
  for r in
    select c.product_id, c.quantity, p.sku, p.name, p.vat_rate, p.active,
           b.price, b.list_price, b.rule_name
    from public.cart_items c
    join public.products p on p.id = c.product_id
    cross join lateral public.price_breakdown(c.product_id, p_user_id, c.quantity) b
    where c.user_id = p_user_id
    order by p.sku
  loop
    v_line := round(r.price * r.quantity, 2);
    v_gross := v_gross + v_line;
    v_lines := v_lines || jsonb_build_object(
      'product_id', r.product_id, 'sku', r.sku, 'name', r.name,
      'quantity', r.quantity, 'vat_rate', r.vat_rate, 'active', r.active,
      'unit_price', r.price, 'list_price', r.list_price,
      'rule_name', r.rule_name, 'line_net', v_line);
  end loop;

  if p_coupon is not null and btrim(p_coupon) <> '' then
    v_code := upper(btrim(p_coupon));
    select * into v_coupon from public.coupons where code = v_code;
    if not found
       or not v_coupon.active
       or (v_coupon.starts_at is not null and v_coupon.starts_at > now())
       or (v_coupon.ends_at is not null and v_coupon.ends_at <= now())
       or (v_coupon.max_uses is not null and v_coupon.uses >= v_coupon.max_uses) then
      v_err := 'MH007';
    elsif v_gross < v_coupon.min_order_net then
      v_err := 'MH008';
    else
      v_cpct := v_coupon.discount_pct;
    end if;
  end if;

  for el in select * from jsonb_array_elements(v_lines) loop
    v_line := (el ->> 'line_net')::numeric;
    v_after := round(v_line * (100 - v_cpct) / 100, 2);
    v_ld := v_line - v_after;
    v_disc := v_disc + v_ld;
    v_sub := v_sub + v_after;
    v_vat := v_vat + round(v_after * (el ->> 'vat_rate')::numeric / 100, 2);
    v_out := v_out || (el || jsonb_build_object('line_discount', v_ld));
  end loop;

  return jsonb_build_object(
    'lines', v_out, 'gross_net', v_gross, 'discount_net', v_disc,
    'subtotal_net', v_sub, 'vat_total', v_vat, 'total', v_sub + v_vat,
    'coupon', jsonb_build_object('code', v_code, 'pct', v_cpct, 'error', v_err));
end;
$$;

revoke execute on function public.price_cart(uuid, text) from public, anon, authenticated;

-- What the client sees in the cart and at checkout (never writes anything).
create function public.cart_quote(p_coupon text default null)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is null or not public.is_approved_client() then
    raise exception 'only approved clients can price a cart' using errcode = '42501';
  end if;
  return public.price_cart((select auth.uid()), p_coupon);
end;
$$;

-- Volume tiers a client can reach on one product (better than their current price).
create function public.product_volume_tiers(p_product_id uuid)
returns table (min_qty integer, price numeric, rule_name text)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is null or not public.is_approved_client() then
    raise exception 'only approved clients can read tiers' using errcode = '42501';
  end if;
  return query
    select t.min_qty, t.price, t.rule_name
    from (
      select pm.min_qty, b.price, pm.name as rule_name,
             row_number() over (partition by pm.min_qty order by b.price) as rn
      from public.promotions pm
      cross join lateral public.price_breakdown(p_product_id, (select auth.uid()), pm.min_qty) b
      join public.products p on p.id = p_product_id and p.active
      where pm.min_qty > 1
        and pm.active
        and (pm.starts_at is null or pm.starts_at <= now())
        and (pm.ends_at is null or pm.ends_at > now())
        and (pm.product_id is null and pm.category_id is null
             or pm.product_id = p.id or pm.category_id = p.category_id)
        and b.price < b.list_price
    ) t
    where t.rn = 1
    order by t.min_qty;
end;
$$;

revoke execute on function public.cart_quote(text) from public, anon;
revoke execute on function public.product_volume_tiers(uuid) from public, anon;
grant execute on function public.cart_quote(text) to authenticated;
grant execute on function public.product_volume_tiers(uuid) to authenticated;

-- Place an order: same atomic flow as phase 4, priced by price_cart and with an optional coupon.
drop function public.place_order(text);
drop function public.effective_price(uuid, uuid);

create function public.place_order(p_note text default null, p_coupon text default null)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_profile public.profiles;
  v_min numeric;
  v_quote jsonb;
  v_err text;
  v_code text;
  v_order_id uuid;
  v_number bigint;
  el jsonb;
begin
  if v_uid is null or not public.is_approved_client() then
    raise exception 'only approved clients can place orders' using errcode = '42501';
  end if;
  select * into v_profile from public.profiles where id = v_uid;
  if v_profile.razon_social is null or btrim(v_profile.razon_social) = '' then
    raise exception 'the profile needs a razon social to place orders' using errcode = 'MH006';
  end if;

  -- Lock order: coupon first, then products by id (no deadlocks between orders).
  if p_coupon is not null and btrim(p_coupon) <> '' then
    perform 1 from public.coupons where code = upper(btrim(p_coupon)) for update;
  end if;
  perform 1
    from public.products p
    join public.cart_items c on c.product_id = p.id
    where c.user_id = v_uid
    order by p.id
    for update of p;

  v_quote := public.price_cart(v_uid, p_coupon);
  if jsonb_array_length(v_quote -> 'lines') = 0 then
    raise exception 'the cart is empty' using errcode = 'MH001';
  end if;

  for el in select * from jsonb_array_elements(v_quote -> 'lines') loop
    if not (el ->> 'active')::boolean then
      raise exception 'product % is not available', el ->> 'sku' using errcode = 'MH002';
    end if;
    if (select stock_on_hand from public.products where id = (el ->> 'product_id')::uuid)
       < (el ->> 'quantity')::integer then
      raise exception 'insufficient stock for %', el ->> 'sku' using errcode = 'MH003';
    end if;
  end loop;

  select min_order_net into v_min from public.settings;
  if (v_quote ->> 'gross_net')::numeric < v_min then
    raise exception 'the order is below the minimum amount' using errcode = 'MH004';
  end if;

  v_err := v_quote -> 'coupon' ->> 'error';
  if v_err is not null then
    raise exception 'the coupon cannot be used (%)', v_err using errcode = v_err;
  end if;
  v_code := v_quote -> 'coupon' ->> 'code';

  insert into public.orders (customer_id, note, customer_razon_social, customer_cuit,
                             customer_tax_condition, subtotal_net, vat_total, total,
                             coupon_code, coupon_pct, discount_net)
  values (v_uid, nullif(btrim(p_note), ''), v_profile.razon_social, v_profile.cuit,
          v_profile.tax_condition, (v_quote ->> 'subtotal_net')::numeric,
          (v_quote ->> 'vat_total')::numeric, (v_quote ->> 'total')::numeric,
          v_code, case when v_code is null then null else (v_quote -> 'coupon' ->> 'pct')::numeric end,
          (v_quote ->> 'discount_net')::numeric)
  returning id, number into v_order_id, v_number;

  insert into public.order_items (order_id, product_id, sku, name, quantity,
                                  unit_price_net, vat_rate, line_net, line_discount)
  select v_order_id, x.product_id, x.sku, x.name, x.quantity,
         x.unit_price, x.vat_rate, x.line_net, x.line_discount
  from jsonb_to_recordset(v_quote -> 'lines') as x(
    product_id uuid, sku text, name text, quantity integer, vat_rate numeric,
    unit_price numeric, line_net numeric, line_discount numeric);

  insert into public.stock_movements (product_id, delta, reason, note, order_id, created_by)
  select x.product_id, -x.quantity, 'sale', 'Pedido #' || v_number, v_order_id, v_uid
  from jsonb_to_recordset(v_quote -> 'lines') as x(product_id uuid, quantity integer)
  order by x.product_id;

  if v_code is not null then
    update public.coupons set uses = uses + 1 where code = v_code;
  end if;

  insert into public.order_events (order_id, status, actor) values (v_order_id, 'pending', v_uid);
  delete from public.cart_items where user_id = v_uid;
  return v_order_id;
end;
$$;

revoke execute on function public.place_order(text, text) from public, anon;
grant execute on function public.place_order(text, text) to authenticated;

-- Cancelling gives the coupon use back (same body as phase 4 plus the coupon).
create or replace function public.cancel_order(p_order_id uuid, p_reason text default null)
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

  if v_order.coupon_code is not null then
    update public.coupons set uses = greatest(uses - 1, 0) where code = v_order.coupon_code;
  end if;

  update public.orders
    set status = 'cancelled', cancelled_at = now(), cancel_reason = nullif(btrim(p_reason), '')
    where id = v_order.id;
  insert into public.order_events (order_id, status, actor, note)
    values (v_order.id, 'cancelled', v_uid, nullif(btrim(p_reason), ''));
end;
$$;

-- RLS: only admins read or write the rule tables; clients get priced results.

alter table public.promotions enable row level security;
alter table public.coupons enable row level security;
revoke all on public.promotions, public.coupons from anon, authenticated;
grant select, insert, update, delete on public.promotions to authenticated;
grant select, insert, update, delete on public.coupons to authenticated;

create policy promotions_admin on public.promotions
  for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
create policy coupons_admin on public.coupons
  for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

-- Functions called from a view run with the caller's privileges, so the view
-- cannot call price_breakdown (it takes any user id). This wrapper is callable
-- by clients but only ever prices for the caller, and only for approved
-- clients and admins.
create function public.my_price(p_product_id uuid, p_qty integer)
returns table (price numeric, list_price numeric, rule_name text)
language sql
stable
security definer
set search_path = ''
as $$
  select b.price, b.list_price, b.rule_name
  from public.price_breakdown(p_product_id, (select auth.uid()), p_qty) b
  where (select public.is_approved_client()) or (select public.is_admin());
$$;

revoke execute on function public.my_price(uuid, integer) from public, anon;
grant execute on function public.my_price(uuid, integer) to authenticated;

-- Catalog view: best unit price for quantity 1 (plus the client's list price).
drop view public.catalog_products;

create view public.catalog_products
with (security_barrier = true) as
  select p.id, p.sku, p.name, p.description, p.brand, p.category_id,
         b.price, b.list_price, b.rule_name,
         p.vat_rate, (p.stock_on_hand > 0) as in_stock
  from public.products p
  cross join lateral public.my_price(p.id, 1) b
  where p.active and ((select public.is_approved_client()) or (select public.is_admin()));

revoke all on public.catalog_products from anon, authenticated;
grant select on public.catalog_products to authenticated;
