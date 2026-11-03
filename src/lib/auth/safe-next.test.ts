import { describe, expect, it } from "vitest";
import { safeNextPath } from "./safe-next";

describe("safeNextPath", () => {
  it.each([
    ["/tienda", "/tienda"],
    ["/admin/clientes?estado=pending", "/admin/clientes?estado=pending"],
    ["/tienda/pedidos#top", "/tienda/pedidos#top"],
  ])("keeps same-origin relative path %s", (input, expected) => {
    expect(safeNextPath(input)).toBe(expected);
  });

  it.each([
    ["//evil.com"],
    ["///evil.com"],
    ["/\\evil.com"],
    ["\\\\evil.com"],
    ["https://evil.com"],
    ["http://evil.com/tienda"],
    ["javascript:alert(1)"],
    ["tienda"],
    ["/%2F%2Fevil.com"],
    ["/%5Cevil.com"],
    ["/tienda\n//evil.com"],
    ["/\t/evil.com"],
    [""],
    ["   "],
  ])("rejects %j", (input) => {
    expect(safeNextPath(input)).toBeNull();
  });

  it("rejects non-strings", () => {
    expect(safeNextPath(undefined)).toBeNull();
    expect(safeNextPath(null)).toBeNull();
    expect(safeNextPath(["/a", "/b"])).toBeNull();
  });

  it("rejects auth pages to avoid redirect loops", () => {
    expect(safeNextPath("/login")).toBeNull();
    expect(safeNextPath("/registro")).toBeNull();
  });

  it("uses the fallback when provided", () => {
    expect(safeNextPath("//evil.com", "/tienda")).toBe("/tienda");
  });
});
