import { isValidSku, normalizeSku } from "./sku";

export type ParsedSearch = {
  /** Set when the whole query could be a part code. */
  sku: string | null;
  /** Free-text terms, already escaped for use inside ILIKE patterns. */
  terms: string[];
};

function escapeLike(term: string): string {
  return term.replace(/[\\%_]/g, (c) => `\\${c}`);
}

export function parseSearchQuery(query: string): ParsedSearch {
  const tokens = query.trim().split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return { sku: null, terms: [] };
  const candidate = tokens.length === 1 ? normalizeSku(tokens[0]) : null;
  return {
    sku: candidate && isValidSku(candidate) ? candidate : null,
    terms: tokens.map(escapeLike),
  };
}
