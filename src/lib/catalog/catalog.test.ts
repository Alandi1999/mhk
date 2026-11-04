import { describe, expect, it } from "vitest";
import { isValidSku, normalizeSku } from "./sku";
import { grossPrice, parseArsAmount, VAT_RATES } from "./money";
import { parseSearchQuery } from "./search";
import { missingColumns, parseCsv } from "./csv";
import { productInputSchema, parseProductRows } from "./schemas";

describe("sku", () => {
  it("normalizes case and whitespace", () => {
    expect(normalizeSku("  past 001 ")).toBe("PAST-001");
    expect(normalizeSku("ab/12.x")).toBe("AB/12.X");
  });
  it("validates the canonical form used by the database", () => {
    expect(isValidSku("PAST-001")).toBe(true);
    expect(isValidSku("past-001")).toBe(false);
    expect(isValidSku("")).toBe(false);
    expect(isValidSku("-X")).toBe(false);
    expect(isValidSku("A".repeat(41))).toBe(false);
  });
});

describe("money", () => {
  it("parses Argentine and plain decimal amounts", () => {
    expect(parseArsAmount("1.234,50")).toBe(1234.5);
    expect(parseArsAmount("1234.5")).toBe(1234.5);
    expect(parseArsAmount("$ 99")).toBe(99);
    expect(parseArsAmount("1.234")).toBe(1234);
  });
  it("rejects invalid or negative amounts", () => {
    expect(parseArsAmount("abc")).toBeNull();
    expect(parseArsAmount("-5")).toBeNull();
    expect(parseArsAmount("")).toBeNull();
  });
  it("computes gross price from net and VAT rate, rounded to cents", () => {
    expect(grossPrice(1000, 21)).toBe(1210);
    expect(grossPrice(100.5, 10.5)).toBe(111.05);
  });
  it("exposes the allowed VAT rates", () => {
    expect(VAT_RATES).toEqual([0, 10.5, 21, 27]);
  });
});

describe("search query", () => {
  it("treats a single code-like token as a SKU search", () => {
    expect(parseSearchQuery(" past-001 ")).toEqual({
      sku: "PAST-001",
      terms: ["past-001"],
    });
  });
  it("splits free text into terms", () => {
    expect(parseSearchQuery("pastilla  honda cg")).toEqual({
      sku: null,
      terms: ["pastilla", "honda", "cg"],
    });
  });
  it("escapes LIKE wildcards", () => {
    expect(parseSearchQuery("50%_off").terms).toEqual(["50\\%\\_off"]);
  });
  it("returns nothing for blank input", () => {
    expect(parseSearchQuery("   ")).toEqual({ sku: null, terms: [] });
  });
});

describe("csv", () => {
  it("parses semicolon CSV with quotes and BOM", () => {
    const rows = parseCsv(
      '﻿sku;nombre\r\nA1;"Aceite; 10W40"\r\nB2;"Dice ""hola"""\r\n',
    );
    expect(rows).toEqual([
      { sku: "A1", nombre: "Aceite; 10W40" },
      { sku: "B2", nombre: 'Dice "hola"' },
    ]);
  });
  it("detects comma delimiter and skips blank lines", () => {
    expect(parseCsv("sku,nombre\nA1,Uno\n\nB2,Dos")).toEqual([
      { sku: "A1", nombre: "Uno" },
      { sku: "B2", nombre: "Dos" },
    ]);
  });
});

describe("product input", () => {
  const ok = {
    sku: "past 001",
    name: "Pastilla",
    price: "1.000,50",
    vat: "21",
  };
  it("normalizes sku and parses money", () => {
    const r = productInputSchema.safeParse(ok);
    expect(r.success && r.data).toMatchObject({
      sku: "PAST-001",
      base_price: 1000.5,
      vat_rate: 21,
    });
  });
  it("rejects unknown VAT rates", () => {
    expect(productInputSchema.safeParse({ ...ok, vat: "5" }).success).toBe(
      false,
    );
  });
});

describe("product CSV rows", () => {
  it("returns valid rows and per-line errors", () => {
    const csv =
      "sku;nombre;precio_neto;iva\nA1;Uno;10;21\n;Sin sku;5;21\nA3;Tres;abc;21\nA1;Repetido;1;21\n";
    const res = parseProductRows(parseCsv(csv));
    expect(res.rows.map((r) => r.sku)).toEqual(["A1"]);
    expect(res.errors.map((e) => e.line)).toEqual([3, 4, 5]);
  });
});

describe("csv header checks", () => {
  it("lists the required columns the file lacks", () => {
    const records = parseCsv("SKU;Nombre\nA1;Uno\n");
    expect(missingColumns(records, ["sku", "nombre", "precio_neto"])).toEqual([
      "precio_neto",
    ]);
    expect(missingColumns(records, ["sku"])).toEqual([]);
  });
  it("keeps line numbers on valid product rows", () => {
    const res = parseProductRows(
      parseCsv("sku;nombre;precio_neto\nA1;Uno;1\n"),
    );
    expect(res.rows[0]).toMatchObject({ sku: "A1", line: 2 });
  });
});
