/**
 * Flip seoIndex for products that have published editorial content.
 *
 * Usage:
 *   bun scripts/seo/apply-published-editorial-seo.ts --dry-run
 *   bun scripts/seo/apply-published-editorial-seo.ts --apply
 */
import "dotenv/config";
import { and, eq, isNotNull, or, sql } from "drizzle-orm";
import { db, pool } from "../../src/db/client";
import { hfProductEditorial, hfProducts } from "../../src/db/schema";

const rawArgs = process.argv.slice(2);
const shouldApply = rawArgs.includes("--apply");

if (rawArgs.includes("--help") || rawArgs.includes("-h")) {
  console.log(`Usage:
  bun scripts/seo/apply-published-editorial-seo.ts [--dry-run] [--apply]

Sets seo_index=1 only for active, non-canonical products with published editorial.
`);
  process.exit(0);
}

async function main() {
  const candidates = await db
    .select({ slug: hfProducts.slug })
    .from(hfProducts)
    .innerJoin(hfProductEditorial, eq(hfProductEditorial.productSlug, hfProducts.slug))
    .where(and(
      eq(hfProducts.isActive, 1),
      isNotNull(hfProductEditorial.publishedAt),
      or(isNullishCanonical(), eq(hfProducts.canonicalSlug, "")),
    ));

  console.log(`[published-seo] candidates=${candidates.length} apply=${shouldApply}`);
  console.log(`[published-seo] first=${candidates.slice(0, 30).map((row) => row.slug).join(", ")}`);

  if (!shouldApply) {
    console.log("[published-seo] Dry-run. DB'ye yazmak için --apply kullan.");
    return;
  }

  await db
    .update(hfProducts)
    .set({ seoIndex: 1 })
    .where(sql`${hfProducts.slug} IN (
      SELECT product_slug FROM hf_product_editorial
      WHERE published_at IS NOT NULL
    ) AND ${hfProducts.isActive} = 1
      AND (${hfProducts.canonicalSlug} IS NULL OR ${hfProducts.canonicalSlug} = '')`);

  console.log(`[published-seo] applied=${candidates.length}`);
}

function isNullishCanonical() {
  return sql`${hfProducts.canonicalSlug} IS NULL`;
}

main()
  .catch((err) => {
    console.error("[published-seo] Fatal:", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
