/**
 * Apply the firm SEO quality gate.
 *
 * Usage:
 *   bun scripts/firms/apply-firm-seo-index.ts --dry-run
 *   bun scripts/firms/apply-firm-seo-index.ts --apply
 *
 * Rule from docs/codex-briefs/firma-seo.md F5:
 * seo_index=1 iff the approved, active firm has a city and at least one
 * firm-specific quality signal: 3+ products, a 120+ char description, or a
 * verified claim. Generic NAP-only firm pages stay noindex.
 */
import "dotenv/config";
import { pool } from "../../src/db/client";
import { submitToIndexNow } from "../../src/modules/indexnow/index";

type CandidateRow = {
  id: number;
  slug: string;
  name: string;
  city_slug: string | null;
  seo_index: number;
  next_seo_index: number;
  product_count: number;
  description_len: number;
  claim_status: string;
};

const args = new Set(process.argv.slice(2));
const shouldApply = args.has("--apply");
const shouldHelp = args.has("--help") || args.has("-h");

if (shouldHelp) {
  console.log(`Usage:
  bun scripts/firms/apply-firm-seo-index.ts [--dry-run] [--apply]

Default mode is --dry-run. --apply updates hf_firms.seo_index and pings IndexNow.
`);
  process.exit(0);
}

const eligibilitySql = `
  CASE
    WHEN f.is_active = 1
     AND f.status = 'approved'
     AND f.city_slug IS NOT NULL
     AND f.city_slug <> ''
     AND (
       COALESCE(fp.product_count, 0) >= 3
       OR CHAR_LENGTH(COALESCE(f.description, '')) >= 120
       OR f.claim_status = 'verified'
     )
    THEN 1 ELSE 0
  END
`;

const productCountJoin = `
  LEFT JOIN (
    SELECT firm_id, COUNT(*) AS product_count
    FROM hf_firm_products
    GROUP BY firm_id
  ) fp ON fp.firm_id = f.id
`;

function siteUrl(): string {
  return (process.env.INDEXNOW_SITE_URL || process.env.FRONTEND_URL || process.env.NEXT_PUBLIC_SITE_URL || "https://haldefiyat.com").replace(/\/$/, "");
}

async function fetchChangedRows(): Promise<CandidateRow[]> {
  const [rows] = await pool.query(
    `
      SELECT
        f.id,
        f.slug,
        f.name,
        f.city_slug,
        f.seo_index,
        ${eligibilitySql} AS next_seo_index,
        COALESCE(fp.product_count, 0) AS product_count,
        CHAR_LENGTH(COALESCE(f.description, '')) AS description_len,
        f.claim_status
      FROM hf_firms f
      ${productCountJoin}
      WHERE f.seo_index <> ${eligibilitySql}
      ORDER BY next_seo_index DESC, product_count DESC, description_len DESC, f.name ASC
    `,
  );
  return rows as CandidateRow[];
}

function printRows(rows: CandidateRow[]) {
  console.table(rows.slice(0, 30).map((row) => ({
    slug: row.slug,
    current: row.seo_index,
    next: row.next_seo_index,
    products: row.product_count,
    descriptionLen: row.description_len,
    claim: row.claim_status,
  })));
  if (rows.length > 30) console.log(`[firm-seo] ... ${rows.length - 30} satir daha`);
}

async function applyChanges() {
  const [result] = await pool.query(
    `
      UPDATE hf_firms f
      ${productCountJoin}
      SET f.seo_index = ${eligibilitySql}
      WHERE f.seo_index <> ${eligibilitySql}
    `,
  );

  const affectedRows = "affectedRows" in Object(result) ? result.affectedRows : undefined;
  const changedRows = "changedRows" in Object(result) ? result.changedRows : undefined;
  console.log(`[firm-seo] affected=${affectedRows ?? "?"} changed=${changedRows ?? "?"}`);
}

async function main() {
  const changed = await fetchChangedRows();
  const enabling = changed.filter((row) => Number(row.next_seo_index) === 1);
  const disabling = changed.filter((row) => Number(row.next_seo_index) === 0);

  console.log(`[firm-seo] mode=${shouldApply ? "apply" : "dry-run"} changed=${changed.length} enable=${enabling.length} disable=${disabling.length}`);
  printRows(changed);

  if (!shouldApply) {
    console.log("[firm-seo] DB'ye yazmak icin --apply kullan.");
    return;
  }

  await applyChanges();

  const changedUrls = changed.map((row) => `${siteUrl()}/firma/${row.slug}`);
  const indexNow = await submitToIndexNow(changedUrls);
  console.log(`[firm-seo] indexnow=${JSON.stringify(indexNow)}`);
}

main()
  .catch((err) => {
    console.error("[firm-seo] Fatal:", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
