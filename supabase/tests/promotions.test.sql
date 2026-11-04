begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;

select plan(35);

-- Start from an empty catalog (the seed loads samples); rolled back with the test.
alter table public.stock_movements disable trigger user;
delete from public.stock_movements;
delete from public.products;
delete from public.categories;
alter table public.stock_movements enable trigger user;

insert into auth.users (id, instance_id, aud, role, email, raw_user_meta_data)
values
  ('00000000-0000-4000-8000-0000000000a1', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'adm@t.local', '{"razon_social":"Admin"}'),
  ('00000000-0000-4000-8000-0000000000b2', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'a@t.local', '{"razon_social":"Cliente A","cuit":"20111111112"}'),
  ('00000000-0000-4000-8000-0000000000c3', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'b@t.local', '{"razon_social":"Cliente B"}'),
  ('00000000-0000-4000-8000-0000000000d4', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'p@t.local', '{"razon_social":"Pendiente"}');
update public.profiles set role = 'admin', status = 'approved' where id = '00000000-0000-4000-8000-0000000000a1';
update public.profiles set status = 'approved' where id in ('00000000-0000-4000-8000-0000000000b2', '00000000-0000-4000-8000-0000000000c3');

insert into public.price_lists (id, name, discount_pct) values ('00000000-0000-4000-8000-0000000000e1', 'Lista A', 10);
update public.profiles set price_list_id = '00000000-0000-4000-8000-0000000000e1' where id = '00000000-0000-4000-8000-0000000000b2';

insert into public.categories (id, name) values
  ('00000000-0000-4000-8000-0000000000c1', 'Cat 1'),
  ('00000000-0000-4000-8000-0000000000c2', 'Cat 2');
insert into public.products (id, sku, name, category_id, base_price, vat_rate) values
  ('00000000-0000-4000-8000-000000000f01', 'P-1', 'Producto 1', '00000000-0000-4000-8000-0000000000c1', 1000, 21),
  ('00000000-0000-4000-8000-000000000f02', 'P-2', 'Producto 2', '00000000-0000-4000-8000-0000000000c2', 500, 10.5),
  ('00000000-0000-4000-8000-000000000f03', 'P-3', 'Producto 3', '00000000-0000-4000-8000-0000000000c1', 100, 21);
insert into public.stock_movements (product_id, delta, reason)
  select id, 100, 'initial' from public.products;

create temp table t (name text primary key, id uuid);
grant all on t to authenticated;

-- Rules (as postgres)
-- P-1: product promo 20% for everyone; a weak 5% promo that never beats the list price
insert into public.promotions (name, discount_pct, product_id) values ('Promo P1 20', 20, '00000000-0000-4000-8000-000000000f01');
insert into public.promotions (name, discount_pct, product_id, price_list_id) values ('Debil 5', 5, '00000000-0000-4000-8000-000000000f03', null);
-- P-2: category promo 15% for everyone; 25% only for Lista A
insert into public.promotions (name, discount_pct, category_id) values ('Cat2 15', 15, '00000000-0000-4000-8000-0000000000c2');
insert into public.promotions (name, discount_pct, product_id, price_list_id) values ('Solo lista A 25', 25, '00000000-0000-4000-8000-000000000f02', '00000000-0000-4000-8000-0000000000e1');
-- Not applicable: inactive, expired, not started yet
insert into public.promotions (name, discount_pct, product_id, active) values ('Inactiva 90', 90, '00000000-0000-4000-8000-000000000f03', false);
insert into public.promotions (name, discount_pct, product_id, ends_at) values ('Vencida 90', 90, '00000000-0000-4000-8000-000000000f03', now() - interval '1 day');
insert into public.promotions (name, discount_pct, product_id, starts_at) values ('Futura 90', 90, '00000000-0000-4000-8000-000000000f03', now() + interval '1 day');
-- Volume: 30% from 10 units on P-3
insert into public.promotions (name, discount_pct, product_id, min_qty) values ('Volumen 10', 30, '00000000-0000-4000-8000-000000000f03', 10);

-- Audience-restricted volume rule: only Lista A may see or use it
insert into public.promotions (name, discount_pct, product_id, min_qty, price_list_id) values ('VIP secreto', 60, '00000000-0000-4000-8000-000000000f01', 7, '00000000-0000-4000-8000-0000000000e1');

insert into public.coupons (code, discount_pct, min_order_net, max_uses) values
  ('DIEZ', 10, 0, null),
  ('GRANDE', 10, 100000, null),
  ('UNICO', 10, 0, 1);
insert into public.coupons (code, discount_pct, ends_at) values ('VENCIDO', 50, now() - interval '1 day');
update public.coupons set uses = 1 where code = 'UNICO';

-- Client A (Lista A, 10%)
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-0000000000b2","role":"authenticated"}', true);
select is((select price from public.catalog_products where sku = 'P-1'), 800.00, 'la promo de producto gana a la lista (800 < 900)');
select is((select rule_name from public.catalog_products where sku = 'P-1'), 'Promo P1 20', 'la vista informa la regla aplicada');
select is((select price from public.catalog_products where sku = 'P-2'), 375.00, 'gana la mas barata entre lista, categoria y promo de lista (375)');
select is((select price from public.catalog_products where sku = 'P-3'), 90.00, 'una promo debil no le gana a la lista; vencida/inactiva/futura se ignoran');
select is((select rule_name from public.catalog_products where sku = 'P-3'), null, 'sin regla cuando gana el precio de lista');
select is((select list_price from public.catalog_products where sku = 'P-1'), 900.00, 'la vista expone el precio de lista del cliente');

-- Client B (no list)
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-0000000000c3","role":"authenticated"}', true);
select is((select price from public.catalog_products where sku = 'P-2'), 425.00, 'la promo exclusiva de lista no aplica a otros clientes');
select is((select price from public.catalog_products where sku = 'P-3'), 95.00, 'promo vigente sin lista (5%)');
select is((select count(*)::int from public.product_volume_tiers((select id from public.catalog_products where sku = 'P-3'))), 1, 'el cliente ve el escalon por volumen disponible');
select is((select price from public.product_volume_tiers((select id from public.catalog_products where sku = 'P-3'))), 70.00, 'el escalon muestra el precio por volumen');
insert into public.cart_items (product_id, quantity) select id, 10 from public.catalog_products where sku = 'P-3';
select is((public.cart_quote()->'lines'->0->>'unit_price')::numeric, 70.00, 'el carrito aplica el escalon al llegar a la cantidad');
delete from public.cart_items;
insert into public.cart_items (product_id, quantity) select id, 9 from public.catalog_products where sku = 'P-3';
select is((public.cart_quote()->'lines'->0->>'unit_price')::numeric, 95.00, 'con 9 unidades todavia no aplica el escalon');
delete from public.cart_items;

select is((select count(*)::int from public.product_volume_tiers((select id from public.catalog_products where sku = 'P-1')) where rule_name = 'VIP secreto'), 0, 'un escalon de otra lista no se muestra ni se nombra');

-- Privileges
select is((select count(*)::int from public.promotions), 0, 'cliente no lee promociones');
select is((select count(*)::int from public.coupons), 0, 'cliente no lee cupones');
select throws_ok($$insert into public.coupons (code, discount_pct) values ('HACK', 100)$$, '42501', null, 'cliente no crea cupones');
select throws_ok($$select * from public.price_breakdown('00000000-0000-4000-8000-000000000f01', '00000000-0000-4000-8000-0000000000b2', 1)$$, '42501', null, 'cliente no llama a price_breakdown');
select throws_ok($$select public.price_cart('00000000-0000-4000-8000-0000000000b2')$$, '42501', null, 'cliente no llama a price_cart');
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-0000000000d4","role":"authenticated"}', true);
select is((select count(*)::int from public.my_price('00000000-0000-4000-8000-000000000f01', 1)), 0, 'cliente pendiente no obtiene precios');
select throws_ok($$select public.cart_quote()$$, '42501', null, 'cliente pendiente no cotiza');

-- Coupons in the cart quote and in the order (client A)
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-0000000000b2","role":"authenticated"}', true);
insert into public.cart_items (product_id, quantity) select id, 2 from public.catalog_products where sku = 'P-1';
select is(public.cart_quote('diez')->'coupon'->>'error', null, 'cupon valido (sin importar mayusculas)');
select is(public.cart_quote(E'\tdiez\n')->'coupon'->>'error', null, 'el cupon tolera tabs y saltos de linea pegados');
select is((select price from public.product_volume_tiers((select id from public.catalog_products where sku = 'P-1')) where min_qty = 7), 400.00, 'el cliente de la lista ve su escalon (60% sobre la base)');
select is((public.cart_quote('DIEZ')->>'discount_net')::numeric, 160.00, 'descuento del cupon = 10% de 1600');
select is(public.cart_quote('NOEXISTE')->'coupon'->>'error', 'MH007', 'cupon inexistente');
select is(public.cart_quote('VENCIDO')->'coupon'->>'error', 'MH007', 'cupon vencido');
select is(public.cart_quote('UNICO')->'coupon'->>'error', 'MH007', 'cupon sin usos disponibles');
select is(public.cart_quote('GRANDE')->'coupon'->>'error', 'MH008', 'cupon por debajo del minimo');
select throws_ok($$select public.place_order(null, 'VENCIDO')$$, 'MH007', null, 'place_order rechaza un cupon vencido');
select is((select count(*)::int from public.orders), 0, 'el rechazo no deja pedido');
insert into t select 'o1', public.place_order('con cupon', 'diez');
select is((select total from public.orders where id = (select id from t where name = 'o1')), 1742.40, 'total = (1600 - 10%) + IVA 21% sobre el neto con cupon');
select is((select discount_net || '/' || coupon_pct || '/' || coupon_code from public.orders where id = (select id from t where name = 'o1')), '160.00/10.00/DIEZ', 'el pedido guarda cupon, porcentaje y descuento');
select is((select line_discount from public.order_items where order_id = (select id from t where name = 'o1')), 160.00, 'la linea guarda su parte del descuento');

reset role;
select is((select uses from public.coupons where code = 'DIEZ'), 1, 'confirmar el pedido consume un uso');
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-0000000000b2","role":"authenticated"}', true);
select public.cancel_order((select id from t where name = 'o1'));
reset role;
select is((select uses from public.coupons where code = 'DIEZ'), 0, 'cancelar devuelve el uso del cupon');

select * from finish();
rollback;
