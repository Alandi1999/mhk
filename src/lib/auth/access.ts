export type Role = "admin" | "cliente";
export type AccountStatus = "pending" | "approved" | "rejected";

export interface AccessInput {
  pathname: string;
  /** Query string including the leading "?" (kept in the `next` param). */
  search?: string;
  user: { id: string } | null;
  profile: { role: Role; status: AccountStatus } | null;
}

export type AccessDecision =
  { type: "allow" } | { type: "redirect"; to: string };

export const PENDING_PATH = "/cuenta/pendiente";

const AUTH_PAGES = ["/login", "/registro"];

function isUnder(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

export function homeFor(role: Role): string {
  return role === "admin" ? "/admin" : "/tienda";
}

const allow: AccessDecision = { type: "allow" };
const redirect = (to: string): AccessDecision => ({ type: "redirect", to });

/**
 * Pure access policy shared by the proxy. Layouts re-check on the server
 * (see `requireProfile`) as defense in depth.
 */
export function resolveAccess({
  pathname,
  search = "",
  user,
  profile,
}: AccessInput): AccessDecision {
  const isAdminArea = isUnder(pathname, "/admin");
  const isShopArea = isUnder(pathname, "/tienda");
  const isAccountArea = isUnder(pathname, "/cuenta");
  const isAuthPage = AUTH_PAGES.includes(pathname);
  const isProtected = isAdminArea || isShopArea || isAccountArea;

  if (!user) {
    if (!isProtected) return allow;
    return redirect(`/login?next=${encodeURIComponent(pathname + search)}`);
  }

  const approved = profile?.status === "approved";
  if (!profile || !approved) {
    // Missing profile counts as not approved: nothing but the waiting room.
    if (isAuthPage || isAdminArea || isShopArea) return redirect(PENDING_PATH);
    return allow;
  }

  const home = homeFor(profile.role);
  if (isAuthPage || isAccountArea) return redirect(home);
  if (isAdminArea && profile.role !== "admin") return redirect(home);
  // Approved admins may also enter /tienda.
  return allow;
}
