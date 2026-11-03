begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;

select plan(29);

-- Fixtures (as postgres, bypass RLS)
insert into auth.users (id, instance_id, aud, role, email, raw_user_meta_data)
values
  ('00000000-0000-4000-8000-0000000000a1', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'adm@t.local', '{"razon_social":"Admin"}'),
  ('00000000-0000-4000-8000-0000000000b2', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'ok@t.local', '{"razon_social":"Taller OK","cuit":"20111111112"}'),
  ('00000000-0000-4000-8000-0000000000c3', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'pend@t.local', '{"razon_social":"Taller Pend"}');
update public.profiles set role = 'admin', status = 'approved' where id = '00000000-0000-4000-8000-0000000000a1';
update public.profiles set status = 'approved' where id = '00000000-0000-4000-8000-0000000000b2';

insert into public.categories (id, name) values ('00000000-0000-4000-8000-0000000000e1', 'Frenos');
insert into public.products (id, sku, name, category_id, base_price, vat_rate, active) values
  ('00000000-0000-4000-8000-000000000f01', 'PAST-001', 'Pastilla de freno delantera', '00000000-0000-4000-8000-0000000000e1', 1000.50, 21, true),
  ('00000000-0000-4000-8000-000000000f02', 'OCULTO-1', 'Producto inactivo', null, 10, 10.5, false);
insert into public.product_compatibility (product_id, moto_brand, moto_model, year_from, year_to) values
  ('00000000-0000-4000-8000-000000000f01', 'Honda', 'CG 150', 2015, 2022),
  ('00000000-0000-4000-8000-000000000f02', 'Yamaha', 'YBR 125', null, null);
insert into public.product_images (product_id, storage_path) values
  ('00000000-0000-4000-8000-000000000f01', 'f01/a.webp');

-- Constraints (as postgres)
select throws_ok($$insert into public.products (sku, name, base_price) values ('past-001', 'x', 1)$$, '23514', null, 'sku en minuscula se rechaza');
select throws_ok($$insert into public.products (sku, name, base_price) values ('PAST-001', 'x', 1)$$, '23505', null, 'sku duplicado se rechaza');
select throws_ok($$insert into public.products (sku, name, base_price) values ('NEG-1', 'x', -1)$$, '23514', null, 'precio negativo se rechaza');
select throws_ok($$insert into public.products (sku, name, base_price, vat_rate) values ('IVA-1', 'x', 1, 5)$$, '23514', null, 'alicuota de IVA invalida se rechaza');
select throws_ok($$insert into public.products (sku, name, base_price, stock_on_hand) values ('STK-1', 'x', 1, 5)$$, '42501', null, 'un producto nuevo no puede nacer con stock');
select throws_ok($$insert into public.product_compatibility (product_id, moto_brand, moto_model, year_from, year_to) values ('00000000-0000-4000-8000-000000000f01', 'Honda', 'CB 190', 2020, 2018)$$, '23514', null, 'anios invertidos se rechazan');
select throws_ok($$insert into public.product_compatibility (product_id, moto_brand, moto_model, year_from, year_to) values ('00000000-0000-4000-8000-000000000f01', 'Honda', 'CG 150', 2015, 2022)$$, '23505', null, 'compatibilidad duplicada se rechaza');

-- Ledger (as postgres)
insert into public.stock_movements (product_id, delta, reason) values ('00000000-0000-4000-8000-000000000f01', 10, 'initial');
select is((select stock_on_hand from public.products where id = '00000000-0000-4000-8000-000000000f01'), 10, 'un movimiento actualiza el stock');
insert into public.stock_movements (product_id, delta, reason, note) values ('00000000-0000-4000-8000-000000000f01', -4, 'sale', 'pedido 1');
select is((select stock_on_hand from public.products where id = '00000000-0000-4000-8000-000000000f01'), 6, 'una salida descuenta stock');
select throws_ok($$insert into public.stock_movements (product_id, delta, reason) values ('00000000-0000-4000-8000-000000000f01', -7, 'adjustment')$$, '23514', null, 'el stock no puede quedar negativo');
select is((select stock_on_hand from public.products where id = '00000000-0000-4000-8000-000000000f01'), 6, 'un movimiento rechazado no cambia el stock');
select throws_ok($$insert into public.stock_movements (product_id, delta, reason) values ('00000000-0000-4000-8000-000000000f01', 0, 'adjustment')$$, '23514', null, 'delta 0 se rechaza');
select throws_ok($$update public.stock_movements set delta = 99$$, '42501', null, 'el ledger no se edita');
select throws_ok($$delete from public.stock_movements$$, '42501', null, 'el ledger no se borra');
select throws_ok($$truncate public.stock_movements$$, '42501', null, 'el ledger no se trunca');
select throws_ok($$update public.products set stock_on_hand = 500 where id = '00000000-0000-4000-8000-000000000f01'$$, '42501', null, 'stock_on_hand no se edita directo');

-- anon
set local role anon;
select throws_ok($$select * from public.products$$, '42501', null, 'anon no lee products');
select throws_ok($$select * from public.catalog_products$$, '42501', null, 'anon no lee el catalogo');
reset role;

-- approved client
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-0000000000b2","role":"authenticated"}', true);
select is((select count(*)::int from public.products), 0, 'cliente no ve filas de products');
select is((select count(*)::int from public.catalog_products), 1, 'cliente ve solo productos activos en el catalogo');
select is((select in_stock from public.catalog_products where sku = 'PAST-001'), true, 'catalogo expone disponibilidad');
select is((select count(*)::int from public.product_compatibility), 1, 'cliente ve compatibilidad solo de productos activos');
select is((select count(*)::int from public.product_images), 1, 'cliente ve imagenes de productos activos');
select throws_ok($$insert into public.stock_movements (product_id, delta, reason) values ('00000000-0000-4000-8000-000000000f01', 1, 'adjustment')$$, '42501', null, 'cliente no registra movimientos');
select is_empty($$update public.products set base_price = 1 where sku = 'PAST-001' returning 1$$, 'cliente no edita productos');

-- pending client
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-0000000000c3","role":"authenticated"}', true);
select is((select count(*)::int from public.catalog_products), 0, 'cliente pendiente no ve el catalogo');

-- admin
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-0000000000a1","role":"authenticated"}', true);
select is((select count(*)::int from public.products), 2, 'admin ve todos los productos');
select lives_ok($$insert into public.stock_movements (product_id, delta, reason, note) values ('00000000-0000-4000-8000-000000000f01', 5, 'purchase', 'compra')$$, 'admin registra un movimiento');
select is((select created_by from public.stock_movements order by id desc limit 1), '00000000-0000-4000-8000-0000000000a1'::uuid, 'el movimiento registra quien lo hizo');

reset role;
select * from finish();
rollback;
