begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;

select plan(14);

-- Start from an empty catalog (the seed loads samples); rolled back with the test.
alter table public.stock_movements disable trigger user;
delete from public.stock_movements;
delete from public.products;
alter table public.stock_movements enable trigger user;

insert into auth.users (id, instance_id, aud, role, email, raw_user_meta_data)
values
  ('00000000-0000-4000-8000-0000000000a1', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'adm@t.local', '{"razon_social":"Admin"}'),
  ('00000000-0000-4000-8000-0000000000b2', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'lista@t.local', '{"razon_social":"Con lista","cuit":"20111111112"}'),
  ('00000000-0000-4000-8000-0000000000c3', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'sin@t.local', '{"razon_social":"Sin lista"}');
update public.profiles set role = 'admin', status = 'approved' where id = '00000000-0000-4000-8000-0000000000a1';
update public.profiles set status = 'approved' where id in ('00000000-0000-4000-8000-0000000000b2', '00000000-0000-4000-8000-0000000000c3');

insert into public.price_lists (id, name, discount_pct) values
  ('00000000-0000-4000-8000-0000000000d1', 'Talleres', 10);
update public.profiles set price_list_id = '00000000-0000-4000-8000-0000000000d1' where id = '00000000-0000-4000-8000-0000000000b2';

insert into public.products (id, sku, name, base_price, vat_rate) values
  ('00000000-0000-4000-8000-000000000f01', 'A-1', 'Con porcentaje', 1000, 21),
  ('00000000-0000-4000-8000-000000000f02', 'A-2', 'Con precio puntual', 1000, 21),
  ('00000000-0000-4000-8000-000000000f03', 'A-3', 'Redondeo', 99.99, 21);
insert into public.price_list_items (price_list_id, product_id, price) values
  ('00000000-0000-4000-8000-0000000000d1', '00000000-0000-4000-8000-000000000f02', 850.25);

select throws_ok($$insert into public.price_lists (name, discount_pct) values ('x', 101)$$, '23514', null, 'descuento mayor a 100 se rechaza');
select throws_ok($$insert into public.price_lists (name, discount_pct) values ('x', -1)$$, '23514', null, 'descuento negativo se rechaza');
select throws_ok($$insert into public.price_lists (name) values ('talleres')$$, '23505', null, 'nombre de lista duplicado (sin mayusculas)');
select throws_ok($$insert into public.price_list_items (price_list_id, product_id, price) values ('00000000-0000-4000-8000-0000000000d1', '00000000-0000-4000-8000-000000000f02', 1)$$, '23505', null, 'un producto aparece una vez por lista');
select throws_ok($$delete from public.price_lists where id = '00000000-0000-4000-8000-0000000000d1'$$, '23503', null, 'no se borra una lista asignada');

-- client with list
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-0000000000b2","role":"authenticated"}', true);
select is((select price from public.catalog_products where sku = 'A-1'), 900.00, 'porcentaje sobre el precio base');
select is((select price from public.catalog_products where sku = 'A-2'), 850.25, 'el precio puntual pisa el porcentaje');
select is((select price from public.catalog_products where sku = 'A-3'), 89.99, 'redondeo a centavos');
select is((select count(*)::int from public.price_lists), 0, 'cliente no ve listas de precios');
select is((select count(*)::int from public.price_list_items), 0, 'cliente no ve precios de lista');
select throws_ok($$update public.profiles set price_list_id = null where id = '00000000-0000-4000-8000-0000000000b2'$$, '42501', null, 'cliente no se cambia su lista');

-- client without list
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-0000000000c3","role":"authenticated"}', true);
select is((select price from public.catalog_products where sku = 'A-1'), 1000.00, 'sin lista paga el precio base');

-- admin
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-0000000000a1","role":"authenticated"}', true);
select lives_ok($$update public.profiles set price_list_id = null where id = '00000000-0000-4000-8000-0000000000b2'$$, 'admin desasigna la lista');
select lives_ok($$insert into public.price_lists (name, discount_pct) values ('Mayoristas', 15)$$, 'admin crea una lista');

reset role;
select * from finish();
rollback;
