import { describe, expect, it } from "vitest";
import { isValidCuit, normalizeCuit } from "./cuit";

describe("isValidCuit", () => {
  it.each([
    ["20123456786", "check digit 6"],
    ["30712345671", "check digit 1"],
    ["27123456780", "check digit 0 (remainder 0 case)"],
    ["20111111112", "check digit 2"],
  ])("accepts %s (%s)", (cuit) => {
    expect(isValidCuit(cuit)).toBe(true);
  });

  it.each([
    ["20123456787", "wrong check digit"],
    ["2012345678", "10 digits"],
    ["201234567866", "12 digits"],
    ["20-12345678-6", "dashes (expects normalized)"],
    ["2012345678a", "letters"],
    ["", "empty"],
  ])("rejects %s (%s)", (cuit) => {
    expect(isValidCuit(cuit)).toBe(false);
  });

  it("rejects a check digit that would be 10", () => {
    // 20-00000001: 10+0+0+0+0+0+0+0+0+2 = 12; 12 mod 11 = 1; 11-1 = 10 -> no valid dv
    expect(isValidCuit("20000000010")).toBe(false);
    expect(isValidCuit("20000000019")).toBe(false);
  });
});

describe("normalizeCuit", () => {
  it("strips dashes, spaces and dots", () => {
    expect(normalizeCuit("20-12345678-6")).toBe("20123456786");
    expect(normalizeCuit(" 20 12345678 6 ")).toBe("20123456786");
    expect(normalizeCuit("20.12345678.6")).toBe("20123456786");
  });

  it("keeps other characters so validation fails later", () => {
    expect(normalizeCuit("20-1234567a-6")).toBe("201234567a6");
  });
});
