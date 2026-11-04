import { describe, expect, it } from "vitest";
import { parseCsv } from "@/lib/catalog/csv";
import {
  parsePriceItemRows,
  parsePriceListForm,
  priceListFormSchema,
} from "./schemas";

describe("priceListFormSchema", () => {
  it("trims the name and accepts a decimal comma", () => {
    expect(
      priceListFormSchema.parse({ name: "  Talleres ", discount: "12,5" }),
    ).toEqual({ name: "Talleres", discount_pct: 12.5 });
  });

  it("accepts the bounds 0 and 100", () => {
    expect(parsePriceListForm({ name: "A", discount: "0" }).ok).toBe(true);
    expect(parsePriceListForm({ name: "A", discount: "100" }).ok).toBe(true);
  });

  it("rejects an empty or too long name", () => {
    const empty = parsePriceListForm({ name: "   ", discount: "10" });
    expect(empty.ok).toBe(false);
    if (!empty.ok) expect(empty.errors.name).toBeTruthy();
    expect(
      parsePriceListForm({ name: "x".repeat(81), discount: "10" }).ok,
    ).toBe(false);
    expect(
      parsePriceListForm({ name: "x".repeat(80), discount: "10" }).ok,
    ).toBe(true);
  });

  it("rejects out of range, non numeric and 3-decimal percentages", () => {
    for (const discount of ["100,01", "-1", "abc", "", "10,555"]) {
      const res = parsePriceListForm({ name: "A", discount });
      expect(res.ok, discount).toBe(false);
      if (!res.ok) expect(res.errors.discount, discount).toBeTruthy();
    }
  });
});

const parse = (csv: string) => parsePriceItemRows(parseCsv(csv));

describe("parsePriceItemRows", () => {
  it("parses sku;precio with Argentine amounts and normalizes the SKU", () => {
    const res = parse("sku;precio\nfre-past-001;1.250,50\nMOT-BUJ-CR7;900\n");
    expect(res.errors).toEqual([]);
    expect(res.rows).toEqual([
      { line: 2, sku: "FRE-PAST-001", price: 1250.5 },
      { line: 3, sku: "MOT-BUJ-CR7", price: 900 },
    ]);
  });

  it("reports row errors with their spreadsheet line", () => {
    const res = parse("sku;precio\nA1;10\n;5\nA3;abc\nA4;-2\nA5;\n");
    expect(res.rows.map((r) => r.line)).toEqual([2]);
    expect(res.errors.map((e) => e.line)).toEqual([3, 4, 5, 6]);
    expect(res.errors[0].message).toBe("SKU inválido");
    expect(res.errors[1].message).toBe("Importe inválido");
  });

  it("flags duplicate SKUs in the file and keeps the first row", () => {
    const res = parse("sku;precio\nA1;10\na1;20\n");
    expect(res.rows).toEqual([{ line: 2, sku: "A1", price: 10 }]);
    expect(res.errors).toEqual([
      { line: 3, message: "SKU repetido en el archivo: A1" },
    ]);
  });
});
