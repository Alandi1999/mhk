import type { Metadata } from "next";
import { LoginForm } from "@/components/auth/login-form";
import { safeNextPath } from "@/lib/auth/safe-next";

export const metadata: Metadata = { title: "Ingresar | MHK Moto Repuestos" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { next } = await searchParams;

  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-6 p-6">
      <h1 className="text-2xl font-bold">Ingresar</h1>
      <LoginForm next={safeNextPath(next)} />
    </main>
  );
}
