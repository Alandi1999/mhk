"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

const decisionSchema = z.object({
  id: z.uuid(),
  status: z.enum(["approved", "rejected"]),
});

async function decide(status: "approved" | "rejected", formData: FormData) {
  // Server actions are public endpoints: always re-check admin here.
  const admin = await requireProfile({ role: "admin" });

  const parsed = decisionSchema.safeParse({ id: formData.get("id"), status });
  if (!parsed.success) return;
  // An admin must not lock themselves out.
  if (parsed.data.id === admin.id) return;

  const supabase = await createClient();
  // RLS (profiles_update_admin) is the final authority on this write.
  await supabase
    .from("profiles")
    .update({ status: parsed.data.status })
    .eq("id", parsed.data.id);

  revalidatePath("/admin/clientes");
}

export async function approveClient(formData: FormData): Promise<void> {
  await decide("approved", formData);
}

export async function rejectClient(formData: FormData): Promise<void> {
  await decide("rejected", formData);
}
