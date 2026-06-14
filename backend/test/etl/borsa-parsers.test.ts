import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  parseBorsaHtml,
  parseBorsaText,
  parsePolatliBorsaJson,
} from "../../src/modules/etl/sources/borsa/text-parsers";

const fixtureRoot = join(import.meta.dir, "fixtures");

function fixture(name: string): string {
  return readFileSync(join(fixtureRoot, name), "utf8");
}

describe("borsa ETL parsers", () => {
  it("parses text bulletins and converts TL/Ton prices to kg", () => {
    const rows = parseBorsaText(fixture("borsa-text.txt"));

    expect(rows).toEqual([
      {
        name: "Buğday",
        category: "hububat",
        unit: "kg",
        min: 12,
        max: 12.5,
        avg: 12.25,
      },
      {
        name: "Arpa",
        category: "hububat",
        unit: "kg",
        min: 9,
        max: 9.6,
        avg: 9.3,
      },
    ]);
  });

  it("parses HTML bulletins through the shared text parser", () => {
    const rows = parseBorsaHtml(fixture("borsa-html.html"));

    expect(rows).toEqual([
      {
        name: "Mısır",
        category: "hububat",
        unit: "kg",
        min: 8,
        max: 8.4,
        avg: 8.2,
      },
      {
        name: "Pamuk",
        category: "sanayi-bitkisi",
        unit: "kg",
        min: 28,
        max: 31,
        avg: 29.5,
      },
    ]);
  });

  it("aggregates Polatli JSON rows with quantity-weighted averages", () => {
    const rows = parsePolatliBorsaJson(JSON.parse(fixture("polatli-borsa.json")));

    expect(rows).toEqual([
      {
        name: "Buğday",
        category: "hububat",
        unit: "tl/ton",
        min: 11,
        max: 13,
        avg: 12.25,
      },
      {
        name: "Arpa",
        category: "hububat",
        unit: "tl/ton",
        min: 9,
        max: 10,
        avg: 9.5,
      },
    ]);
  });
});
