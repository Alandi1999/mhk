import "server-only";
import { cache } from "react";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { homeFor, PENDING_PATH, type AccountStatus, type Role } from "./access";

export interface ProfileSummary {
  role: Role;
  status: AccountStatus;
  razon_social: string | null;
}

export interface Session {
  id: string;
  email: string | undefined;
  profile: ProfileSummary | null;
}

export type ApprovedSession = Omit<Session, "profile"> & ProfileSummary;

/**
 * Verified user + profile for the current request (null when anonymous).
 * Uses `getUser()`, which validates the token against the Auth server, so it
 * is safe for authorization decisions.
 */
export const getSession = cache(async (): Promise<Session | null> => {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, status, razon_social")
    .eq("id", data.user.id)
    .maybeSingle();

  return { id: data.user.id, email: data.user.email, profile };
});

/**
 * Server-side guard (defense in depth; the proxy is not the only check).
 * - `role: "admin"`: approved admins only (others get notFound()).
 * - `role: "cliente"`: shop access, i.e. approved clients and approved admins.
 * Anonymous -> /login, not approved or no profile -> /cuenta/pendiente.
 */
export async function requireProfile({
  role,
}: {
  role: Role;
}): Promise<ApprovedSession> {
  const session = await getSession();
  if (!session) redirect("/login");
  const { profile } = session;
  if (!profile || profile.status !== "approved") redirect(PENDING_PATH);
  if (role === "admin" && profile.role !== "admin") notFound();
  if (
    role === "cliente" &&
    profile.role !== "cliente" &&
    profile.role !== "admin"
  ) {
    redirect(homeFor(profile.role));
  }
  return { id: session.id, email: session.email, ...profile };
}
