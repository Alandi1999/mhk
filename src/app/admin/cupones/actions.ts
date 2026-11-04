"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireProfile } from "@/lib/auth/session";
import {
  parseCouponForm,
  type CouponFormValues,
} from "@/lib/promotions/schemas";
import { createClient } from "@/lib/supabase/server";

export interface CouponFormState {
  error?: string;
  fieldErrors?: Record<string, string>;
  /** Raw submitted values, so the form keeps what the admin typed. */
  values?: CouponFormValues;
}

const UNIQUE_VIOLATION = "23505";
const idSchema = z.uuid();
const LIST_PATH = "/admin/cupones";

function text(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

export async function saveCoupon(
  _prev: CouponFormState,
  formData: FormData,
): Promise<CouponFormState> {
  await requireProfile({ role: "admin" });

  const values: CouponFormValues = {
    code: text(formData, "code"),
    discount: text(formData, "discount"),
    min_order: text(formData, "min_order"),
    max_uses: text(formData, "max_uses"),
    starts_at: text(formData, "starts_at"),
    ends_at: text(formData, "ends_at"),
  };
  const rawId = text(formData, "id");
  const id = rawId ? idSchema.safeParse(rawId) : null;
  if (id && !id.success) return { error: "Cupón inválido.", values };

  const parsed = parseCouponForm(values);
  if (!parsed.ok) return { fieldErrors: parsed.errors, values };
  // The code never changes after creation: orders keep a copy of it and
  // clients may already have it.
  const { code, ...rest } = parsed.data;

  const supabase = await createClient();
  const result = id?.success
    ? await supabase.from("coupons").update(rest).eq("id", id.data).select("id")
    : await supabase
        .from("coupons")
        .insert({ code, ...rest })
        .select("id");

  if (result.error?.code === UNIQUE_VIOLATION) {
    return {
      fieldErrors: { code: "Ya existe un cupón con ese código" },
      values,
    };
  }
  // RLS can filter a write out without raising an error.
  if (result.error || !result.data || result.data.length === 0) {
    return {
      error:
        "No se pudo guardar el cupón. Puede que no tengas permiso o que ya no exista. Recargá e intentá de nuevo.",
      values,
    };
  }

  revalidatePath(LIST_PATH);
  redirect(`${LIST_PATH}?ok=${id?.success ? "guardado" : "creado"}`);
}

export async function toggleCoupon(formData: FormData): Promise<void> {
  await requireProfile({ role: "admin" });
  const id = idSchema.safeParse(text(formData, "id"));
  const active = text(formData, "active");
  if (!id.success || (active !== "true" && active !== "false")) {
    redirect(`${LIST_PATH}?error=invalido`);
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("coupons")
    .update({ active: active === "true" })
    .eq("id", id.data)
    .select("id");
  if (error || !data || data.length === 0) {
    redirect(`${LIST_PATH}?error=no-actualizado`);
  }

  revalidatePath(LIST_PATH);
  redirect(`${LIST_PATH}?ok=${active === "true" ? "activado" : "desactivado"}`);
}

export async function deleteCoupon(formData: FormData): Promise<void> {
  await requireProfile({ role: "admin" });
  const id = idSchema.safeParse(text(formData, "id"));
  if (!id.success) redirect(`${LIST_PATH}?error=invalido`);

  const supabase = await createClient();
  // Only a coupon nobody has used can go; the filter also guards a race with
  // an order placed after the page loaded.
  const { data, error } = await supabase
    .from("coupons")
    .delete()
    .eq("id", id.data)
    .eq("uses", 0)
    .select("id");
  if (error) redirect(`${LIST_PATH}?error=no-borrado`);
  if (!data || data.length === 0) {
    const { data: still } = await supabase
      .from("coupons")
      .select("uses")
      .eq("id", id.data)
      .maybeSingle();
    redirect(
      `${LIST_PATH}?error=${still && still.uses > 0 ? "usado" : "no-borrado"}`,
    );
  }

  revalidatePath(LIST_PATH);
  redirect(`${LIST_PATH}?ok=eliminado`);
}
