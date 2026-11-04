// Compatibility editor format: one bike per line, `Marca | Modelo | Años`.
// Years are optional: `2018`, `2015-2022`, `2015-` (from only), `-2022`.
// Limits mirror the product_compatibility CHECK constraints.

export type CompatibilityEntry = {
  moto_brand: string;
  moto_model: string;
  year_from: number | null;
  year_to: number | null;
};

export type CompatibilityError = { line: number; message: string };

const MIN_YEAR = 1950;
const MAX_YEAR = 2100;
const MAX_BRAND = 60;
const MAX_MODEL = 80;

type Years = { from: number | null; to: number | null };

function parseYears(raw: string): Years | string {
  const match = /^(\d{4})?\s*(?:([-–])\s*(\d{4})?)?$/.exec(raw);
  if (!match || (!match[1] && !match[3])) {
    return "Años inválidos (usá 2018, 2015-2022, 2015- o -2022)";
  }
  const from = match[1] ? Number(match[1]) : null;
  // A single year ("2018") means that year only.
  const to = match[2] ? (match[3] ? Number(match[3]) : null) : from;
  for (const year of [from, to]) {
    if (year !== null && (year < MIN_YEAR || year > MAX_YEAR)) {
      return `Los años deben estar entre ${MIN_YEAR} y ${MAX_YEAR}`;
    }
  }
  if (from !== null && to !== null && from > to) {
    return "El año inicial no puede ser mayor que el final";
  }
  return { from, to };
}

export function parseCompatibility(text: string): {
  entries: CompatibilityEntry[];
  errors: CompatibilityError[];
} {
  const entries: CompatibilityEntry[] = [];
  const errors: CompatibilityError[] = [];
  const seen = new Set<string>();

  text.split(/\r?\n/).forEach((rawLine, index) => {
    const line = index + 1;
    if (rawLine.trim() === "") return;
    const fail = (message: string) => errors.push({ line, message });

    const parts = rawLine.split("|").map((p) => p.trim());
    if (parts.length < 2 || parts.length > 3) {
      return fail("Formato: Marca | Modelo | Años (los años son opcionales)");
    }
    const [brand, model, yearsRaw] = parts;
    if (!brand) return fail("Falta la marca");
    if (!model) return fail("Falta el modelo");
    if (brand.length > MAX_BRAND) {
      return fail(`La marca admite hasta ${MAX_BRAND} caracteres`);
    }
    if (model.length > MAX_MODEL) {
      return fail(`El modelo admite hasta ${MAX_MODEL} caracteres`);
    }

    let years: Years = { from: null, to: null };
    if (yearsRaw !== undefined) {
      const parsed = parseYears(yearsRaw);
      if (typeof parsed === "string") return fail(parsed);
      years = parsed;
    }

    const key = [brand, model, years.from, years.to]
      .map((v) => String(v).toLowerCase())
      .join("|");
    if (seen.has(key)) return fail("Compatibilidad repetida");
    seen.add(key);

    entries.push({
      moto_brand: brand,
      moto_model: model,
      year_from: years.from,
      year_to: years.to,
    });
  });

  return { entries, errors };
}

export function serializeCompatibility(entries: CompatibilityEntry[]): string {
  return entries
    .map(({ moto_brand, moto_model, year_from, year_to }) => {
      const head = `${moto_brand} | ${moto_model}`;
      if (year_from === null && year_to === null) return head;
      if (year_from === year_to) return `${head} | ${year_from}`;
      return `${head} | ${year_from ?? ""}-${year_to ?? ""}`;
    })
    .join("\n");
}
