-- LOCAL DEV ONLY. Never run against a hosted project.
-- Admin: admin@mhk.local / admin1234 (documented in README, local only).
-- Sample clients (pending approval): cliente1@mhk.local, cliente2@mhk.local (same password).

do $$
declare
  u record;
begin
  for u in
    select * from (values
      ('00000000-0000-0000-0000-00000000ad01'::uuid, 'admin@mhk.local', '{"razon_social":"MHK Administracion"}'::jsonb),
      ('00000000-0000-0000-0000-00000000c101'::uuid, 'cliente1@mhk.local',
        '{"razon_social":"Taller Rodriguez SRL","cuit":"30712345671","tax_condition":"responsable_inscripto","phone":"+54 11 5555-0001"}'::jsonb),
      ('00000000-0000-0000-0000-00000000c102'::uuid, 'cliente2@mhk.local',
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
where id = '00000000-0000-0000-0000-00000000ad01';
