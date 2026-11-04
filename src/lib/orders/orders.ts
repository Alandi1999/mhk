export const ORDER_STATUSES = [
  "pending",
  "confirmed",
  "preparing",
  "shipped",
  "delivered",
  "cancelled",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "Pendiente de pago",
  confirmed: "Confirmado",
  preparing: "En preparación",
  shipped: "Enviado",
  delivered: "Entregado",
  cancelled: "Cancelado",
};

const FLOW: Partial<Record<OrderStatus, OrderStatus>> = {
  pending: "confirmed",
  confirmed: "preparing",
  preparing: "shipped",
  shipped: "delivered",
};

/** Next step an admin can take; mirrors admin_set_order_status(). */
export function nextStatus(status: OrderStatus): OrderStatus | null {
  return FLOW[status] ?? null;
}

/** Mirrors cancel_order(): the owner only while pending. */
export function clientCanCancel(status: OrderStatus): boolean {
  return status === "pending";
}

/** Mirrors cancel_order(): admins until the order ships. */
export function adminCanCancel(status: OrderStatus): boolean {
  return (
    status === "pending" || status === "confirmed" || status === "preparing"
  );
}

function roundCents(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

export type CartLine = { price: number; quantity: number; vatRate: number };

/** Same rounding as place_order(): per-line net and per-line VAT, in cents. */
export function cartTotals(lines: CartLine[]): {
  subtotalNet: number;
  vatTotal: number;
  total: number;
} {
  let subtotal = 0;
  let vat = 0;
  for (const l of lines) {
    const net = roundCents(l.price * l.quantity);
    subtotal += net;
    vat += roundCents((net * l.vatRate) / 100);
  }
  subtotal = roundCents(subtotal);
  vat = roundCents(vat);
  return {
    subtotalNet: subtotal,
    vatTotal: vat,
    total: roundCents(subtotal + vat),
  };
}

const ERROR_MESSAGES: Record<string, string> = {
  MH001: "Tu carrito está vacío.",
  MH002:
    "Algún producto del carrito ya no está disponible. Quitalo y probá de nuevo.",
  MH003: "No hay stock suficiente de algún producto. Revisá las cantidades.",
  "23514": "No hay stock suficiente de algún producto. Revisá las cantidades.",
  MH004: "El pedido no alcanza el mínimo de compra.",
  MH005: "El pedido no puede cambiar a ese estado.",
  "42501": "No tenés permiso para hacer esto.",
};

export function orderErrorMessage(code: string | undefined): string {
  return (
    (code && ERROR_MESSAGES[code]) ||
    "No pudimos completar la operación. Probá de nuevo."
  );
}
