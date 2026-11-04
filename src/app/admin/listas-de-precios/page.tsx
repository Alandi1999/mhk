import type { Metadata } from "next";
import { FormAlert } from "@/components/auth/form-alert";
import { PageContainer } from "@/components/shell/page-container";
import { requireProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { ListForm } from "./list-form";
import { ListTable, type ListRow } from "./list-table";

export const metadata: Metadata = {
  title: "Listas de precios | MHK Moto Repuestos",
};

const ACTION_ERRORS: Record<string, string> = {
  asignada: "Hay clientes con esta lista. Reasignalos antes de borrarla.",
  "no-borrada":
    "No se pudo eliminar la lista. Puede que no tengas permiso o que ya no exista. Recargá e intentá de nuevo.",
  invalida: "La solicitud no es válida. Recargá la página e intentá de nuevo.",
};

export default async function PriceListsPage({
  searchParams,
}: PageProps<"/admin/listas-de-precios">) {
  await requireProfile({ role: "admin" });
  const params = await searchParams;
  const actionError = typeof params.error === "string" ? params.error : null;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("price_lists")
    .select("id, name, discount_pct, price_list_items(count), profiles(count)")
    .order("name");

  const lists: ListRow[] = (data ?? []).map((l) => ({
    id: l.id,
    name: l.name,
    discount_pct: l.discount_pct,
    items: l.price_list_items[0]?.count ?? 0,
    clients: l.profiles[0]?.count ?? 0,
  }));

  return (
    <PageContainer
      title="Listas de precios"
      description="Cada lista aplica un porcentaje de descuento sobre el precio base, con precios puntuales opcionales por producto. Asignala a cada cliente desde Clientes."
    >
      {params.ok === "eliminada" ? (
        <p role="status" className="text-sm font-semibold text-success">
          Lista eliminada.
        </p>
      ) : null}
      <FormAlert>
        {actionError
          ? (ACTION_ERRORS[actionError] ??
            "No se pudo completar la acción. Probá de nuevo.")
          : null}
      </FormAlert>

      {error ? (
        <FormAlert>No pudimos cargar las listas. Probá de nuevo.</FormAlert>
      ) : lists.length === 0 ? (
        <p className="rounded-lg border border-rule bg-surface px-4 py-10 text-center text-ink-muted">
          Todavía no hay listas de precios.
        </p>
      ) : (
        <ListTable lists={lists} />
      )}

      <section className="flex flex-col gap-4 border-t border-rule pt-6">
        <h2 className="text-xl font-bold text-ink">Nueva lista</h2>
        <ListForm initial={{ name: "", discount: "" }} />
      </section>
    </PageContainer>
  );
}
