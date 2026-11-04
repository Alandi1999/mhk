import { z } from "zod";
import { parseArsAmount } from "@/lib/catalog/money";
import { isValidSku, normalizeSku } from "@/lib/catalog/sku";

export const NAME_MAX = 80;
export const MIN_QTY_MAX = 9999;
const AMOUNT_LIMIT = 1e12;
const MAX_USES_LIMIT = 2_147_483_647;
// Argentina has no DST: Buenos Aires is a fixed UTC-03.
const BA_OFFSET_HOURS = 3;
const LOCAL_INPUT = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/;

/**
 * `datetime-local` value ("2026-11-04T18:30") read as Buenos Aires time and
 * converted to an ISO instant. Null when malformed or not a real date.
 */
export function localInputToIso(value: string): string | null {
  const m = LOCAL_INPUT.exec(value.trim());
  if (!m) return null;
  const [y, mo, d, h, mi] = m.slice(1).map(Number);
  const check = new Date(Date.UTC(y, mo - 1, d, h, mi));
  if (
    check.getUTCFullYear() !== y ||
    check.getUTCMonth() !== mo - 1 ||
    check.getUTCDate() !== d ||
    check.getUTCHours() !== h ||
    check.getUTCMinutes() !== mi
  ) {
    return null;
  }
  return new Date(
    Date.UTC(y, mo - 1, d, h + BA_OFFSET_HOURS, mi),
  ).toISOString();
}

/** ISO instant back to a Buenos Aires `datetime-local` value ("" for null). */
export function isoToLocalInput(iso: string | null): string {
  if (!iso) return "";
  const shifted = new Date(
    new Date(iso).getTime() - BA_OFFSET_HOURS * 3_600_000,
  );
  return shifted.toISOString().slice(0, 16);
}

function issue(ctx: z.RefinementCtx, message: string, path: string) {
  ctx.issues.push({ code: "custom", message, input: "", path: [path] });
}

const hasAtMostTwoDecimals = (n: number) =>
  Math.abs(n * 100 - Math.round(n * 100)) < 1e-6;

/** Percentage in (0, 100] with at most 2 decimals (decimal comma allowed). */
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
  if (n <= 0 || n > 100) {
    ctx.issues.push({
      code: "custom",
      message: "El porcentaje va de 0,01 a 100",
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
  return Math.round(n * 100) / 100;
});

const name = z
  .string()
  .trim()
  .min(1, "Nombre requerido")
  .max(NAME_MAX, `Máximo ${NAME_MAX} caracteres`);

const optionalDate = z.string().transform((v, ctx) => {
  if (v.trim() === "") return null;
  const iso = localInputToIso(v);
  if (!iso) {
    ctx.issues.push({
      code: "custom",
      message: "Fecha u hora inválida",
      input: v,
    });
    return z.NEVER;
  }
  return iso;
});

/** Shared end-after-start check (the database requires starts_at < ends_at). */
function checkWindow(
  starts: string | null,
  ends: string | null,
  ctx: z.RefinementCtx,
) {
  if (starts && ends && new Date(ends) <= new Date(starts)) {
    issue(ctx, "El fin tiene que ser posterior al inicio", "ends_at");
  }
}

const uuid = z.uuid();

export type PromotionTarget =
  | { kind: "all" }
  | { kind: "product"; sku: string }
  | { kind: "category"; category_id: string };

export const promotionFormSchema = z
  .object({
    name,
    discount: percentage,
    min_qty: z.string().transform((v, ctx) => {
      const t = v.trim();
      const n = /^\d+$/.test(t) ? Number(t) : NaN;
      if (!Number.isInteger(n) || n < 1 || n > MIN_QTY_MAX) {
        ctx.issues.push({
          code: "custom",
          message: `Ingresá un número entero de 1 a ${MIN_QTY_MAX}`,
          input: v,
        });
        return z.NEVER;
      }
      return n;
    }),
    target: z.string(),
    sku: z.string(),
    category_id: z.string(),
    price_list_id: z.string(),
    starts_at: optionalDate,
    ends_at: optionalDate,
  })
  .transform((f, ctx) => {
    let target: PromotionTarget = { kind: "all" };
    if (f.target === "product") {
      const sku = normalizeSku(f.sku);
      if (sku === "") {
        issue(ctx, "Ingresá el SKU del producto", "sku");
      } else if (!isValidSku(sku)) {
        issue(ctx, "SKU inválido", "sku");
      } else {
        target = { kind: "product", sku };
      }
    } else if (f.target === "category") {
      const id = uuid.safeParse(f.category_id.trim());
      if (id.success) target = { kind: "category", category_id: id.data };
      else issue(ctx, "Elegí una categoría", "category_id");
    } else if (f.target !== "all") {
      issue(ctx, "Elegí a qué productos aplica", "target");
    }

    let priceListId: string | null = null;
    if (f.price_list_id.trim() !== "") {
      const id = uuid.safeParse(f.price_list_id.trim());
      if (id.success) priceListId = id.data;
      else issue(ctx, "Elegí una lista de precios", "price_list_id");
    }

    checkWindow(f.starts_at, f.ends_at, ctx);

    return {
      name: f.name,
      discount_pct: f.discount,
      min_qty: f.min_qty,
      target,
      price_list_id: priceListId,
      starts_at: f.starts_at,
      ends_at: f.ends_at,
    };
  });

export type PromotionInput = z.output<typeof promotionFormSchema>;

export const couponFormSchema = z
  .object({
    code: z
      .string()
      .trim()
      .transform((v) => v.toUpperCase())
      .pipe(
        z
          .string()
          .regex(
            /^[A-Z0-9_-]{3,30}$/,
            "De 3 a 30 caracteres: letras sin tilde, números, guion o guion bajo",
          ),
      ),
    discount: percentage,
    min_order: z.string().transform((v, ctx) => {
      if (v.trim() === "") return 0;
      const n = parseArsAmount(v.trim());
      if (
        n === null ||
        !Number.isFinite(n) ||
        n >= AMOUNT_LIMIT ||
        !hasAtMostTwoDecimals(n)
      ) {
        ctx.issues.push({
          code: "custom",
          message: "Importe inválido",
          input: v,
        });
        return z.NEVER;
      }
      return Math.round(n * 100) / 100;
    }),
    max_uses: z.string().transform((v, ctx) => {
      const t = v.trim();
      if (t === "") return null;
      const n = /^\d+$/.test(t) ? Number(t) : NaN;
      if (!Number.isInteger(n) || n < 1 || n > MAX_USES_LIMIT) {
        ctx.issues.push({
          code: "custom",
          message: "Ingresá un número entero de 1 o más, o dejalo vacío",
          input: v,
        });
        return z.NEVER;
      }
      return n;
    }),
    starts_at: optionalDate,
    ends_at: optionalDate,
  })
  .transform((f, ctx) => {
    checkWindow(f.starts_at, f.ends_at, ctx);
    return {
      code: f.code,
      discount_pct: f.discount,
      min_order_net: f.min_order,
      max_uses: f.max_uses,
      starts_at: f.starts_at,
      ends_at: f.ends_at,
    };
  });

export type CouponInput = z.output<typeof couponFormSchema>;

export type FormResult<T> =
  { ok: true; data: T } | { ok: false; errors: Record<string, string> };

function run<T>(
  schema: z.ZodType<T>,
  raw: Record<string, string>,
): FormResult<T> {
  const parsed = schema.safeParse(raw);
  if (parsed.success) return { ok: true, data: parsed.data };
  const errors: Record<string, string> = {};
  for (const i of parsed.error.issues) {
    errors[String(i.path[0] ?? "form")] ??= i.message;
  }
  return { ok: false, errors };
}

export type PromotionFormValues = {
  name: string;
  discount: string;
  min_qty: string;
  target: string;
  sku: string;
  category_id: string;
  price_list_id: string;
  starts_at: string;
  ends_at: string;
};

export type CouponFormValues = {
  code: string;
  discount: string;
  min_order: string;
  max_uses: string;
  starts_at: string;
  ends_at: string;
};

export function parsePromotionForm(
  raw: PromotionFormValues,
): FormResult<PromotionInput> {
  return run<PromotionInput>(promotionFormSchema, raw);
}

export function parseCouponForm(
  raw: CouponFormValues,
): FormResult<CouponInput> {
  return run<CouponInput>(couponFormSchema, raw);
}
