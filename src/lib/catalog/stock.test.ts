import { describe, expect, it } from "vitest";
import {
  MANUAL_REASONS,
  formatDelta,
  formatMovementDate,
  parseDelta,
  reasonLabel,
} from "./stock";

describe("stock reasons", () => {
  it("offers only the manual reasons in the UI", () => {
    expect(MANUAL_REASONS).toEqual([
      "purchase",
      "adjustment",
      "return",
      "correction",
    ]);
  });
  it("labels every reason in Spanish, including system ones", () => {
    expect(reasonLabel("purchase")).toBe("Ingreso por compra");
    expect(reasonLabel("adjustment")).toBe("Ajuste");
    expect(reasonLabel("return")).toBe("Devolución");
    expect(reasonLabel("correction")).toBe("Corrección");
    expect(reasonLabel("initial")).toBe("Stock inicial");
    expect(reasonLabel("sale")).toBe("Venta");
  });
});

describe("parseDelta", () => {
  it("accepts positive integers for purchase and return", () => {
    expect(parseDelta("purchase", "12")).toEqual({ ok: true, delta: 12 });
    expect(parseDelta("return", "+3")).toEqual({ ok: true, delta: 3 });
  });
  it("rejects negative quantities for purchase and return", () => {
    const res = parseDelta("purchase", "-2");
    expect(res.ok).toBe(false);
    expect(parseDelta("return", "-1").ok).toBe(false);
  });
  it("accepts signed integers for adjustment and correction", () => {
    expect(parseDelta("adjustment", "-4")).toEqual({ ok: true, delta: -4 });
    expect(parseDelta("correction", "5")).toEqual({ ok: true, delta: 5 });
    expect(parseDelta("adjustment", "−4")).toEqual({ ok: true, delta: -4 });
  });
  it("rejects zero, decimals, blanks and non numbers", () => {
    for (const raw of ["0", "1,5", "2.5", "", "  ", "abc", "1e3"]) {
      expect(parseDelta("adjustment", raw).ok).toBe(false);
    }
  });
  it("rejects absurdly large quantities", () => {
    expect(parseDelta("purchase", "1000000").ok).toBe(false);
  });
  it("rejects reasons that are not manual", () => {
    expect(parseDelta("sale", "1").ok).toBe(false);
    expect(parseDelta("initial", "1").ok).toBe(false);
  });
});

describe("formatDelta", () => {
  it("shows an explicit sign", () => {
    expect(formatDelta(5)).toBe("+5");
    expect(formatDelta(-3)).toBe("−3");
  });
});

describe("formatMovementDate", () => {
  it("renders Buenos Aires local time", () => {
    expect(formatMovementDate("2026-11-04T21:30:00Z")).toBe("04/11/2026 18:30");
  });
});
