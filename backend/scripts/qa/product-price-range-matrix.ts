import { pool } from "../../src/db/client";

type Row = {
  id: number;
  productSlug: string;
  productName: string;
  productUnit: string;
  observedUnit: string;
  avgPrice: string | number;
  sourceApi: string;
  recordedDate: string | Date;
};

const [raw] = await pool.query<any[]>(`
  SELECT ph.id, p.slug AS productSlug, p.name_tr AS productName,
         p.unit AS productUnit, ph.unit AS observedUnit,
         ph.avg_price AS avgPrice, ph.source_api AS sourceApi,
         ph.recorded_date AS recordedDate
    FROM hf_price_history ph
    INNER JOIN hf_products p ON p.id = ph.product_id
   ORDER BY ph.id DESC
   LIMIT 15000
`);

const groups = new Map<string, Row[]>();
for (const row of raw as Row[]) {
  if (row.observedUnit !== row.productUnit) continue;
  const price = Number(row.avgPrice);
  if (!Number.isFinite(price) || price <= 0) continue;
  const key = `${row.productSlug}|${row.productUnit}`;
  const values = groups.get(key) ?? [];
  values.push(row);
  groups.set(key, values);
}

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle]! : (sorted[middle - 1]! + sorted[middle]!) / 2;
}

function absoluteLimit(unit: string, slug: string): number {
  if (unit === "kasa" || unit === "koli") return 15_000;
  if (slug.includes("balik")) return 12_000;
  return 1_500;
}

const matrix = [...groups.entries()].flatMap(([key, rows]) => {
  if (rows.length < 5) return [];
  const [productSlug, unit] = key.split("|") as [string, string];
  const values = rows.map((row) => Number(row.avgPrice));
  const center = median(values);
  const lower = Math.max(0.01, center * 0.25);
  const upper = Math.min(absoluteLimit(unit, productSlug), center * 4);
  const latest = rows[0]!;
  const latestPrice = Number(latest.avgPrice);
  return [{
    productSlug,
    productName: latest.productName,
    unit,
    sampleCount: rows.length,
    median: Math.round(center * 100) / 100,
    temporaryLower: Math.round(lower * 100) / 100,
    temporaryUpper: Math.round(upper * 100) / 100,
    latestPrice,
    latestSource: latest.sourceApi,
    latestDate: latest.recordedDate instanceof Date ? latest.recordedDate.toISOString().slice(0, 10) : String(latest.recordedDate).slice(0, 10),
    latestOutsideRange: latestPrice < lower || latestPrice > upper,
    latestMedianRatio: Math.round((latestPrice / center) * 100) / 100,
  }];
}).sort((a, b) => a.productSlug.localeCompare(b.productSlug, "tr"));

console.log(JSON.stringify({
  measuredAt: new Date().toISOString(),
  inputRows: raw.length,
  productUnitGroups: matrix.length,
  reviewCandidates: matrix.filter((row) => row.latestOutsideRange),
  matrix,
}, null, 2));

await pool.end();
