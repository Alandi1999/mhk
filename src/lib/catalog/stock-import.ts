import type { CsvRecord } from "./csv";
import { normalizeSku, isValidSku } from "./sku";
import { NOTE_MAX, parseDelta, type ManualReason } from "./stock";

import type { RowError } from "./schemas";

export type StockImportRow = {
  /** Spreadsheet row (header = 1). */
  line: number;
  sku: string;
  delta: number;
  reason: ManualReason;
  note: string | null;
};

const REASON_BY_WORD: Record<string, ManualReason> = {
  compra: "purchase",
  ajuste: "adjustment",
  devolucion: "return",
  correccion: "correction",
};

function reasonFromWord(word: string): ManualReason | null {
  const key = word
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  if (key === "") return "adjustment";
  return REASON_BY_WORD[key] ?? null;
}

/** Columns: sku;cantidad;motivo;nota. `motivo` defaults to ajuste. */
export function parseStockRows(records: CsvRecord[]): {
  rows: StockImportRow[];
  errors: RowError[];
} {
  const rows: StockImportRow[] = [];
  const errors: RowError[] = [];

  records.forEach((record, index) => {
    const line = index + 2;
    const fail = (message: string) => errors.push({ line, message });

    const sku = normalizeSku(record.sku ?? "");
    if (!isValidSku(sku)) return fail("SKU inválido");

    const reason = reasonFromWord(record.motivo ?? "");
    if (!reason) {
      return fail("Motivo inválido (compra, ajuste, devolucion o correccion)");
    }
    const delta = parseDelta(reason, record.cantidad ?? "");
    if (!delta.ok) return fail(delta.error);

    const note = (record.nota ?? "").trim();
    if (note.length > NOTE_MAX) {
      return fail(`La nota supera los ${NOTE_MAX} caracteres`);
    }

    rows.push({
      line,
      sku,
      delta: delta.delta,
      reason,
      note: note === "" ? null : note,
    });
  });

  return { rows, errors };
}

/**
 * Checks rows against current stock (by SKU), in file order. A row for an
 * unknown SKU, or one that would leave the running total below zero, is an
 * error and does not count toward later rows of the same SKU.
 */
export function validateStockRows(
  rows: StockImportRow[],
  currentStock: ReadonlyMap<string, number>,
): { valid: StockImportRow[]; errors: RowError[] } {
  const running = new Map(currentStock);
  const valid: StockImportRow[] = [];
  const errors: RowError[] = [];

  for (const row of rows) {
    const current = running.get(row.sku);
    if (current === undefined) {
      errors.push({ line: row.line, message: `SKU inexistente: ${row.sku}` });
      continue;
    }
    const next = current + row.delta;
    if (next < 0) {
      errors.push({
        line: row.line,
        message: `El stock de ${row.sku} quedaría negativo (${current} − ${Math.abs(row.delta)})`,
      });
      continue;
    }
    running.set(row.sku, next);
    valid.push(row);
  }

  return { valid, errors };
}
