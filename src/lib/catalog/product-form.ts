import { z } from "zod";
import { productInputSchema } from "./schemas";

export type ProductFormValues = {
  sku: string;
  name: string;
  description: string | null;
  brand: string | null;
  category_id: string | null;
  base_price: number;
  vat_rate: number;
  active: boolean;
};

export type ProductFormResult =
  | { ok: true; data: ProductFormValues }
  | { ok: false; errors: Record<string, string> };

const categoryId = z
  .union([z.uuid("Categoría inválida"), z.literal("")])
  .transform((v) => (v === "" ? null : v));

type RawForm = Record<string, FormDataEntryValue | null | undefined>;

/**
 * Validates the admin product form. Unlike the CSV flow (which names the
 * category), the form picks a category by id. Returns one message per field.
 */
export function parseProductForm(raw: RawForm): ProductFormResult {
  const base = productInputSchema.safeParse({
    sku: raw.sku ?? "",
    name: raw.name ?? "",
    description: raw.description ?? "",
    brand: raw.brand ?? "",
    price: raw.price ?? "",
    vat: raw.vat ?? "",
    // HTML checkboxes are only submitted when checked.
    active: Boolean(raw.active),
  });
  const category = categoryId.safeParse(raw.category_id ?? "");

  const errors: Record<string, string> = {};
  if (!base.success) {
    for (const issue of base.error.issues) {
      const field = String(issue.path[0] ?? "form");
      errors[field] ??= issue.message;
    }
  }
  if (!category.success) errors.category_id = "Categoría inválida";
  if (!base.success || !category.success) return { ok: false, errors };

  const { category: _unused, ...rest } = base.data;
  void _unused;
  return { ok: true, data: { ...rest, category_id: category.data } };
}
