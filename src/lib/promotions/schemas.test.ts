import { describe, expect, it } from "vitest";
import {
  isoToLocalInput,
  localInputToIso,
  parseCouponForm,
  parsePromotionForm,
} from "./schemas";

const CATEGORY = "ca7ca7ca-0000-4000-8000-000000000001";
const LIST = "a1a1a1a1-0000-4000-8000-000000000001";

const promo = {
  name: "Promo frenos",
  discount: "10",
  min_qty: "1",
  target: "all",
  sku: "",
  category_id: "",
  price_list_id: "",
  starts_at: "",
  ends_at: "",
};

function errorsOf(res: { ok: boolean; errors?: Record<string, string> }) {
  expect(res.ok).toBe(false);
  return res.errors ?? {};
}

describe("local date-time (Buenos Aires, UTC-03)", () => {
  it("converts a datetime-local value to ISO", () => {
    expect(localInputToIso("2026-11-04T18:30")).toBe(
      "2026-11-04T21:30:00.000Z",
    );
    expect(localInputToIso("2026-12-31T22:00")).toBe(
      "2027-01-01T01:00:00.000Z",
    );
  });

  it("rejects malformed or impossible values", () => {
    for (const v of [
      "",
      "2026-11-04",
      "2026-02-31T10:00",
      "x",
      "2026-11-04T25:00",
    ]) {
      expect(localInputToIso(v), v).toBeNull();
    }
  });

  it("round-trips ISO back to the input value", () => {
    expect(isoToLocalInput("2026-11-04T21:30:00.000Z")).toBe(
      "2026-11-04T18:30",
    );
    expect(isoToLocalInput("2027-01-01T01:00:00+00:00")).toBe(
      "2026-12-31T22:00",
    );
    expect(isoToLocalInput(null)).toBe("");
  });
});

describe("parsePromotionForm", () => {
  it("parses a plain promotion for everyone", () => {
    const res = parsePromotionForm({ ...promo, discount: " 12,5 " });
    expect(res).toEqual({
      ok: true,
      data: {
        name: "Promo frenos",
        discount_pct: 12.5,
        min_qty: 1,
        target: { kind: "all" },
        price_list_id: null,
        starts_at: null,
        ends_at: null,
      },
    });
  });

  it("validates the name (1..80 after trimming)", () => {
    expect(
      errorsOf(parsePromotionForm({ ...promo, name: "   " })).name,
    ).toBeTruthy();
    expect(
      errorsOf(parsePromotionForm({ ...promo, name: "x".repeat(81) })).name,
    ).toBeTruthy();
    expect(parsePromotionForm({ ...promo, name: "x".repeat(80) }).ok).toBe(
      true,
    );
  });

  it("accepts 0,01 and 100 and rejects 0, over 100 and 3 decimals", () => {
    expect(parsePromotionForm({ ...promo, discount: "0,01" }).ok).toBe(true);
    expect(parsePromotionForm({ ...promo, discount: "100" }).ok).toBe(true);
    for (const discount of ["0", "0,00", "100,01", "-5", "abc", "", "10,555"]) {
      expect(
        errorsOf(parsePromotionForm({ ...promo, discount })).discount,
        discount,
      ).toBeTruthy();
    }
  });

  it("requires an integer minimum quantity from 1 to 9999", () => {
    expect(parsePromotionForm({ ...promo, min_qty: "10" })).toMatchObject({
      ok: true,
      data: { min_qty: 10 },
    });
    expect(parsePromotionForm({ ...promo, min_qty: "9999" }).ok).toBe(true);
    for (const min_qty of ["0", "10000", "1,5", "-2", "", "abc"]) {
      expect(
        errorsOf(parsePromotionForm({ ...promo, min_qty })).min_qty,
        min_qty,
      ).toBeTruthy();
    }
  });

  it("targets a product by normalized SKU", () => {
    const res = parsePromotionForm({
      ...promo,
      target: "product",
      sku: " fre past 001 ",
    });
    expect(res).toMatchObject({
      ok: true,
      data: { target: { kind: "product", sku: "FRE-PAST-001" } },
    });
    expect(
      errorsOf(parsePromotionForm({ ...promo, target: "product", sku: "" }))
        .sku,
    ).toBeTruthy();
    expect(
      errorsOf(parsePromotionForm({ ...promo, target: "product", sku: "***" }))
        .sku,
    ).toBeTruthy();
  });

  it("targets a category by id and ignores the SKU text", () => {
    const res = parsePromotionForm({
      ...promo,
      target: "category",
      category_id: CATEGORY,
      sku: "garbage ***",
    });
    expect(res).toMatchObject({
      ok: true,
      data: { target: { kind: "category", category_id: CATEGORY } },
    });
    expect(
      errorsOf(parsePromotionForm({ ...promo, target: "category" }))
        .category_id,
    ).toBeTruthy();
    expect(
      errorsOf(
        parsePromotionForm({
          ...promo,
          target: "category",
          category_id: "nope",
        }),
      ).category_id,
    ).toBeTruthy();
  });

  it("rejects an unknown target", () => {
    expect(
      errorsOf(parsePromotionForm({ ...promo, target: "zzz" })).target,
    ).toBeTruthy();
  });

  it("audience is a price list id or everyone", () => {
    expect(parsePromotionForm({ ...promo, price_list_id: LIST })).toMatchObject(
      {
        ok: true,
        data: { price_list_id: LIST },
      },
    );
    expect(
      errorsOf(parsePromotionForm({ ...promo, price_list_id: "x" }))
        .price_list_id,
    ).toBeTruthy();
  });

  it("converts the window from Buenos Aires time and requires end after start", () => {
    const res = parsePromotionForm({
      ...promo,
      starts_at: "2026-11-04T00:00",
      ends_at: "2026-11-30T23:59",
    });
    expect(res).toMatchObject({
      ok: true,
      data: {
        starts_at: "2026-11-04T03:00:00.000Z",
        ends_at: "2026-12-01T02:59:00.000Z",
      },
    });
    expect(
      errorsOf(
        parsePromotionForm({
          ...promo,
          starts_at: "2026-11-04T10:00",
          ends_at: "2026-11-04T10:00",
        }),
      ).ends_at,
    ).toBeTruthy();
    expect(
      errorsOf(
        parsePromotionForm({
          ...promo,
          starts_at: "2026-11-05T10:00",
          ends_at: "2026-11-04T10:00",
        }),
      ).ends_at,
    ).toBeTruthy();
  });

  it("allows a half-open window and flags a malformed date", () => {
    expect(
      parsePromotionForm({ ...promo, starts_at: "2026-11-04T10:00" }).ok,
    ).toBe(true);
    expect(
      parsePromotionForm({ ...promo, ends_at: "2026-11-04T10:00" }).ok,
    ).toBe(true);
    expect(
      errorsOf(parsePromotionForm({ ...promo, starts_at: "mañana" })).starts_at,
    ).toBeTruthy();
  });
});

const coupon = {
  code: "bienvenida10",
  discount: "10",
  min_order: "",
  max_uses: "",
  starts_at: "",
  ends_at: "",
};

describe("parseCouponForm", () => {
  it("normalizes the code to upper case and applies defaults", () => {
    expect(parseCouponForm(coupon)).toEqual({
      ok: true,
      data: {
        code: "BIENVENIDA10",
        discount_pct: 10,
        min_order_net: 0,
        max_uses: null,
        starts_at: null,
        ends_at: null,
      },
    });
  });

  it("trims the code and enforces ^[A-Z0-9_-]{3,30}$", () => {
    expect(parseCouponForm({ ...coupon, code: "  ab-1_c " })).toMatchObject({
      ok: true,
      data: { code: "AB-1_C" },
    });
    for (const code of [
      "ab",
      "x".repeat(31),
      "con espacio",
      "ñandú",
      "a.b",
      "",
    ]) {
      expect(
        errorsOf(parseCouponForm({ ...coupon, code })).code,
        code,
      ).toBeTruthy();
    }
    expect(parseCouponForm({ ...coupon, code: "x".repeat(30) }).ok).toBe(true);
  });

  it("uses the same percentage rules as promotions", () => {
    for (const discount of ["0", "100,5", "1,234", "x"]) {
      expect(
        errorsOf(parseCouponForm({ ...coupon, discount })).discount,
        discount,
      ).toBeTruthy();
    }
    expect(parseCouponForm({ ...coupon, discount: "7,25" })).toMatchObject({
      ok: true,
      data: { discount_pct: 7.25 },
    });
  });

  it("parses the minimum order as an Argentine amount", () => {
    expect(
      parseCouponForm({ ...coupon, min_order: "$ 1.234,50" }),
    ).toMatchObject({
      ok: true,
      data: { min_order_net: 1234.5 },
    });
    expect(parseCouponForm({ ...coupon, min_order: "0" }).ok).toBe(true);
    for (const min_order of ["-5", "abc", "10,555"]) {
      expect(
        errorsOf(parseCouponForm({ ...coupon, min_order })).min_order,
        min_order,
      ).toBeTruthy();
    }
  });

  it("max uses is optional and at least 1", () => {
    expect(parseCouponForm({ ...coupon, max_uses: "50" })).toMatchObject({
      ok: true,
      data: { max_uses: 50 },
    });
    for (const max_uses of ["0", "-1", "1,5", "abc"]) {
      expect(
        errorsOf(parseCouponForm({ ...coupon, max_uses })).max_uses,
        max_uses,
      ).toBeTruthy();
    }
  });

  it("validates the window like promotions", () => {
    expect(
      parseCouponForm({
        ...coupon,
        starts_at: "2026-11-04T00:00",
        ends_at: "2026-11-05T00:00",
      }),
    ).toMatchObject({
      ok: true,
      data: {
        starts_at: "2026-11-04T03:00:00.000Z",
        ends_at: "2026-11-05T03:00:00.000Z",
      },
    });
    expect(
      errorsOf(
        parseCouponForm({
          ...coupon,
          starts_at: "2026-11-05T00:00",
          ends_at: "2026-11-04T00:00",
        }),
      ).ends_at,
    ).toBeTruthy();
  });
});
