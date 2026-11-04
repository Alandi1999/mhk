import { describe, expect, it } from "vitest";
import { parseProductForm } from "./product-form";
import {
  pageRange,
  parsePage,
  PAGE_SIZE,
  searchFilters,
} from "./product-query";

const CATEGORY = "11111111-1111-4111-8111-111111111111";

const valid = {
  sku: "pas 001",
  name: " Pastillas de freno ",
  description: "",
  brand: "Brembo",
  category_id: CATEGORY,
  price: "1.234,50",
  vat: "10.5",
  active: "on",
};

describe("parseProductForm", () => {
  it("normalizes a valid form into database columns", () => {
    const result = parseProductForm(valid);
    expect(result).toEqual({
      ok: true,
      data: {
        sku: "PAS-001",
        name: "Pastillas de freno",
        description: null,
        brand: "Brembo",
        category_id: CATEGORY,
        base_price: 1234.5,
        vat_rate: 10.5,
        active: true,
      },
    });
  });

  it("treats an empty category as none and an unchecked box as inactive", () => {
    const result = parseProductForm({
      ...valid,
      category_id: "",
      active: null,
    });
    expect(result.ok && result.data.category_id).toBeNull();
    expect(result.ok && result.data.active).toBe(false);
  });

  it("returns one message per invalid field", () => {
    const result = parseProductForm({
      ...valid,
      sku: "!!",
      name: "",
      price: "abc",
      vat: "5",
      category_id: "not-a-uuid",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(Object.keys(result.errors).sort()).toEqual([
        "category_id",
        "name",
        "price",
        "sku",
        "vat",
      ]);
    }
  });
});

describe("parsePage / pageRange", () => {
  it("defaults to page 1 for junk and floors decimals", () => {
    expect(parsePage(undefined)).toBe(1);
    expect(parsePage("0")).toBe(1);
    expect(parsePage("-3")).toBe(1);
    expect(parsePage("abc")).toBe(1);
    expect(parsePage(["2", "3"])).toBe(1);
    expect(parsePage("3")).toBe(3);
    expect(parsePage("2.9")).toBe(2);
  });
  it("maps a page to an inclusive row range of 25", () => {
    expect(PAGE_SIZE).toBe(25);
    expect(pageRange(1)).toEqual({ from: 0, to: 24 });
    expect(pageRange(3)).toEqual({ from: 50, to: 74 });
  });
});

describe("searchFilters", () => {
  it("returns no filters for an empty query", () => {
    expect(searchFilters("   ")).toEqual([]);
  });
  it("matches each term on sku prefix or name substring", () => {
    expect(searchFilters("pastilla wave")).toEqual([
      'sku.ilike."pastilla%",name.ilike."%pastilla%"',
      'sku.ilike."wave%",name.ilike."%wave%"',
    ]);
  });
  it("escapes LIKE wildcards and quotes so the filter cannot be broken", () => {
    const [filter] = searchFilters('50%_a"b),c');
    expect(filter).toBe(
      'sku.ilike."50\\\\%\\\\_a\\"b),c%",name.ilike."%50\\\\%\\\\_a\\"b),c%"',
    );
  });
});
