import type { Metadata } from "next";
import Link from "next/link";
import { FormAlert } from "@/components/auth/form-alert";
import { StateFilterNav } from "@/components/promotions/state-filter-nav";
import { PageContainer } from "@/components/shell/page-container";
import { buttonVariants } from "@/components/ui/button";
import { requireProfile } from "@/lib/auth/session";
import { couponState } from "@/lib/promotions/state";
import { createClient } from "@/lib/supabase/server";
import { CouponTable, type CouponRow } from "./coupon-table";

export const metadata: Metadata = {
  title: "Cupones | MHK Moto Repuestos",
};

const FILTERS = [
  { value: "todos", label: "Todos" },
  { value: "running", label: "Vigentes" },
  { value: "scheduled", label: "Programados" },
  { value: "exhausted", label: "Agotados" },
  { value: "expired", label: "Vencidos" },
  { value: "inactive", label: "Inactivos" },
] as const;

const OK_MESSAGES: Record<string, string> = {
  creado: "Cupón creado.",
  guardado: "Cupón guardado.",
  activado: "Cupón activado.",
  desactivado: "Cupón desactivado.",
  eliminado: "Cupón eliminado.",
};

const ACTION_ERRORS: Record<string, string> = {
  usado:
    "El cupón ya se usó en pedidos y no se puede eliminar. Desactivalo para que deje de aceptarse.",
  "no-actualizado":
    "No se pudo actualizar el cupón. Puede que no tengas permiso o que ya no exista. Recargá e intentá de nuevo.",
  "no-borrado":
    "No se pudo eliminar el cupón. Puede que no tengas permiso o que ya no exista. Recargá e intentá de nuevo.",
  invalido: "La solicitud no es válida. Recargá la página e intentá de nuevo.",
};

export default async function CouponsPage({
  searchParams,
}: PageProps<"/admin/cupones">) {
  await requireProfile({ role: "admin" });
  const params = await searchParams;
  const estado =
    FILTERS.find((f) => f.value === params.estado)?.value ?? "todos";
  const ok = typeof params.ok === "string" ? OK_MESSAGES[params.ok] : undefined;
  const actionError =
    typeof params.error === "string"
      ? (ACTION_ERRORS[params.error] ??
        "No se pudo completar la acción. Probá de nuevo.")
      : undefined;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("coupons")
    .select(
      "id, code, discount_pct, min_order_net, uses, max_uses, starts_at, ends_at, active",
    )
    .order("created_at", { ascending: false });

  const now = new Date();
  const all: CouponRow[] = (data ?? []).map((c) => ({
    ...c,
    state: couponState(c, now),
  }));
  const rows = all.filter((c) => estado === "todos" || c.state === estado);
  const label = FILTERS.find((f) => f.value === estado)?.label ?? "";

  return (
    <PageContainer
      title="Cupones"
      description="Códigos de descuento que el cliente ingresa al confirmar el pedido. Descuentan un porcentaje de todo el pedido, con pedido mínimo, límite de usos y vigencia opcionales."
    >
      <div>
        <Link
          href="/admin/cupones/nuevo"
          className={buttonVariants({ className: "max-sm:w-full" })}
        >
          Nuevo cupón
        </Link>
      </div>

      <StateFilterNav
        basePath="/admin/cupones"
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
        <FormAlert>No pudimos cargar los cupones. Probá de nuevo.</FormAlert>
      ) : rows.length === 0 ? (
        <p className="rounded-lg border border-rule bg-surface px-4 py-10 text-center text-ink-muted">
          {all.length === 0
            ? "Todavía no hay cupones."
            : "No hay cupones en este estado."}
        </p>
      ) : (
        <CouponTable
          coupons={rows}
          caption={`Cupones: ${label.toLowerCase()}`}
        />
      )}
    </PageContainer>
  );
}
