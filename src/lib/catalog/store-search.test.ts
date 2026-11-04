import { describe, expect, it } from "vitest";
import {
  compatFilter,
  firstImageByProduct,
  mergeExactFirst,
  storeSearchFilters,
} from "./store-search";

const A = "11111111-1111-4111-8111-111111111111";
const B = "22222222-2222-4222-8222-222222222222";

describe("compatFilter", () => {
  it("matches the moto brand or model anywhere", () => {
    expect(compatFilter("150")).toBe(
      'moto_brand.ilike."%150%",moto_model.ilike."%150%"',
    );
  });
});

describe("storeSearchFilters", () => {
  it("returns one filter per term, matching SKU prefix or name", () => {
    expect(storeSearchFilters("pastilla", [[]])).toEqual([
      'sku.ilike."pastilla%",name.ilike."%pastilla%"',
    ]);
  });

  it("adds the products whose compatibility matched that term", () => {
    expect(storeSearchFilters("cg 150", [[A, B], []])).toEqual([
      `sku.ilike."cg%",name.ilike."%cg%",id.in.(${A},${B})`,
      'sku.ilike."150%",name.ilike."%150%"',
    ]);
  });

  it("returns nothing for an empty query", () => {
    expect(storeSearchFilters("   ", [])).toEqual([]);
  });
});

describe("mergeExactFirst", () => {
  const row = (sku: string) => ({ sku });

  it("puts the exact SKU match first and drops its duplicate", () => {
    expect(
      mergeExactFirst(row("X2"), [row("X1"), row("X2"), row("X3")]),
    ).toEqual([row("X2"), row("X1"), row("X3")]);
  });

  it("prepends an exact match missing from the page", () => {
    expect(mergeExactFirst(row("X9"), [row("X1")])).toEqual([
      row("X9"),
      row("X1"),
    ]);
  });

  it("leaves the rows alone without an exact match", () => {
    expect(mergeExactFirst(null, [row("X1")])).toEqual([row("X1")]);
  });
});

describe("firstImageByProduct", () => {
  it("keeps the first image per product in the given order", () => {
    const map = firstImageByProduct([
      { product_id: A, storage_path: "a/1.jpg" },
      { product_id: A, storage_path: "a/2.jpg" },
      { product_id: B, storage_path: "b/1.jpg" },
    ]);
    expect(map.get(A)).toBe("a/1.jpg");
    expect(map.get(B)).toBe("b/1.jpg");
    expect(map.size).toBe(2);
  });
});
