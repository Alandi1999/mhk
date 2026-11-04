"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireProfile } from "@/lib/auth/session";
import {
  parsePriceListForm,
  priceItemInputSchema,
} from "@/lib/pricing/schemas";
import { createClient } from "@/lib/supabase/server";
import {
  ImportFailure,
  importPriceItems,
  type ItemsReport,
} from "./run-import";
import { MAX_CSV_BYTES } from "@/lib/catalog/csv";

export interface ListFormState {
  error?: string;
  fieldErrors?: Record<string, string>;
  /** Raw submitted values, so the form keeps what the admin typed. */
  values?: Record<string, string>;
}

export interface ItemFormState {
  error?: string;
  fieldErrors?: Record<string, string>;
  values?: Record<string, string>;
  saved?: boolean;
}

export interface ItemsImportState {
  error?: string;
  report?: ItemsReport;
}

const UNIQUE_VIOLATION = "23505";
const FOREIGN_KEY_VIOLATION = "23503";
const idSchema = z.uuid();
const LIST_PATH = "/admin/listas-de-precios";

function text(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

export async function saveList(
  _prev: ListFormState,
  formData: FormData,
): Promise<ListFormState> {
  await requireProfile({ role: "admin" });

  const values = {
    name: text(formData, "name"),
    discount: text(formData, "discount"),
  };
  const rawId = text(formData, "id");
  const id = rawId ? idSchema.safeParse(rawId) : null;
  if (id && !id.success) return { error: "Lista inválida.", values };

  const parsed = parsePriceListForm(values);
  if (!parsed.ok) return { fieldErrors: parsed.errors, values };

  const supabase = await createClient();
  const result = id?.success
    ? await supabase
        .from("price_lists")
        .update(parsed.data)
        .eq("id", id.data)
        .select("id")
    : await supabase.from("price_lists").insert(parsed.data).select("id");

  if (result.error?.code === UNIQUE_VIOLATION) {
    return {
      fieldErrors: { name: "Ya existe una lista con ese nombre" },
      values,
    };
  }
  // RLS can filter a write out without raising an error.
  if (result.error || !result.data || result.data.length === 0) {
    return {
      error:
        "No se pudo guardar la lista. Puede que no tengas permiso o que ya no exista. Recargá e intentá de nuevo.",
      values,
    };
  }

  revalidatePath(LIST_PATH);
  redirect(
    `${LIST_PATH}/${result.data[0].id}?ok=${id?.success ? "guardada" : "creada"}`,
  );
}

export async function deleteList(formData: FormData): Promise<void> {
  await requireProfile({ role: "admin" });
  const id = idSchema.safeParse(text(formData, "id"));
  if (!id.success) redirect(`${LIST_PATH}?error=invalida`);

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("price_lists")
    .delete()
    .eq("id", id.data)
    .select("id");

  // profiles.price_list_id is ON DELETE RESTRICT.
  if (error?.code === FOREIGN_KEY_VIOLATION) {
    redirect(`${LIST_PATH}?error=asignada`);
  }
  if (error || !data || data.length === 0) {
    redirect(`${LIST_PATH}?error=no-borrada`);
  }

  revalidatePath(LIST_PATH);
  redirect(`${LIST_PATH}?ok=eliminada`);
}

export async function saveItem(
  _prev: ItemFormState,
  formData: FormData,
): Promise<ItemFormState> {
  await requireProfile({ role: "admin" });

  const values = { sku: text(formData, "sku"), price: text(formData, "price") };
  const listId = idSchema.safeParse(text(formData, "list_id"));
  if (!listId.success) return { error: "Lista inválida.", values };

  const parsed = priceItemInputSchema.safeParse(values);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      fieldErrors[String(issue.path[0] ?? "sku")] ??= issue.message;
    }
    return { fieldErrors, values };
  }

  const supabase = await createClient();
  const { data: product, error: lookupError } = await supabase
    .from("products")
    .select("id")
    .eq("sku", parsed.data.sku)
    .maybeSingle();
  if (lookupError) {
    return { error: "No se pudo buscar el producto. Probá de nuevo.", values };
  }
  if (!product) {
    return {
      fieldErrors: { sku: `No existe un producto con SKU ${parsed.data.sku}` },
      values,
    };
  }

  const { data, error } = await supabase
    .from("price_list_items")
    .upsert(
      {
        price_list_id: listId.data,
        product_id: product.id,
        price: parsed.data.price,
      },
      { onConflict: "price_list_id,product_id" },
    )
    .select("product_id");
  if (error || !data || data.length === 0) {
    return {
      error:
        "No se pudo guardar el precio. Puede que no tengas permiso o que la lista ya no exista.",
      values,
    };
  }

  revalidatePath(`${LIST_PATH}/${listId.data}`);
  return { saved: true };
}

export async function removeItem(formData: FormData): Promise<void> {
  await requireProfile({ role: "admin" });
  const listId = idSchema.safeParse(text(formData, "list_id"));
  const productId = idSchema.safeParse(text(formData, "product_id"));
  if (!listId.success) redirect(LIST_PATH);
  if (!productId.success) redirect(`${LIST_PATH}/${listId.data}?error=quitar`);

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("price_list_items")
    .delete()
    .eq("price_list_id", listId.data)
    .eq("product_id", productId.data)
    .select("product_id");
  if (error || !data || data.length === 0) {
    redirect(`${LIST_PATH}/${listId.data}?error=quitar`);
  }

  revalidatePath(`${LIST_PATH}/${listId.data}`);
  redirect(`${LIST_PATH}/${listId.data}?ok=quitado`);
}

export async function runItemsImport(
  _prev: ItemsImportState,
  formData: FormData,
): Promise<ItemsImportState> {
  await requireProfile({ role: "admin" });

  const listId = idSchema.safeParse(text(formData, "list_id"));
  if (!listId.success) return { error: "Lista inválida." };
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Elegí un archivo CSV para subir." };
  }
  if (file.size > MAX_CSV_BYTES) {
    return { error: "El archivo supera el máximo de 2 MB." };
  }
  const apply = formData.get("intent") === "importar";

  try {
    const supabase = await createClient();
    const report = await importPriceItems(
      supabase,
      listId.data,
      await file.text(),
      apply,
    );
    if (apply) revalidatePath(`${LIST_PATH}/${listId.data}`);
    return { report };
  } catch (error) {
    if (error instanceof ImportFailure) return { error: error.message };
    return { error: "No se pudo procesar el archivo. Probá de nuevo." };
  }
}
