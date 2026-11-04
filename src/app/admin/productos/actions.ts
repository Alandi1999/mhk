"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireProfile } from "@/lib/auth/session";
import { parseCompatibility } from "@/lib/catalog/compatibility";
import {
  IMAGE_BUCKET,
  IMAGE_EXTENSIONS,
  MAX_IMAGE_BYTES,
} from "@/lib/catalog/images";
import { parseProductForm } from "@/lib/catalog/product-form";
import { createClient } from "@/lib/supabase/server";

export interface ProductFormState {
  /** Form-level error message (Spanish, user facing). */
  error?: string;
  fieldErrors?: Record<string, string>;
  /** Raw submitted values, so the form keeps what the admin typed. */
  values?: Record<string, string>;
}

export interface CompatibilityState {
  error?: string;
  /** Per-line problems from the parser. */
  lineErrors?: { line: number; message: string }[];
  saved?: boolean;
  /** Submitted text, kept when validation or the write fails. */
  text?: string;
}

const UNIQUE_VIOLATION = "23505";
const idSchema = z.uuid();

function text(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

const FORM_KEYS = [
  "sku",
  "name",
  "description",
  "brand",
  "category_id",
  "price",
  "vat",
] as const;

export async function saveProduct(
  _prev: ProductFormState,
  formData: FormData,
): Promise<ProductFormState> {
  await requireProfile({ role: "admin" });

  const values: Record<string, string> = Object.fromEntries(
    FORM_KEYS.map((k) => [k, text(formData, k)]),
  );
  if (formData.get("active")) values.active = "on";

  const rawId = text(formData, "id");
  const id = rawId ? idSchema.safeParse(rawId) : null;
  if (id && !id.success) return { error: "Producto inválido.", values };

  const parsed = parseProductForm({
    ...values,
    active: formData.get("active"),
  });
  if (!parsed.ok) return { fieldErrors: parsed.errors, values };

  const supabase = await createClient();
  // stock_on_hand is never written here: only the stock ledger changes it.
  const result = id?.success
    ? await supabase
        .from("products")
        .update(parsed.data)
        .eq("id", id.data)
        .select("id")
    : await supabase.from("products").insert(parsed.data).select("id");

  if (result.error?.code === UNIQUE_VIOLATION) {
    return {
      fieldErrors: { sku: "Ya existe un producto con ese SKU" },
      values,
    };
  }
  // RLS can filter a write out without raising an error.
  if (result.error || !result.data || result.data.length === 0) {
    return {
      error:
        "No se pudo guardar el producto. Puede que no tengas permiso o que ya no exista. Recargá e intentá de nuevo.",
      values,
    };
  }

  revalidatePath("/admin/productos");
  redirect(`/admin/productos/${result.data[0].id}?ok=guardado`);
}

export async function saveCompatibility(
  _prev: CompatibilityState,
  formData: FormData,
): Promise<CompatibilityState> {
  await requireProfile({ role: "admin" });

  const submitted = text(formData, "compatibility");
  const productId = idSchema.safeParse(text(formData, "product_id"));
  if (!productId.success)
    return { error: "Producto inválido.", text: submitted };

  const { entries, errors } = parseCompatibility(submitted);
  if (errors.length > 0) {
    return {
      error: "Corregí las líneas marcadas y volvé a guardar.",
      lineErrors: errors,
      text: submitted,
    };
  }

  const supabase = await createClient();
  const fail = (error: string): CompatibilityState => ({
    error,
    text: submitted,
  });

  const { data: previous, error: readError } = await supabase
    .from("product_compatibility")
    .select("moto_brand, moto_model, year_from, year_to")
    .eq("product_id", productId.data);
  if (readError) return fail("No se pudo leer la compatibilidad actual.");

  // Replace = delete + insert. Not atomic, so a failed insert restores the
  // previous rows (best effort) instead of leaving the product empty.
  const { error: deleteError } = await supabase
    .from("product_compatibility")
    .delete()
    .eq("product_id", productId.data);
  if (deleteError) return fail("No se pudo actualizar la compatibilidad.");

  if (entries.length > 0) {
    const { error: insertError } = await supabase
      .from("product_compatibility")
      .insert(entries.map((e) => ({ ...e, product_id: productId.data })));
    if (insertError) {
      if (previous.length > 0) {
        await supabase
          .from("product_compatibility")
          .insert(previous.map((e) => ({ ...e, product_id: productId.data })));
      }
      return fail(
        `No se pudo guardar la compatibilidad (${insertError.message}). Se mantuvo la anterior.`,
      );
    }
  }

  revalidatePath(`/admin/productos/${productId.data}`);
  return { saved: true, text: submitted };
}

function imageRedirect(productId: string, error?: string): never {
  redirect(
    `/admin/productos/${productId}${error ? `?error=${error}` : ""}#imagenes`,
  );
}

export async function uploadImage(formData: FormData): Promise<void> {
  await requireProfile({ role: "admin" });
  const productId = idSchema.safeParse(text(formData, "product_id"));
  if (!productId.success) redirect("/admin/productos");

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    imageRedirect(productId.data, "imagen-vacia");
  }
  const extension = IMAGE_EXTENSIONS[file.type];
  if (!extension) imageRedirect(productId.data, "imagen-tipo");
  if (file.size > MAX_IMAGE_BYTES) imageRedirect(productId.data, "imagen-peso");

  const supabase = await createClient();
  const path = `${productId.data}/${randomUUID()}.${extension}`;

  const { error: uploadError } = await supabase.storage
    .from(IMAGE_BUCKET)
    .upload(path, file, { contentType: file.type });
  if (uploadError) imageRedirect(productId.data, "imagen-subida");

  const { data: last } = await supabase
    .from("product_images")
    .select("position")
    .eq("product_id", productId.data)
    .order("position", { ascending: false })
    .limit(1);
  const position = last && last.length > 0 ? last[0].position + 1 : 0;

  const { data, error } = await supabase
    .from("product_images")
    .insert({ product_id: productId.data, storage_path: path, position })
    .select("id");
  if (error || !data || data.length === 0) {
    // Do not leave an orphan object behind.
    await supabase.storage.from(IMAGE_BUCKET).remove([path]);
    imageRedirect(productId.data, "imagen-subida");
  }

  revalidatePath(`/admin/productos/${productId.data}`);
  imageRedirect(productId.data);
}

export async function deleteImage(formData: FormData): Promise<void> {
  await requireProfile({ role: "admin" });
  const productId = idSchema.safeParse(text(formData, "product_id"));
  const imageId = idSchema.safeParse(text(formData, "image_id"));
  if (!productId.success) redirect("/admin/productos");
  if (!imageId.success) imageRedirect(productId.data, "imagen-borrar");

  const supabase = await createClient();
  const { data: image } = await supabase
    .from("product_images")
    .select("storage_path")
    .eq("id", imageId.data)
    .eq("product_id", productId.data)
    .maybeSingle();
  if (!image) imageRedirect(productId.data, "imagen-borrar");

  // Object first, then the row: a failure never leaves a row pointing at a
  // missing file that looks fine in the UI.
  const { error: removeError } = await supabase.storage
    .from(IMAGE_BUCKET)
    .remove([image.storage_path]);
  if (removeError) imageRedirect(productId.data, "imagen-borrar");

  const { data, error } = await supabase
    .from("product_images")
    .delete()
    .eq("id", imageId.data)
    .select("id");
  if (error || !data || data.length === 0) {
    imageRedirect(productId.data, "imagen-borrar");
  }

  revalidatePath(`/admin/productos/${productId.data}`);
  imageRedirect(productId.data);
}
