import { quote } from "./product-query";
import { parseSearchQuery } from "./search";

/** Max products pulled from compatibility per term (keeps the URL short). */
export const COMPAT_MATCH_LIMIT = 200;

/** PostgREST `or=` filter matching a compatibility row for one term. */
export function compatFilter(term: string): string {
  const pattern = quote(`%${term}%`);
  return `moto_brand.ilike.${pattern},moto_model.ilike.${pattern}`;
}

/**
 * One PostgREST `or=` filter per search term (apply each with `.or()` so the
 * terms are ANDed). A term matches the SKU prefix, the name anywhere, or any
 * product whose compatibility matched it (`idsByTerm[i]` for term i).
 */
export function storeSearchFilters(
  query: string,
  idsByTerm: string[][],
): string[] {
  return parseSearchQuery(query).terms.map((term, i) => {
    const base = `sku.ilike.${quote(`${term}%`)},name.ilike.${quote(`%${term}%`)}`;
    const ids = idsByTerm[i] ?? [];
    return ids.length > 0 ? `${base},id.in.(${ids.join(",")})` : base;
  });
}

/** Exact part-code match goes first; it is never listed twice. */
export function mergeExactFirst<T extends { sku: string }>(
  exact: T | null,
  rows: T[],
): T[] {
  if (!exact) return rows;
  return [exact, ...rows.filter((row) => row.sku !== exact.sku)];
}

/** First image path per product, given rows already ordered by position. */
export function firstImageByProduct(
  images: { product_id: string; storage_path: string }[],
): Map<string, string> {
  const map = new Map<string, string>();
  for (const image of images) {
    if (!map.has(image.product_id))
      map.set(image.product_id, image.storage_path);
  }
  return map;
}
