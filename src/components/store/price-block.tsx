import { formatArs, grossPrice } from "@/lib/catalog/money";
import { isDiscounted } from "@/lib/cart/quote";
import { cn } from "@/lib/utils";
import { PromoBadge } from "./promo-badge";

/** Net price (what the wholesale buyer reads first) plus the VAT-inclusive one. */
export function PriceBlock({
  net,
  vatRate,
  listPrice = null,
  ruleName = null,
  className,
}: {
  net: number | null;
  vatRate: number;
  /** The client's list price; shown struck through when `net` beats it. */
  listPrice?: number | null;
  ruleName?: string | null;
  className?: string;
}) {
  if (net === null) {
    return (
      <p className={cn("text-sm text-ink-muted", className)}>
        Consultar precio
      </p>
    );
  }
  const vat = new Intl.NumberFormat("es-AR").format(vatRate);
  const discounted = isDiscounted(net, listPrice);
  return (
    <div className={cn("flex flex-col gap-0.5", className)}>
      {discounted && listPrice !== null ? (
        <p className="text-sm text-ink-muted tabular-nums">
          <span className="sr-only">Precio de lista: </span>
          <s>{formatArs(listPrice)}</s>
        </p>
      ) : null}
      <p className="text-xl font-bold text-ink tabular-nums">
        {formatArs(net)}
      </p>
      {discounted && ruleName ? (
        <PromoBadge name={ruleName} className="self-start" />
      ) : null}
      <p className="text-sm text-ink-muted">Precio neto + IVA {vat}%</p>
      <p className="text-sm text-ink-muted tabular-nums">
        Con IVA: {formatArs(grossPrice(net, vatRate))}
      </p>
    </div>
  );
}
