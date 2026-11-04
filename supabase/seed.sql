-- LOCAL DEV ONLY. Never run against a hosted project.
-- Seeded ids are RFC 4122 v4-shaped so they pass strict uuid validation.
-- Admin: admin@mhk.local / admin1234 (documented in README, local only).
-- Sample clients (pending approval): cliente1@mhk.local, cliente2@mhk.local (same password).

do $$
declare
  u record;
begin
  for u in
    select * from (values
      ('a0a0a0a0-0000-4000-8000-00000000ad01'::uuid, 'admin@mhk.local', '{"razon_social":"MHK Administracion"}'::jsonb),
      ('c1c1c1c1-0000-4000-8000-00000000c101'::uuid, 'cliente1@mhk.local',
        '{"razon_social":"Taller Rodriguez SRL","cuit":"30712345671","tax_condition":"responsable_inscripto","phone":"+54 11 5555-0001"}'::jsonb),
      ('c1c1c1c1-0000-4000-8000-00000000c102'::uuid, 'cliente2@mhk.local',
        '{"razon_social":"Motos del Sur","cuit":"20123456786","tax_condition":"monotributo","phone":"+54 11 5555-0002"}'::jsonb)
    ) as t(id, email, meta)
  loop
    insert into auth.users (
      id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change,
      email_change_token_current, reauthentication_token, phone_change, phone_change_token
    ) values (
      u.id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', u.email,
      extensions.crypt('admin1234', extensions.gen_salt('bf')), now(),
      '{"provider":"email","providers":["email"]}'::jsonb, u.meta, now(), now(),
      '', '', '', '', '', '', '', ''
    );

    insert into auth.identities (
      id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at
    ) values (
      gen_random_uuid(), u.id, u.id::text, 'email',
      jsonb_build_object('sub', u.id::text, 'email', u.email, 'email_verified', true),
      now(), now(), now()
    );
  end loop;
end $$;

-- The signup trigger always creates cliente/pending; promote the admin here.
update public.profiles
set role = 'admin', status = 'approved'
where id = 'a0a0a0a0-0000-4000-8000-00000000ad01';

-- Catalog sample data (local dev only): 3 categories, 8 parts, initial stock.
insert into public.categories (id, name) values
  ('ca7ca7ca-0000-4000-8000-000000000001', 'Frenos'),
  ('ca7ca7ca-0000-4000-8000-000000000002', 'Transmision'),
  ('ca7ca7ca-0000-4000-8000-000000000003', 'Motor y encendido');

insert into public.products (id, sku, name, description, brand, category_id, base_price, vat_rate, active) values
  ('b0b0b0b0-0000-4000-8000-000000000001', 'FRE-PAST-001', 'Pastillas de freno delanteras', 'Juego de pastillas semimetalicas.', 'Brembo', 'ca7ca7ca-0000-4000-8000-000000000001', 8500.00, 21, true),
  ('b0b0b0b0-0000-4000-8000-000000000002', 'FRE-DISC-002', 'Disco de freno delantero 240 mm', null, 'Moto Pro', 'ca7ca7ca-0000-4000-8000-000000000001', 32900.50, 21, true),
  ('b0b0b0b0-0000-4000-8000-000000000003', 'TRA-KIT-428', 'Kit de transmision 428H 14-41', 'Cadena reforzada, pinon y corona.', 'DID', 'ca7ca7ca-0000-4000-8000-000000000002', 45800.00, 21, true),
  ('b0b0b0b0-0000-4000-8000-000000000004', 'TRA-CAD-428', 'Cadena 428H 116 eslabones', null, 'DID', 'ca7ca7ca-0000-4000-8000-000000000002', 18700.00, 21, true),
  ('b0b0b0b0-0000-4000-8000-000000000005', 'MOT-BUJ-CR7', 'Bujia CR7HSA', 'Bujia estandar para motos 110 a 150 cc.', 'NGK', 'ca7ca7ca-0000-4000-8000-000000000003', 3200.00, 21, true),
  ('b0b0b0b0-0000-4000-8000-000000000006', 'MOT-FIL-ACE', 'Filtro de aceite', null, 'Hiflofiltro', 'ca7ca7ca-0000-4000-8000-000000000003', 4100.00, 10.5, true),
  ('b0b0b0b0-0000-4000-8000-000000000007', 'MOT-FIL-AIR', 'Filtro de aire', null, 'Moto Pro', 'ca7ca7ca-0000-4000-8000-000000000003', 5600.00, 21, true),
  ('b0b0b0b0-0000-4000-8000-000000000008', 'MOT-KIT-JUN', 'Kit de juntas de motor', 'Discontinuado por el proveedor.', null, 'ca7ca7ca-0000-4000-8000-000000000003', 21500.00, 21, false);

insert into public.product_compatibility (product_id, moto_brand, moto_model, year_from, year_to) values
  ('b0b0b0b0-0000-4000-8000-000000000001', 'Honda', 'CG 150', 2010, 2022),
  ('b0b0b0b0-0000-4000-8000-000000000001', 'Yamaha', 'YBR 125', 2008, 2020),
  ('b0b0b0b0-0000-4000-8000-000000000001', 'Zanella', 'ZB 110', null, null),
  ('b0b0b0b0-0000-4000-8000-000000000002', 'Honda', 'XR 150L', 2014, null),
  ('b0b0b0b0-0000-4000-8000-000000000002', 'Yamaha', 'FZ 16', 2012, 2019),
  ('b0b0b0b0-0000-4000-8000-000000000003', 'Honda', 'Wave 110', 2015, 2022),
  ('b0b0b0b0-0000-4000-8000-000000000003', 'Motomel', 'CG 150', 2012, 2021),
  ('b0b0b0b0-0000-4000-8000-000000000003', 'Zanella', 'RX 150', 2013, 2020),
  ('b0b0b0b0-0000-4000-8000-000000000004', 'Honda', 'Wave 110', 2015, 2022),
  ('b0b0b0b0-0000-4000-8000-000000000004', 'Motomel', 'Blitz 110', 2014, 2022),
  ('b0b0b0b0-0000-4000-8000-000000000005', 'Honda', 'CG 150', 2010, 2022),
  ('b0b0b0b0-0000-4000-8000-000000000005', 'Honda', 'Wave 110', 2015, 2022),
  ('b0b0b0b0-0000-4000-8000-000000000005', 'Yamaha', 'YBR 125', 2008, 2020),
  ('b0b0b0b0-0000-4000-8000-000000000005', 'Motomel', 'Blitz 110', 2014, 2022),
  ('b0b0b0b0-0000-4000-8000-000000000006', 'Honda', 'XR 150L', 2014, null),
  ('b0b0b0b0-0000-4000-8000-000000000006', 'Yamaha', 'FZ 16', 2012, 2019),
  ('b0b0b0b0-0000-4000-8000-000000000007', 'Honda', 'CG 150', 2010, 2022),
  ('b0b0b0b0-0000-4000-8000-000000000007', 'Zanella', 'ZB 110', null, null),
  ('b0b0b0b0-0000-4000-8000-000000000008', 'Honda', 'Titan 150', 2004, 2009);

-- stock_on_hand cannot be set directly: the ledger trigger maintains it.
insert into public.stock_movements (product_id, delta, reason, note) values
  ('b0b0b0b0-0000-4000-8000-000000000001', 40, 'initial', 'Stock inicial de ejemplo'),
  ('b0b0b0b0-0000-4000-8000-000000000002', 12, 'initial', 'Stock inicial de ejemplo'),
  ('b0b0b0b0-0000-4000-8000-000000000003', 8, 'initial', 'Stock inicial de ejemplo'),
  ('b0b0b0b0-0000-4000-8000-000000000004', 25, 'initial', 'Stock inicial de ejemplo'),
  ('b0b0b0b0-0000-4000-8000-000000000005', 120, 'initial', 'Stock inicial de ejemplo'),
  ('b0b0b0b0-0000-4000-8000-000000000006', 60, 'initial', 'Stock inicial de ejemplo'),
  ('b0b0b0b0-0000-4000-8000-000000000007', 3, 'initial', 'Stock inicial de ejemplo');
