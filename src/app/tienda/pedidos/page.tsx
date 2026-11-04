import type { Metadata } from "next";
import Link from "next/link";
import { FormAlert } from "@/components/auth/form-alert";
import { OrderStatusBadge } from "@/components/orders/order-status-badge";
import { PageContainer } from "@/components/shell/page-container";
import { buttonVariants } from "@/components/ui/button";
import { PAGE_SIZE, pageRange, parsePage } from "@/lib/catalog/product-query";
import { formatArs } from "@/lib/catalog/money";
import { formatMovementDate } from "@/lib/catalog/stock";
import { requireProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Mis pedidos | MHK Moto Repuestos" };

export default async function OrdersPage({
  searchParams,
}: PageProps<"/tienda/pedidos">) {
  await requireProfile({ role: "cliente" });
  const params = await searchParams;
  const page = parsePage(params.page);

  const supabase = await createClient();
  const { from, to } = pageRange(page);
  // RLS limits this to the caller's own orders.
  const { data, count, error } = await supabase
    .from("orders")
    .select("id, number, status, total, created_at", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);

  const outOfRange = error?.code === "PGRST103";
  const orders = data ?? [];
  const pages = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE));
  const hrefFor = (target: number) =>
    target > 1 ? `/tienda/pedidos?page=${target}` : "/tienda/pedidos";

  return (
    <PageContainer title="Mis pedidos">
      {error && !outOfRange ? (
        <FormAlert>No pudimos cargar tus pedidos. Probá de nuevo.</FormAlert>
      ) : orders.length === 0 ? (
        <div className="flex flex-col items-start gap-3 rounded-lg border border-rule bg-surface px-4 py-10">
          <p className="text-ink">
            {page > 1
              ? "No hay pedidos en esta página."
              : "Todavía no hiciste ningún pedido."}
          </p>
          <Link
            href={page > 1 ? hrefFor(1) : "/tienda"}
            className={buttonVariants({ variant: "outline" })}
          >
            {page > 1 ? "Volver a la primera página" : "Ir al catálogo"}
          </Link>
        </div>
      ) : (
        <>
          <p role="status" className="text-sm text-ink-muted tabular-nums">
            {count} {count === 1 ? "pedido" : "pedidos"} · página {page} de{" "}
            {pages}
          </p>

          <ul aria-label="Pedidos" className="flex flex-col gap-3 lg:hidden">
            {orders.map((order) => (
              <li key={order.id}>
                <Link
                  href={`/tienda/pedidos/${order.id}`}
                  className="flex min-h-11 flex-col gap-2 rounded-lg border border-rule bg-surface p-3 hover:bg-surface-2"
                >
                  <span className="flex items-center justify-between gap-2">
                    <span className="font-mono text-lg font-bold text-ink">
                      Pedido #{order.number}
                    </span>
                    <OrderStatusBadge status={order.status} />
                  </span>
                  <span className="flex items-center justify-between gap-2 text-sm text-ink-muted tabular-nums">
                    <span>{formatMovementDate(order.created_at)}</span>
                    <span className="text-base font-bold text-ink">
                      {formatArs(order.total)}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>

          <div className="hidden overflow-hidden rounded-lg border border-rule bg-surface lg:block">
            <table className="w-full text-left text-sm">
              <caption className="sr-only">Mis pedidos</caption>
              <thead className="bg-surface-2 text-ink-muted">
                <tr>
                  <th scope="col" className="px-3 py-2 font-semibold">
                    Pedido
                  </th>
                  <th scope="col" className="px-3 py-2 font-semibold">
                    Fecha
                  </th>
                  <th scope="col" className="px-3 py-2 font-semibold">
                    Estado
                  </th>
                  <th
                    scope="col"
                    className="px-3 py-2 text-right font-semibold"
                  >
                    Total
                  </th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id} className="border-t border-rule">
                    <td className="px-3 py-3">
                      <Link
                        href={`/tienda/pedidos/${order.id}`}
                        className="font-mono text-base font-bold text-ink underline-offset-4 hover:underline"
                      >
                        #{order.number}
                      </Link>
                    </td>
                    <td className="px-3 py-3 text-ink tabular-nums">
                      {formatMovementDate(order.created_at)}
                    </td>
                    <td className="px-3 py-3">
                      <OrderStatusBadge status={order.status} />
                    </td>
                    <td className="px-3 py-3 text-right font-bold text-ink tabular-nums">
                      {formatArs(order.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <nav
            aria-label="Paginación"
            className="flex items-center justify-end gap-2"
          >
            {page > 1 ? (
              <Link
                href={hrefFor(page - 1)}
                className={buttonVariants({ variant: "outline" })}
              >
                Anterior
              </Link>
            ) : null}
            {page < pages ? (
              <Link
                href={hrefFor(page + 1)}
                className={buttonVariants({ variant: "outline" })}
              >
                Siguiente
              </Link>
            ) : null}
          </nav>
        </>
      )}
    </PageContainer>
  );
}
