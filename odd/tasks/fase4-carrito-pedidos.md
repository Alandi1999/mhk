# Feature: fase4-carrito-pedidos

Objective: cart, checkout and orders for approved wholesale clients (roadmap phase 4). Payments (bank transfer receipt, cuenta corriente) and shipping are later phases. Branch `feat/fase4-carrito-pedidos`. Delivery: `ask-on-risk`. Runner: Vitest (`pnpm test`), pgTAP (`pnpm db:test`).
Mirror: Engram topic `odd/fase4-carrito-pedidos/tasks`. Mirror status: pending.

## Specs

- S1: "Carrito y pedidos (2 semanas): precios por cliente y escala, mínimos, checkout, estados del pedido, reserva de stock." (roadmap). Quantity-scale pricing ("escala") is deferred to the promotions phase (assumption).
- S2: "al enviar el pedido, como recomendás": stock is deducted when the client places the order (one `sale` movement per line, linked to the order) and returned (`return` movements) if the order is cancelled.
- S3: The cart is stored per user in the database. Order lines snapshot SKU, name, net unit price (the client's effective price at that moment), VAT rate and quantity; the order snapshots the client's razón social, CUIT and tax condition. Prices stay net of VAT.
- S4: Placing an order is one atomic database operation that verifies approval, active products, enough stock, and the minimum order amount; two clients ordering the last unit cannot both succeed.
- S5: A single global minimum order amount (net, ARS) is editable by admins (0 = no minimum).
- S6: Order states: pending (placed, awaiting payment), confirmed, preparing, shipped, delivered, cancelled. Admins advance them in order; the client can cancel only while pending; admins can cancel until shipped. Every change is recorded in an event log.
- S7: Clients see and cancel (while pending) only their own orders; admins see all and manage them. Clients never write orders directly: only through the database functions.

## Tasks

- [x] T1 (S2,S3,S4,S5,S6,S7) Schema + functions + RLS + pgTAP: cart_items, orders, order_items, order_events, settings, place_order / cancel_order / admin_set_order_status, stock_movements.order_id. Inline. High risk (migration, concurrency, permissions): own commit. Evidence: migration `20260401000000_cart_orders.sql` + `cart_orders.test.sql` (30 pgTAP, 97 total pass). Real concurrency probe: two sessions (psql, authenticated role, 3 s hold) ordering the last unit of one product, one order was created, the other rolled back, stock stayed at 0. Tests written after the migration (no RED observed). Risk: items 1, 2, 4.
- [x] T2 (S3,S6) Pure libs: totals in cents, status labels and transitions, error mapping. Inline, test first. Evidence: RED observed (unresolved import), GREEN 8 tests in `src/lib/orders/orders.test.ts`. Risk: none.
- [x] T3 (S1,S3,S4,S5,S7) Client side: add to cart from catalog and detail, /tienda/carrito, checkout with note, /tienda/pedidos list/detail with cancel. Delegated writer (parallel with T4). Route: delegated direct writer (parallel with T4). Evidence: RED observed for cart helpers, 217 unit tests (full tree), 97 pgTAP, lint/typecheck/build/format ok; browser run as approved client (add/merge/update/remove, totals, minimum notice, inactive line blocked, insufficient stock message, place order drops stock, cancel returns it, 404s, pending blocked, no overflow at 375/1440). Not verified: order list pagination, admin using the shop. Risk: none.
- [x] T4 (S5,S6,S7) Admin side: /admin/pedidos list and detail with status advance and cancel, minimum order setting. Delegated writer (parallel with T3). Route: delegated direct writer (parallel with T3). Evidence: RED observed for order-query helpers, 217 unit tests, 98 pgTAP, lint/typecheck/build/format ok; browser run as admin (filters, search, detail, full advance flow, cancel returns stock with event log, minimum persists and place_order rejects below it, non-admin redirected, 0 overflow at 375/1440). Deviation: shared SiteNav/BrandHeader got horizontal scroll so 9 admin nav items fit. Not verified: pagination past 25 rows, keyboard/screen reader. Risk: item 3 (shared nav layout).

## Log

- L1 (2026-11-04) user: "mergeá el PR y arrancá la fase 4" (roadmap: "Carrito y pedidos (2 semanas): precios por cliente y escala, mínimos, checkout, estados del pedido, reserva de stock.")
- L2 (2026-11-04) user: "al enviar el pedido, como recomendás"
- PR #3 (phase 3) merged as 82fc573; CI green.
- Independent verifier (high-risk T1): no blockers. Probed privileges, money, state machine, stock sums, atomicity and 4 real races. Advisory fixed: approved client without razón social failed with raw 23502, now MH006. Advisories left: clients can add inactive products to the cart (rejected at checkout, MH002); profiles with stock movements cannot be deleted (phase 2 append-only trigger vs ON DELETE SET NULL); a client rejected after ordering cannot cancel their pending order.
