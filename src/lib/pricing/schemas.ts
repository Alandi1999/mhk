import { z } from "zod";
import type { CsvRecord } from "@/lib/catalog/csv";
import { parseArsAmount } from "@/lib/catalog/money";
import type { RowError } from "@/lib/catalog/schemas";
import { isValidSku, normalizeSku } from "@/lib/catalog/sku";

export const LIST_NAME_MAX = 80;
// price_list_items.price is numeric(14, 2).
const PRICE_LIMIT = 1e12;

const hasAtMostTwoDecimals = (n: number) =>
  Math.abs(n * 100 - Math.round(n * 100)) < 1e-6;

const percentage = z.string().transform((v, ctx) => {
  const n = parseArsAmount(v.trim());
  if (n === null || !Number.isFinite(n)) {
    ctx.issues.push({
      code: "custom",
      message: "Ingresá un porcentaje, por ejemplo 12,5",
      input: v,
    });
    return z.NEVER;
  }
  if (n > 100) {
    ctx.issues.push({
      code: "custom",
      message: "El porcentaje va de 0 a 100",
      input: v,
    });
    return z.NEVER;
  }
  if (!hasAtMostTwoDecimals(n)) {
    ctx.issues.push({
      code: "custom",
      message: "Usá hasta 2 decimales",
      input: v,
    });
    return z.NEVER;
  }
  return n;
});

/** Price list form; output uses database column names. */
export const priceListFormSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, "Nombre requerido")
      .max(LIST_NAME_MAX, `Máximo ${LIST_NAME_MAX} caracteres`),
    discount: percentage,
  })
  .transform(({ name, discount }) => ({ name, discount_pct: discount }));

export type PriceListInput = z.output<typeof priceListFormSchema>;

export type PriceListFormResult =
  | { ok: true; data: PriceListInput }
  | { ok: false; errors: Record<string, string> };

export function parsePriceListForm(raw: {
  name: string;
  discount: string;
}): PriceListFormResult {
  const parsed = priceListFormSchema.safeParse(raw);
  if (parsed.success) return { ok: true, data: parsed.data };
  const errors: Record<string, string> = {};
  for (const issue of parsed.error.issues) {
    const key = String(issue.path[0] ?? "form");
    errors[key] ??= issue.message;
  }
  return { ok: false, errors };
}

const sku = z.string().transform((v, ctx) => {
  const normalized = normalizeSku(v);
  if (!isValidSku(normalized)) {
    ctx.issues.push({ code: "custom", message: "SKU inválido", input: v });
    return z.NEVER;
  }
  return normalized;
});

const price = z.string().transform((v, ctx) => {
  const n = parseArsAmount(v);
  if (n === null || !Number.isFinite(n) || n >= PRICE_LIMIT) {
    ctx.issues.push({ code: "custom", message: "Importe inválido", input: v });
    return z.NEVER;
  }
  return Math.round(n * 100) / 100;
});

/** One explicit price: used by the single-SKU form and the CSV rows. */
export const priceItemInputSchema = z.object({ sku, price });

export type PriceItemRow = { line: number; sku: string; price: number };

/** Columns: sku;precio. `line` is the spreadsheet row (header = 1). */
export function parsePriceItemRows(records: CsvRecord[]): {
  rows: PriceItemRow[];
  errors: RowError[];
} {
  const rows: PriceItemRow[] = [];
  const errors: RowError[] = [];
  const seen = new Set<string>();

  records.forEach((record, index) => {
    const line = index + 2;
    const parsed = priceItemInputSchema.safeParse({
      sku: record.sku ?? "",
      price: record.precio ?? "",
    });
    if (!parsed.success) {
      errors.push({
        line,
        message: parsed.error.issues.map((i) => i.message).join("; "),
      });
      return;
    }
    if (seen.has(parsed.data.sku)) {
      errors.push({
        line,
        message: `SKU repetido en el archivo: ${parsed.data.sku}`,
      });
      return;
    }
    seen.add(parsed.data.sku);
    rows.push({ line, ...parsed.data });
  });

  return { rows, errors };
}
