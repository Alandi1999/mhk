import { cartTotals, orderErrorMessage } from "@/lib/orders/orders";

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

export type CatalogRow = {
  id: string;
  sku: string;
  name: string;
  price: number | null;
  vat_rate: number;
  in_stock: boolean | null;
};

export type CartRow = { product_id: string; quantity: number };

export type CartIssue = "unavailable" | "no-stock" | "no-price";

export type CartLine = {
  productId: string;
  quantity: number;
  sku: string | null;
  name: string | null;
  price: number | null;
  vatRate: number;
  issue: CartIssue | null;
};

/**
 * Joins cart rows with what the client can see in catalog_products. A product
 * missing from the catalog is inactive (or gone) and is kept as "unavailable"
 * so the buyer can remove it. Clients only see an in-stock flag, never counts.
 */
export function buildCartLines(
  cart: CartRow[],
  catalog: CatalogRow[],
): CartLine[] {
  const byId = new Map(catalog.map((p) => [p.id, p]));
  const lines: CartLine[] = cart.map((row) => {
    const p = byId.get(row.product_id);
    if (!p) {
      return {
        productId: row.product_id,
        quantity: row.quantity,
        sku: null,
        name: null,
        price: null,
        vatRate: 0,
        issue: "unavailable",
      };
    }
    return {
      productId: p.id,
      quantity: row.quantity,
      sku: p.sku,
      name: p.name,
      price: p.price,
      vatRate: p.vat_rate,
      issue: p.price === null ? "no-price" : p.in_stock ? null : "no-stock",
    };
  });
  return lines.sort((a, b) => {
    if (a.sku === null || b.sku === null) {
      return a.sku === b.sku ? 0 : a.sku === null ? 1 : -1;
    }
    return a.sku.localeCompare(b.sku);
  });
}

/** Totals of the priced lines plus whether the order can be placed. */
export function cartSummary(lines: CartLine[], minOrderNet: number) {
  const priced = lines.flatMap((l) =>
    l.price === null
      ? []
      : [{ price: l.price, quantity: l.quantity, vatRate: l.vatRate }],
  );
  const totals = cartTotals(priced);
  const missingToMinimum = Math.max(
    0,
    Math.round((minOrderNet - totals.subtotalNet) * 100) / 100,
  );
  const hasIssues = lines.some((l) => l.issue !== null);
  return {
    totals,
    missingToMinimum,
    hasIssues,
    canCheckout: lines.length > 0 && !hasIssues && missingToMinimum === 0,
  };
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
