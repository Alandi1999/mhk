import { ImageOff } from "lucide-react";
import Link from "next/link";
import { AddToCartForm } from "./add-to-cart-form";
import { AvailabilityBadge } from "./availability-badge";
import { PriceBlock } from "./price-block";

export type StoreProduct = {
  id: string;
  sku: string;
  name: string;
  brand: string | null;
  price: number | null;
  list_price: number | null;
  rule_name: string | null;
  vat_rate: number;
  in_stock: boolean | null;
  imageUrl: string | null;
};

/** Catalog row: the SKU leads because buyers order by part code. */
export function ProductCard({
  product,
  returnTo,
}: {
  product: StoreProduct;
  /** Current catalog URL, so adding to the cart keeps the search. */
  returnTo: string;
}) {
  const href = `/tienda/producto/${encodeURIComponent(product.sku)}`;
  return (
    <li className="flex gap-3 rounded-lg border border-rule bg-surface p-3 md:gap-4 md:p-4">
      <Link
        href={href}
        tabIndex={-1}
        aria-hidden="true"
        className="shrink-0 self-start"
      >
        {product.imageUrl ? (
          // Public bucket URL on the Supabase host: no optimizer needed.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.imageUrl}
            alt=""
            loading="lazy"
            className="size-20 rounded-md bg-surface-2 object-cover md:size-24"
          />
        ) : (
          <span className="flex size-20 items-center justify-center rounded-md bg-surface-2 text-ink-muted md:size-24">
            <ImageOff aria-hidden="true" className="size-6" />
          </span>
        )}
      </Link>
      <div className="flex min-w-0 flex-1 flex-col gap-3 md:flex-row md:items-center md:justify-between md:gap-6">
        <div className="flex min-w-0 flex-col gap-1">
          <Link
            href={href}
            className="inline-flex min-h-11 items-center font-mono text-lg font-bold text-ink underline-offset-4 hover:underline md:min-h-0"
          >
            {product.sku}
          </Link>
          <p className="text-base text-ink">{product.name}</p>
          {product.brand ? (
            <p className="text-sm text-ink-muted">{product.brand}</p>
          ) : null}
          <AvailabilityBadge
            inStock={!!product.in_stock}
            className="mt-1 self-start"
          />
        </div>
        <div className="flex flex-col gap-3 md:items-end">
          <PriceBlock
            net={product.price}
            vatRate={product.vat_rate}
            listPrice={product.list_price}
            ruleName={product.rule_name}
          />
          <AddToCartForm
            productId={product.id}
            sku={product.sku}
            returnTo={returnTo}
            orderable={!!product.in_stock && product.price !== null}
          />
        </div>
      </div>
    </li>
  );
}
