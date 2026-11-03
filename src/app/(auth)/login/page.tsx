import type { Metadata } from "next";
import { LoginForm } from "@/components/auth/login-form";
import { AuthShell } from "@/components/shell/auth-shell";
import { safeNextPath } from "@/lib/auth/safe-next";

export const metadata: Metadata = { title: "Ingresar | MHK Moto Repuestos" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { next } = await searchParams;

  return (
    <AuthShell>
      <h1 className="font-display-wide text-3xl text-ink">Ingresar</h1>
      <LoginForm next={safeNextPath(next)} />
    </AuthShell>
  );
}
