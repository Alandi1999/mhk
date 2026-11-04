import { z } from "zod";
import type { CsvRecord } from "./csv";
import { parseArsAmount, VAT_RATES } from "./money";
import { isValidSku, normalizeSku } from "./sku";

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((v) => (v ? v : null));

const sku = z.string().transform((v, ctx) => {
  const normalized = normalizeSku(v);
  if (!isValidSku(normalized)) {
    ctx.issues.push({ code: "custom", message: "SKU inválido", input: v });
    return z.NEVER;
  }
  return normalized;
});

const amount = z.union([z.string(), z.number()]).transform((v, ctx) => {
  const n = typeof v === "number" ? v : parseArsAmount(v);
  if (n === null || !Number.isFinite(n) || n < 0) {
    ctx.issues.push({ code: "custom", message: "Importe inválido", input: v });
    return z.NEVER;
  }
  return n;
});

const vat = z
  .union([z.string(), z.number()])
  .optional()
  .transform((v, ctx) => {
    if (v === undefined || v === "") return 21;
    const n = typeof v === "number" ? v : parseArsAmount(v);
    if (n === null || !(VAT_RATES as readonly number[]).includes(n)) {
      ctx.issues.push({
        code: "custom",
        message: "IVA inválido (0, 10,5, 21 o 27)",
        input: v,
      });
      return z.NEVER;
    }
    return n;
  });

const active = z
  .union([z.string(), z.boolean()])
  .optional()
  .transform((v) =>
    typeof v === "boolean"
      ? v
      : !["no", "n", "0", "false"].includes((v ?? "").trim().toLowerCase()),
  );

/** Form/CSV input for a product; output uses database column names. */
export const productInputSchema = z
  .object({
    sku,
    name: z.string().trim().min(1, "Nombre requerido").max(200),
    description: optionalText(4000),
    brand: optionalText(80),
    category: optionalText(80),
    price: amount,
    vat,
    active,
  })
  .transform(({ price, vat, ...rest }) => ({
    ...rest,
    base_price: price,
    vat_rate: vat,
  }));

export type ProductInput = z.output<typeof productInputSchema>;

export type RowError = { line: number; message: string };

/** A valid CSV product with the spreadsheet line it came from. */
export type ProductRow = ProductInput & { line: number };

const CSV_COLUMNS = {
  sku: "sku",
  name: "nombre",
  description: "descripcion",
  brand: "marca",
  category: "categoria",
  price: "precio_neto",
  vat: "iva",
  active: "activo",
} as const;

/** `line` is the spreadsheet row (header = 1) assuming no blank lines. */
export function parseProductRows(records: CsvRecord[]): {
  rows: ProductRow[];
  errors: RowError[];
} {
  const rows: ProductRow[] = [];
  const errors: RowError[] = [];
  const seen = new Set<string>();

  records.forEach((record, index) => {
    const line = index + 2;
    const raw = Object.fromEntries(
      Object.entries(CSV_COLUMNS).map(([key, column]) => [
        key,
        record[column] ?? "",
      ]),
    );
    const parsed = productInputSchema.safeParse(raw);
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
    rows.push({ ...parsed.data, line });
  });

  return { rows, errors };
}
