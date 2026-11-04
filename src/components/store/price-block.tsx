import { formatArs, grossPrice } from "@/lib/catalog/money";
import { cn } from "@/lib/utils";

/** Net price (what the wholesale buyer reads first) plus the VAT-inclusive one. */
export function PriceBlock({
  net,
  vatRate,
  className,
}: {
  net: number | null;
  vatRate: number;
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
  return (
    <div className={cn("flex flex-col gap-0.5", className)}>
      <p className="text-xl font-bold text-ink tabular-nums">
        {formatArs(net)}
      </p>
      <p className="text-sm text-ink-muted">Precio neto + IVA {vat}%</p>
      <p className="text-sm text-ink-muted tabular-nums">
        Con IVA: {formatArs(grossPrice(net, vatRate))}
      </p>
    </div>
  );
}
