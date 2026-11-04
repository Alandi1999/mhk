// Canonical SKU form: upper case, whitespace runs become "-". Mirrors the
// products.sku CHECK constraint in the database.
const SKU_PATTERN = /^[A-Z0-9][A-Z0-9._/-]{0,39}$/;

export function normalizeSku(input: string): string {
  return input.trim().toUpperCase().replace(/\s+/g, "-");
}

export function isValidSku(sku: string): boolean {
  return SKU_PATTERN.test(sku);
}
