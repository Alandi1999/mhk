import { describe, expect, it } from "vitest";
import {
  ORDER_FILTERS,
  isWorkQueue,
  orderSearchFilter,
  parseOrderFilter,
} from "./order-query";

describe("parseOrderFilter", () => {
  it("defaults to pending for missing or unknown values", () => {
    expect(parseOrderFilter(undefined)).toBe("pending");
    expect(parseOrderFilter("nope")).toBe("pending");
    expect(parseOrderFilter(["shipped"])).toBe("pending");
  });
  it("accepts every status and 'all'", () => {
    for (const f of ORDER_FILTERS) {
      expect(parseOrderFilter(f.value)).toBe(f.value);
    }
    expect(ORDER_FILTERS.map((f) => f.value)).toContain("all");
  });
});

describe("isWorkQueue", () => {
  it("is oldest-first only for the statuses that wait for the admin", () => {
    expect(isWorkQueue("pending")).toBe(true);
    expect(isWorkQueue("confirmed")).toBe(true);
    expect(isWorkQueue("preparing")).toBe(true);
    expect(isWorkQueue("shipped")).toBe(false);
    expect(isWorkQueue("delivered")).toBe(false);
    expect(isWorkQueue("cancelled")).toBe(false);
    expect(isWorkQueue("all")).toBe(false);
  });
});

describe("orderSearchFilter", () => {
  it("returns null for an empty query", () => {
    expect(orderSearchFilter("")).toBeNull();
    expect(orderSearchFilter("   ")).toBeNull();
  });
  it("matches an order number exactly, and also the customer name", () => {
    expect(orderSearchFilter("123")).toBe(
      'number.eq.123,customer_razon_social.ilike."%123%"',
    );
    expect(orderSearchFilter("#45")).toBe(
      'number.eq.45,customer_razon_social.ilike."%#45%"',
    );
  });
  it("searches only by customer name when the text is not a number", () => {
    expect(orderSearchFilter("Moto Sur")).toBe(
      'customer_razon_social.ilike."%Moto Sur%"',
    );
  });
  it("escapes ILIKE wildcards and PostgREST quoting", () => {
    expect(orderSearchFilter("50%_off")).toBe(
      'customer_razon_social.ilike."%50\\\\%\\\\_off%"',
    );
    expect(orderSearchFilter('a"b')).toBe(
      'customer_razon_social.ilike."%a\\"b%"',
    );
  });
  it("does not build a number match for values beyond a safe integer", () => {
    expect(orderSearchFilter("99999999999999999999")).toBe(
      'customer_razon_social.ilike."%99999999999999999999%"',
    );
  });
  it("drops filter separators that could inject extra conditions", () => {
    const f = orderSearchFilter("a),number.eq.1");
    expect(f).toBe('customer_razon_social.ilike."%a),number.eq.1%"');
  });
});
