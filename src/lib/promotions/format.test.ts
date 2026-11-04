import { describe, expect, it } from "vitest";
import { formatPct, formatWindow, promotionKind } from "./format";

describe("promotion formatting", () => {
  it("formats percentages with a decimal comma", () => {
    expect(formatPct(12.5)).toBe("12,5 %");
    expect(formatPct(10)).toBe("10 %");
  });

  it("describes the window in Buenos Aires time", () => {
    expect(formatWindow(null, null)).toBe("Sin límite");
    expect(formatWindow("2026-11-04T21:30:00Z", null)).toBe(
      "Desde 04/11/2026 18:30",
    );
    expect(formatWindow(null, "2026-11-04T21:30:00Z")).toBe(
      "Hasta 04/11/2026 18:30",
    );
    expect(formatWindow("2026-11-04T03:00:00Z", "2026-12-01T02:59:00Z")).toBe(
      "04/11/2026 00:00 al 30/11/2026 23:59",
    );
  });

  it("tells plain promotions from volume discounts", () => {
    expect(promotionKind(1)).toBe("Promoción");
    expect(promotionKind(10)).toBe("Volumen desde 10 u.");
  });
});
