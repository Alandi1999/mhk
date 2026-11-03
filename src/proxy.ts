import { NextResponse, type NextRequest } from "next/server";
import { resolveAccess } from "@/lib/auth/access";
import { updateSession } from "@/lib/supabase/middleware";

export async function proxy(request: NextRequest) {
  const { response, supabase, userId } = await updateSession(request);

  // RLS lets a user read their own profile row.
  const { data: profile } = userId
    ? await supabase
        .from("profiles")
        .select("role, status")
        .eq("id", userId)
        .maybeSingle()
    : { data: null };

  const { pathname, search } = request.nextUrl;
  const decision = resolveAccess({
    pathname,
    search,
    user: userId ? { id: userId } : null,
    profile,
  });

  if (decision.type === "allow") return response;

  const redirect = NextResponse.redirect(new URL(decision.to, request.url));
  // Keep any refreshed session cookies on the redirect.
  response.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
  return redirect;
}

export const config = {
  matcher: [
    // Skip static assets and image optimisation files.
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
