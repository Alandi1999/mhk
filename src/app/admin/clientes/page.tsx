import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { TAX_CONDITION_LABELS } from "@/lib/auth/schemas";
import { requireProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { approveClient, rejectClient } from "./actions";

export const metadata: Metadata = { title: "Clientes | MHK Moto Repuestos" };

const FILTERS = [
  { value: "pending", label: "Pendientes" },
  { value: "approved", label: "Aprobados" },
  { value: "rejected", label: "Rechazados" },
] as const;

type Filter = (typeof FILTERS)[number]["value"];

const ACTION_ERRORS: Record<string, string> = {
  "no-actualizado":
    "No se pudo actualizar el cliente. Puede que no tengas permiso o que ya haya cambiado. Recargá e intentá de nuevo.",
  propio: "No podés cambiar el estado de tu propia cuenta.",
  invalido: "La solicitud no es válida. Recargá la página e intentá de nuevo.",
};

function parseFilter(value: string | string[] | undefined): Filter {
  return FILTERS.find((f) => f.value === value)?.value ?? "pending";
}

export default async function ClientsPage({
  searchParams,
}: PageProps<"/admin/clientes">) {
  const admin = await requireProfile({ role: "admin" });
  const params = await searchParams;
  const estado = parseFilter(params.estado);
  const actionError = typeof params.error === "string" ? params.error : null;

  const supabase = await createClient();
  const { data: clients, error } = await supabase
    .from("profiles")
    .select("id, razon_social, cuit, tax_condition, phone, status, created_at")
    .eq("role", "cliente")
    .eq("status", estado)
    .order("created_at", { ascending: false });

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-4 p-6">
      <h1 className="text-2xl font-bold">Clientes</h1>

      <nav aria-label="Filtrar por estado" className="flex gap-4">
        {FILTERS.map((f) => (
          <Link
            key={f.value}
            href={`/admin/clientes?estado=${f.value}`}
            aria-current={f.value === estado ? "page" : undefined}
            className={f.value === estado ? "font-bold underline" : undefined}
          >
            {f.label}
          </Link>
        ))}
      </nav>

      <div role="alert" aria-live="assertive">
        {actionError ? (
          <p>
            {ACTION_ERRORS[actionError] ??
              "No se pudo completar la acción. Probá de nuevo."}
          </p>
        ) : null}
      </div>

      {error ? (
        <p role="alert">No pudimos cargar los clientes. Probá de nuevo.</p>
      ) : clients.length === 0 ? (
        <p>No hay clientes en este estado.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <caption className="sr-only">
              Clientes{" "}
              {FILTERS.find((f) => f.value === estado)?.label.toLowerCase()}
            </caption>
            <thead>
              <tr>
                <th scope="col">Razón social</th>
                <th scope="col">CUIT</th>
                <th scope="col">Condición IVA</th>
                <th scope="col">Teléfono</th>
                <th scope="col">Alta</th>
                <th scope="col">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {clients.map((c) => (
                <tr key={c.id}>
                  <td>{c.razon_social ?? "-"}</td>
                  <td>{c.cuit ?? "-"}</td>
                  <td>
                    {c.tax_condition
                      ? TAX_CONDITION_LABELS[c.tax_condition]
                      : "-"}
                  </td>
                  <td>{c.phone ?? "-"}</td>
                  <td>
                    <time dateTime={c.created_at}>
                      {new Date(c.created_at).toLocaleDateString("es-AR", {
                        timeZone: "America/Argentina/Buenos_Aires",
                      })}
                    </time>
                  </td>
                  <td>
                    <div className="flex gap-2">
                      {c.status !== "approved" && c.id !== admin.id ? (
                        <form action={approveClient}>
                          <input type="hidden" name="id" value={c.id} />
                          <input type="hidden" name="estado" value={estado} />
                          <Button type="submit" size="sm">
                            Aprobar
                          </Button>
                        </form>
                      ) : null}
                      {c.status !== "rejected" && c.id !== admin.id ? (
                        <form action={rejectClient}>
                          <input type="hidden" name="id" value={c.id} />
                          <input type="hidden" name="estado" value={estado} />
                          <Button type="submit" size="sm" variant="outline">
                            Rechazar
                          </Button>
                        </form>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
