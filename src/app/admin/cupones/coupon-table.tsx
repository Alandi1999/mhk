import Link from "next/link";
import { RuleStateBadge } from "@/components/promotions/rule-state-badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { formatArs } from "@/lib/catalog/money";
import { formatPct, formatWindow } from "@/lib/promotions/format";
import type { CouponState } from "@/lib/promotions/state";
import { toggleCoupon } from "./actions";

export type CouponRow = {
  id: string;
  code: string;
  discount_pct: number;
  min_order_net: number;
  uses: number;
  max_uses: number | null;
  starts_at: string | null;
  ends_at: string | null;
  active: boolean;
  state: CouponState;
};

const th =
  "sticky top-0 z-10 bg-surface-2 px-4 py-3 text-xs font-bold tracking-wide text-ink-muted uppercase";
const td = "px-4 py-3 align-middle";

const minimum = (c: CouponRow) =>
  c.min_order_net > 0 ? formatArs(c.min_order_net) : "Sin mínimo";
const usage = (c: CouponRow) =>
  c.max_uses === null ? `${c.uses}` : `${c.uses} / ${c.max_uses}`;

function RowActions({ coupon }: { coupon: CouponRow }) {
  return (
    <div className="flex gap-3 lg:justify-end">
      <Link
        href={`/admin/cupones/${coupon.id}`}
        aria-label={`Editar ${coupon.code}`}
        className={buttonVariants({
          size: "sm",
          variant: "outline",
          className: "max-lg:flex-1",
        })}
      >
        Editar
      </Link>
      <form action={toggleCoupon} className="max-lg:flex-1">
        <input type="hidden" name="id" value={coupon.id} />
        <input type="hidden" name="active" value={String(!coupon.active)} />
        <Button
          type="submit"
          size="sm"
          variant="outline"
          aria-label={`${coupon.active ? "Desactivar" : "Activar"} ${coupon.code}`}
          className="max-lg:w-full"
        >
          {coupon.active ? "Desactivar" : "Activar"}
        </Button>
      </form>
    </div>
  );
}

/** Dense table from lg, stacked rows below. */
export function CouponTable({
  coupons,
  caption,
}: {
  coupons: CouponRow[];
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
                Código
              </th>
              <th scope="col" className={`${th} text-right`}>
                Descuento
              </th>
              <th scope="col" className={`${th} text-right`}>
                Pedido mínimo
              </th>
              <th scope="col" className={`${th} text-right`}>
                Usos
              </th>
              <th scope="col" className={th}>
                Vigencia
              </th>
              <th scope="col" className={th}>
                Estado
              </th>
              <th scope="col" className={`${th} rounded-tr-lg text-right`}>
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="[&_tr:hover]:bg-ground [&_tr:not(:last-child)_td]:border-b [&_tr:not(:last-child)_td]:border-rule">
            {coupons.map((c) => (
              <tr key={c.id}>
                <td
                  className={`${td} font-mono font-semibold break-all text-ink`}
                >
                  {c.code}
                </td>
                <td className={`${td} text-right tabular-nums`}>
                  {formatPct(c.discount_pct)}
                </td>
                <td className={`${td} text-right tabular-nums`}>
                  {minimum(c)}
                </td>
                <td className={`${td} text-right tabular-nums`}>{usage(c)}</td>
                <td className={`${td} tabular-nums`}>
                  {formatWindow(c.starts_at, c.ends_at)}
                </td>
                <td className={td}>
                  <RuleStateBadge state={c.state} kind="coupon" />
                </td>
                <td className={td}>
                  <RowActions coupon={c} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className="flex flex-col divide-y divide-rule rounded-lg border border-rule bg-surface lg:hidden">
        {coupons.map((c) => (
          <li key={c.id} className="flex flex-col gap-3 p-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <p className="min-w-0 font-mono font-semibold break-all text-ink">
                {c.code}
              </p>
              <RuleStateBadge state={c.state} kind="coupon" />
            </div>
            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
              <dt className="text-ink-muted">Descuento</dt>
              <dd className="tabular-nums">{formatPct(c.discount_pct)}</dd>
              <dt className="text-ink-muted">Pedido mínimo</dt>
              <dd className="tabular-nums">{minimum(c)}</dd>
              <dt className="text-ink-muted">Usos</dt>
              <dd className="tabular-nums">{usage(c)}</dd>
              <dt className="text-ink-muted">Vigencia</dt>
              <dd className="tabular-nums">
                {formatWindow(c.starts_at, c.ends_at)}
              </dd>
            </dl>
            <RowActions coupon={c} />
          </li>
        ))}
      </ul>
    </>
  );
}
