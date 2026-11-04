import "server-only";
import {
  MAX_CSV_ROWS,
  missingColumns,
  parseCsv,
  type CsvRecord,
} from "@/lib/catalog/csv";
import { parseProductRows, type RowError } from "@/lib/catalog/schemas";
import { parseStockRows, validateStockRows } from "@/lib/catalog/stock-import";
import type { createClient } from "@/lib/supabase/server";

type Supabase = Awaited<ReturnType<typeof createClient>>;

export type ImportKind = "productos" | "stock";

export interface ImportReport {
  kind: ImportKind;
  /** false = dry run ("Solo validar"), nothing was written. */
  applied: boolean;
  /** Data rows read from the file. */
  total: number;
  created: number;
  updated: number;
  newCategories: number;
  /** Stock movements recorded (or recordable, in a dry run). */
  movements: number;
  errorCount: number;
  /** First errors by line, capped for display. */
  errors: RowError[];
}

export class ImportFailure extends Error {}

const SHOWN_ERRORS = 100;
const UPSERT_CHUNK = 500;
const MOVEMENT_CHUNK = 200;
// `in (...)` goes in the URL: keep each lookup well under the length limit.
const LOOKUP_CHUNK = 100;
const CHECK_VIOLATION = "23514";

function chunks<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    out.push(items.slice(i, i + size));
  }
  return out;
}

function readRecords(text: string, required: readonly string[]): CsvRecord[] {
  const records = parseCsv(text);
  if (records.length === 0) {
    throw new ImportFailure("El archivo no tiene filas de datos.");
  }
  if (records.length > MAX_CSV_ROWS) {
    throw new ImportFailure(
      `El archivo tiene ${records.length} filas; el máximo es ${MAX_CSV_ROWS}.`,
    );
  }
  const missing = missingColumns(records, required);
  if (missing.length > 0) {
    throw new ImportFailure(
      `Faltan columnas obligatorias: ${missing.join(", ")}.`,
    );
  }
  return records;
}

function finish(
  base: Omit<ImportReport, "errorCount" | "errors">,
  errors: RowError[],
): ImportReport {
  const sorted = [...errors].sort((a, b) => a.line - b.line);
  return {
    ...base,
    errorCount: sorted.length,
    errors: sorted.slice(0, SHOWN_ERRORS),
  };
}

export async function importProducts(
  supabase: Supabase,
  text: string,
  apply: boolean,
): Promise<ImportReport> {
  const records = readRecords(text, ["sku", "nombre", "precio_neto"]);
  const { rows, errors } = parseProductRows(records);

  // Categories come as names: match case-insensitively, create the rest.
  const { data: categories, error: categoriesError } = await supabase
    .from("categories")
    .select("id, name");
  if (categoriesError)
    throw new ImportFailure("No se pudieron leer las categorías.");
  const categoryIds = new Map(
    categories.map((c) => [c.name.toLowerCase(), c.id]),
  );
  const missingNames = new Map<string, string>();
  for (const row of rows) {
    if (row.category && !categoryIds.has(row.category.toLowerCase())) {
      missingNames.set(row.category.toLowerCase(), row.category);
    }
  }

  const existing = new Set<string>();
  for (const part of chunks(
    rows.map((r) => r.sku),
    LOOKUP_CHUNK,
  )) {
    const { data, error } = await supabase
      .from("products")
      .select("sku")
      .in("sku", part);
    if (error)
      throw new ImportFailure("No se pudieron leer los productos actuales.");
    for (const p of data) existing.add(p.sku);
  }

  const base = {
    kind: "productos" as const,
    applied: apply,
    total: records.length,
    created: 0,
    updated: 0,
    newCategories: missingNames.size,
    movements: 0,
  };

  if (!apply) {
    const updated = rows.filter((r) => existing.has(r.sku)).length;
    return finish({ ...base, created: rows.length - updated, updated }, errors);
  }

  if (missingNames.size > 0) {
    const { error } = await supabase
      .from("categories")
      .insert([...missingNames.values()].map((name) => ({ name })));
    if (error) {
      throw new ImportFailure(
        "No se pudieron crear las categorías nuevas. No se importó nada.",
      );
    }
    const { data: refreshed } = await supabase
      .from("categories")
      .select("id, name");
    for (const c of refreshed ?? [])
      categoryIds.set(c.name.toLowerCase(), c.id);
  }

  const failures: RowError[] = [...errors];
  let created = 0;
  let updated = 0;
  for (const part of chunks(rows, UPSERT_CHUNK)) {
    // stock_on_hand is deliberately absent: only the ledger changes it.
    const payload = part.map((r) => ({
      sku: r.sku,
      name: r.name,
      description: r.description,
      brand: r.brand,
      category_id: r.category
        ? (categoryIds.get(r.category.toLowerCase()) ?? null)
        : null,
      base_price: r.base_price,
      vat_rate: r.vat_rate,
      active: r.active,
    }));
    const { error } = await supabase
      .from("products")
      .upsert(payload, { onConflict: "sku" });
    if (error) {
      for (const r of part) {
        failures.push({
          line: r.line,
          message: `No se guardó: ${error.message}`,
        });
      }
      continue;
    }
    for (const r of part) {
      if (existing.has(r.sku)) updated++;
      else created++;
    }
  }

  return finish({ ...base, created, updated }, failures);
}

export async function importStock(
  supabase: Supabase,
  text: string,
  apply: boolean,
): Promise<ImportReport> {
  const records = readRecords(text, ["sku", "cantidad"]);
  const parsed = parseStockRows(records);

  const stock = new Map<string, number>();
  const productIds = new Map<string, string>();
  for (const part of chunks(
    [...new Set(parsed.rows.map((r) => r.sku))],
    LOOKUP_CHUNK,
  )) {
    const { data, error } = await supabase
      .from("products")
      .select("id, sku, stock_on_hand")
      .in("sku", part);
    if (error) throw new ImportFailure("No se pudieron leer los productos.");
    for (const p of data) {
      stock.set(p.sku, p.stock_on_hand);
      productIds.set(p.sku, p.id);
    }
  }

  const checked = validateStockRows(parsed.rows, stock);
  const failures: RowError[] = [...parsed.errors, ...checked.errors];
  const base = {
    kind: "stock" as const,
    applied: apply,
    total: records.length,
    created: 0,
    updated: 0,
    newCategories: 0,
  };

  if (!apply) {
    return finish({ ...base, movements: checked.valid.length }, failures);
  }

  let movements = 0;
  for (const part of chunks(checked.valid, MOVEMENT_CHUNK)) {
    // One INSERT per chunk is atomic: a failing row fails its whole chunk.
    const { error } = await supabase.from("stock_movements").insert(
      part.map((r) => ({
        product_id: productIds.get(r.sku)!,
        delta: r.delta,
        reason: r.reason,
        note: r.note,
      })),
    );
    if (error) {
      const message =
        error.code === CHECK_VIOLATION
          ? "No se aplicó: el stock habría quedado negativo (cambió mientras se importaba)"
          : `No se aplicó: ${error.message}`;
      for (const r of part) failures.push({ line: r.line, message });
      continue;
    }
    movements += part.length;
  }

  return finish({ ...base, movements }, failures);
}
