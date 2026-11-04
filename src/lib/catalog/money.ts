export const VAT_RATES = [0, 10.5, 21, 27] as const;

/**
 * Parses an amount typed by an Argentine user: "1.234,50", "1234.5", "$ 99".
 * A lone dot followed by exactly three digits groups ("1.234") is read as a
 * thousands separator. Returns null when it is not a non-negative number.
 */
export function parseArsAmount(input: string): number | null {
  let s = input.replace(/[$\s]/g, "");
  if (s.includes(",")) s = s.replace(/\./g, "").replace(",", ".");
  else if (/^\d{1,3}(\.\d{3})+$/.test(s)) s = s.replace(/\./g, "");
  if (!/^\d+(\.\d+)?$/.test(s)) return null;
  return Number(s);
}

/** Net price plus VAT, rounded to cents. */
export function grossPrice(net: number, vatRate: number): number {
  return Math.round(net * (1 + vatRate / 100) * 100) / 100;
}

const ars = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
});

export function formatArs(amount: number): string {
  return ars.format(amount);
}
