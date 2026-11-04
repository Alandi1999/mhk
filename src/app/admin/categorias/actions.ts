"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

const nameSchema = z.string().trim().min(1).max(80);
const idSchema = z.uuid();

const BACK = "/admin/categorias";
const back = (error?: string) => (error ? `${BACK}?error=${error}` : BACK);

// Postgres error codes: unique_violation, foreign_key_violation.
const UNIQUE = "23505";
const FOREIGN_KEY = "23503";

export async function createCategory(formData: FormData): Promise<void> {
  await requireProfile({ role: "admin" });
  const name = nameSchema.safeParse(formData.get("name"));
  if (!name.success) redirect(back("invalido"));

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("categories")
    .insert({ name: name.data })
    .select("id");
  if (error?.code === UNIQUE) redirect(back("duplicada"));
  if (error || !data || data.length === 0) redirect(back("no-guardado"));

  revalidatePath(BACK);
  redirect(back());
}

export async function renameCategory(formData: FormData): Promise<void> {
  await requireProfile({ role: "admin" });
  const id = idSchema.safeParse(formData.get("id"));
  const name = nameSchema.safeParse(formData.get("name"));
  if (!id.success || !name.success) redirect(back("invalido"));

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("categories")
    .update({ name: name.data })
    .eq("id", id.data)
    .select("id");
  if (error?.code === UNIQUE) redirect(back("duplicada"));
  if (error || !data || data.length === 0) redirect(back("no-guardado"));

  revalidatePath(BACK);
  redirect(back());
}

export async function deleteCategory(formData: FormData): Promise<void> {
  await requireProfile({ role: "admin" });
  const id = idSchema.safeParse(formData.get("id"));
  if (!id.success) redirect(back("invalido"));

  const supabase = await createClient();
  // products.category_id is `on delete restrict`: in-use categories fail.
  const { data, error } = await supabase
    .from("categories")
    .delete()
    .eq("id", id.data)
    .select("id");
  if (error?.code === FOREIGN_KEY) redirect(back("en-uso"));
  if (error || !data || data.length === 0) redirect(back("no-guardado"));

  revalidatePath(BACK);
  redirect(back());
}
