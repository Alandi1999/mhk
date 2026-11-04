import { orderErrorMessage } from "@/lib/orders/orders";

/** Mirrors the `quantity between 1 and 9999` check on cart_items. */
export const MAX_QUANTITY = 9999;

/**
 * Quantity typed by the buyer: a positive integer, clamped to the maximum the
 * cart accepts. Anything else (zero, decimals, blanks, text) is null.
 */
export function parseQuantity(input: unknown): number | null {
  if (typeof input !== "string") return null;
  const s = input.trim();
  if (!/^\d+$/.test(s)) return null;
  const n = Number(s);
  if (n < 1) return null;
  return Math.min(n, MAX_QUANTITY);
}

/** Adding to a line already in the cart sums the quantities, up to the cap. */
export function mergeQuantity(existing: number, added: number): number {
  return Math.min(existing + added, MAX_QUANTITY);
}

/**
 * Where a cart form sends the buyer back to. Only paths inside /tienda are
 * honoured, so a tampered hidden field cannot become an open redirect.
 */
export function safeReturnPath(
  input: unknown,
  fallback: string = "/tienda",
): string {
  if (typeof input !== "string") return fallback;
  if (input.includes("\\") || input.includes("//")) return fallback;
  if (!/^\/tienda(?=$|[/?#])/.test(input)) return fallback;
  return input;
}

/** Sets (or replaces) a query param on a path, keeping the rest. */
export function withNotice(path: string, key: string, value: string): string {
  const [base, query = ""] = path.split("?", 2);
  const params = new URLSearchParams(query);
  params.set(key, value);
  return `${base}?${params.toString()}`;
}

const NOTICE_MESSAGES: Record<string, string> = {
  cantidad: "Ingresá una cantidad válida, de 1 a 9999.",
  "no-disponible":
    "Ese repuesto no está disponible para pedir en este momento.",
  "no-guardado": "No pudimos guardar el cambio en tu carrito. Probá de nuevo.",
  invalido: "No pudimos procesar el pedido. Probá de nuevo.",
  nota: "La nota puede tener hasta 500 caracteres.",
  motivo: "El motivo puede tener hasta 500 caracteres.",
};

/** Spanish message for an `?error=` code from the cart or order actions. */
export function noticeMessage(code: string | undefined): string {
  return (code && NOTICE_MESSAGES[code]) || orderErrorMessage(code);
}
