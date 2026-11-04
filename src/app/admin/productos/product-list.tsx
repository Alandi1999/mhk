import Link from "next/link";
import { ActiveBadge } from "@/components/catalog/active-badge";
import { formatArs } from "@/lib/catalog/money";

export type ProductRow = {
  id: string;
  sku: string;
  name: string;
  brand: string | null;
  base_price: number;
  vat_rate: number;
  stock_on_hand: number;
  active: boolean;
  categories: { name: string } | null;
};

const dash = "-";
const th =
  "sticky top-0 z-10 bg-surface-2 px-4 py-3 text-xs font-bold tracking-wide text-ink-muted uppercase";
const td = "px-4 py-3 align-middle";

const vat = (rate: number) => `${String(rate).replace(".", ",")} %`;

/**
 * Dense table from the lg breakpoint, stacked rows below it (same pattern as
 * the clients list).
 */
export function ProductList({
  products,
  caption,
}: {
  products: ProductRow[];
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
              <th scope="col" className={th}>
                Categoría
              </th>
              <th scope="col" className={`${th} text-right`}>
                Precio neto
              </th>
              <th scope="col" className={`${th} text-right`}>
                IVA
              </th>
              <th scope="col" className={`${th} text-right`}>
                Stock
              </th>
              <th scope="col" className={`${th} rounded-tr-lg`}>
                Estado
              </th>
            </tr>
          </thead>
          <tbody className="[&_tr:hover]:bg-ground [&_tr:not(:last-child)_td]:border-b [&_tr:not(:last-child)_td]:border-rule">
            {products.map((p) => (
              <tr key={p.id}>
                <td className={`${td} font-mono whitespace-nowrap`}>
                  <Link
                    href={`/admin/productos/${p.id}`}
                    className="inline-flex min-h-11 items-center font-semibold text-ink underline underline-offset-4"
                  >
                    {p.sku}
                  </Link>
                </td>
                <td className={td}>
                  <span className="font-semibold text-ink">{p.name}</span>
                  {p.brand ? (
                    <span className="block text-ink-muted">{p.brand}</span>
                  ) : null}
                </td>
                <td className={td}>{p.categories?.name ?? dash}</td>
                <td
                  className={`${td} text-right whitespace-nowrap tabular-nums`}
                >
                  {formatArs(p.base_price)}
                </td>
                <td
                  className={`${td} text-right whitespace-nowrap tabular-nums`}
                >
                  {vat(p.vat_rate)}
                </td>
                <td className={`${td} text-right tabular-nums`}>
                  {p.stock_on_hand}
                </td>
                <td className={`${td} whitespace-nowrap`}>
                  <ActiveBadge active={p.active} />
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
              href={`/admin/productos/${p.id}`}
              className="flex min-h-11 flex-col gap-2 p-4 hover:bg-ground"
            >
              <div className="flex items-start justify-between gap-3">
                <span className="font-mono font-semibold text-ink">
                  {p.sku}
                </span>
                <ActiveBadge active={p.active} />
              </div>
              <p className="font-semibold text-ink">{p.name}</p>
              <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
                <dt className="text-ink-muted">Categoría</dt>
                <dd>{p.categories?.name ?? dash}</dd>
                <dt className="text-ink-muted">Precio neto</dt>
                <dd className="tabular-nums">
                  {formatArs(p.base_price)} + IVA {vat(p.vat_rate)}
                </dd>
                <dt className="text-ink-muted">Stock</dt>
                <dd className="tabular-nums">{p.stock_on_hand}</dd>
              </dl>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
