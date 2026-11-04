import { describe, expect, it } from "vitest";
import { parseCompatibility, serializeCompatibility } from "./compatibility";

describe("parseCompatibility", () => {
  it("parses brand | model with and without years", () => {
    const { entries, errors } = parseCompatibility(
      "Honda | Wave 110 | 2015-2022\nYamaha | YBR 125\nZanella | ZB 110 | 2018\n",
    );
    expect(errors).toEqual([]);
    expect(entries).toEqual([
      {
        moto_brand: "Honda",
        moto_model: "Wave 110",
        year_from: 2015,
        year_to: 2022,
      },
      {
        moto_brand: "Yamaha",
        moto_model: "YBR 125",
        year_from: null,
        year_to: null,
      },
      {
        moto_brand: "Zanella",
        moto_model: "ZB 110",
        year_from: 2018,
        year_to: 2018,
      },
    ]);
  });

  it("skips blank lines, trims, and accepts CRLF and open ranges", () => {
    const { entries, errors } = parseCompatibility(
      "\r\n  Honda|CG 150|2010-  \r\n\r\nMotomel | CG 150 | -2012",
    );
    expect(errors).toEqual([]);
    expect(entries.map((e) => [e.year_from, e.year_to])).toEqual([
      [2010, null],
      [null, 2012],
    ]);
  });

  it("reports line-numbered errors for malformed lines", () => {
    const { entries, errors } = parseCompatibility(
      [
        "Honda",
        "Honda | | 2010",
        "Honda | CG | 1949",
        "Honda | CG | 2101",
        "Honda | CG | 2020-2010",
        "Honda | CG | abcd",
        "Honda | CG | 2010 | extra",
        `${"B".repeat(61)} | CG`,
        `Honda | ${"M".repeat(81)}`,
      ].join("\n"),
    );
    expect(entries).toEqual([]);
    expect(errors.map((e) => e.line)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
    expect(errors.every((e) => e.message.length > 0)).toBe(true);
  });

  it("rejects duplicates case-insensitively, pointing at the later line", () => {
    const { entries, errors } = parseCompatibility(
      "Honda | CG 150 | 2010\nhonda | cg 150 | 2010-2010",
    );
    expect(entries).toHaveLength(1);
    expect(errors).toEqual([
      { line: 2, message: expect.stringContaining("repetida") },
    ]);
  });

  it("returns nothing for empty input", () => {
    expect(parseCompatibility("  \n ")).toEqual({ entries: [], errors: [] });
  });
});

describe("serializeCompatibility", () => {
  it("round-trips through the parser", () => {
    const text = [
      "Honda | Wave 110 | 2015-2022",
      "Yamaha | YBR 125",
      "Zanella | ZB 110 | 2018",
      "Honda | CG 150 | 2010-",
      "Motomel | CG 150 | -2012",
    ].join("\n");
    const { entries } = parseCompatibility(text);
    expect(serializeCompatibility(entries)).toBe(text);
  });
});
