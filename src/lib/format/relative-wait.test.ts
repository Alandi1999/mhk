import { describe, expect, it } from "vitest";
import { formatWait } from "./relative-wait";

const NOW = new Date("2026-11-03T12:00:00Z");
const ago = (ms: number) => new Date(NOW.getTime() - ms).toISOString();
const MIN = 60_000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

describe("formatWait", () => {
  it.each([
    [0, "hace instantes"],
    [30_000, "hace instantes"],
    [MIN, "hace 1 min"],
    [59 * MIN, "hace 59 min"],
    [HOUR, "hace 1 h"],
    [23 * HOUR, "hace 23 h"],
    [DAY, "hace 1 día"],
    [2 * DAY, "hace 2 días"],
    [29 * DAY, "hace 29 días"],
    [30 * DAY, "hace 1 mes"],
    [75 * DAY, "hace 2 meses"],
    [400 * DAY, "hace 13 meses"],
  ])("formats %i ms as %s", (elapsed, expected) => {
    expect(formatWait(ago(elapsed), NOW)).toBe(expected);
  });

  it("treats a future timestamp (clock skew) as just now", () => {
    expect(formatWait(ago(-5 * MIN), NOW)).toBe("hace instantes");
  });

  it("returns an empty string for an invalid date", () => {
    expect(formatWait("not a date", NOW)).toBe("");
  });
});
