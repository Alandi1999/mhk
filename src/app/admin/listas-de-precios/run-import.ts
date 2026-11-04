import "server-only";
import { MAX_CSV_ROWS, missingColumns, parseCsv } from "@/lib/catalog/csv";
import type { RowError } from "@/lib/catalog/schemas";
import { parsePriceItemRows } from "@/lib/pricing/schemas";
import type { createClient } from "@/lib/supabase/server";

type Supabase = Awaited<ReturnType<typeof createClient>>;

export interface ItemsReport {
  /** false = dry run ("Solo validar"), nothing was written. */
  applied: boolean;
  /** Data rows read from the file. */
  total: number;
  /** Explicit prices that did not exist in the list yet. */
  created: number;
  /** Explicit prices that already existed and change (or are rewritten). */
  updated: number;
  errorCount: number;
  /** First errors by line, capped for display. */
  errors: RowError[];
}

export class ImportFailure extends Error {}

const SHOWN_ERRORS = 100;
const UPSERT_CHUNK = 500;
// `in (...)` goes in the URL: keep each lookup well under the length limit.
const LOOKUP_CHUNK = 100;

function chunks<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    out.push(items.slice(i, i + size));
  }
  return out;
}

function finish(
  base: Omit<ItemsReport, "errorCount" | "errors">,
  errors: RowError[],
): ItemsReport {
  const sorted = [...errors].sort((a, b) => a.line - b.line);
  return {
    ...base,
    errorCount: sorted.length,
    errors: sorted.slice(0, SHOWN_ERRORS),
  };
}

/** Imports `sku;precio` rows as explicit prices of one list (upsert). */
export async function importPriceItems(
  supabase: Supabase,
  listId: string,
  text: string,
  apply: boolean,
): Promise<ItemsReport> {
  const records = parseCsv(text);
  if (records.length === 0) {
    throw new ImportFailure("El archivo no tiene filas de datos.");
  }
  if (records.length > MAX_CSV_ROWS) {
    throw new ImportFailure(
      `El archivo tiene ${records.length} filas; el máximo es ${MAX_CSV_ROWS}.`,
    );
  }
  const missing = missingColumns(records, ["sku", "precio"]);
  if (missing.length > 0) {
    throw new ImportFailure(
      `Faltan columnas obligatorias: ${missing.join(", ")}.`,
    );
  }

  const { data: list, error: listError } = await supabase
    .from("price_lists")
    .select("id")
    .eq("id", listId)
    .maybeSingle();
  if (listError || !list) throw new ImportFailure("La lista no existe.");

  const parsed = parsePriceItemRows(records);
  const productIds = new Map<string, string>();
  for (const part of chunks(
    parsed.rows.map((r) => r.sku),
    LOOKUP_CHUNK,
  )) {
    const { data, error } = await supabase
      .from("products")
      .select("id, sku")
      .in("sku", part);
    if (error) throw new ImportFailure("No se pudieron leer los productos.");
    for (const p of data) productIds.set(p.sku, p.id);
  }

  const failures: RowError[] = [...parsed.errors];
  const known = parsed.rows.filter((r) => {
    if (productIds.has(r.sku)) return true;
    failures.push({ line: r.line, message: `SKU inexistente: ${r.sku}` });
    return false;
  });

  const existing = new Set<string>();
  for (const part of chunks(
    known.map((r) => productIds.get(r.sku)!),
    LOOKUP_CHUNK,
  )) {
    const { data, error } = await supabase
      .from("price_list_items")
      .select("product_id")
      .eq("price_list_id", listId)
      .in("product_id", part);
    if (error) {
      throw new ImportFailure("No se pudieron leer los precios actuales.");
    }
    for (const item of data) existing.add(item.product_id);
  }

  const base = { applied: apply, total: records.length };
  const countUpdated = (rows: typeof known) =>
    rows.filter((r) => existing.has(productIds.get(r.sku)!)).length;

  if (!apply) {
    const updated = countUpdated(known);
    return finish(
      { ...base, created: known.length - updated, updated },
      failures,
    );
  }

  let created = 0;
  let updated = 0;
  for (const part of chunks(known, UPSERT_CHUNK)) {
    const { error } = await supabase.from("price_list_items").upsert(
      part.map((r) => ({
        price_list_id: listId,
        product_id: productIds.get(r.sku)!,
        price: r.price,
      })),
      { onConflict: "price_list_id,product_id" },
    );
    if (error) {
      for (const r of part) {
        failures.push({
          line: r.line,
          message: `No se guardó: ${error.message}`,
        });
      }
      continue;
    }
    const changed = countUpdated(part);
    updated += changed;
    created += part.length - changed;
  }

  return finish({ ...base, created, updated }, failures);
}
