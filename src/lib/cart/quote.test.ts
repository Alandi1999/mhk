import { describe, expect, it } from "vitest";
import {
  couponNotice,
  isDiscounted,
  lineIssue,
  normalizeCoupon,
  parseQuote,
  quoteSummary,
  type Quote,
} from "./quote";

const line = {
  product_id: "11111111-1111-4111-8111-111111111111",
  sku: "A-1",
  name: "Bujía",
  quantity: 2,
  vat_rate: 21,
  active: true,
  unit_price: 80,
  list_price: 100,
  rule_name: "Promo bujías",
  line_net: 160,
  line_discount: 0,
};

const raw = {
  lines: [line],
  gross_net: 160,
  discount_net: 0,
  subtotal_net: 160,
  vat_total: 33.6,
  total: 193.6,
  coupon: { code: null, pct: 0, error: null },
};

describe("parseQuote", () => {
  it("parses the jsonb returned by cart_quote", () => {
    const q = parseQuote(raw);
    expect(q?.lines[0]).toMatchObject({ sku: "A-1", unit_price: 80 });
    expect(q?.total).toBe(193.6);
    expect(q?.coupon.error).toBeNull();
  });
  it("accepts a null rule name and an empty cart", () => {
    expect(
      parseQuote({ ...raw, lines: [{ ...line, rule_name: null }] })?.lines[0]
        .rule_name,
    ).toBeNull();
    expect(parseQuote({ ...raw, lines: [] })?.lines).toEqual([]);
  });
  it("returns null for anything that is not a quote", () => {
    expect(parseQuote(null)).toBeNull();
    expect(parseQuote("x")).toBeNull();
    expect(parseQuote({ ...raw, total: "193.6" })).toBeNull();
    expect(parseQuote({ ...raw, lines: [{ ...line, sku: 1 }] })).toBeNull();
    expect(parseQuote({ ...raw, coupon: undefined })).toBeNull();
  });
});

describe("normalizeCoupon", () => {
  it("trims and upper-cases", () => {
    expect(normalizeCoupon("  diez-10 ")).toBe("DIEZ-10");
  });
  it("returns null for blanks and non strings", () => {
    expect(normalizeCoupon("   ")).toBeNull();
    expect(normalizeCoupon(undefined)).toBeNull();
    expect(normalizeCoupon(["A"])).toBeNull();
  });
  it("caps the length so a tampered value stays small", () => {
    expect(normalizeCoupon("x".repeat(500))).toHaveLength(30);
  });
});

describe("couponNotice", () => {
  it("is none without a code", () => {
    expect(couponNotice(raw.coupon)).toEqual({ kind: "none" });
  });
  it("describes an applied coupon", () => {
    expect(couponNotice({ code: "DIEZ", pct: 10, error: null })).toEqual({
      kind: "applied",
      text: "Cupón DIEZ: 10% de descuento",
    });
    expect(couponNotice({ code: "MED", pct: 7.5, error: null })).toMatchObject({
      text: "Cupón MED: 7,5% de descuento",
    });
  });
  it("maps MH007 and MH008 to Spanish errors", () => {
    expect(couponNotice({ code: "X", pct: 0, error: "MH007" })).toEqual({
      kind: "error",
      text: "El cupón no existe, venció o ya no tiene usos disponibles.",
    });
    expect(couponNotice({ code: "X", pct: 0, error: "MH008" })).toEqual({
      kind: "error",
      text: "El pedido no alcanza el mínimo para usar este cupón.",
    });
  });
});

describe("isDiscounted", () => {
  it("is true only when the unit price beats the list price", () => {
    expect(isDiscounted(80, 100)).toBe(true);
    expect(isDiscounted(100, 100)).toBe(false);
    expect(isDiscounted(100, null)).toBe(false);
  });
});

describe("lineIssue", () => {
  it("flags inactive products as unavailable", () => {
    expect(lineIssue({ ...line, active: false }, undefined)).toBe(
      "unavailable",
    );
  });
  it("flags products without stock", () => {
    expect(lineIssue(line, false)).toBe("no-stock");
    expect(lineIssue(line, true)).toBeNull();
  });
});

describe("quoteSummary", () => {
  const quote = parseQuote(raw) as Quote;
  it("allows checkout and reports no shortfall at or above the minimum", () => {
    const s = quoteSummary(quote, false, 160);
    expect(s.missingToMinimum).toBe(0);
    expect(s.canCheckout).toBe(true);
  });
  it("measures the minimum on the amount before the coupon", () => {
    const withCoupon = {
      ...quote,
      gross_net: 160,
      discount_net: 16,
      subtotal_net: 144,
    };
    expect(quoteSummary(withCoupon, false, 150).missingToMinimum).toBe(0);
    expect(quoteSummary(withCoupon, false, 200).missingToMinimum).toBe(40);
  });
  it("blocks checkout on issues, empty carts, shortfall or a bad coupon", () => {
    expect(quoteSummary(quote, true, 0).canCheckout).toBe(false);
    expect(quoteSummary({ ...quote, lines: [] }, false, 0).canCheckout).toBe(
      false,
    );
    expect(quoteSummary(quote, false, 500).canCheckout).toBe(false);
    const bad = { ...quote, coupon: { code: "X", pct: 0, error: "MH007" } };
    expect(quoteSummary(bad, false, 0).canCheckout).toBe(false);
  });
});
