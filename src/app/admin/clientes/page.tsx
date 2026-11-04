import type { Metadata } from "next";
import Link from "next/link";
import { FormAlert } from "@/components/auth/form-alert";
import { CountBadge } from "@/components/shell/count-badge";
import { PageContainer } from "@/components/shell/page-container";
import { cn } from "@/lib/utils";
import { requireProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { getPendingClientCount } from "../pending-count";
import { ClientList } from "./client-list";

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
  "lista-no-asignada":
    "No se pudo asignar la lista. Solo se asigna a clientes aprobados; recargá e intentá de nuevo.",
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
  const pendingCount = await getPendingClientCount();
  // Pending: oldest first, so the longest wait is handled first.
  const [{ data: clients, error }, { data: priceLists }] = await Promise.all([
    supabase
      .from("profiles")
      .select(
        "id, razon_social, cuit, tax_condition, phone, status, created_at, price_list_id",
      )
      .eq("role", "cliente")
      .eq("status", estado)
      .order("created_at", { ascending: estado === "pending" }),
    supabase.from("price_lists").select("id, name").order("name"),
  ]);

  const estadoLabel = FILTERS.find((f) => f.value === estado)?.label ?? "";

  return (
    <PageContainer title="Clientes">
      <nav aria-label="Filtrar por estado">
        <ul className="flex gap-1 border-b border-rule">
          {FILTERS.map((f) => {
            const active = f.value === estado;
            return (
              <li key={f.value}>
                <Link
                  href={`/admin/clientes?estado=${f.value}`}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "relative flex h-11 items-center px-4 text-sm font-semibold transition-colors duration-150",
                    active ? "text-ink" : "text-ink-muted hover:text-ink",
                  )}
                >
                  {f.label}
                  {f.value === "pending" ? (
                    <CountBadge count={pendingCount} className="ml-2" />
                  ) : null}
                  {active ? (
                    <span
                      aria-hidden="true"
                      className="absolute inset-x-1 bottom-0 h-1 bg-brand-orange slant-bar"
                    />
                  ) : null}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <FormAlert>
        {actionError
          ? (ACTION_ERRORS[actionError] ??
            "No se pudo completar la acción. Probá de nuevo.")
          : null}
      </FormAlert>

      {error ? (
        <FormAlert>No pudimos cargar los clientes. Probá de nuevo.</FormAlert>
      ) : clients.length === 0 ? (
        <p className="rounded-lg border border-rule bg-surface px-4 py-10 text-center text-ink-muted">
          No hay clientes en este estado.
        </p>
      ) : (
        <ClientList
          clients={clients}
          caption={`Clientes ${estadoLabel.toLowerCase()}`}
          adminId={admin.id}
          estado={estado}
          now={new Date()}
          priceLists={priceLists ?? []}
        />
      )}
    </PageContainer>
  );
}
