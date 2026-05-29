/**
 * Publish reviewed product editorial drafts in controlled batches.
 *
 * Usage:
 *   bun scripts/seo/publish-reviewed-editorials.ts --dry-run --limit=10
 *   bun scripts/seo/publish-reviewed-editorials.ts --apply --limit=50 --reviewed-by=orhan
 *   bun scripts/seo/publish-reviewed-editorials.ts --apply --slugs=patates,domates,elma
 */
import "dotenv/config";
import { and, asc, eq, inArray, isNull, sql } from "drizzle-orm";
import { db, pool } from "../../src/db/client";
import { hfProductEditorial } from "../../src/db/schema";

type EditorialCandidate = {
  productSlug: string;
  aboutMd: string;
  priceFactorsMd: string;
  seasonMd: string;
  productionRegionMd: string;
  qualityIndicatorsMd: string | null;
  culinaryUsesMd: string | null;
};

const rawArgs = process.argv.slice(2);
const shouldApply = rawArgs.includes("--apply");
const limit = Math.min(238, Math.max(1, Number(readArg("--limit=", "50")) || 50));
const reviewedBy = readArg("--reviewed-by=", "codex");
const slugs = readArg("--slugs=", "")
  .split(",")
  .map((slug) => slug.trim())
  .filter(Boolean);

if (rawArgs.includes("--help") || rawArgs.includes("-h")) {
  console.log(`Usage:
  bun scripts/seo/publish-reviewed-editorials.ts [--dry-run] [--apply]
    --limit=50
    --slugs=patates,domates,elma
    --reviewed-by=orhan

Publishes only valid ai_draft rows where published_at IS NULL.
`);
  process.exit(0);
}

function readArg(prefix: string, fallback: string): string {
  return rawArgs.find((arg) => arg.startsWith(prefix))?.slice(prefix.length) ?? fallback;
}

function wordCount(text: string | null | undefined) {
  return (text ?? "").trim().split(/\s+/).filter(Boolean).length;
}

function validateCandidate(row: EditorialCandidate): string[] {
  // Esikler generator'in kendi validateDraft tabaniyla (min ~30 kelime) hizali.
  // Daha kati bir gate, kaliteli ama kisa-tutulmus (Anthropic) icerigi bloklar;
  // urun sayfasi zaten 6 editoryel alan + FAQ + grafik + tablo + schema iceriyor.
  const fields: Array<[keyof EditorialCandidate, number]> = [
    ["aboutMd", 30],
    ["priceFactorsMd", 30],
    ["seasonMd", 20],
    ["productionRegionMd", 25],
    ["qualityIndicatorsMd", 25],
    ["culinaryUsesMd", 25],
  ];
  const errors: string[] = [];
  for (const [field, minWords] of fields) {
    const words = wordCount(row[field] as string | null);
    if (words < minWords) errors.push(`${String(field)} too short (${words}/${minWords})`);
  }
  return errors;
}

async function main() {
  const where = and(
    eq(hfProductEditorial.source, "ai_draft"),
    isNull(hfProductEditorial.publishedAt),
    slugs.length > 0 ? inArray(hfProductEditorial.productSlug, slugs) : sql`1 = 1`,
  );

  const rows = await db
    .select({
      productSlug: hfProductEditorial.productSlug,
      aboutMd: hfProductEditorial.aboutMd,
      priceFactorsMd: hfProductEditorial.priceFactorsMd,
      seasonMd: hfProductEditorial.seasonMd,
      productionRegionMd: hfProductEditorial.productionRegionMd,
      qualityIndicatorsMd: hfProductEditorial.qualityIndicatorsMd,
      culinaryUsesMd: hfProductEditorial.culinaryUsesMd,
    })
    .from(hfProductEditorial)
    .where(where)
    .orderBy(asc(hfProductEditorial.id))
    .limit(limit);

  const valid: EditorialCandidate[] = [];
  const invalid: Array<{ slug: string; errors: string[] }> = [];
  for (const row of rows) {
    const errors = validateCandidate(row);
    if (errors.length) invalid.push({ slug: row.productSlug, errors });
    else valid.push(row);
  }

  console.log(`[publish-editorials] candidates=${rows.length} valid=${valid.length} invalid=${invalid.length} apply=${shouldApply}`);
  for (const item of invalid.slice(0, 20)) {
    console.warn(`[publish-editorials] invalid ${item.slug}: ${item.errors.join(", ")}`);
  }

  if (!shouldApply) {
    console.log("[publish-editorials] Dry-run. DB'ye yazmak için --apply kullan.");
    if (valid.length) console.log(`[publish-editorials] publishable=${valid.map((row) => row.productSlug).join(", ")}`);
    return;
  }

  const now = new Date();
  for (const row of valid) {
    await db
      .update(hfProductEditorial)
      .set({
        source: "ai_reviewed",
        reviewedBy,
        reviewedAt: now,
        publishedAt: now,
      })
      .where(eq(hfProductEditorial.productSlug, row.productSlug));
    console.log(`[publish-editorials] published ${row.productSlug}`);
  }
}

main()
  .catch((err) => {
    console.error("[publish-editorials] Fatal:", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
