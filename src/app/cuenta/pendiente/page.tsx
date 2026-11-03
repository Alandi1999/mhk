import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LogoutButton } from "@/components/auth/logout-button";
import { getSession } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Cuenta | MHK Moto Repuestos" };

export default async function PendingPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const rejected = session.profile?.status === "rejected";

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-4 p-6">
      {rejected ? (
        <>
          <h1 className="text-2xl font-bold">Solicitud rechazada</h1>
          <p>
            No pudimos aprobar tu cuenta. Si creés que es un error, contactanos
            para revisar tus datos.
          </p>
        </>
      ) : (
        <>
          <h1 className="text-2xl font-bold">Cuenta pendiente de aprobación</h1>
          <p>
            Estamos validando los datos de tu comercio. Cuando tu cuenta esté
            aprobada vas a poder ingresar a la tienda.
          </p>
        </>
      )}
      <LogoutButton />
    </main>
  );
}
