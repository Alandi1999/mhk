-- Phase 1: user/role base (profiles, enums, CUIT validation, signup trigger, RLS).

create type public.user_role as enum ('admin', 'cliente');
create type public.account_status as enum ('pending', 'approved', 'rejected');
create type public.tax_condition as enum ('responsable_inscripto', 'monotributo', 'exento');

-- CUIT/CUIL check digit (AFIP/ARCA): weights 5,4,3,2,7,6,5,4,3,2 over the first
-- 10 digits; dv = 11 - (sum mod 11), where 11 -> 0 and 10 -> no valid dv.
-- Expects 11 plain digits (no dashes).
create function public.is_valid_cuit(p_cuit text)
returns boolean
language plpgsql
immutable
strict
set search_path = ''
as $$
declare
  weights constant int[] := array[5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
  total int := 0;
  dv int;
begin
  if p_cuit !~ '^[0-9]{11}$' then
    return false;
  end if;
  for i in 1..10 loop
    total := total + substr(p_cuit, i, 1)::int * weights[i];
  end loop;
  dv := 11 - (total % 11);
  if dv = 11 then
    dv := 0;
  elsif dv = 10 then
    return false;
  end if;
  return dv = substr(p_cuit, 11, 1)::int;
end;
$$;

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role public.user_role not null default 'cliente',
  status public.account_status not null default 'pending',
  razon_social text,
  cuit text,
  tax_condition public.tax_condition,
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_cuit_valid check (cuit is null or public.is_valid_cuit(cuit))
);

create unique index profiles_cuit_key on public.profiles (cuit) where cuit is not null;

create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := clock_timestamp();
  return new;
end;
$$;

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

-- Admin check. Security definer so policies on profiles can call it without recursion.
create function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role = 'admin' and status = 'approved'
  );
$$;

revoke execute on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated, service_role;

-- Privilege boundary: end users (JWT present) that are not admins cannot touch
-- id/role/status. Trusted contexts (postgres, service_role) have no auth.uid().
create function public.profiles_guard_privileged_columns()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is not null and not public.is_admin() then
    if new.id is distinct from old.id
       or new.role is distinct from old.role
       or new.status is distinct from old.status then
      raise exception 'only admins can change id, role or status'
        using errcode = '42501';
    end if;
  end if;
  return new;
end;
$$;

revoke execute on function public.profiles_guard_privileged_columns() from public, anon, authenticated;

create trigger profiles_guard_privileged_columns
before update on public.profiles
for each row execute function public.profiles_guard_privileged_columns();

-- Signup: always cliente/pending. role/status in raw_user_meta_data are IGNORED
-- (clients control signup metadata). An invalid CUIT violates the CHECK
-- constraint (23514) and aborts the signup instead of silently dropping the value.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
begin
  insert into public.profiles (id, razon_social, cuit, tax_condition, phone)
  values (
    new.id,
    nullif(btrim(meta ->> 'razon_social'), ''),
    nullif(btrim(meta ->> 'cuit'), ''),
    nullif(meta ->> 'tax_condition', '')::public.tax_condition,
    nullif(btrim(meta ->> 'phone'), '')
  );
  return new;
end;
$$;

revoke execute on function public.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- RLS and grants
alter table public.profiles enable row level security;

revoke all on public.profiles from anon, authenticated;
grant select, update on public.profiles to authenticated;

create policy profiles_select_own on public.profiles
for select to authenticated
using (id = (select auth.uid()));

create policy profiles_select_admin on public.profiles
for select to authenticated
using ((select public.is_admin()));

create policy profiles_update_own on public.profiles
for update to authenticated
using (id = (select auth.uid()))
with check (id = (select auth.uid()));

create policy profiles_update_admin on public.profiles
for update to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));
