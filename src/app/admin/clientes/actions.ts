"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

const decisionSchema = z.object({
  id: z.uuid(),
  status: z.enum(["approved", "rejected"]),
});

const filterSchema = z.enum(["pending", "approved", "rejected"]);

async function decide(status: "approved" | "rejected", formData: FormData) {
  // Server actions are public endpoints: always re-check admin here.
  const admin = await requireProfile({ role: "admin" });

  const parsed = decisionSchema.safeParse({ id: formData.get("id"), status });
  const estado = filterSchema.catch("pending").parse(formData.get("estado"));
  const back = (error?: string) =>
    `/admin/clientes?estado=${estado}${error ? `&error=${error}` : ""}`;

  if (!parsed.success) redirect(back("invalido"));
  // An admin must not lock themselves out.
  if (parsed.data.id === admin.id) redirect(back("propio"));

  const supabase = await createClient();
  // RLS (profiles_update_admin) is the final authority on this write. It can
  // filter the row out without raising an error, so also check that a row
  // was actually updated.
  const { data, error } = await supabase
    .from("profiles")
    .update({ status: parsed.data.status })
    .eq("id", parsed.data.id)
    .select("id");

  if (error || !data || data.length === 0) redirect(back("no-actualizado"));

  revalidatePath("/admin/clientes");
  redirect(back());
}

export async function approveClient(formData: FormData): Promise<void> {
  await decide("approved", formData);
}

export async function rejectClient(formData: FormData): Promise<void> {
  await decide("rejected", formData);
}
