"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

const idSchema = z.uuid();
const advanceSchema = z.object({
  id: z.uuid(),
  to: z.enum(["confirmed", "preparing", "shipped", "delivered"]),
});
const REASON_MAX = 500;

function text(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function done(id: string, flag: { ok: string } | { error: string }): never {
  revalidatePath("/admin/pedidos");
  revalidatePath(`/admin/pedidos/${id}`);
  revalidatePath("/admin/stock");
  const usp = new URLSearchParams(flag);
  redirect(`/admin/pedidos/${id}?${usp.toString()}`);
}

/** Moves an order one step forward. The database enforces the flow (MH005). */
export async function advanceOrder(formData: FormData): Promise<void> {
  // Server actions are public endpoints: always re-check admin here.
  await requireProfile({ role: "admin" });

  const parsed = advanceSchema.safeParse({
    id: text(formData, "id"),
    to: text(formData, "to"),
  });
  if (!parsed.success) redirect("/admin/pedidos");

  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_set_order_status", {
    p_order_id: parsed.data.id,
    p_status: parsed.data.to,
  });
  if (error) done(parsed.data.id, { error: error.code ?? "unknown" });
  done(parsed.data.id, { ok: "avanzado" });
}

/** Cancels an order and returns its stock (cancel_order does both). */
export async function cancelOrderAsAdmin(formData: FormData): Promise<void> {
  await requireProfile({ role: "admin" });

  const id = idSchema.safeParse(text(formData, "id"));
  if (!id.success) redirect("/admin/pedidos");
  const reason = text(formData, "reason").trim();
  if (reason.length > REASON_MAX) done(id.data, { error: "reason-long" });

  const supabase = await createClient();
  const { error } = await supabase.rpc("cancel_order", {
    p_order_id: id.data,
    p_reason: reason === "" ? undefined : reason,
  });
  if (error) done(id.data, { error: error.code ?? "unknown" });
  done(id.data, { ok: "cancelado" });
}
