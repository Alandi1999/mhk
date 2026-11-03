import type { Metadata } from "next";
import { RegisterForm } from "@/components/auth/register-form";

export const metadata: Metadata = { title: "Registro | MHK Moto Repuestos" };

export default function RegisterPage() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-6 p-6">
      <h1 className="text-2xl font-bold">Crear cuenta</h1>
      <p className="text-sm text-muted-foreground">
        Tienda mayorista: validamos los datos de cada comercio antes de
        habilitar el acceso.
      </p>
      <RegisterForm />
    </main>
  );
}
