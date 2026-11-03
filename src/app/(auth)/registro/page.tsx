import type { Metadata } from "next";
import { RegisterForm } from "@/components/auth/register-form";
import { AuthShell } from "@/components/shell/auth-shell";

export const metadata: Metadata = { title: "Registro | MHK Moto Repuestos" };

export default function RegisterPage() {
  return (
    <AuthShell width="md">
      <div className="flex flex-col gap-2">
        <h1 className="font-display-wide text-3xl text-ink">Crear cuenta</h1>
        <p className="max-w-[65ch] text-sm text-ink-muted">
          Tienda mayorista: validamos los datos de cada comercio antes de
          habilitar el acceso.
        </p>
      </div>
      <RegisterForm />
    </AuthShell>
  );
}
