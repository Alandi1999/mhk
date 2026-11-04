# Feature: fase5-promos-descuentos

Objective: promotions, volume discounts and coupons (roadmap phase 5). Branch `feat/fase5-promos-descuentos`. Delivery: `ask-on-risk`. Runner: Vitest (`pnpm test`), pgTAP (`pnpm db:test`).
Mirror: Engram topic `odd/fase5-promos-descuentos/tasks`. Mirror status: pending.

## Specs

- S1: "Promos y descuentos (1 semana): descuentos por volumen, cupones, promos por categoría o cliente, con vigencia." (roadmap)
- S2: "gana el más barato por línea": per order line, the unit price is the lowest of the client's price-list price (explicit or percentage), every matching volume discount and every matching promotion. Discounts never stack. The coupon is applied separately, on the order.
- S3: Promotions are percentage discounts over `base_price` with a validity window (start/end, optional), targeting one product, one category or all products, for everyone or for one price list. A volume discount is the same rule with a minimum quantity greater than 1.
- S4: Coupons: unique code (case-insensitive), percentage, optional minimum order amount (net, before coupon), optional usage limit, validity window, active flag. The client enters it at checkout; it discounts every line proportionally (VAT is computed on the discounted lines). Placing the order consumes one use; cancelling it gives the use back.
- S5: One database function prices the cart (lines, rules applied, totals, coupon status); the cart page, the checkout and `place_order` all use it, so what the client sees is what the order stores. The catalog price shows the best price for quantity 1; product detail lists the volume tiers available to that client.
- S6: Only admins manage promotions and coupons; clients cannot read the rule tables, only the priced results. Orders keep a snapshot: unit price, coupon code, coupon percentage and discount amount.
- S7: Prices stay net of VAT (phase 2 decision). The minimum order amount (phase 4 setting) is checked against the net total before the coupon.

## Tasks

- [x] T1 (S2,S3,S4,S5,S6,S7) Schema + functions + RLS + pgTAP: promotions, coupons, `price_breakdown`, `price_cart`, `cart_quote`, new `place_order(note, coupon)`, `cancel_order` returns the coupon use, catalog view with best price, order snapshot columns. Inline. High risk (migration, pricing, concurrency): own commit, independent verifier. Evidence: migration `20260501000000_promotions_coupons.sql` + `promotions.test.sql` (32 pgTAP, 130 total pass), typecheck/lint/format ok, 217 unit tests. Found while testing: functions called from a view run with the caller privileges, so price_breakdown (takes any user id) stays internal and the view uses the caller-only `my_price`. Tests written after the migration (no RED observed). Risk: items 1, 2, 4.
- [x] T2 (S1,S3,S4,S6) Admin: /admin/promociones and /admin/cupones (CRUD, validity, usage), coupon and discount shown in the admin order detail. Delegated writer (parallel with T3). Route: delegated direct writer (parallel with T3). Evidence: RED observed for promotion/coupon schemas and states, 257 unit tests, 133 pgTAP, lint/typecheck/build/format ok; 55 browser checks as admin (promotions of each kind, validation errors, coupons incl. duplicate/used/exhausted badges, order detail with coupon, no overflow at 375/1440). Not verified: 1024px, logged-in non-admin on these pages, keyboard use of the delete confirmation. Risk: item 2.
- [x] T3 (S2,S4,S5) Client: cart priced through `cart_quote` (quantity-dependent prices, rule label, coupon input), volume tiers on product detail, coupon and discount in the client order detail. Delegated writer (parallel with T2). Route: delegated direct writer (parallel with T2). Evidence: RED observed for quote/orders helpers, 257 unit tests (full tree), lint/typecheck/build ok; browser run as approved client (struck list price + promo badge, tiers table, qty 2 to 10 changes unit price, coupon valid/unknown/expired/below-minimum messages, checkout disabled for bad coupons, stored order equals quote, coupon use consumed and returned on cancel, no overflow at 375/1440, pending blocked). Not verified: coupon exhaustion through the UI, component tests. Risk: none.

## Log

- L1 (2026-11-04) user: "mergeá el PR y arrancá la fase 5" (roadmap: "Promos y descuentos (1 semana): descuentos por volumen, cupones, promos por categoría o cliente, con vigencia.")
- L2 (2026-11-04) user: "gana el más barato por línea, como recomendás"
- PR #4 (phase 4) merged as e30b0ec; CI green.
- Independent verifier (high-risk T1): 2 blockers found and fixed: (B1) deadlock between place_order and cancel_order on the same coupon (cancel now locks the coupon before stock), (B2) product_volume_tiers leaked other audiences' rule names and phantom tiers (now scoped to the caller, priced by the real rule). Recheck: 450 places + 450 cancels on one coupon with 3 sessions, 0 errors; tiers correct. Also fixed: pasted coupon codes with tabs/newlines. Advisories left: MH008 vs MH007 lets an approved client confirm that an active code exists; deleting a coupon that has orders is allowed (orders keep the code as text); `my_price` accepts qty <= 0.
