"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

const idSchema = z.uuid();
const reasonSchema = z.string().trim().max(500);

/** Owner cancels a pending order; cancel_order() re-checks owner and state. */
export async function cancelOrder(formData: FormData): Promise<void> {
  await requireProfile({ role: "cliente" });
  const id = idSchema.safeParse(formData.get("order_id"));
  if (!id.success) redirect("/tienda/pedidos");
  const detail = `/tienda/pedidos/${id.data}`;
  const reason = reasonSchema.safeParse(formData.get("reason") ?? "");
  if (!reason.success) redirect(`${detail}?error=motivo`);

  const supabase = await createClient();
  const { error } = await supabase.rpc("cancel_order", {
    p_order_id: id.data,
    p_reason: reason.data,
  });
  if (error) {
    const code = /^[A-Za-z0-9]{5}$/.test(error.code) ? error.code : "x";
    redirect(`${detail}?error=${code}`);
  }

  revalidatePath("/tienda", "layout");
  redirect(`${detail}?cancelado=1`);
}
