-- Phase 3: B2B price lists.
-- A list is a percentage discount over products.base_price, with optional
-- explicit net prices per product. A client has at most one list.

create table public.price_lists (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(btrim(name)) between 1 and 80),
  discount_pct numeric(5, 2) not null default 0 check (discount_pct >= 0 and discount_pct <= 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index price_lists_name_key on public.price_lists (lower(name));

create trigger price_lists_set_updated_at
before update on public.price_lists
for each row execute function public.set_updated_at();

create table public.price_list_items (
  price_list_id uuid not null references public.price_lists (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete cascade,
  -- Net of VAT, ARS. Overrides the list percentage for this product.
  price numeric(14, 2) not null check (price >= 0),
  updated_at timestamptz not null default now(),
  primary key (price_list_id, product_id)
);

create index price_list_items_product_idx on public.price_list_items (product_id);

create trigger price_list_items_set_updated_at
before update on public.price_list_items
for each row execute function public.set_updated_at();

alter table public.profiles
  add column price_list_id uuid references public.price_lists (id) on delete restrict;

-- Only admins may assign a list (extends the phase 1 privilege boundary).
create or replace function public.profiles_guard_privileged_columns()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is not null and not public.is_admin() then
    if new.id is distinct from old.id
       or new.role is distinct from old.role
       or new.status is distinct from old.status
       or new.price_list_id is distinct from old.price_list_id then
      raise exception 'only admins can change id, role, status or price list'
        using errcode = '42501';
    end if;
  end if;
  return new;
end;
$$;

alter table public.price_lists enable row level security;
alter table public.price_list_items enable row level security;

revoke all on public.price_lists, public.price_list_items from anon, authenticated;
grant select, insert, update, delete on public.price_lists to authenticated;
grant select, insert, update, delete on public.price_list_items to authenticated;

create policy price_lists_admin on public.price_lists
  for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
create policy price_list_items_admin on public.price_list_items
  for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

-- Client-facing catalog now exposes the caller's effective net price instead
-- of base_price: explicit item price, else base_price minus the list percentage,
-- else base_price. Owner-rights view on purpose (see phase 2); the filter and the
-- auth.uid() lookup below are the access check.
drop view public.catalog_products;

create view public.catalog_products
with (security_barrier = true) as
  select p.id, p.sku, p.name, p.description, p.brand, p.category_id,
         coalesce(i.price, round(p.base_price * (1 - coalesce(l.discount_pct, 0) / 100), 2)) as price,
         p.vat_rate, (p.stock_on_hand > 0) as in_stock
  from public.products p
  left join lateral (
    select pl.id, pl.discount_pct
    from public.profiles pr
    join public.price_lists pl on pl.id = pr.price_list_id
    where pr.id = (select auth.uid())
  ) l on true
  left join public.price_list_items i on i.product_id = p.id and i.price_list_id = l.id
  where p.active and ((select public.is_approved_client()) or (select public.is_admin()));

revoke all on public.catalog_products from anon, authenticated;
grant select on public.catalog_products to authenticated;
