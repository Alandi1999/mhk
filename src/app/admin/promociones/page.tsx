import type { Metadata } from "next";
import Link from "next/link";
import { FormAlert } from "@/components/auth/form-alert";
import { StateFilterNav } from "@/components/promotions/state-filter-nav";
import { PageContainer } from "@/components/shell/page-container";
import { buttonVariants } from "@/components/ui/button";
import { requireProfile } from "@/lib/auth/session";
import { promotionState } from "@/lib/promotions/state";
import { createClient } from "@/lib/supabase/server";
import { PromotionTable, type PromotionRow } from "./promotion-table";

export const metadata: Metadata = {
  title: "Promociones | MHK Moto Repuestos",
};

const FILTERS = [
  { value: "todas", label: "Todas" },
  { value: "running", label: "Vigentes" },
  { value: "scheduled", label: "Programadas" },
  { value: "expired", label: "Vencidas" },
  { value: "inactive", label: "Inactivas" },
] as const;

const OK_MESSAGES: Record<string, string> = {
  creada: "Promoción creada.",
  guardada: "Promoción guardada.",
  activada: "Promoción activada.",
  desactivada: "Promoción desactivada.",
  eliminada: "Promoción eliminada.",
};

const ACTION_ERRORS: Record<string, string> = {
  "no-actualizada":
    "No se pudo actualizar la promoción. Puede que no tengas permiso o que ya no exista. Recargá e intentá de nuevo.",
  "no-borrada":
    "No se pudo eliminar la promoción. Puede que no tengas permiso o que ya no exista. Recargá e intentá de nuevo.",
  invalida: "La solicitud no es válida. Recargá la página e intentá de nuevo.",
};

export default async function PromotionsPage({
  searchParams,
}: PageProps<"/admin/promociones">) {
  await requireProfile({ role: "admin" });
  const params = await searchParams;
  const estado =
    FILTERS.find((f) => f.value === params.estado)?.value ?? "todas";
  const ok = typeof params.ok === "string" ? OK_MESSAGES[params.ok] : undefined;
  const actionError =
    typeof params.error === "string"
      ? (ACTION_ERRORS[params.error] ??
        "No se pudo completar la acción. Probá de nuevo.")
      : undefined;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("promotions")
    .select(
      "id, name, discount_pct, min_qty, starts_at, ends_at, active, products(sku, name), categories(name), price_lists(name)",
    )
    .order("created_at", { ascending: false });

  const now = new Date();
  const all: PromotionRow[] = (data ?? []).map((p) => ({
    id: p.id,
    name: p.name,
    discount_pct: p.discount_pct,
    min_qty: p.min_qty,
    target: p.products
      ? `${p.products.sku} · ${p.products.name}`
      : p.categories
        ? `Categoría ${p.categories.name}`
        : "Todos los productos",
    audience: p.price_lists
      ? `Lista ${p.price_lists.name}`
      : "Todos los clientes",
    starts_at: p.starts_at,
    ends_at: p.ends_at,
    active: p.active,
    state: promotionState(p, now),
  }));
  const rows = all.filter((p) => estado === "todas" || p.state === estado);
  const label = FILTERS.find((f) => f.value === estado)?.label ?? "";

  return (
    <PageContainer
      title="Promociones"
      description="Descuentos porcentuales sobre el precio base, con vigencia opcional y cantidad mínima para los descuentos por volumen. En cada producto gana el precio más bajo: los descuentos no se suman."
    >
      <div>
        <Link
          href="/admin/promociones/nueva"
          className={buttonVariants({ className: "max-sm:w-full" })}
        >
          Nueva promoción
        </Link>
      </div>

      <StateFilterNav
        basePath="/admin/promociones"
        filters={FILTERS}
        current={estado}
      />

      {ok ? (
        <p role="status" className="text-sm font-semibold text-success">
          {ok}
        </p>
      ) : null}
      <FormAlert>{actionError}</FormAlert>

      {error ? (
        <FormAlert>
          No pudimos cargar las promociones. Probá de nuevo.
        </FormAlert>
      ) : rows.length === 0 ? (
        <p className="rounded-lg border border-rule bg-surface px-4 py-10 text-center text-ink-muted">
          {all.length === 0
            ? "Todavía no hay promociones."
            : "No hay promociones en este estado."}
        </p>
      ) : (
        <PromotionTable
          promotions={rows}
          caption={`Promociones: ${label.toLowerCase()}`}
        />
      )}
    </PageContainer>
  );
}
