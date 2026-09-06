/** Read-only retail evidence. Run from backend: bun scripts/qa/retail-audit.ts */
import { pool } from "@/db/client";

const queries: Record<string, string> = {
  clock: `SELECT UTC_TIMESTAMP() AS observed_at, CURDATE() AS database_date`,
  chains: `SELECT chain_slug, COUNT(*) AS records, COUNT(DISTINCT product_id) AS products,
    MIN(recorded_date) AS first_date, MAX(recorded_date) AS last_date,
    SUM(recorded_date >= CURDATE() - INTERVAL 5 DAY) AS recent_records
    FROM hf_retail_prices GROUP BY chain_slug`,
  daily: `SELECT recorded_date, COUNT(*) AS records, COUNT(DISTINCT product_id) AS products,
    COUNT(DISTINCT chain_slug) AS chains FROM hf_retail_prices
    WHERE recorded_date >= CURDATE() - INTERVAL 14 DAY GROUP BY recorded_date ORDER BY recorded_date`,
  units: `SELECT rp.unit, p.unit AS product_unit, COUNT(*) AS records
    FROM hf_retail_prices rp LEFT JOIN hf_products p ON p.id=rp.product_id
    WHERE rp.recorded_date >= CURDATE() - INTERVAL 5 DAY GROUP BY rp.unit,p.unit`,
  samples: `SELECT p.slug,rp.chain_slug,rp.price,rp.unit,rp.recorded_date,rp.product_name_raw,rp.product_url
    FROM hf_retail_prices rp JOIN hf_products p ON p.id=rp.product_id
    WHERE rp.recorded_date >= CURDATE() - INTERVAL 5 DAY
    AND p.slug IN ('domates','patates','salatalik','limon','sogan','sogan-kuru','muz','sut','dana-kiyma')
    ORDER BY p.slug,rp.chain_slug,rp.recorded_date DESC`,
  suspicious_names: `SELECT p.slug,rp.chain_slug,rp.price,rp.unit,p.unit AS product_unit,rp.recorded_date,rp.product_name_raw
    FROM hf_retail_prices rp JOIN hf_products p ON p.id=rp.product_id
    WHERE rp.recorded_date >= CURDATE() - INTERVAL 5 DAY
    AND (rp.unit <> p.unit OR rp.product_name_raw REGEXP 'Adet|Demet|Paket|[0-9] ?[gG][rR]') LIMIT 70`,
  quarantine: `SELECT reason_code,status,COUNT(*) AS records,MAX(recorded_date) AS last_date
    FROM hf_retail_price_quarantine GROUP BY reason_code,status`,
  provenance: `SELECT COUNT(*) AS records,SUM(product_url IS NULL OR product_url='') AS missing_url,
    SUM(product_id IS NULL) AS unmatched,SUM(recorded_date > CURDATE()) AS future_date
    FROM hf_retail_prices WHERE recorded_date >= CURDATE() - INTERVAL 5 DAY`,
};
try {
  const output: Record<string, unknown> = {};
  for (const [name, sql] of Object.entries(queries)) {
    const [rows] = await pool.query(sql);
    output[name] = rows;
  }
  console.log(JSON.stringify(output, null, 2));
} finally { await pool.end(); }
