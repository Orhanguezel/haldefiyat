import { pool } from "../../src/db/client";
import { canonicalUnit } from "../../src/modules/etl/canonical-contract";

type FrequencyRow = {
  sourceApi: string;
  rawUnit: string;
  productUnit: string;
  rowCount: number | string;
};

// Source-by-source aggregation deliberately uses the source index. A single
// global GROUP BY on the million-row history can create a very large MySQL
// temporary file on small production hosts.
const [sourceRows] = await pool.query("SELECT DISTINCT source_api AS sourceApi FROM hf_price_history ORDER BY source_api");
const rawRows: FrequencyRow[] = [];
for (const source of sourceRows as Array<{ sourceApi: string }>) {
  const [rows] = await pool.query(`
    SELECT
      ph.source_api AS sourceApi,
      ph.unit AS rawUnit,
      p.unit AS productUnit,
      COUNT(*) AS rowCount
    FROM hf_price_history ph FORCE INDEX (hf_ph_source_api)
    INNER JOIN hf_products p ON p.id = ph.product_id
    WHERE ph.source_api = ?
    GROUP BY ph.unit, p.unit
  `, [source.sourceApi]);
  rawRows.push(...rows as FrequencyRow[]);
}

const rows = rawRows.map((row) => {
  const observed = canonicalUnit(row.rawUnit) ?? row.rawUnit.trim().toLocaleLowerCase("tr");
  const expected = canonicalUnit(row.productUnit) ?? row.productUnit.trim().toLocaleLowerCase("tr");
  return {
    ...row,
    rowCount: Number(row.rowCount),
    normalizedObservedUnit: observed,
    normalizedProductUnit: expected,
    publicEligible: observed === expected,
  };
});

const totalRows = rows.reduce((sum, row) => sum + row.rowCount, 0);
const excludedRows = rows.filter((row) => !row.publicEligible).reduce((sum, row) => sum + row.rowCount, 0);
const bySource = [...new Set(rows.map((row) => row.sourceApi))].map((sourceApi) => {
  const sourceRows = rows.filter((row) => row.sourceApi === sourceApi);
  const total = sourceRows.reduce((sum, row) => sum + row.rowCount, 0);
  const excluded = sourceRows.filter((row) => !row.publicEligible).reduce((sum, row) => sum + row.rowCount, 0);
  return { sourceApi, totalRows: total, excludedRows: excluded, excludedPct: total ? Math.round(excluded * 10_000 / total) / 100 : 0 };
}).sort((a, b) => b.totalRows - a.totalRows);

console.log(JSON.stringify({
  measuredAt: new Date().toISOString(),
  totalRows,
  publicEligibleRows: totalRows - excludedRows,
  excludedRows,
  excludedPct: totalRows ? Math.round(excludedRows * 10_000 / totalRows) / 100 : 0,
  bySource,
  mismatchCohorts: rows.filter((row) => !row.publicEligible).sort((a, b) => b.rowCount - a.rowCount),
  frequency: rows,
}, null, 2));

await pool.end();
