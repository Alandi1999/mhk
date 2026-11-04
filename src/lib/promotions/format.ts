import { formatMovementDate } from "@/lib/catalog/stock";

/** 12.5 -> "12,5 %" */
export function formatPct(value: number): string {
  return `${String(value).replace(".", ",")} %`;
}

/** Human text for a validity window; both ends optional. */
export function formatWindow(
  startsAt: string | null,
  endsAt: string | null,
): string {
  if (startsAt && endsAt) {
    return `${formatMovementDate(startsAt)} al ${formatMovementDate(endsAt)}`;
  }
  if (startsAt) return `Desde ${formatMovementDate(startsAt)}`;
  if (endsAt) return `Hasta ${formatMovementDate(endsAt)}`;
  return "Sin límite";
}

/** "Promoción" for min_qty 1, "Volumen desde N u." otherwise. */
export function promotionKind(minQty: number): string {
  return minQty > 1 ? `Volumen desde ${minQty} u.` : "Promoción";
}
