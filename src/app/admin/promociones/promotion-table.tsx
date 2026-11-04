import Link from "next/link";
import { RuleStateBadge } from "@/components/promotions/rule-state-badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  formatPct,
  formatWindow,
  promotionKind,
} from "@/lib/promotions/format";
import type { PromotionState } from "@/lib/promotions/state";
import { togglePromotion } from "./actions";

export type PromotionRow = {
  id: string;
  name: string;
  discount_pct: number;
  min_qty: number;
  target: string;
  audience: string;
  starts_at: string | null;
  ends_at: string | null;
  active: boolean;
  state: PromotionState;
};

const th =
  "sticky top-0 z-10 bg-surface-2 px-4 py-3 text-xs font-bold tracking-wide text-ink-muted uppercase";
const td = "px-4 py-3 align-middle";

function RowActions({ promo }: { promo: PromotionRow }) {
  return (
    <div className="flex gap-3 lg:justify-end">
      <Link
        href={`/admin/promociones/${promo.id}`}
        aria-label={`Editar ${promo.name}`}
        className={buttonVariants({
          size: "sm",
          variant: "outline",
          className: "max-lg:flex-1",
        })}
      >
        Editar
      </Link>
      <form action={togglePromotion} className="max-lg:flex-1">
        <input type="hidden" name="id" value={promo.id} />
        <input type="hidden" name="active" value={String(!promo.active)} />
        <Button
          type="submit"
          size="sm"
          variant="outline"
          aria-label={`${promo.active ? "Desactivar" : "Activar"} ${promo.name}`}
          className="max-lg:w-full"
        >
          {promo.active ? "Desactivar" : "Activar"}
        </Button>
      </form>
    </div>
  );
}

/** Dense table from lg, stacked rows below (same pattern as price lists). */
export function PromotionTable({
  promotions,
  caption,
}: {
  promotions: PromotionRow[];
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
                Promoción
              </th>
              <th scope="col" className={`${th} text-right`}>
                Descuento
              </th>
              <th scope="col" className={th}>
                Aplica a
              </th>
              <th scope="col" className={th}>
                Para
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
            {promotions.map((p) => (
              <tr key={p.id}>
                <td className={td}>
                  <p className="font-semibold break-words text-ink">{p.name}</p>
                  <p className="text-ink-muted tabular-nums">
                    {promotionKind(p.min_qty)}
                  </p>
                </td>
                <td className={`${td} text-right tabular-nums`}>
                  {formatPct(p.discount_pct)}
                </td>
                <td className={`${td} break-words`}>{p.target}</td>
                <td className={`${td} break-words`}>{p.audience}</td>
                <td className={`${td} tabular-nums`}>
                  {formatWindow(p.starts_at, p.ends_at)}
                </td>
                <td className={td}>
                  <RuleStateBadge state={p.state} kind="promotion" />
                </td>
                <td className={td}>
                  <RowActions promo={p} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className="flex flex-col divide-y divide-rule rounded-lg border border-rule bg-surface lg:hidden">
        {promotions.map((p) => (
          <li key={p.id} className="flex flex-col gap-3 p-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <p className="min-w-0 font-semibold break-words text-ink">
                {p.name}
              </p>
              <RuleStateBadge state={p.state} kind="promotion" />
            </div>
            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
              <dt className="text-ink-muted">Tipo</dt>
              <dd className="tabular-nums">{promotionKind(p.min_qty)}</dd>
              <dt className="text-ink-muted">Descuento</dt>
              <dd className="tabular-nums">{formatPct(p.discount_pct)}</dd>
              <dt className="text-ink-muted">Aplica a</dt>
              <dd className="break-words">{p.target}</dd>
              <dt className="text-ink-muted">Para</dt>
              <dd className="break-words">{p.audience}</dd>
              <dt className="text-ink-muted">Vigencia</dt>
              <dd className="tabular-nums">
                {formatWindow(p.starts_at, p.ends_at)}
              </dd>
            </dl>
            <RowActions promo={p} />
          </li>
        ))}
      </ul>
    </>
  );
}
