"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireProfile } from "@/lib/auth/session";
import {
  NOTE_MAX,
  isManualReason,
  parseDelta,
  type StockReason,
} from "@/lib/catalog/stock";
import { createClient } from "@/lib/supabase/server";

export interface MovementFormState {
  error?: string;
  fieldErrors?: Record<string, string>;
  /** Submitted values, kept when validation or the write fails. */
  values?: { reason: string; quantity: string; note: string };
}

const idSchema = z.uuid();
// Postgres check_violation: the ledger trigger refused a negative stock.
const CHECK_VIOLATION = "23514";

function text(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

export async function recordMovement(
  _prev: MovementFormState,
  formData: FormData,
): Promise<MovementFormState> {
  await requireProfile({ role: "admin" });

  const values = {
    reason: text(formData, "reason"),
    quantity: text(formData, "quantity"),
    note: text(formData, "note"),
  };
  const productId = idSchema.safeParse(text(formData, "product_id"));
  if (!productId.success) return { error: "Producto inválido.", values };

  const fieldErrors: Record<string, string> = {};
  if (!isManualReason(values.reason)) fieldErrors.reason = "Elegí un motivo";
  const delta = parseDelta(values.reason as StockReason, values.quantity);
  if (!delta.ok && !fieldErrors.reason) fieldErrors.quantity = delta.error;
  const note = values.note.trim();
  if (note.length > NOTE_MAX) {
    fieldErrors.note = `Máximo ${NOTE_MAX} caracteres`;
  }
  if (Object.keys(fieldErrors).length > 0 || !delta.ok) {
    return { fieldErrors, values };
  }

  const supabase = await createClient();
  // The ledger is the only way stock changes: a trigger updates stock_on_hand.
  const { error } = await supabase.from("stock_movements").insert({
    product_id: productId.data,
    delta: delta.delta,
    reason: values.reason as StockReason,
    note: note === "" ? null : note,
  });

  if (error?.code === CHECK_VIOLATION) {
    return {
      fieldErrors: { quantity: "El stock no puede quedar negativo" },
      values,
    };
  }
  if (error) {
    return {
      error:
        "No se pudo registrar el movimiento. Puede que no tengas permiso o que el producto ya no exista. Recargá e intentá de nuevo.",
      values,
    };
  }

  revalidatePath("/admin/stock");
  revalidatePath(`/admin/stock/${productId.data}`);
  revalidatePath("/admin/productos");
  redirect(`/admin/stock/${productId.data}?ok=registrado`);
}
