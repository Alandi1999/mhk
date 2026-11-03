begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;

select plan(24);

-- CUIT check digit (weights 5,4,3,2,7,6,5,4,3,2 over the first 10 digits):
--   20-12345678: 10+0+3+4+21+24+25+24+21+16 = 148; 148 mod 11 = 5; 11-5 = 6 -> 20123456786
--   30-71234567: 15+0+21+2+14+18+20+20+18+14 = 142; 142 mod 11 = 10; 11-10 = 1 -> 30712345671
--   27-12345678: 10+28+3+4+21+24+25+24+21+16 = 176; 176 mod 11 = 0; 11-0 = 11 -> 0 -> 27123456780
select ok(public.is_valid_cuit('20123456786'), 'CUIT valido (dv 6)');
select ok(public.is_valid_cuit('30712345671'), 'CUIT valido (dv 1)');
select ok(public.is_valid_cuit('27123456780'), 'CUIT valido (dv 0, caso resto 0)');
select ok(not public.is_valid_cuit('20123456787'), 'CUIT con digito verificador incorrecto');
select ok(not public.is_valid_cuit('2012345678'), 'CUIT de 10 digitos');
select ok(not public.is_valid_cuit('20-12345678-6'), 'CUIT con guiones (se espera normalizado)');
select ok(not public.is_valid_cuit('2012345678a'), 'CUIT con letras');

-- 20-11111111: 10+0+3+2+7+6+5+4+3+2 = 42; 42 mod 11 = 9; 11-9 = 2 -> 20111111112 (distinct from seed data)

-- Fixtures (as postgres, bypass RLS)
insert into auth.users (id, instance_id, aud, role, email, raw_user_meta_data)
values
  ('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'a@t.local',
   '{"razon_social":"Taller A","cuit":"20111111112","tax_condition":"monotributo","phone":"1111"}'),
  ('00000000-0000-0000-0000-0000000000b2', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'b@t.local',
   '{"razon_social":"Taller B","role":"admin","status":"approved"}'),
  ('00000000-0000-0000-0000-0000000000c3', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'admin@t.local',
   '{"razon_social":"Admin"}');

select is(
  (select role::text || '/' || status::text from public.profiles where id = '00000000-0000-0000-0000-0000000000a1'),
  'cliente/pending', 'signup crea cliente/pending');
select is(
  (select cuit from public.profiles where id = '00000000-0000-0000-0000-0000000000a1'),
  '20111111112', 'signup copia cuit de metadata');
select is(
  (select role::text || '/' || status::text from public.profiles where id = '00000000-0000-0000-0000-0000000000b2'),
  'cliente/pending', 'role/status en metadata son ignorados');

select throws_ok(
  $$insert into auth.users (id, instance_id, aud, role, email, raw_user_meta_data)
    values ('00000000-0000-0000-0000-0000000000d4', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'd@t.local', '{"cuit":"20123456787"}')$$,
  '23514', null, 'signup con CUIT invalido se rechaza');
select throws_ok(
  $$insert into auth.users (id, instance_id, aud, role, email, raw_user_meta_data)
    values ('00000000-0000-0000-0000-0000000000d5', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'e@t.local', '{"cuit":"20111111112"}')$$,
  '23505', null, 'CUIT duplicado se rechaza');

-- Promote admin (postgres context bypasses the guard)
update public.profiles set role = 'admin', status = 'approved' where id = '00000000-0000-0000-0000-0000000000c3';

-- updated_at
select pg_sleep(0.01);
update public.profiles set phone = '2222' where id = '00000000-0000-0000-0000-0000000000a1';
select ok(
  (select updated_at > created_at from public.profiles where id = '00000000-0000-0000-0000-0000000000a1'),
  'updated_at cambia al actualizar');

-- anon sees nothing
set local role anon;
select throws_ok($$select * from public.profiles$$, '42501', null, 'anon no puede leer profiles');
reset role;

-- user A
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated"}', true);
select is((select count(*)::int from public.profiles), 1, 'cliente solo ve su perfil');
select is((select count(*)::int from public.profiles where id = '00000000-0000-0000-0000-0000000000b2'), 0, 'cliente no ve perfil ajeno');
select lives_ok($$update public.profiles set razon_social = 'Taller A2', phone = '3333' where id = '00000000-0000-0000-0000-0000000000a1'$$, 'cliente edita sus datos');
select throws_ok($$update public.profiles set role = 'admin' where id = '00000000-0000-0000-0000-0000000000a1'$$, '42501', null, 'cliente no puede cambiar role');
select throws_ok($$update public.profiles set status = 'approved' where id = '00000000-0000-0000-0000-0000000000a1'$$, '42501', null, 'cliente no puede cambiar status');
select is_empty($$update public.profiles set phone = 'x' where id = '00000000-0000-0000-0000-0000000000b2' returning 1$$, 'cliente no puede editar perfil ajeno');
select throws_ok($$delete from public.profiles where id = '00000000-0000-0000-0000-0000000000a1'$$, '42501', null, 'cliente no puede borrar');

-- admin
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000c3","role":"authenticated"}', true);
select ok((select count(*)::int from public.profiles) >= 3, 'admin lista todos los perfiles');
select lives_ok($$update public.profiles set status = 'approved' where id = '00000000-0000-0000-0000-0000000000a1'$$, 'admin aprueba cliente');
reset role;

select is((select status::text from public.profiles where id = '00000000-0000-0000-0000-0000000000a1'), 'approved', 'status quedo approved');

select * from finish();
rollback;
