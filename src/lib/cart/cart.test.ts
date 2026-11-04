import { describe, expect, it } from "vitest";
import {
  MAX_QUANTITY,
  buildCartLines,
  cartSummary,
  mergeQuantity,
  noticeMessage,
  parseQuantity,
  safeReturnPath,
  withNotice,
} from "./cart";

describe("parseQuantity", () => {
  it("accepts positive integers, trimming spaces", () => {
    expect(parseQuantity("3")).toBe(3);
    expect(parseQuantity("  12 ")).toBe(12);
  });
  it("clamps to the maximum the cart table allows", () => {
    expect(parseQuantity("9999")).toBe(9999);
    expect(parseQuantity("10000")).toBe(MAX_QUANTITY);
    expect(parseQuantity("99999999999")).toBe(MAX_QUANTITY);
  });
  it("rejects zero, negatives, decimals, blanks and non numbers", () => {
    for (const raw of ["0", "-1", "1.5", "1,5", "", "  ", "abc", "1e3", null]) {
      expect(parseQuantity(raw)).toBeNull();
    }
  });
});

describe("mergeQuantity", () => {
  it("adds to the existing quantity", () => {
    expect(mergeQuantity(2, 3)).toBe(5);
    expect(mergeQuantity(0, 4)).toBe(4);
  });
  it("caps at the maximum", () => {
    expect(mergeQuantity(9990, 20)).toBe(MAX_QUANTITY);
  });
});

describe("safeReturnPath", () => {
  it("keeps same-area paths with their query", () => {
    expect(safeReturnPath("/tienda?q=filtro&page=2")).toBe(
      "/tienda?q=filtro&page=2",
    );
    expect(safeReturnPath("/tienda/producto/ABC-1")).toBe(
      "/tienda/producto/ABC-1",
    );
  });
  it("falls back for anything that could leave the shop", () => {
    for (const raw of [
      "//evil.com",
      "https://evil.com",
      "/admin",
      "/tiendax",
      "/tienda\\evil",
      "",
      null,
      42,
    ]) {
      expect(safeReturnPath(raw)).toBe("/tienda");
    }
    expect(safeReturnPath("nope", "/tienda/carrito")).toBe("/tienda/carrito");
  });
});

describe("withNotice", () => {
  it("adds a query param, keeping the others", () => {
    expect(withNotice("/tienda?q=a", "agregado", "X 1")).toBe(
      "/tienda?q=a&agregado=X+1",
    );
    expect(withNotice("/tienda", "error", "invalido")).toBe(
      "/tienda?error=invalido",
    );
  });
  it("replaces a previous value of the same param", () => {
    expect(withNotice("/tienda?agregado=A&q=a", "agregado", "B")).toBe(
      "/tienda?agregado=B&q=a",
    );
  });
});

const catalog = [
  {
    id: "p1",
    sku: "B-2",
    name: "Bujía",
    price: 100,
    vat_rate: 21,
    in_stock: true,
  },
  {
    id: "p2",
    sku: "A-1",
    name: "Filtro",
    price: 50,
    vat_rate: 10.5,
    in_stock: false,
  },
  {
    id: "p3",
    sku: "C-3",
    name: "Cadena",
    price: null,
    vat_rate: 21,
    in_stock: true,
  },
];

describe("buildCartLines", () => {
  it("joins cart rows with the catalog and sorts by SKU", () => {
    const lines = buildCartLines(
      [
        { product_id: "p1", quantity: 2 },
        { product_id: "p2", quantity: 1 },
      ],
      catalog,
    );
    expect(lines.map((l) => l.sku)).toEqual(["A-1", "B-2"]);
    expect(lines[1]).toMatchObject({
      productId: "p1",
      name: "Bujía",
      price: 100,
      vatRate: 21,
      quantity: 2,
      issue: null,
    });
  });
  it("flags products without stock", () => {
    const [line] = buildCartLines([{ product_id: "p2", quantity: 1 }], catalog);
    expect(line.issue).toBe("no-stock");
  });
  it("flags products without a price", () => {
    const [line] = buildCartLines([{ product_id: "p3", quantity: 1 }], catalog);
    expect(line.issue).toBe("no-price");
  });
  it("shows products missing from the catalog as unavailable, last", () => {
    const lines = buildCartLines(
      [
        { product_id: "gone", quantity: 4 },
        { product_id: "p1", quantity: 1 },
      ],
      catalog,
    );
    expect(lines.map((l) => l.productId)).toEqual(["p1", "gone"]);
    expect(lines[1]).toMatchObject({
      sku: null,
      name: null,
      price: null,
      quantity: 4,
      issue: "unavailable",
    });
  });
});

describe("cartSummary", () => {
  const ok = buildCartLines(
    [
      { product_id: "p1", quantity: 2 },
      { product_id: "p3", quantity: 1 },
    ],
    catalog,
  ).filter((l) => !l.issue);

  it("totals the orderable lines with the order rounding", () => {
    const s = cartSummary(ok, 0);
    expect(s.totals).toEqual({ subtotalNet: 200, vatTotal: 42, total: 242 });
    expect(s.missingToMinimum).toBe(0);
    expect(s.canCheckout).toBe(true);
  });
  it("reports what is missing to reach the minimum and blocks checkout", () => {
    const s = cartSummary(ok, 1000);
    expect(s.missingToMinimum).toBe(800);
    expect(s.canCheckout).toBe(false);
  });
  it("blocks checkout when any line has an issue or the cart is empty", () => {
    const withIssue = buildCartLines(
      [{ product_id: "p2", quantity: 1 }],
      catalog,
    );
    expect(cartSummary(withIssue, 0).canCheckout).toBe(false);
    expect(cartSummary(withIssue, 0).hasIssues).toBe(true);
    expect(cartSummary([], 0).canCheckout).toBe(false);
  });
  it("does not count unavailable lines in the totals", () => {
    const lines = buildCartLines(
      [
        { product_id: "p1", quantity: 1 },
        { product_id: "gone", quantity: 5 },
      ],
      catalog,
    );
    expect(cartSummary(lines, 0).totals.subtotalNet).toBe(100);
  });
});

describe("noticeMessage", () => {
  it("explains cart-level codes", () => {
    expect(noticeMessage("cantidad")).toMatch(/cantidad válida/);
    expect(noticeMessage("nota")).toMatch(/500/);
  });
  it("delegates database codes to the order messages", () => {
    expect(noticeMessage("MH003")).toMatch(/stock suficiente/);
    expect(noticeMessage("MH004")).toMatch(/mínimo/);
  });
  it("has a generic fallback", () => {
    expect(noticeMessage("x")).toMatch(/Probá de nuevo/);
    expect(noticeMessage(undefined)).toMatch(/Probá de nuevo/);
  });
});
