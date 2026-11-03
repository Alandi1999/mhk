import Link from "next/link";
import { AuthShell } from "@/components/shell/auth-shell";
import { buttonVariants } from "@/components/ui/button";

export default function Home() {
  return (
    <AuthShell>
      <h1 className="font-display-wide text-3xl text-ink">
        MHK Moto Repuestos
      </h1>
      <p className="text-ink-muted">
        Tienda mayorista para talleres y locales de repuestos de motos. Ingresá
        con tu cuenta o pedí el alta de tu comercio.
      </p>
      <div className="flex flex-col gap-3 sm:flex-row">
        <Link href="/login" className={buttonVariants({ size: "lg" })}>
          Ingresar
        </Link>
        <Link
          href="/registro"
          className={buttonVariants({ size: "lg", variant: "outline" })}
        >
          Crear cuenta
        </Link>
      </div>
    </AuthShell>
  );
}
