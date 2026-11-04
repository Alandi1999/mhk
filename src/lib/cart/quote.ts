import { z } from "zod";
import { orderErrorMessage } from "@/lib/orders/orders";

const lineSchema = z.object({
  product_id: z.string(),
  sku: z.string(),
  name: z.string(),
  quantity: z.number(),
  vat_rate: z.number(),
  active: z.boolean(),
  unit_price: z.number(),
  list_price: z.number().nullable(),
  rule_name: z.string().nullable(),
  line_net: z.number(),
  line_discount: z.number(),
});

/** Shape of the jsonb returned by cart_quote(); rpc() gives it back untyped. */
const quoteSchema = z.object({
  lines: z.array(lineSchema),
  gross_net: z.number(),
  discount_net: z.number(),
  subtotal_net: z.number(),
  vat_total: z.number(),
  total: z.number(),
  coupon: z.object({
    code: z.string().nullable(),
    pct: z.number(),
    error: z.string().nullable(),
  }),
});

export type Quote = z.infer<typeof quoteSchema>;
export type QuoteLine = Quote["lines"][number];
export type QuoteCoupon = Quote["coupon"];

export function parseQuote(raw: unknown): Quote | null {
  const parsed = quoteSchema.safeParse(raw);
  return parsed.success ? parsed.data : null;
}

/** Mirrors the coupons.code check (3 to 30 characters). */
const COUPON_MAX = 30;

/** Coupon code typed by the buyer, as the database compares it: trimmed, upper case. */
export function normalizeCoupon(input: unknown): string | null {
  if (typeof input !== "string") return null;
  const code = input.trim().toUpperCase().slice(0, COUPON_MAX);
  return code === "" ? null : code;
}

export type CouponNotice =
  { kind: "none" } | { kind: "applied" | "error"; text: string };

function formatPct(pct: number): string {
  return new Intl.NumberFormat("es-AR", { maximumFractionDigits: 2 }).format(
    pct,
  );
}

/** What to tell the buyer about the coupon in the quote. */
export function couponNotice(coupon: QuoteCoupon): CouponNotice {
  if (coupon.error) {
    return { kind: "error", text: orderErrorMessage(coupon.error) };
  }
  if (!coupon.code) return { kind: "none" };
  return {
    kind: "applied",
    text: `Cupón ${coupon.code}: ${formatPct(coupon.pct)}% de descuento`,
  };
}

/** A promotion or volume tier beat the client's list price. */
export function isDiscounted(unitPrice: number, listPrice: number | null) {
  return listPrice !== null && unitPrice < listPrice;
}

export type CartIssue = "unavailable" | "no-stock";

/** inStock comes from catalog_products; inactive products are not in it. */
export function lineIssue(
  line: Pick<QuoteLine, "active">,
  inStock: boolean | undefined,
): CartIssue | null {
  if (!line.active) return "unavailable";
  return inStock ? null : "no-stock";
}

/** Totals come from the quote; this adds the minimum check and checkout gate. */
export function quoteSummary(
  quote: Quote,
  hasIssues: boolean,
  minOrderNet: number,
) {
  // The minimum is checked on the amount before the coupon (place_order does too).
  const missingToMinimum = Math.max(
    0,
    Math.round((minOrderNet - quote.gross_net) * 100) / 100,
  );
  return {
    missingToMinimum,
    canCheckout:
      quote.lines.length > 0 &&
      !hasIssues &&
      missingToMinimum === 0 &&
      quote.coupon.error === null,
  };
}
