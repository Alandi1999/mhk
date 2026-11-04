import { parseSearchQuery } from "./search";

export const PAGE_SIZE = 25;

/** 1-based page from a `?page=` value; anything unusable is page 1. */
export function parsePage(value: string | string[] | undefined): number {
  if (typeof value !== "string") return 1;
  const n = Math.floor(Number(value));
  return Number.isFinite(n) && n >= 1 ? n : 1;
}

/** Inclusive row range for PostgREST `.range(from, to)`. */
export function pageRange(page: number): { from: number; to: number } {
  const from = (page - 1) * PAGE_SIZE;
  return { from, to: from + PAGE_SIZE - 1 };
}

function quote(pattern: string): string {
  // PostgREST double-quoted value: escape backslashes and quotes.
  return `"${pattern.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
}

/**
 * One PostgREST `or=` filter per search term; apply each with `.or()` so the
 * terms are ANDed. A term matches the SKU prefix or the name anywhere.
 */
export function searchFilters(query: string): string[] {
  return parseSearchQuery(query).terms.map(
    (term) => `sku.ilike.${quote(`${term}%`)},name.ilike.${quote(`%${term}%`)}`,
  );
}
