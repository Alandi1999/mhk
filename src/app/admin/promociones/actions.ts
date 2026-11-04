"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireProfile } from "@/lib/auth/session";
import {
  parsePromotionForm,
  type PromotionFormValues,
} from "@/lib/promotions/schemas";
import { createClient } from "@/lib/supabase/server";

export interface PromotionFormState {
  error?: string;
  fieldErrors?: Record<string, string>;
  /** Raw submitted values, so the form keeps what the admin typed. */
  values?: PromotionFormValues;
}

const idSchema = z.uuid();
const LIST_PATH = "/admin/promociones";

function text(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

export async function savePromotion(
  _prev: PromotionFormState,
  formData: FormData,
): Promise<PromotionFormState> {
  await requireProfile({ role: "admin" });

  const values: PromotionFormValues = {
    name: text(formData, "name"),
    discount: text(formData, "discount"),
    min_qty: text(formData, "min_qty"),
    target: text(formData, "target"),
    sku: text(formData, "sku"),
    category_id: text(formData, "category_id"),
    price_list_id: text(formData, "price_list_id"),
    starts_at: text(formData, "starts_at"),
    ends_at: text(formData, "ends_at"),
  };
  const rawId = text(formData, "id");
  const id = rawId ? idSchema.safeParse(rawId) : null;
  if (id && !id.success) return { error: "Promoción inválida.", values };

  const parsed = parsePromotionForm(values);
  if (!parsed.ok) return { fieldErrors: parsed.errors, values };
  const input = parsed.data;

  const supabase = await createClient();
  let productId: string | null = null;
  if (input.target.kind === "product") {
    const { data: product, error: lookupError } = await supabase
      .from("products")
      .select("id")
      .eq("sku", input.target.sku)
      .maybeSingle();
    if (lookupError) {
      return {
        error: "No se pudo buscar el producto. Probá de nuevo.",
        values,
      };
    }
    if (!product) {
      return {
        fieldErrors: {
          sku: `No existe un producto con SKU ${input.target.sku}`,
        },
        values,
      };
    }
    productId = product.id;
  }

  const row = {
    name: input.name,
    discount_pct: input.discount_pct,
    min_qty: input.min_qty,
    product_id: productId,
    category_id:
      input.target.kind === "category" ? input.target.category_id : null,
    price_list_id: input.price_list_id,
    starts_at: input.starts_at,
    ends_at: input.ends_at,
  };

  const result = id?.success
    ? await supabase
        .from("promotions")
        .update(row)
        .eq("id", id.data)
        .select("id")
    : await supabase.from("promotions").insert(row).select("id");

  // RLS can filter a write out without raising an error; a foreign key error
  // means the category or price list was deleted while the form was open.
  if (result.error || !result.data || result.data.length === 0) {
    return {
      error:
        "No se pudo guardar la promoción. Puede que no tengas permiso, que ya no exista o que la categoría o la lista elegida se haya eliminado. Recargá e intentá de nuevo.",
      values,
    };
  }

  revalidatePath(LIST_PATH);
  redirect(`${LIST_PATH}?ok=${id?.success ? "guardada" : "creada"}`);
}

export async function togglePromotion(formData: FormData): Promise<void> {
  await requireProfile({ role: "admin" });
  const id = idSchema.safeParse(text(formData, "id"));
  const active = text(formData, "active");
  if (!id.success || (active !== "true" && active !== "false")) {
    redirect(`${LIST_PATH}?error=invalida`);
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("promotions")
    .update({ active: active === "true" })
    .eq("id", id.data)
    .select("id");
  if (error || !data || data.length === 0) {
    redirect(`${LIST_PATH}?error=no-actualizada`);
  }

  revalidatePath(LIST_PATH);
  redirect(`${LIST_PATH}?ok=${active === "true" ? "activada" : "desactivada"}`);
}

export async function deletePromotion(formData: FormData): Promise<void> {
  await requireProfile({ role: "admin" });
  const id = idSchema.safeParse(text(formData, "id"));
  if (!id.success) redirect(`${LIST_PATH}?error=invalida`);

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("promotions")
    .delete()
    .eq("id", id.data)
    .select("id");
  if (error || !data || data.length === 0) {
    redirect(`${LIST_PATH}?error=no-borrada`);
  }

  revalidatePath(LIST_PATH);
  redirect(`${LIST_PATH}?ok=eliminada`);
}
