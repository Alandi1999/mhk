import Link from "next/link";
import { CircleAlert, CircleCheck } from "lucide-react";

export type StockRow = {
  id: string;
  sku: string;
  name: string;
  brand: string | null;
  stock_on_hand: number;
  active: boolean;
};

const th =
  "sticky top-0 z-10 bg-surface-2 px-4 py-3 text-xs font-bold tracking-wide text-ink-muted uppercase";
const td = "px-4 py-3 align-middle";

/** Text plus icon: out of stock never relies on colour alone. */
function StockLevel({ value }: { value: number }) {
  const out = value === 0;
  const Icon = out ? CircleAlert : CircleCheck;
  return (
    <span
      className={`inline-flex items-center gap-1.5 font-semibold tabular-nums ${out ? "text-danger" : "text-ink"}`}
    >
      <Icon aria-hidden="true" className="size-4" />
      {value}
      {out ? <span className="font-medium">Sin stock</span> : null}
    </span>
  );
}

/** Dense table from lg, stacked rows below (same pattern as products). */
export function StockList({
  products,
  caption,
}: {
  products: StockRow[];
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
                SKU
              </th>
              <th scope="col" className={th}>
                Nombre
              </th>
              <th scope="col" className={`${th} text-right`}>
                Stock
              </th>
              <th scope="col" className={`${th} rounded-tr-lg`}>
                <span className="sr-only">Acciones</span>
              </th>
            </tr>
          </thead>
          <tbody className="[&_tr:hover]:bg-ground [&_tr:not(:last-child)_td]:border-b [&_tr:not(:last-child)_td]:border-rule">
            {products.map((p) => (
              <tr key={p.id}>
                <td className={`${td} font-mono whitespace-nowrap`}>
                  <span className="font-semibold text-ink">{p.sku}</span>
                </td>
                <td className={td}>
                  <span className="font-semibold text-ink">{p.name}</span>
                  {p.brand ? (
                    <span className="block text-ink-muted">{p.brand}</span>
                  ) : null}
                </td>
                <td className={`${td} text-right whitespace-nowrap`}>
                  <StockLevel value={p.stock_on_hand} />
                </td>
                <td className={`${td} text-right whitespace-nowrap`}>
                  <Link
                    href={`/admin/stock/${p.id}`}
                    className="inline-flex min-h-11 items-center font-semibold text-ink underline underline-offset-4"
                  >
                    Movimientos
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className="flex flex-col divide-y divide-rule rounded-lg border border-rule bg-surface lg:hidden">
        {products.map((p) => (
          <li key={p.id}>
            <Link
              href={`/admin/stock/${p.id}`}
              className="flex min-h-11 flex-col gap-2 p-4 hover:bg-ground"
            >
              <div className="flex items-start justify-between gap-3">
                <span className="font-mono font-semibold text-ink">
                  {p.sku}
                </span>
                <StockLevel value={p.stock_on_hand} />
              </div>
              <p className="font-semibold text-ink">{p.name}</p>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
