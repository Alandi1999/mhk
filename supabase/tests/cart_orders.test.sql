begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;

select plan(31);

-- Start from an empty catalog (the seed loads samples); rolled back with the test.
alter table public.stock_movements disable trigger user;
delete from public.stock_movements;
delete from public.products;
alter table public.stock_movements enable trigger user;

insert into auth.users (id, instance_id, aud, role, email, raw_user_meta_data)
values
  ('00000000-0000-4000-8000-0000000000a1', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'adm@t.local', '{"razon_social":"Admin"}'),
  ('00000000-0000-4000-8000-0000000000b2', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'a@t.local', '{"razon_social":"Cliente A","cuit":"20111111112","tax_condition":"monotributo"}'),
  ('00000000-0000-4000-8000-0000000000c3', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'b@t.local', '{"razon_social":"Cliente B"}'),
  ('00000000-0000-4000-8000-0000000000d4', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'p@t.local', '{"razon_social":"Pendiente"}');
update public.profiles set role = 'admin', status = 'approved' where id = '00000000-0000-4000-8000-0000000000a1';
update public.profiles set status = 'approved' where id in ('00000000-0000-4000-8000-0000000000b2', '00000000-0000-4000-8000-0000000000c3');

insert into public.price_lists (id, name, discount_pct) values ('00000000-0000-4000-8000-0000000000e1', 'Lista A', 10);
update public.profiles set price_list_id = '00000000-0000-4000-8000-0000000000e1' where id = '00000000-0000-4000-8000-0000000000b2';

insert into public.products (id, sku, name, base_price, vat_rate, active) values
  ('00000000-0000-4000-8000-000000000f01', 'P-1', 'Producto 1', 1000, 21, true),
  ('00000000-0000-4000-8000-000000000f02', 'P-2', 'Producto 2', 500, 10.5, true),
  ('00000000-0000-4000-8000-000000000f03', 'P-3', 'Producto inactivo', 100, 21, false);
insert into public.stock_movements (product_id, delta, reason) values
  ('00000000-0000-4000-8000-000000000f01', 5, 'initial'),
  ('00000000-0000-4000-8000-000000000f02', 1, 'initial'),
  ('00000000-0000-4000-8000-000000000f03', 5, 'initial');

create temp table t (name text primary key, id uuid);
grant all on t to authenticated;

-- Client A (list 10%)
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-0000000000b2","role":"authenticated"}', true);

select throws_ok($$select public.place_order()$$, 'MH001', null, 'carrito vacio se rechaza');
select lives_ok($$insert into public.cart_items (product_id, quantity) values ('00000000-0000-4000-8000-000000000f01', 2)$$, 'cliente agrega al carrito');
select throws_ok($$insert into public.cart_items (product_id, quantity) values ('00000000-0000-4000-8000-000000000f01', 0)$$, '23514', null, 'cantidad 0 se rechaza');

-- Client B cannot touch A's cart; pending client cannot use a cart
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-0000000000c3","role":"authenticated"}', true);
select is((select count(*)::int from public.cart_items), 0, 'cliente no ve el carrito ajeno');
select throws_ok($$insert into public.cart_items (user_id, product_id, quantity) values ('00000000-0000-4000-8000-0000000000b2', '00000000-0000-4000-8000-000000000f02', 1)$$, '42501', null, 'cliente no escribe en carrito ajeno');
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-0000000000d4","role":"authenticated"}', true);
select throws_ok($$insert into public.cart_items (product_id, quantity) values ('00000000-0000-4000-8000-000000000f02', 1)$$, '42501', null, 'cliente pendiente no usa carrito');
select throws_ok($$select public.place_order()$$, '42501', null, 'cliente pendiente no hace pedidos');

-- A client without razon social cannot order (handled error, not a raw NOT NULL failure)
reset role;
update public.profiles set razon_social = null where id = '00000000-0000-4000-8000-0000000000b2';
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-0000000000b2","role":"authenticated"}', true);
select throws_ok($$select public.place_order()$$, 'MH006', null, 'perfil sin razon social se rechaza con error propio');
reset role;
update public.profiles set razon_social = 'Cliente A' where id = '00000000-0000-4000-8000-0000000000b2';
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-0000000000b2","role":"authenticated"}', true);

-- A places the order
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-0000000000b2","role":"authenticated"}', true);
select lives_ok($$insert into t select 'o1', public.place_order('  Entregar por la tarde ')$$, 'cliente hace el pedido');
select is((select total from public.orders where id = (select id from t where name = 'o1')), 2178.00, 'total = 2 x 900 neto + IVA 21%');
select is((select unit_price_net from public.order_items where order_id = (select id from t where name = 'o1')), 900.00, 'la linea guarda el precio efectivo del cliente');
select is((select note from public.orders where id = (select id from t where name = 'o1')), 'Entregar por la tarde', 'nota recortada');
select is((select count(*)::int from public.cart_items), 0, 'el carrito queda vacio');

-- Stock effects (as postgres)
reset role;
select is((select stock_on_hand from public.products where sku = 'P-1'), 3, 'el pedido descuenta stock');
select is((select delta::text || '/' || reason::text from public.stock_movements where order_id = (select id from t where name = 'o1')), '-2/sale', 'movimiento sale enlazado al pedido');

-- Failures leave no trace
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-0000000000b2","role":"authenticated"}', true);
insert into public.cart_items (product_id, quantity) values ('00000000-0000-4000-8000-000000000f02', 2);
select throws_ok($$select public.place_order()$$, 'MH003', null, 'stock insuficiente se rechaza');
delete from public.cart_items;
insert into public.cart_items (product_id, quantity) values ('00000000-0000-4000-8000-000000000f03', 1);
select throws_ok($$select public.place_order()$$, 'MH002', null, 'producto inactivo se rechaza');
delete from public.cart_items;
reset role;
update public.settings set min_order_net = 5000;
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-0000000000b2","role":"authenticated"}', true);
insert into public.cart_items (product_id, quantity) values ('00000000-0000-4000-8000-000000000f01', 1);
select throws_ok($$select public.place_order()$$, 'MH004', null, 'por debajo del minimo se rechaza');
select is((select count(*)::int from public.orders), 1, 'los pedidos rechazados no dejan filas');
delete from public.cart_items;
reset role;
update public.settings set min_order_net = 0;

-- Visibility and direct writes
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-0000000000c3","role":"authenticated"}', true);
select is((select count(*)::int from public.orders), 0, 'otro cliente no ve el pedido');
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-0000000000b2","role":"authenticated"}', true);
select throws_ok($$update public.orders set total = 1$$, '42501', null, 'cliente no edita pedidos directo');
select throws_ok($$select public.admin_set_order_status((select id from t where name = 'o1'), 'confirmed')$$, '42501', null, 'cliente no cambia el estado');

-- Another client cannot cancel; the owner can while pending
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-0000000000c3","role":"authenticated"}', true);
select throws_ok($$select public.cancel_order((select id from t where name = 'o1'))$$, '42501', null, 'otro cliente no cancela');
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-0000000000b2","role":"authenticated"}', true);
select lives_ok($$select public.cancel_order((select id from t where name = 'o1'), 'Me equivoque')$$, 'el dueno cancela mientras esta pendiente');
select throws_ok($$select public.cancel_order((select id from t where name = 'o1'))$$, 'MH005', null, 'no se cancela dos veces');
reset role;
select is((select stock_on_hand from public.products where sku = 'P-1'), 5, 'cancelar devuelve el stock');

-- Admin flow on a second order
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-0000000000b2","role":"authenticated"}', true);
insert into public.cart_items (product_id, quantity) values ('00000000-0000-4000-8000-000000000f01', 1);
insert into t select 'o2', public.place_order();
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-0000000000a1","role":"authenticated"}', true);
select lives_ok($$select public.admin_set_order_status((select id from t where name = 'o2'), 'confirmed')$$, 'admin confirma');
select throws_ok($$select public.admin_set_order_status((select id from t where name = 'o2'), 'delivered')$$, 'MH005', null, 'no se salta de estado');
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-0000000000b2","role":"authenticated"}', true);
select throws_ok($$select public.cancel_order((select id from t where name = 'o2'))$$, 'MH005', null, 'el cliente no cancela un pedido confirmado');

select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-0000000000a1","role":"authenticated"}', true);
select lives_ok($$select public.cancel_order((select id from t where name = 'o2'), 'Sin pago')$$, 'el admin cancela un pedido confirmado');
reset role;
select is((select stock_on_hand from public.products where sku = 'P-1'), 5, 'la cancelacion del admin devuelve el stock');

select * from finish();
rollback;
