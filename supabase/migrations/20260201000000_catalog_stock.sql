-- Phase 2: catalog and auditable stock.
-- One row per part (unique SKU), no variants. Prices are net of VAT with a
-- per-product rate. Stock is an immutable ledger; products.stock_on_hand is
-- a cache only the ledger trigger may change.

create extension if not exists pg_trgm with schema extensions;

create type public.stock_reason as enum
  ('initial', 'purchase', 'adjustment', 'sale', 'return', 'correction');

-- Approved (non-admin or admin) client check. Security definer so policies and
-- the catalog view can call it without recursion through profiles RLS.
create function public.is_approved_client()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role = 'cliente' and status = 'approved'
  );
$$;

revoke execute on function public.is_approved_client() from public, anon;
grant execute on function public.is_approved_client() to authenticated, service_role;

-- Categories (flat)

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(btrim(name)) between 1 and 80),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index categories_name_key on public.categories (lower(name));

create trigger categories_set_updated_at
before update on public.categories
for each row execute function public.set_updated_at();

-- Products

create table public.products (
  id uuid primary key default gen_random_uuid(),
  -- Canonical form: upper case, no spaces. The app normalizes; the DB enforces.
  sku text not null check (sku ~ '^[A-Z0-9][A-Z0-9._/-]{0,39}$'),
  name text not null check (length(btrim(name)) between 1 and 200),
  description text check (description is null or length(description) <= 4000),
  brand text check (brand is null or length(btrim(brand)) between 1 and 80),
  category_id uuid references public.categories (id) on delete restrict,
  -- Net of VAT, ARS.
  base_price numeric(14, 2) not null check (base_price >= 0),
  vat_rate numeric(4, 2) not null default 21 check (vat_rate in (0, 10.5, 21, 27)),
  stock_on_hand integer not null default 0 check (stock_on_hand >= 0),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index products_sku_key on public.products (sku);
create index products_category_idx on public.products (category_id);
create index products_name_trgm_idx on public.products using gin (name extensions.gin_trgm_ops);
create index products_sku_trgm_idx on public.products using gin (sku extensions.gin_trgm_ops);

create trigger products_set_updated_at
before update on public.products
for each row execute function public.set_updated_at();

-- Compatibility: searchable data, not a purchasable entity.

create table public.product_compatibility (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  moto_brand text not null check (length(btrim(moto_brand)) between 1 and 60),
  moto_model text not null check (length(btrim(moto_model)) between 1 and 80),
  year_from smallint check (year_from between 1950 and 2100),
  year_to smallint check (year_to between 1950 and 2100),
  check (year_from is null or year_to is null or year_from <= year_to),
  unique nulls not distinct (product_id, moto_brand, moto_model, year_from, year_to)
);

create index product_compat_product_idx on public.product_compatibility (product_id);
create index product_compat_model_trgm_idx
  on public.product_compatibility using gin (moto_model extensions.gin_trgm_ops);
create index product_compat_brand_trgm_idx
  on public.product_compatibility using gin (moto_brand extensions.gin_trgm_ops);

-- Images (files live in the public storage bucket `product-images`)

create table public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  storage_path text not null unique check (length(storage_path) between 1 and 300),
  position integer not null default 0 check (position >= 0),
  created_at timestamptz not null default now()
);

create index product_images_product_idx on public.product_images (product_id, position);

-- Stock ledger: immutable

create table public.stock_movements (
  id bigint generated always as identity primary key,
  product_id uuid not null references public.products (id) on delete restrict,
  delta integer not null check (delta <> 0),
  reason public.stock_reason not null,
  note text check (note is null or length(note) <= 500),
  created_by uuid default auth.uid() references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create index stock_movements_product_idx on public.stock_movements (product_id, created_at desc);

create function public.stock_movements_apply()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- Mark this transaction as the legitimate writer of stock_on_hand.
  perform set_config('mhk.stock_write', '1', true);
  update public.products
    set stock_on_hand = stock_on_hand + new.delta
    where id = new.product_id;
  perform set_config('mhk.stock_write', '', true);
  return new;
end;
$$;

revoke execute on function public.stock_movements_apply() from public, anon, authenticated;

create trigger stock_movements_apply
after insert on public.stock_movements
for each row execute function public.stock_movements_apply();

create function public.stock_movements_immutable()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  raise exception 'stock_movements is append-only' using errcode = '42501';
end;
$$;

revoke execute on function public.stock_movements_immutable() from public, anon, authenticated;

create trigger stock_movements_no_update
before update or delete on public.stock_movements
for each row execute function public.stock_movements_immutable();

create trigger stock_movements_no_truncate
before truncate on public.stock_movements
for each statement execute function public.stock_movements_immutable();

-- Only the ledger may change stock_on_hand; new products start at zero.
create function public.products_guard_stock()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    if new.stock_on_hand <> 0 then
      raise exception 'stock_on_hand starts at 0; record a stock movement' using errcode = '42501';
    end if;
  elsif new.stock_on_hand is distinct from old.stock_on_hand
    and coalesce(current_setting('mhk.stock_write', true), '') <> '1' then
    raise exception 'stock_on_hand changes only through stock_movements' using errcode = '42501';
  end if;
  return new;
end;
$$;

revoke execute on function public.products_guard_stock() from public, anon, authenticated;

create trigger products_guard_stock
before insert or update on public.products
for each row execute function public.products_guard_stock();

-- Visibility helper for child tables of products (clients cannot read products directly).
create function public.product_is_visible(p_product_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.is_admin()
    or (public.is_approved_client()
        and exists (select 1 from public.products where id = p_product_id and active));
$$;

revoke execute on function public.product_is_visible(uuid) from public, anon;
grant execute on function public.product_is_visible(uuid) to authenticated, service_role;

-- RLS and grants

alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_compatibility enable row level security;
alter table public.product_images enable row level security;
alter table public.stock_movements enable row level security;

revoke all on public.categories, public.products, public.product_compatibility,
  public.product_images, public.stock_movements from anon, authenticated;

grant select, insert, update, delete on public.categories to authenticated;
grant select, insert, update on public.products to authenticated;
grant select, insert, update, delete on public.product_compatibility to authenticated;
grant select, insert, update, delete on public.product_images to authenticated;
grant select, insert on public.stock_movements to authenticated;

create policy categories_select on public.categories
  for select to authenticated
  using ((select public.is_admin()) or (select public.is_approved_client()));
create policy categories_write_admin on public.categories
  for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

-- Clients read the catalog through the catalog_products view (no raw stock).
create policy products_select_admin on public.products
  for select to authenticated using ((select public.is_admin()));
create policy products_insert_admin on public.products
  for insert to authenticated with check ((select public.is_admin()));
create policy products_update_admin on public.products
  for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

create policy compat_select on public.product_compatibility
  for select to authenticated using (public.product_is_visible(product_id));
create policy compat_write_admin on public.product_compatibility
  for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

create policy images_select on public.product_images
  for select to authenticated using (public.product_is_visible(product_id));
create policy images_write_admin on public.product_images
  for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

create policy stock_select_admin on public.stock_movements
  for select to authenticated using ((select public.is_admin()));
create policy stock_insert_admin on public.stock_movements
  for insert to authenticated with check ((select public.is_admin()));

-- Client-facing catalog: active products only, availability instead of quantity.
-- Owner-rights view on purpose (clients have no direct access to products);
-- the filter below is the access check.
create view public.catalog_products
with (security_barrier = true) as
  select p.id, p.sku, p.name, p.description, p.brand, p.category_id,
         p.base_price, p.vat_rate, (p.stock_on_hand > 0) as in_stock
  from public.products p
  where p.active and ((select public.is_approved_client()) or (select public.is_admin()));

revoke all on public.catalog_products from anon, authenticated;
grant select on public.catalog_products to authenticated;

-- Storage: public-read bucket for product images, admin-only writes.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('product-images', 'product-images', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create policy product_images_admin_insert on storage.objects
  for insert to authenticated
  with check (bucket_id = 'product-images' and (select public.is_admin()));
create policy product_images_admin_update on storage.objects
  for update to authenticated
  using (bucket_id = 'product-images' and (select public.is_admin()))
  with check (bucket_id = 'product-images' and (select public.is_admin()));
create policy product_images_admin_delete on storage.objects
  for delete to authenticated
  using (bucket_id = 'product-images' and (select public.is_admin()));
