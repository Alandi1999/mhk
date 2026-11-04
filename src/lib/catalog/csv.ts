export type CsvRecord = Record<string, string>;

/**
 * Minimal RFC 4180 reader for admin uploads. Accepts ";" or "," (picked from
 * the header line), quoted fields with "" escapes, CRLF/LF and a UTF-8 BOM.
 * Header names are lower-cased and trimmed. Blank lines are skipped.
 */
export function parseCsv(text: string): CsvRecord[] {
  const src = text.replace(/^﻿/, "");
  const firstLine = src.split(/\r?\n/, 1)[0] ?? "";
  const delimiter =
    firstLine.split(";").length > firstLine.split(",").length ? ";" : ",";

  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;

  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (quoted) {
      if (c === '"' && src[i + 1] === '"') {
        field += '"';
        i++;
      } else if (c === '"') quoted = false;
      else field += c;
    } else if (c === '"') quoted = true;
    else if (c === delimiter) {
      row.push(field);
      field = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && src[i + 1] === "\n") i++;
      row.push(field);
      field = "";
      rows.push(row);
      row = [];
    } else field += c;
  }
  if (field !== "" || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  const [header, ...data] = rows.filter((r) =>
    r.some((cell) => cell.trim() !== ""),
  );
  if (!header) return [];
  const keys = header.map((h) => h.trim().toLowerCase());
  return data.map((cells) =>
    Object.fromEntries(keys.map((k, i) => [k, (cells[i] ?? "").trim()])),
  );
}

export const MAX_CSV_BYTES = 2 * 1024 * 1024;
export const MAX_CSV_ROWS = 5000;

/** Required header names (lower case) the file does not have. */
export function missingColumns(
  records: CsvRecord[],
  required: readonly string[],
): string[] {
  const present = new Set(Object.keys(records[0] ?? {}));
  return required.filter((column) => !present.has(column));
}
