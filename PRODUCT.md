# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Next.js (App Router) + TypeScript, Tailwind + shadcn/ui, deployed on Vercel; Supabase (Postgres, Auth, RLS, Storage). Confirmed by the user.

## Users

Wholesale buyers: motorcycle repair shops (talleres) and motorcycle spare-parts stores (locales de repuestos) in Argentina. They restock in volume, repeat orders often, and order by product code. A second user is the admin (the business owner/staff) who manages stock, promotions, discounts, customers, orders and payments.

## Product Purpose

Wholesale-only (no retail) online store for MHK Moto Repuestos S.A.S. Approved business customers browse the catalog, see their own prices, place orders by code and pay by bank transfer or on account (cuenta corriente). The admin controls stock, pricing, promotions and customer approval, and invoices through ARCA.

## Capabilities and Constraints

- Wholesale only: customer accounts are approved by the admin; prices depend on customer/group and quantity tiers.
- Payments: bank transfer (customer uploads a receipt, admin confirms) and cuenta corriente (credit limit, ledger, balance). No online payment gateway; Mercado Pago was explicitly ruled out by the client.
- Invoicing through ARCA. Today the business invoices as monotributista (Factura C). A S.A.S. is being formed and the business will then invoice as Responsable Inscripto (Factura A/B), with a different CUIT, certificate and point of sale. Prices are stored net of VAT with a per-product rate so the switch is configuration, not migration.
- An existing project, Barflow, already has an ARCA integration that may be reused. Not yet reviewed.
- Undecided: ARCA integration route (own WSAA/WSFEv1 client vs Afip SDK), shipping, product fitment data (brand/model of motorcycle).

## Brand Commitments

Business name: MHK Moto Repuestos S.A.S. The logo is at `public/mhk logo.png` and is binding as the visual reference (orange gradient, black, metallic silver; italic heavy wordmark, wheel mark). Visual direction is derived from it in the design step, not decided here.

## Evidence on Hand

- Logo: `public/mhk logo.png`.
- No product photos, catalog data, customer testimonials or pricing yet. Do not fabricate them.

## Product Principles

1. Speed for repeat buyers: ordering by code and reordering must take fewer steps than calling or messaging the seller.
2. The customer's own price and balance are always visible; no surprise totals.
3. The admin can run the business (stock, prices, promos, customers, payments) without a developer.
4. Fiscal correctness first: every sale produces the right comprobante for the issuer's current tax condition.
5. Simple, auditable money flows: stock movements and cuenta corriente entries are ledgers, never overwritten.
