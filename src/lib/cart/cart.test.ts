import { describe, expect, it } from "vitest";
import {
  MAX_QUANTITY,
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
