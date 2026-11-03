import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LogoutButton } from "@/components/auth/logout-button";
import { AuthShell } from "@/components/shell/auth-shell";
import { StatusBadge } from "@/components/shell/status-badge";
import { getSession } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Cuenta | MHK Moto Repuestos" };

export default async function PendingPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const rejected = session.profile?.status === "rejected";

  return (
    <AuthShell>
      <StatusBadge
        status={rejected ? "rejected" : "pending"}
        className="self-start"
      />
      {rejected ? (
        <>
          <h1 className="font-display-wide text-3xl text-balance text-ink">
            Solicitud rechazada
          </h1>
          <p className="text-ink-muted">
            No pudimos aprobar tu cuenta. Si creés que es un error, contactanos
            para revisar tus datos.
          </p>
        </>
      ) : (
        <>
          <h1 className="font-display-wide text-3xl text-balance text-ink">
            Cuenta pendiente de aprobación
          </h1>
          <p className="text-ink-muted">
            Estamos validando los datos de tu comercio. Cuando tu cuenta esté
            aprobada vas a poder ingresar a la tienda.
          </p>
        </>
      )}
      <div className="self-start">
        <LogoutButton />
      </div>
    </AuthShell>
  );
}
