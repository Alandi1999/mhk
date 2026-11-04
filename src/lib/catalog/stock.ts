import type { Database } from "@/lib/supabase/database.types";

export type StockReason = Database["public"]["Enums"]["stock_reason"];

/** Reasons an admin can pick; `initial` and `sale` are written by the system. */
export const MANUAL_REASONS = [
  "purchase",
  "adjustment",
  "return",
  "correction",
] as const satisfies readonly StockReason[];

export type ManualReason = (typeof MANUAL_REASONS)[number];

const LABELS: Record<StockReason, string> = {
  initial: "Stock inicial",
  purchase: "Ingreso por compra",
  adjustment: "Ajuste",
  sale: "Venta",
  return: "Devolución",
  correction: "Corrección",
};

export const NOTE_MAX = 500;
/** Sanity bound for a single movement. */
export const MAX_DELTA = 999_999;

export function reasonLabel(reason: StockReason): string {
  return LABELS[reason];
}

export function isManualReason(value: string): value is ManualReason {
  return (MANUAL_REASONS as readonly string[]).includes(value);
}

/** Purchases and returns only add stock; adjustments may go either way. */
const POSITIVE_ONLY: readonly StockReason[] = ["purchase", "return"];

export type DeltaResult =
  { ok: true; delta: number } | { ok: false; error: string };

/**
 * Validates a typed quantity for a manual movement and returns the signed
 * delta to store. Accepts "5", "+5", "-5" (and the typographic minus).
 */
export function parseDelta(reason: StockReason, raw: string): DeltaResult {
  if (!isManualReason(reason)) {
    return { ok: false, error: "Motivo inválido" };
  }
  const text = raw.trim().replace(/^−/, "-");
  if (!/^[+-]?\d+$/.test(text)) {
    return { ok: false, error: "Ingresá un número entero, sin decimales" };
  }
  const delta = Number(text);
  if (delta === 0) return { ok: false, error: "La cantidad no puede ser 0" };
  if (Math.abs(delta) > MAX_DELTA) {
    return { ok: false, error: "La cantidad es demasiado grande" };
  }
  if (delta < 0 && POSITIVE_ONLY.includes(reason)) {
    return {
      ok: false,
      error: `${reasonLabel(reason)} solo suma stock: usá una cantidad positiva`,
    };
  }
  return { ok: true, delta };
}

/** Signed quantity with an explicit sign ("+5", "−3"). */
export function formatDelta(delta: number): string {
  return delta > 0 ? `+${delta}` : `−${Math.abs(delta)}`;
}

const dateParts = new Intl.DateTimeFormat("es-AR", {
  timeZone: "America/Argentina/Buenos_Aires",
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

/** "04/11/2026 18:30" in Buenos Aires time, independent of ICU quirks. */
export function formatMovementDate(iso: string): string {
  const p = Object.fromEntries(
    dateParts.formatToParts(new Date(iso)).map((x) => [x.type, x.value]),
  );
  return `${p.day}/${p.month}/${p.year} ${p.hour}:${p.minute}`;
}
