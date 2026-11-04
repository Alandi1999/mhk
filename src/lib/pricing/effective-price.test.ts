import { describe, expect, it } from "vitest";
import { effectivePrice } from "./effective-price";

describe("effectivePrice", () => {
  it("applies the list percentage to the base price", () => {
    expect(
      effectivePrice({ basePrice: 1000, discountPct: 10, explicitPrice: null }),
    ).toBe(900);
  });

  it("rounds to cents like the SQL view (99.99 at 10% is 89.99)", () => {
    expect(
      effectivePrice({
        basePrice: 99.99,
        discountPct: 10,
        explicitPrice: null,
      }),
    ).toBe(89.99);
  });

  it("rounds half away from zero (10.05 at 50% is 5.03)", () => {
    expect(
      effectivePrice({
        basePrice: 10.05,
        discountPct: 50,
        explicitPrice: null,
      }),
    ).toBe(5.03);
  });

  it("lets an explicit price win over the percentage", () => {
    expect(
      effectivePrice({
        basePrice: 1000,
        discountPct: 10,
        explicitPrice: 850.25,
      }),
    ).toBe(850.25);
  });

  it("keeps an explicit price of zero", () => {
    expect(
      effectivePrice({ basePrice: 1000, discountPct: 10, explicitPrice: 0 }),
    ).toBe(0);
  });

  it("falls back to the base price without a list", () => {
    expect(
      effectivePrice({
        basePrice: 32900.5,
        discountPct: null,
        explicitPrice: null,
      }),
    ).toBe(32900.5);
  });

  it("handles 0% and 100%", () => {
    expect(
      effectivePrice({ basePrice: 8500, discountPct: 0, explicitPrice: null }),
    ).toBe(8500);
    expect(
      effectivePrice({
        basePrice: 8500,
        discountPct: 100,
        explicitPrice: null,
      }),
    ).toBe(0);
  });
});
