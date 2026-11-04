# Feature: fase2-catalogo-stock

Objective: catalog and auditable stock for the MHK wholesale store (roadmap phase 2). Branch `feat/fase2-catalogo-stock`. Delivery: `ask-on-risk`, PRs by work unit. Runner: Vitest (`pnpm test`), pgTAP (`pnpm db:test`).
Mirror: Engram topic `odd/fase2-catalogo-stock/tasks` (project mhk). Mirror status: pending.

## Specs

- S1: "SKU único con compatibilidad como datos de búsqueda". One row per part, identified by a unique SKU (the code customers order by). No variants. Compatibility (moto brand, model, year range) is searchable data attached to a product, not a separate purchasable entity.
- S2: Roadmap scope: "productos, variantes, categorías, imágenes, stock con movimientos auditables y carga masiva por CSV" (variants dropped by S1).
- S3: Prices are stored net of VAT with a per-product VAT rate (decision from phase 0). Price lists / per-client prices belong to phase 3-4; phase 2 stores only a single net `base_price`. (assumption: no cost price yet)
- S4: Stock is a ledger: every change is an immutable movement (who, when, reason, signed quantity); on-hand is derived/maintained from movements and can never go negative.
- S5: Admin manages categories, products, images, stock movements and CSV imports; approved clients can read active products; anon and pending/rejected users see nothing. RLS is the final authority.
- S6 (assumption): approved clients see availability, not exact stock numbers. Revisit with the client.

## Tasks

- [x] T1 (S1,S3,S4,S5) Schema + RLS + pgTAP: categories, products, product_compatibility, product_images, stock_movements + trigger, storage bucket policies. Route: inline. High risk (migration/RLS): own commit, native review candidate. Evidence: migration `20260201000000_catalog_stock.sql` + `catalog_stock.test.sql` (29 pgTAP, 53 total pass), types regenerated, typecheck/lint/format ok. Tests were written after the migration (no RED observed). Risk: item 1 and 2 (migration, RLS).
- [x] T2 (S1,S3) Domain libs: Zod schemas, SKU normalization, money/VAT helpers, search-query parsing, CSV parser/validator (pure, tested first). Route: inline. Evidence: RED observed (unresolved imports), GREEN 15 tests (126 total), typecheck/lint/format ok. `src/lib/catalog/{sku,money,search,csv,schemas}.ts`. Risk: none.
- [x] T3 (S5) Admin categories and products CRUD + image upload. Route: delegated direct writer (trigger: 2+ non-trivial files, ~25 files). Evidence: 140 unit tests, 53 pgTAP, lint/typecheck/build/format ok; admin flows replayed over HTTP (CRUD, dup SKU, compat, image upload, category-in-use block, non-admin redirected). Not verified: screenshots, mobile 375px. Seed now loads 3 categories + 8 products; catalog_stock pgTAP test clears the catalog inside its rolled-back transaction. Risk: item 2 (admin writes under RLS, storage upload).
- [ ] T4 (S4,S5) Admin stock: record movements, history per product.
- [ ] T5 (S2,S5) Admin CSV import (products, stock adjustments) with row-level error report.
- [ ] T6 (S1,S5,S6) Tienda catalog: search by SKU/name/compatibility, listing, product detail.

## Log

- L1 (2026-11-03) user: "mergeá el PR y arrancá la fase 2" (phase 2 = roadmap "Catálogo y stock (1–2 semanas): productos, variantes, categorías, imágenes, stock con movimientos auditables y carga masiva por CSV.")
- L2 (2026-11-03) user: "SKU único con compatibilidad como datos de búsqueda"
- PR #1 (phase 1) merged to main as d70ab67. CI green on GitHub (app 37s, database 2m31s).
