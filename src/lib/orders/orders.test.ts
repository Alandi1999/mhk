import { describe, expect, it } from "vitest";
import {
  adminCanCancel,
  cartTotals,
  clientCanCancel,
  nextStatus,
  orderErrorMessage,
  STATUS_LABELS,
} from "./orders";

describe("status flow", () => {
  it("advances one step at a time and stops at the end", () => {
    expect(nextStatus("pending")).toBe("confirmed");
    expect(nextStatus("confirmed")).toBe("preparing");
    expect(nextStatus("preparing")).toBe("shipped");
    expect(nextStatus("shipped")).toBe("delivered");
    expect(nextStatus("delivered")).toBeNull();
    expect(nextStatus("cancelled")).toBeNull();
  });
  it("lets clients cancel only while pending", () => {
    expect(clientCanCancel("pending")).toBe(true);
    expect(clientCanCancel("confirmed")).toBe(false);
  });
  it("lets admins cancel until shipped", () => {
    expect(
      (["pending", "confirmed", "preparing"] as const).every(adminCanCancel),
    ).toBe(true);
    expect(adminCanCancel("shipped")).toBe(false);
    expect(adminCanCancel("delivered")).toBe(false);
    expect(adminCanCancel("cancelled")).toBe(false);
  });
  it("has a Spanish label for every status", () => {
    expect(STATUS_LABELS.pending).toBe("Pendiente de pago");
    expect(Object.keys(STATUS_LABELS)).toHaveLength(6);
  });
});

describe("cart totals", () => {
  it("rounds each line like the database does", () => {
    // 2 x 900 = 1800 net, 21% = 378; 3 x 33.33 = 99.99, 10.5% = 10.50 (10.49895)
    const t = cartTotals([
      { price: 900, quantity: 2, vatRate: 21 },
      { price: 33.33, quantity: 3, vatRate: 10.5 },
    ]);
    expect(t).toEqual({
      subtotalNet: 1899.99,
      vatTotal: 388.5,
      total: 2288.49,
    });
  });
  it("returns zeros for an empty cart", () => {
    expect(cartTotals([])).toEqual({ subtotalNet: 0, vatTotal: 0, total: 0 });
  });
});

describe("error messages", () => {
  it("maps database error codes to Spanish messages", () => {
    expect(orderErrorMessage("MH001")).toMatch(/vacío/);
    expect(orderErrorMessage("MH003")).toMatch(/stock/i);
    expect(orderErrorMessage("MH004")).toMatch(/mínimo/);
    expect(orderErrorMessage("MH006")).toMatch(/razón social/);
    expect(orderErrorMessage("23514")).toMatch(/stock/i);
  });
  it("maps the coupon errors", () => {
    expect(orderErrorMessage("MH007")).toBe(
      "El cupón no existe, venció o ya no tiene usos disponibles.",
    );
    expect(orderErrorMessage("MH008")).toBe(
      "El pedido no alcanza el mínimo para usar este cupón.",
    );
  });
  it("falls back to a generic message", () => {
    expect(orderErrorMessage("XXXXX")).toMatch(/No pudimos/);
    expect(orderErrorMessage(undefined)).toMatch(/No pudimos/);
  });
});
