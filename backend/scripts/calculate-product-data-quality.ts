/**
 * Calculate hf_products.data_quality from recent market coverage and name hygiene.
 *
 * Usage:
 *   bun scripts/calculate-product-data-quality.ts --dry-run
 *   bun scripts/calculate-product-data-quality.ts --apply
 */
import "dotenv/config";
import { pool } from "../src/db/client";

const args = new Set(process.argv.slice(2));
const shouldApply = args.has("--apply");
const shouldHelp = args.has("--help") || args.has("-h");

if (shouldHelp) {
  console.log(`Usage:
  bun scripts/calculate-product-data-quality.ts [--dry-run] [--apply]

Default mode is --dry-run. --apply updates hf_products.data_quality.
`);
  process.exit(0);
}

// data_quality 0-100 = veri kapsamı (baskın) + tamamlanabilir içerik alanları.
// VERİ ÇEKİRDEĞİ = fiyat(40) + hal(25) = 65 → fiyatsız ürün 70'i geçemez (index-gating korunur).
// İçerik puanı = isim(15, displayName-farkında) + alias(10) + yayınlı editoryel(10).
// İsim kontrolü name_tr yerine displayName varsa onu kullanır → temiz displayName atamak +15 kazandırır.
const scoreSql = `
  LEAST(100,
    CASE WHEN COALESCE(stats.price_rows_30d, 0) >= 1 THEN 40 ELSE 0 END +
    CASE WHEN COALESCE(stats.market_count_30d, 0) >= 3 THEN 25 ELSE 0 END +
    CASE
      WHEN COALESCE(NULLIF(p.display_name, ''), p.name_tr) NOT LIKE '%.%'
       AND COALESCE(NULLIF(p.display_name, ''), p.name_tr) NOT REGEXP '^[[:alpha:]]([.]|[[:space:]])'
      THEN 15 ELSE 0
    END +
    CASE WHEN COALESCE(JSON_LENGTH(p.aliases), 0) >= 1 THEN 10 ELSE 0 END +
    CASE WHEN ed.published_at IS NOT NULL THEN 10 ELSE 0 END
  )
`;

const statsJoin = `
  LEFT JOIN (
    SELECT
      product_id,
      COUNT(*) AS price_rows_30d,
      COUNT(DISTINCT market_id) AS market_count_30d
    FROM hf_price_history
    WHERE recorded_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
    GROUP BY product_id
  ) stats ON stats.product_id = p.id
  LEFT JOIN hf_product_editorial ed ON ed.product_slug = p.slug
`;

async function printSummary(label: string) {
  const [summaryRows] = await pool.query(
    `
      SELECT
        COUNT(*) AS products,
        SUM(CASE WHEN calculated_quality >= 70 THEN 1 ELSE 0 END) AS quality_70_plus,
        SUM(CASE WHEN calculated_quality BETWEEN 40 AND 69 THEN 1 ELSE 0 END) AS quality_40_69,
        SUM(CASE WHEN calculated_quality < 40 THEN 1 ELSE 0 END) AS quality_under_40
      FROM (
        SELECT ${scoreSql} AS calculated_quality
        FROM hf_products p
        ${statsJoin}
        WHERE p.is_active = 1
      ) scored
    `,
  );

  const [sampleRows] = await pool.query(
    `
      SELECT p.slug, p.name_tr, ${scoreSql} AS calculated_quality,
             COALESCE(stats.price_rows_30d, 0) AS price_rows_30d,
             COALESCE(stats.market_count_30d, 0) AS market_count_30d
      FROM hf_products p
      ${statsJoin}
      WHERE p.is_active = 1
      ORDER BY calculated_quality DESC, p.display_order ASC, p.slug ASC
      LIMIT 20
    `,
  );

  console.log(`[data-quality] ${label}`);
  console.table(summaryRows);
  console.table(sampleRows);
}

async function main() {
  await printSummary("dry-run");

  if (!shouldApply) {
    console.log("[data-quality] DB'ye yazmak için --apply kullan.");
    return;
  }

  const [result] = await pool.query(
    `
      UPDATE hf_products p
      ${statsJoin}
      SET p.data_quality = ${scoreSql}
      WHERE p.is_active = 1
    `,
  );

  const changedRows = "changedRows" in Object(result) ? result.changedRows : undefined;
  const affectedRows = "affectedRows" in Object(result) ? result.affectedRows : undefined;
  console.log(`[data-quality] affected=${affectedRows ?? "?"} changed=${changedRows ?? "?"}`);
  await printSummary("after-apply");
}

main()
  .catch((err) => {
    console.error("[data-quality] Fatal:", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
