import Link from "next/link";
import { OrderStatusBadge } from "@/components/orders/order-status-badge";
import { formatArs } from "@/lib/catalog/money";
import { formatCuit } from "@/lib/cuit";
import type { OrderStatus } from "@/lib/orders/orders";
import { formatOrderDate } from "./format";

export type OrderRow = {
  id: string;
  number: number;
  status: OrderStatus;
  created_at: string;
  customer_razon_social: string;
  customer_cuit: string | null;
  total: number;
};

const dash = "-";
const th =
  "sticky top-0 z-10 bg-surface-2 px-4 py-3 text-xs font-bold tracking-wide text-ink-muted uppercase";
const td = "px-4 py-3 align-middle";
const link =
  "inline-flex min-h-11 items-center font-mono font-semibold text-ink underline underline-offset-4";

/** Dense table from lg, stacked rows below. Both render the same data. */
export function OrderList({
  orders,
  caption,
}: {
  orders: OrderRow[];
  caption: string;
}) {
  return (
    <>
      <div className="hidden rounded-lg border border-rule bg-surface lg:block">
        <table className="w-full border-separate border-spacing-0 text-left text-sm">
          <caption className="sr-only">{caption}</caption>
          <thead>
            <tr>
              <th scope="col" className={`${th} rounded-tl-lg`}>
                Pedido
              </th>
              <th scope="col" className={th}>
                Fecha
              </th>
              <th scope="col" className={th}>
                Cliente
              </th>
              <th scope="col" className={th}>
                CUIT
              </th>
              <th scope="col" className={th}>
                Estado
              </th>
              <th scope="col" className={`${th} rounded-tr-lg text-right`}>
                Total
              </th>
            </tr>
          </thead>
          <tbody className="[&_tr:hover]:bg-ground [&_tr:not(:last-child)_td]:border-b [&_tr:not(:last-child)_td]:border-rule">
            {orders.map((o) => (
              <tr key={o.id}>
                <td className={td}>
                  <Link href={`/admin/pedidos/${o.id}`} className={link}>
                    #{o.number}
                  </Link>
                </td>
                <td className={`${td} whitespace-nowrap tabular-nums`}>
                  <time dateTime={o.created_at}>
                    {formatOrderDate(o.created_at)}
                  </time>
                </td>
                <td className={`${td} font-semibold text-ink`}>
                  {o.customer_razon_social}
                </td>
                <td className={`${td} font-mono whitespace-nowrap`}>
                  {o.customer_cuit ? formatCuit(o.customer_cuit) : dash}
                </td>
                <td className={td}>
                  <OrderStatusBadge status={o.status} />
                </td>
                <td
                  className={`${td} text-right font-semibold whitespace-nowrap tabular-nums`}
                >
                  {formatArs(o.total)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className="flex flex-col divide-y divide-rule rounded-lg border border-rule bg-surface lg:hidden">
        {orders.map((o) => (
          <li key={o.id}>
            <Link
              href={`/admin/pedidos/${o.id}`}
              className="flex min-h-11 flex-col gap-2 p-4 hover:bg-ground"
            >
              <div className="flex items-start justify-between gap-3">
                <span className="font-mono font-semibold text-ink">
                  #{o.number}
                </span>
                <OrderStatusBadge status={o.status} />
              </div>
              <p className="font-semibold break-words text-ink">
                {o.customer_razon_social}
              </p>
              <div className="flex items-baseline justify-between gap-3 text-sm text-ink-muted">
                <span className="tabular-nums">
                  <time dateTime={o.created_at}>
                    {formatOrderDate(o.created_at)}
                  </time>
                  {o.customer_cuit ? (
                    <>
                      {" · "}
                      <span className="font-mono">
                        {formatCuit(o.customer_cuit)}
                      </span>
                    </>
                  ) : null}
                </span>
                <span className="text-base font-bold text-ink tabular-nums">
                  {formatArs(o.total)}
                </span>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
