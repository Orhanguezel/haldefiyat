import type { BorsaPriceRow } from "./types";

const TMO_2026_ALIM: Array<{ name: string; category: string; ton: number }> = [
  { name: "Buğday", category: "hububat", ton: 16_500 },
  { name: "Arpa", category: "hububat", ton: 12_750 },
];

export function parseTmoAlimResmi(): BorsaPriceRow[] {
  return TMO_2026_ALIM.map((row) => ({
    name: row.name,
    category: row.category,
    unit: "kg",
    avg: row.ton / 1000,
    min: row.ton / 1000,
    max: row.ton / 1000,
    recordedDate: "2026-06-01",
  }));
}

