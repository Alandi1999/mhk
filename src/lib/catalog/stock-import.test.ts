import { describe, expect, it } from "vitest";
import { parseCsv } from "./csv";
import { parseStockRows, validateStockRows } from "./stock-import";

const parse = (csv: string) => parseStockRows(parseCsv(csv));

describe("parseStockRows", () => {
  it("maps motivo to the ledger reason and defaults to adjustment", () => {
    const res = parse(
      "sku;cantidad;motivo;nota\na1;10;compra;Factura 123\nB2;-2;;rotura\nC3;4;Devolución;\nD4;1;correccion;x\n",
    );
    expect(res.errors).toEqual([]);
    expect(res.rows).toEqual([
      {
        line: 2,
        sku: "A1",
        delta: 10,
        reason: "purchase",
        note: "Factura 123",
      },
      { line: 3, sku: "B2", delta: -2, reason: "adjustment", note: "rotura" },
      { line: 4, sku: "C3", delta: 4, reason: "return", note: null },
      { line: 5, sku: "D4", delta: 1, reason: "correction", note: "x" },
    ]);
  });

  it("reports row errors with their line and keeps the valid rows", () => {
    const res = parse(
      "sku;cantidad;motivo;nota\nA1;5;compra;\n;3;ajuste;\nA3;0;ajuste;\nA4;1,5;ajuste;\nA5;2;regalo;\nA6;-1;compra;\nA7;1;ajuste;" +
        "x".repeat(501) +
        "\n",
    );
    expect(res.rows.map((r) => r.sku)).toEqual(["A1"]);
    expect(res.errors.map((e) => e.line)).toEqual([3, 4, 5, 6, 7, 8]);
  });

  it("accepts a leading plus sign", () => {
    const res = parse("sku;cantidad\nA1;+7\n");
    expect(res.rows[0]).toMatchObject({ delta: 7, reason: "adjustment" });
  });
});

describe("validateStockRows", () => {
  const rows = parse(
    "sku;cantidad;motivo\nA1;5;compra\nA1;-3;ajuste\nA1;-4;ajuste\nZZ;1;compra\nA1;-2;ajuste\nB2;-1;ajuste\n",
  ).rows;

  it("applies cumulative deltas per sku in file order", () => {
    const stock = new Map([
      ["A1", 2],
      ["B2", 0],
    ]);
    const res = validateStockRows(rows, stock);
    // A1: 2+5=7, -3=4, -4 would be 0 -> ok (0), then -2 would be -2 -> error.
    expect(res.valid.map((r) => r.line)).toEqual([2, 3, 4]);
    expect(res.errors).toEqual([
      { line: 5, message: "SKU inexistente: ZZ" },
      {
        line: 6,
        message: "El stock de A1 quedaría negativo (0 − 2)",
      },
      {
        line: 7,
        message: "El stock de B2 quedaría negativo (0 − 1)",
      },
    ]);
  });

  it("does not count rejected rows in the running total", () => {
    const res = validateStockRows(
      parse("sku;cantidad\nA1;-10\nA1;-1\n").rows,
      new Map([["A1", 1]]),
    );
    expect(res.errors.map((e) => e.line)).toEqual([2]);
    expect(res.valid.map((r) => r.line)).toEqual([3]);
  });

  it("returns errors sorted by line", () => {
    const res = validateStockRows(rows, new Map([["A1", 0]]));
    const lines = res.errors.map((e) => e.line);
    expect(lines).toEqual([...lines].sort((a, b) => a - b));
  });
});
