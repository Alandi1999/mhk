import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { FormAlert } from "@/components/auth/form-alert";
import { OrderStatusBadge } from "@/components/orders/order-status-badge";
import { PageContainer } from "@/components/shell/page-container";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { requireProfile } from "@/lib/auth/session";
import { TAX_CONDITION_LABELS } from "@/lib/auth/schemas";
import { formatArs } from "@/lib/catalog/money";
import { formatMovementDate } from "@/lib/catalog/stock";
import { formatCuit } from "@/lib/cuit";
import {
  STATUS_LABELS,
  adminCanCancel,
  nextStatus,
  orderErrorMessage,
} from "@/lib/orders/orders";
import { createClient } from "@/lib/supabase/server";
import { advanceOrder, cancelOrderAsAdmin } from "../actions";

export const metadata: Metadata = {
  title: "Pedido | MHK Moto Repuestos",
};

const th =
  "bg-surface-2 px-4 py-3 text-xs font-bold tracking-wide text-ink-muted uppercase";

export default async function AdminOrderPage({
  params,
  searchParams,
}: PageProps<"/admin/pedidos/[id]">) {
  await requireProfile({ role: "admin" });
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const query = await searchParams;

  const supabase = await createClient();
  const [{ data: order }, { data: items }, { data: events }] =
    await Promise.all([
      supabase.from("orders").select("*").eq("id", id).maybeSingle(),
      supabase
        .from("order_items")
        .select("id, sku, name, quantity, unit_price_net, line_net")
        .eq("order_id", id)
        .order("sku"),
      supabase
        .from("order_events")
        .select("id, status, note, created_at, actor, profiles(razon_social)")
        .eq("order_id", id)
        .order("id"),
    ]);
  if (!order) notFound();

  const lines = items ?? [];
  const history = events ?? [];
  const next = nextStatus(order.status);
  const canCancel = adminCanCancel(order.status);
  const errorCode = typeof query.error === "string" ? query.error : null;
  const errorMessage = errorCode
    ? errorCode === "reason-long"
      ? "El motivo puede tener hasta 500 caracteres."
      : orderErrorMessage(errorCode)
    : null;
  const okMessage =
    query.ok === "avanzado"
      ? "Estado actualizado."
      : query.ok === "cancelado"
        ? "Pedido cancelado. El stock volvió al inventario."
        : null;
  const who = (e: (typeof history)[number]) =>
    e.profiles?.razon_social ?? (e.actor ? "Administrador" : "Sistema");

  return (
    <PageContainer title={`Pedido #${order.number}`}>
      <Link
        href="/admin/pedidos"
        className="-mt-4 inline-flex min-h-11 items-center self-start text-sm font-semibold text-ink underline underline-offset-4"
      >
        Volver a pedidos
      </Link>

      {okMessage ? (
        <p role="status" className="text-sm font-semibold text-success">
          {okMessage}
        </p>
      ) : null}
      <FormAlert>{errorMessage}</FormAlert>

      <section
        aria-label="Datos del pedido"
        className="flex flex-col gap-4 rounded-lg border border-rule bg-surface p-4"
      >
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <OrderStatusBadge status={order.status} />
          <span className="text-sm text-ink-muted tabular-nums">
            Creado el {formatMovementDate(order.created_at)}
          </span>
        </div>
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
          <dt className="text-ink-muted">Cliente</dt>
          <dd className="font-semibold break-words text-ink">
            {order.customer_razon_social}
          </dd>
          <dt className="text-ink-muted">CUIT</dt>
          <dd className="font-mono">
            {order.customer_cuit ? formatCuit(order.customer_cuit) : "-"}
          </dd>
          <dt className="text-ink-muted">Condición IVA</dt>
          <dd>
            {order.customer_tax_condition
              ? TAX_CONDITION_LABELS[order.customer_tax_condition]
              : "-"}
          </dd>
          <dt className="text-ink-muted">Nota del cliente</dt>
          <dd className="break-words whitespace-pre-line">
            {order.note ?? "-"}
          </dd>
          {order.status === "cancelled" ? (
            <>
              <dt className="text-ink-muted">Motivo de cancelación</dt>
              <dd className="break-words whitespace-pre-line">
                {order.cancel_reason ?? "-"}
              </dd>
            </>
          ) : null}
        </dl>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-bold text-ink">Productos</h2>
        <div className="hidden rounded-lg border border-rule bg-surface md:block">
          <table className="w-full border-separate border-spacing-0 text-left text-sm">
            <caption className="sr-only">Productos del pedido</caption>
            <thead>
              <tr>
                <th scope="col" className={`${th} rounded-tl-lg`}>
                  SKU
                </th>
                <th scope="col" className={th}>
                  Producto
                </th>
                <th scope="col" className={`${th} text-right`}>
                  Cantidad
                </th>
                <th scope="col" className={`${th} text-right`}>
                  Precio neto
                </th>
                <th scope="col" className={`${th} rounded-tr-lg text-right`}>
                  Subtotal neto
                </th>
              </tr>
            </thead>
            <tbody className="[&_tr:not(:last-child)_td]:border-b [&_tr:not(:last-child)_td]:border-rule">
              {lines.map((l) => (
                <tr key={l.id}>
                  <td className="px-4 py-3 font-mono whitespace-nowrap">
                    {l.sku}
                  </td>
                  <td className="px-4 py-3 break-words">{l.name}</td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {l.quantity}
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap tabular-nums">
                    {formatArs(l.unit_price_net)}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold whitespace-nowrap tabular-nums">
                    {formatArs(l.line_net)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <ul className="flex flex-col divide-y divide-rule rounded-lg border border-rule bg-surface md:hidden">
          {lines.map((l) => (
            <li key={l.id} className="flex flex-col gap-1 p-4">
              <p className="font-mono text-sm font-semibold">{l.sku}</p>
              <p className="break-words text-ink">{l.name}</p>
              <div className="flex items-baseline justify-between gap-3 text-sm text-ink-muted tabular-nums">
                <span>
                  {l.quantity} × {formatArs(l.unit_price_net)}
                </span>
                <span className="text-base font-bold text-ink">
                  {formatArs(l.line_net)}
                </span>
              </div>
            </li>
          ))}
        </ul>

        <dl className="ml-auto grid w-full max-w-sm grid-cols-[1fr_auto] gap-x-6 gap-y-1 text-sm tabular-nums">
          <dt className="text-ink-muted">Subtotal neto</dt>
          <dd className="text-right">{formatArs(order.subtotal_net)}</dd>
          <dt className="text-ink-muted">IVA</dt>
          <dd className="text-right">{formatArs(order.vat_total)}</dd>
          <dt className="border-t border-rule pt-2 text-base font-bold text-ink">
            Total
          </dt>
          <dd className="border-t border-rule pt-2 text-right text-base font-bold text-ink">
            {formatArs(order.total)}
          </dd>
        </dl>
      </section>

      {next || canCancel ? (
        <section className="flex flex-col gap-4 border-t border-rule pt-6">
          <h2 className="text-xl font-bold text-ink">Acciones</h2>
          {next ? (
            <form action={advanceOrder}>
              <input type="hidden" name="id" value={order.id} />
              <input type="hidden" name="to" value={next} />
              <Button type="submit" className="max-sm:w-full">
                Avanzar a {STATUS_LABELS[next]}
              </Button>
            </form>
          ) : null}
          {canCancel ? (
            <form
              action={cancelOrderAsAdmin}
              className="flex max-w-xl flex-col gap-3"
            >
              <input type="hidden" name="id" value={order.id} />
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="reason">
                  Motivo de la cancelación (opcional)
                </Label>
                <Textarea id="reason" name="reason" maxLength={500} rows={3} />
                <p className="text-sm text-ink-muted">
                  Al cancelar, el stock de los productos vuelve al inventario.
                  No se puede deshacer.
                </p>
              </div>
              <div>
                <Button
                  type="submit"
                  variant="destructive"
                  className="max-sm:w-full"
                >
                  Cancelar pedido
                </Button>
              </div>
            </form>
          ) : null}
        </section>
      ) : null}

      <section className="flex flex-col gap-4 border-t border-rule pt-6">
        <h2 className="text-xl font-bold text-ink">Historial</h2>
        <ol className="flex flex-col divide-y divide-rule rounded-lg border border-rule bg-surface">
          {history.map((e) => (
            <li key={e.id} className="flex flex-col gap-1 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <OrderStatusBadge status={e.status} />
                <span className="text-sm text-ink-muted tabular-nums">
                  {formatMovementDate(e.created_at)}
                </span>
              </div>
              <p className="text-sm text-ink-muted">Por {who(e)}</p>
              {e.note ? (
                <p className="text-sm break-words text-ink">{e.note}</p>
              ) : null}
            </li>
          ))}
        </ol>
      </section>
    </PageContainer>
  );
}
