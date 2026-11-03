"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { homeFor, PENDING_PATH } from "./access";
import { loginSchema, registerSchema } from "./schemas";
import { safeNextPath } from "./safe-next";

export interface FormState {
  /** Form-level error message (Spanish, user facing). */
  error?: string;
  /** Per-field messages keyed by field name. */
  fieldErrors?: Record<string, string>;
  /** Registration succeeded but there is no session yet (email confirmation on). */
  registered?: boolean;
}

function fieldErrors(
  issues: { path: PropertyKey[]; message: string }[],
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of issues) {
    const key = String(issue.path[0] ?? "form");
    out[key] ??= issue.message;
  }
  return out;
}

function text(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

export async function login(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = loginSchema.safeParse({
    email: text(formData, "email"),
    password: text(formData, "password"),
  });
  if (!parsed.success) {
    return { fieldErrors: fieldErrors(parsed.error.issues) };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error || !data.user) {
    return { error: "Email o contraseña incorrectos." };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, status")
    .eq("id", data.user.id)
    .maybeSingle();

  if (!profile || profile.status !== "approved") redirect(PENDING_PATH);

  // `next` comes from the client: only same-origin relative paths pass.
  redirect(
    safeNextPath(text(formData, "next"), homeFor(profile.role)) as string,
  );
}

export async function register(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = registerSchema.safeParse({
    email: text(formData, "email"),
    password: text(formData, "password"),
    razon_social: text(formData, "razon_social"),
    cuit: text(formData, "cuit"),
    tax_condition: text(formData, "tax_condition"),
    phone: text(formData, "phone"),
  });
  if (!parsed.success) {
    return { fieldErrors: fieldErrors(parsed.error.issues) };
  }

  const { email, password, ...metadata } = parsed.data;
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: metadata },
  });

  if (error) {
    if (error.code === "weak_password") {
      return {
        fieldErrors: { password: "La contraseña es demasiado débil." },
      };
    }
    if (error.code === "over_request_rate_limit" || error.status === 429) {
      return { error: "Demasiados intentos. Probá de nuevo en unos minutos." };
    }
    // Deliberately generic: an invalid/duplicate CUIT surfaces as a generic
    // "Database error saving new user", and we do not reveal whether an email
    // is already registered.
    return {
      error:
        "No pudimos crear la cuenta. Revisá el CUIT (puede estar ya registrado) y los datos.",
    };
  }

  // Email confirmations off (local default): the session is already active.
  if (data.session) redirect(PENDING_PATH);
  return { registered: true };
}

export async function logout(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
