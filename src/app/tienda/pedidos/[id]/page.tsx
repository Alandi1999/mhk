import { ArrowLeft, CircleCheck } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FormAlert } from "@/components/auth/form-alert";
import { OrderStatusBadge } from "@/components/orders/order-status-badge";
import { PageContainer } from "@/components/shell/page-container";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { requireProfile } from "@/lib/auth/session";
import { formatArs } from "@/lib/catalog/money";
import { formatMovementDate } from "@/lib/catalog/stock";
import { noticeMessage } from "@/lib/cart/cart";
import { clientCanCancel, STATUS_LABELS } from "@/lib/orders/orders";
import { createClient } from "@/lib/supabase/server";
import { cancelOrder } from "../actions";

export const metadata: Metadata = { title: "Pedido | MHK Moto Repuestos" };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function OrderPage({
  params,
  searchParams,
}: PageProps<"/tienda/pedidos/[id]">) {
  await requireProfile({ role: "cliente" });
  const { id } = await params;
  if (!UUID.test(id)) notFound();
  const query = await searchParams;
  const justPlaced = query.ok === "1";
  const justCancelled = query.cancelado === "1";
  const errorCode = typeof query.error === "string" ? query.error : "";

  const supabase = await createClient();
  // RLS returns nothing for orders that are not the caller's own.
  const { data: order } = await supabase
    .from("orders")
    .select(
      "id, number, status, note, subtotal_net, vat_total, total, cancel_reason, created_at",
    )
    .eq("id", id)
    .maybeSingle();
  if (!order) notFound();

  const [items, events] = await Promise.all([
    supabase
      .from("order_items")
      .select("id, sku, name, quantity, unit_price_net, line_net")
      .eq("order_id", order.id)
      .order("sku"),
    supabase
      .from("order_events")
      .select("id, status, note, created_at")
      .eq("order_id", order.id)
      .order("id"),
  ]);
  const lines = items.data ?? [];

  return (
    <PageContainer
      title={`Pedido #${order.number}`}
      description={`Hecho el ${formatMovementDate(order.created_at)}`}
    >
      <Link
        href="/tienda/pedidos"
        className="inline-flex min-h-11 items-center gap-2 self-start text-sm font-semibold text-ink underline-offset-4 hover:underline"
      >
        <ArrowLeft aria-hidden="true" className="size-4" />
        Volver a mis pedidos
      </Link>

      {justPlaced ? (
        <p
          role="status"
          className="flex items-start gap-2 rounded-md bg-success-tint px-3 py-2.5 text-sm font-medium text-success"
        >
          <CircleCheck aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          Recibimos tu pedido. Queda pendiente de pago hasta que lo confirmemos.
        </p>
      ) : null}
      {justCancelled ? (
        <p
          role="status"
          className="flex items-start gap-2 rounded-md bg-success-tint px-3 py-2.5 text-sm font-medium text-success"
        >
          <CircleCheck aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          Cancelaste el pedido. Devolvimos el stock.
        </p>
      ) : null}
      {errorCode ? <FormAlert>{noticeMessage(errorCode)}</FormAlert> : null}

      <div className="flex flex-wrap items-center gap-3">
        <OrderStatusBadge status={order.status} />
      </div>
      {order.note ? (
        <p className="max-w-[65ch] whitespace-pre-line text-ink">
          <span className="text-ink-muted">Tu nota: </span>
          {order.note}
        </p>
      ) : null}
      {order.status === "cancelled" && order.cancel_reason ? (
        <p className="max-w-[65ch] whitespace-pre-line text-ink">
          <span className="text-ink-muted">Motivo de la cancelación: </span>
          {order.cancel_reason}
        </p>
      ) : null}

      <section aria-label="Productos" className="flex flex-col gap-3">
        <h2 className="text-xl font-bold text-ink">Productos</h2>
        <ul className="flex flex-col gap-3 lg:hidden">
          {lines.map((line) => (
            <li
              key={line.id}
              className="flex flex-col gap-1 rounded-lg border border-rule bg-surface p-3"
            >
              <p className="font-mono text-lg font-bold text-ink">{line.sku}</p>
              <p className="text-base text-ink">{line.name}</p>
              <p className="text-sm text-ink-muted tabular-nums">
                {line.quantity} × {formatArs(line.unit_price_net)} ·{" "}
                <span className="font-bold text-ink">
                  {formatArs(line.line_net)}
                </span>
              </p>
            </li>
          ))}
        </ul>
        <div className="hidden overflow-hidden rounded-lg border border-rule bg-surface lg:block">
          <table className="w-full text-left text-sm">
            <caption className="sr-only">Productos del pedido</caption>
            <thead className="bg-surface-2 text-ink-muted">
              <tr>
                <th scope="col" className="px-3 py-2 font-semibold">
                  Código
                </th>
                <th scope="col" className="px-3 py-2 font-semibold">
                  Repuesto
                </th>
                <th scope="col" className="px-3 py-2 text-right font-semibold">
                  Cantidad
                </th>
                <th scope="col" className="px-3 py-2 text-right font-semibold">
                  Precio neto
                </th>
                <th scope="col" className="px-3 py-2 text-right font-semibold">
                  Subtotal neto
                </th>
              </tr>
            </thead>
            <tbody>
              {lines.map((line) => (
                <tr key={line.id} className="border-t border-rule">
                  <td className="px-3 py-3 font-mono font-bold text-ink">
                    {line.sku}
                  </td>
                  <td className="px-3 py-3 text-ink">{line.name}</td>
                  <td className="px-3 py-3 text-right tabular-nums">
                    {line.quantity}
                  </td>
                  <td className="px-3 py-3 text-right tabular-nums">
                    {formatArs(line.unit_price_net)}
                  </td>
                  <td className="px-3 py-3 text-right font-bold text-ink tabular-nums">
                    {formatArs(line.line_net)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <dl className="flex flex-col gap-1 rounded-lg border border-rule bg-surface p-4 text-sm tabular-nums lg:ml-auto lg:w-96">
          <div className="flex justify-between gap-4">
            <dt className="text-ink-muted">Subtotal neto</dt>
            <dd className="text-ink">{formatArs(order.subtotal_net)}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-ink-muted">IVA</dt>
            <dd className="text-ink">{formatArs(order.vat_total)}</dd>
          </div>
          <div className="flex justify-between gap-4 border-t border-rule pt-2 text-lg font-bold">
            <dt className="text-ink">Total</dt>
            <dd className="text-ink">{formatArs(order.total)}</dd>
          </div>
        </dl>
      </section>

      <section aria-label="Historial" className="flex flex-col gap-3">
        <h2 className="text-xl font-bold text-ink">Historial</h2>
        <ol className="flex flex-col gap-2">
          {(events.data ?? []).map((event) => (
            <li
              key={event.id}
              className="flex flex-col gap-0.5 border-l-2 border-rule pl-3"
            >
              <p className="text-sm font-semibold text-ink">
                {STATUS_LABELS[event.status]}
                <span className="font-normal text-ink-muted tabular-nums">
                  {" "}
                  · {formatMovementDate(event.created_at)}
                </span>
              </p>
              {event.note ? (
                <p className="text-sm whitespace-pre-line text-ink-muted">
                  {event.note}
                </p>
              ) : null}
            </li>
          ))}
        </ol>
      </section>

      {clientCanCancel(order.status) ? (
        <section
          aria-label="Cancelar pedido"
          className="flex max-w-xl flex-col gap-3 border-t border-rule pt-6"
        >
          <h2 className="text-xl font-bold text-ink">Cancelar pedido</h2>
          <p className="text-sm text-ink-muted">
            Podés cancelarlo mientras esté pendiente de pago. Devolvemos el
            stock al instante.
          </p>
          <form action={cancelOrder} className="flex flex-col gap-3">
            <input type="hidden" name="order_id" value={order.id} />
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="reason">Motivo (opcional)</Label>
              <Textarea id="reason" name="reason" maxLength={500} rows={2} />
            </div>
            <Button type="submit" variant="destructive" className="self-start">
              Cancelar pedido
            </Button>
          </form>
        </section>
      ) : null}
    </PageContainer>
  );
}
