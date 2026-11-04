"use server";

import { revalidatePath } from "next/cache";
import { requireProfile } from "@/lib/auth/session";
import { parseArsAmount } from "@/lib/catalog/money";
import { createClient } from "@/lib/supabase/server";

export interface SettingsFormState {
  error?: string;
  saved?: boolean;
  /** Submitted value, kept when validation or the write fails. */
  value?: string;
}

// numeric(14, 2) in the database; keep well inside it.
const MAX_AMOUNT = 999_999_999;

export async function saveMinOrder(
  _prev: SettingsFormState,
  formData: FormData,
): Promise<SettingsFormState> {
  // Server actions are public endpoints: always re-check admin here.
  await requireProfile({ role: "admin" });

  const raw = formData.get("min_order_net");
  const value = typeof raw === "string" ? raw : "";
  // Empty is treated as "no minimum".
  const amount = value.trim() === "" ? 0 : parseArsAmount(value);
  if (amount === null) {
    return { error: "Ingresá un monto válido, por ejemplo 150000.", value };
  }
  if (amount > MAX_AMOUNT) {
    return { error: "El monto es demasiado grande.", value };
  }

  const supabase = await createClient();
  // RLS (settings_update_admin) is the final authority and can filter the row
  // out without an error, so also check that a row was updated.
  const { data, error } = await supabase
    .from("settings")
    .update({ min_order_net: Math.round(amount * 100) / 100 })
    .eq("id", true)
    .select("id");
  if (error || !data || data.length === 0) {
    return {
      error:
        "No se pudo guardar. Puede que no tengas permiso. Recargá e intentá de nuevo.",
      value,
    };
  }

  revalidatePath("/admin/configuracion");
  revalidatePath("/tienda/carrito");
  return { saved: true };
}
