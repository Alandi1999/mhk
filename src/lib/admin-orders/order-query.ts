import { quote } from "@/lib/catalog/product-query";
import { ORDER_STATUSES, STATUS_LABELS } from "@/lib/orders/orders";

export type OrderFilter = (typeof ORDER_STATUSES)[number] | "all";

/** Filter tabs of /admin/pedidos: every status plus "Todos". */
export const ORDER_FILTERS: readonly { value: OrderFilter; label: string }[] = [
  ...ORDER_STATUSES.map((s) => ({ value: s, label: STATUS_LABELS[s] })),
  { value: "all" as const, label: "Todos" },
];

/** Unknown or missing values fall back to the pending queue. */
export function parseOrderFilter(
  value: string | string[] | undefined,
): OrderFilter {
  return ORDER_FILTERS.find((f) => f.value === value)?.value ?? "pending";
}

/** Statuses that wait for the admin are listed oldest first (work queue). */
export function isWorkQueue(filter: OrderFilter): boolean {
  return (
    filter === "pending" || filter === "confirmed" || filter === "preparing"
  );
}

function escapeLike(text: string): string {
  return text.replace(/[\\%_]/g, (c) => `\\${c}`);
}

/**
 * PostgREST `or=` filter for the search box: an order number (digits, with an
 * optional leading "#") matches exactly; the text always matches the customer
 * name. Returns null when there is nothing to search.
 */
export function orderSearchFilter(query: string): string | null {
  const text = query.trim();
  if (text === "") return null;
  const byName = `customer_razon_social.ilike.${quote(`%${escapeLike(text)}%`)}`;
  const digits = text.replace(/^#/, "");
  if (/^\d{1,15}$/.test(digits)) {
    return `number.eq.${Number(digits)},${byName}`;
  }
  return byName;
}
