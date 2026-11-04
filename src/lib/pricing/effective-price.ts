export interface EffectivePriceInput {
  /** products.base_price (net, ARS). */
  basePrice: number;
  /** price_lists.discount_pct of the client's list, null without a list. */
  discountPct: number | null;
  /** price_list_items.price for this product on that list, if any. */
  explicitPrice: number | null;
}

/**
 * Net price a client pays. Mirrors the SQL `catalog_products` view: the
 * explicit price wins, else base_price minus the list percentage rounded to
 * cents (half away from zero, like Postgres `round(numeric, 2)`), else the base
 * price. Integer cents and basis points avoid binary floating point drift.
 */
export function effectivePrice({
  basePrice,
  discountPct,
  explicitPrice,
}: EffectivePriceInput): number {
  if (explicitPrice !== null) return explicitPrice;
  if (discountPct === null) return basePrice;
  const baseCents = Math.round(basePrice * 100);
  const keepBasisPoints = 10000 - Math.round(discountPct * 100);
  return Math.round((baseCents * keepBasisPoints) / 10000) / 100;
}
