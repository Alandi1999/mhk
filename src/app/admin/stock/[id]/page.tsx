import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { FormAlert } from "@/components/auth/form-alert";
import { ActiveBadge } from "@/components/catalog/active-badge";
import { PageContainer } from "@/components/shell/page-container";
import { requireProfile } from "@/lib/auth/session";
import {
  formatDelta,
  formatMovementDate,
  reasonLabel,
} from "@/lib/catalog/stock";
import { createClient } from "@/lib/supabase/server";
import { MovementForm } from "./movement-form";

export const metadata: Metadata = {
  title: "Movimientos de stock | MHK Moto Repuestos",
};

const HISTORY_LIMIT = 200;

export default async function ProductStockPage({
  params,
  searchParams,
}: PageProps<"/admin/stock/[id]">) {
  await requireProfile({ role: "admin" });
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const query = await searchParams;

  const supabase = await createClient();
  const [{ data: product }, movements] = await Promise.all([
    supabase
      .from("products")
      .select("id, sku, name, stock_on_hand, active")
      .eq("id", id)
      .maybeSingle(),
    supabase
      .from("stock_movements")
      .select(
        "id, delta, reason, note, created_at, created_by, profiles(razon_social)",
      )
      .eq("product_id", id)
      .order("created_at", { ascending: false })
      .order("id", { ascending: false })
      .limit(HISTORY_LIMIT),
  ]);
  if (!product) notFound();

  const history = movements.data ?? [];
  const who = (m: (typeof history)[number]) =>
    m.profiles?.razon_social ?? (m.created_by ? "Administrador" : "Sistema");

  return (
    <PageContainer title={product.name} width="narrow">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <span className="font-mono font-semibold text-ink">{product.sku}</span>
        <ActiveBadge active={product.active} />
        <Link
          href={`/admin/productos/${product.id}`}
          className="inline-flex min-h-11 items-center text-sm font-semibold text-ink underline underline-offset-4"
        >
          Editar producto
        </Link>
      </div>

      <p className="text-base text-ink-muted">
        Stock actual:{" "}
        <strong className="text-2xl text-ink tabular-nums">
          {product.stock_on_hand}
        </strong>
      </p>

      {query.ok === "registrado" ? (
        <p role="status" className="text-sm font-semibold text-success">
          Movimiento registrado.
        </p>
      ) : null}

      <section className="flex flex-col gap-4 border-t border-rule pt-6">
        <h2 className="text-xl font-bold text-ink">Registrar movimiento</h2>
        <MovementForm productId={product.id} />
      </section>

      <section className="flex flex-col gap-4 border-t border-rule pt-6">
        <h2 className="text-xl font-bold text-ink">Historial</h2>
        {movements.error ? (
          <FormAlert>No pudimos cargar el historial. Probá de nuevo.</FormAlert>
        ) : history.length === 0 ? (
          <p className="text-ink-muted">Todavía no hay movimientos.</p>
        ) : (
          <>
            <div className="hidden rounded-lg border border-rule bg-surface md:block">
              <table className="w-full border-separate border-spacing-0 text-left text-sm">
                <caption className="sr-only">
                  Movimientos de stock, del más reciente al más antiguo
                </caption>
                <thead>
                  <tr>
                    {["Fecha", "Motivo", "Cantidad", "Nota", "Usuario"].map(
                      (h, i) => (
                        <th
                          key={h}
                          scope="col"
                          className={`bg-surface-2 px-4 py-3 text-xs font-bold tracking-wide text-ink-muted uppercase ${i === 2 ? "text-right" : ""}`}
                        >
                          {h}
                        </th>
                      ),
                    )}
                  </tr>
                </thead>
                <tbody className="[&_tr:not(:last-child)_td]:border-b [&_tr:not(:last-child)_td]:border-rule">
                  {history.map((m) => (
                    <tr key={m.id}>
                      <td className="px-4 py-3 whitespace-nowrap tabular-nums">
                        {formatMovementDate(m.created_at)}
                      </td>
                      <td className="px-4 py-3">{reasonLabel(m.reason)}</td>
                      <td className="px-4 py-3 text-right font-semibold tabular-nums">
                        {formatDelta(m.delta)}
                      </td>
                      <td className="px-4 py-3 break-words">{m.note ?? "-"}</td>
                      <td className="px-4 py-3">{who(m)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <ul className="flex flex-col divide-y divide-rule rounded-lg border border-rule bg-surface md:hidden">
              {history.map((m) => (
                <li key={m.id} className="flex flex-col gap-1 p-4">
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="font-semibold text-ink">
                      {reasonLabel(m.reason)}
                    </span>
                    <span className="text-lg font-bold text-ink tabular-nums">
                      {formatDelta(m.delta)}
                    </span>
                  </div>
                  <p className="text-sm text-ink-muted tabular-nums">
                    {formatMovementDate(m.created_at)} · {who(m)}
                  </p>
                  {m.note ? (
                    <p className="text-sm break-words text-ink">{m.note}</p>
                  ) : null}
                </li>
              ))}
            </ul>
            {history.length === HISTORY_LIMIT ? (
              <p className="text-sm text-ink-muted">
                Se muestran los últimos {HISTORY_LIMIT} movimientos.
              </p>
            ) : null}
          </>
        )}
      </section>
    </PageContainer>
  );
}
