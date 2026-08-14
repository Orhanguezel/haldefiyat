import { pool } from "../../src/db/client";
import { canonicalUnit } from "../../src/modules/etl/canonical-contract";

type FrequencyRow = {
  sourceApi: string;
  rawUnit: string;
  productUnit: string;
  rowCount: number | string;
  productCount: number | string;
  firstDate: string | Date;
  lastDate: string | Date;
};

const [rawRows] = await pool.query(`
  SELECT
    ph.source_api AS sourceApi,
    ph.unit AS rawUnit,
    p.unit AS productUnit,
    COUNT(*) AS rowCount,
    COUNT(DISTINCT ph.product_id) AS productCount,
    MIN(ph.recorded_date) AS firstDate,
    MAX(ph.recorded_date) AS lastDate
  FROM hf_price_history ph
  INNER JOIN hf_products p ON p.id = ph.product_id
  GROUP BY ph.source_api, ph.unit, p.unit
  ORDER BY COUNT(*) DESC
`);

const rows = (rawRows as FrequencyRow[]).map((row) => {
  const observed = canonicalUnit(row.rawUnit) ?? row.rawUnit.trim().toLocaleLowerCase("tr");
  const expected = canonicalUnit(row.productUnit) ?? row.productUnit.trim().toLocaleLowerCase("tr");
  return {
    ...row,
    rowCount: Number(row.rowCount),
    productCount: Number(row.productCount),
    firstDate: row.firstDate instanceof Date ? row.firstDate.toISOString().slice(0, 10) : String(row.firstDate).slice(0, 10),
    lastDate: row.lastDate instanceof Date ? row.lastDate.toISOString().slice(0, 10) : String(row.lastDate).slice(0, 10),
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
