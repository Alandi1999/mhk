import { describe, expect, it } from "vitest";
import {
  couponState,
  couponStateLabel,
  promotionState,
  promotionStateLabel,
} from "./state";

const now = new Date("2026-11-04T12:00:00.000Z");
const open = { active: true, starts_at: null, ends_at: null };

describe("promotionState", () => {
  it("is running without a window", () => {
    expect(promotionState(open, now)).toBe("running");
  });

  it("is inactive when the flag is off, whatever the window says", () => {
    expect(promotionState({ ...open, active: false }, now)).toBe("inactive");
    expect(
      promotionState(
        { active: false, starts_at: "2026-12-01T00:00:00Z", ends_at: null },
        now,
      ),
    ).toBe("inactive");
  });

  it("is scheduled before the start", () => {
    expect(
      promotionState({ ...open, starts_at: "2026-11-04T12:00:01Z" }, now),
    ).toBe("scheduled");
  });

  it("starts inclusive: running exactly at starts_at", () => {
    expect(
      promotionState({ ...open, starts_at: "2026-11-04T12:00:00Z" }, now),
    ).toBe("running");
  });

  it("ends exclusive: expired exactly at ends_at", () => {
    expect(
      promotionState({ ...open, ends_at: "2026-11-04T12:00:00Z" }, now),
    ).toBe("expired");
    expect(
      promotionState({ ...open, ends_at: "2026-11-04T12:00:01Z" }, now),
    ).toBe("running");
  });

  it("labels each state in Spanish", () => {
    expect(promotionStateLabel("running")).toBe("Vigente");
    expect(promotionStateLabel("scheduled")).toBe("Programada");
    expect(promotionStateLabel("expired")).toBe("Vencida");
    expect(promotionStateLabel("inactive")).toBe("Inactiva");
  });
});

describe("couponState", () => {
  const coupon = { ...open, uses: 0, max_uses: null as number | null };

  it("is running with no limit", () => {
    expect(couponState({ ...coupon, uses: 500 }, now)).toBe("running");
  });

  it("is exhausted when uses reach max_uses", () => {
    expect(couponState({ ...coupon, uses: 4, max_uses: 5 }, now)).toBe(
      "running",
    );
    expect(couponState({ ...coupon, uses: 5, max_uses: 5 }, now)).toBe(
      "exhausted",
    );
    expect(couponState({ ...coupon, uses: 6, max_uses: 5 }, now)).toBe(
      "exhausted",
    );
  });

  it("keeps the window states and the active flag first", () => {
    expect(
      couponState({ ...coupon, active: false, uses: 9, max_uses: 5 }, now),
    ).toBe("inactive");
    expect(
      couponState({ ...coupon, starts_at: "2026-12-01T00:00:00Z" }, now),
    ).toBe("scheduled");
    expect(
      couponState({ ...coupon, ends_at: "2026-11-01T00:00:00Z" }, now),
    ).toBe("expired");
  });

  it("labels each state in Spanish", () => {
    expect(couponStateLabel("running")).toBe("Vigente");
    expect(couponStateLabel("exhausted")).toBe("Agotado");
    expect(couponStateLabel("scheduled")).toBe("Programado");
    expect(couponStateLabel("expired")).toBe("Vencido");
    expect(couponStateLabel("inactive")).toBe("Inactivo");
  });
});
