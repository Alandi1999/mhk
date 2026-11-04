# Feature: fase3-listas-de-precios

Objective: B2B price lists (roadmap phase 3). Registration with CUIT and admin approval already shipped in phase 1; padrón (ARCA) validation is deferred to the invoicing phase because it needs the ARCA certificate. Branch `feat/fase3-clientes-b2b`. Delivery: `ask-on-risk`. Runner: Vitest (`pnpm test`), pgTAP (`pnpm db:test`).
Mirror: Engram topic `odd/fase3-listas-de-precios/tasks`. Mirror status: pending.

## Specs

- S1: "porcentaje con precios puntuales". A price list is a named percentage discount over the product `base_price`, with optional explicit net prices per product that override the percentage.
- S2: A client has at most one assigned price list; without one they pay `base_price`. Only admins assign lists (clients cannot change it on their own profile).
- S3: Prices stay net of VAT (phase 2 decision). The effective net price is computed in the database for the signed-in user; clients never see `base_price` or other clients' lists.
- S4: Admin manages lists (create, rename, change percentage, delete when unassigned), their explicit prices (per SKU and by CSV `sku;precio`) and assigns a list to each client.
- S5: The storefront shows the client's effective net price (and gross with VAT) in the catalog and product detail.
- S6 (assumption): padrón validation deferred to the ARCA phase.

## Tasks

- [x] T1 (S1,S2,S3) Schema + RLS + pgTAP: price_lists, price_list_items, profiles.price_list_id (guarded), effective price in `catalog_products`. Inline. High risk (migration, auth guard): own commit. Evidence: migration `20260301000000_price_lists.sql` + `price_lists.test.sql` (14 pgTAP, 67 total pass), view `catalog_products` now exposes effective `price` (base_price removed from the client-facing view). Tests written after the migration (no RED observed). Risk: item 1 and 2 (migration, profile guard).
- [x] T2 (S1,S3,S4) Pricing domain libs + admin lists: pure price calc, schemas, CSV for list items; /admin/listas-de-precios (CRUD, items, CSV) and list assignment per client in /admin/clientes. Delegated writer. Route: delegated direct writer (trigger: 2+ non-trivial files, ~20 files). Evidence: RED observed for pricing libs, 180 unit tests, 67 pgTAP, lint/typecheck/build/format ok; HTTP replay of lists CRUD, explicit prices, CSV dry run/apply, delete blocked when assigned, assignment on approved client, storefront shows 20% list price and explicit price, non-admin redirected. Not verified: 375px layout, 44px targets, lists with more than 25 prices. Seed lists are named "(ejemplo)" to avoid colliding with the pgTAP fixtures. Risk: item 2.
- [x] T3 (S3,S5) Storefront uses the effective price from the view. Inline. Evidence: storefront reads `price` from the view (nullable in generated types, rendered as "Consultar precio"); typecheck/lint/format ok, 166 unit tests. Risk: none.

## Log

- L1 (2026-11-04) user: "mergeá el PR y arrancá la fase 3" (roadmap: "Clientes B2B (1 semana): registro con CUIT, aprobación por el admin, validación de padrón, listas de precios.")
- L2 (2026-11-04) user: "sí, porcentaje con precios puntuales"
- PR #2 (phase 2) merged as ccda077; CI green.
