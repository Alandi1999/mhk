const WEIGHTS = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2] as const;

/**
 * Strips the separators people usually type (dashes, spaces, dots). Anything
 * else is kept so that `isValidCuit` rejects it afterwards.
 */
export function normalizeCuit(input: string): string {
  return input.replace(/[-\s.]/g, "");
}

/**
 * TypeScript twin of the SQL function `public.is_valid_cuit`: 11 plain digits
 * and a valid AFIP/ARCA check digit. Expects an already normalized value.
 */
export function isValidCuit(cuit: string): boolean {
  if (!/^[0-9]{11}$/.test(cuit)) return false;
  let total = 0;
  for (let i = 0; i < 10; i++) {
    total += Number(cuit[i]) * WEIGHTS[i];
  }
  let dv = 11 - (total % 11);
  if (dv === 11) dv = 0;
  else if (dv === 10) return false;
  return dv === Number(cuit[10]);
}

/**
 * Display format XX-XXXXXXXX-X. Anything that is not 11 digits once the usual
 * separators are stripped is returned unchanged.
 */
export function formatCuit(input: string): string {
  const digits = normalizeCuit(input);
  if (!/^[0-9]{11}$/.test(digits)) return input;
  return `${digits.slice(0, 2)}-${digits.slice(2, 10)}-${digits.slice(10)}`;
}
