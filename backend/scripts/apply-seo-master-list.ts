/**
 * Apply product SEO master decisions from CSV files.
 *
 * Usage:
 *   bun scripts/apply-seo-master-list.ts --dry-run
 *   bun scripts/apply-seo-master-list.ts --masters=data/seo/master-slugs.csv --mapping=data/seo/manual-name-mapping.csv --apply
 *
 * CSV formats:
 *   master-slugs.csv: cluster,master_slug,display_name,search_volume,notes
 *   manual-name-mapping.csv: slug,display_name,canonical_slug,seo_index,notes
 */
import "dotenv/config";
import { eq } from "drizzle-orm";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { db, pool } from "../src/db/client";
import { hfProducts } from "../src/db/schema";

type ProductRow = {
  slug: string;
  nameTr: string;
  displayName: string | null;
  canonicalSlug: string | null;
  seoIndex: number;
  dataQuality: number;
  searchVolume: number;
};

type MasterDecision = {
  masterSlug: string;
  displayName?: string | null;
  searchVolume?: number;
};

type MappingDecision = {
  displayName?: string | null;
  canonicalSlug?: string | null;
  seoIndex?: number;
  isActive?: number;
};

type UpdateDecision = {
  slug: string;
  displayName?: string | null;
  canonicalSlug?: string | null;
  seoIndex?: number;
  isActive?: number;
  searchVolume?: number;
};

const rawArgs = process.argv.slice(2);
if (rawArgs.includes("--help") || rawArgs.includes("-h")) {
  console.log(`Usage:
  bun scripts/apply-seo-master-list.ts [--dry-run] [--apply]
    --masters=data/seo/master-slugs.csv
    --mapping=data/seo/manual-name-mapping.csv
`);
  process.exit(0);
}

const shouldApply = rawArgs.includes("--apply");
const mastersPath = readArg("--masters=") ?? "data/seo/master-slugs.csv";
const mappingPath = readArg("--mapping=") ?? "data/seo/manual-name-mapping.csv";

function readArg(prefix: string): string | undefined {
  return rawArgs.find((arg) => arg.startsWith(prefix))?.slice(prefix.length);
}

function parseCsvLine(line: string): string[] {
  const cells: string[] = [];
  let current = "";
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    const next = line[i + 1];
    if (ch === '"' && quoted && next === '"') {
      current += '"';
      i++;
      continue;
    }
    if (ch === '"') {
      quoted = !quoted;
      continue;
    }
    if (ch === "," && !quoted) {
      cells.push(current.trim());
      current = "";
      continue;
    }
    current += ch;
  }
  cells.push(current.trim());
  return cells;
}

function readCsv(path: string): Array<Record<string, string>> {
  const absolute = resolve(process.cwd(), path);
  if (!existsSync(absolute)) return [];
  const lines = readFileSync(absolute, "utf8")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"));
  if (lines.length < 2) return [];
  const header = parseCsvLine(lines[0]!);
  return lines.slice(1).map((line) => {
    const cells = parseCsvLine(line);
    return Object.fromEntries(header.map((key, i) => [key, cells[i] ?? ""]));
  });
}

function titleCaseTr(input: string): string {
  return input
    .toLocaleLowerCase("tr-TR")
    .split(/(\s|-)/)
    .map((part) => (/^\s|-$/u.test(part) || !part ? part : part.charAt(0).toLocaleUpperCase("tr-TR") + part.slice(1)))
    .join("")
    .trim();
}

function clusterOf(slug: string): string {
  return slug.split("-")[0] ?? slug;
}

function isTrashVariant(slug: string): boolean {
  return /(^|-)(muhtelif|diger|ikinci|ii|iii|iyi-tarim|kg|adet|1-sinif|2-sinif|sinif-1|sinif-2|sofralik|normal|standart)(-|$)/u.test(slug);
}

function loadMasterDecisions(path: string): Map<string, MasterDecision> {
  const decisions = new Map<string, MasterDecision>();
  for (const row of readCsv(path)) {
    const cluster = row.cluster?.trim();
    const masterSlug = row.master_slug?.trim();
    if (!cluster || !masterSlug) continue;
    decisions.set(cluster, {
      masterSlug,
      displayName: row.display_name?.trim() || null,
      searchVolume: row.search_volume ? Number(row.search_volume) || 0 : undefined,
    });
  }
  return decisions;
}

function loadMappingDecisions(path: string): Map<string, MappingDecision> {
  const decisions = new Map<string, MappingDecision>();
  for (const row of readCsv(path)) {
    const slug = row.slug?.trim();
    if (!slug) continue;
    decisions.set(slug, {
      displayName: row.display_name?.trim() || undefined,
      canonicalSlug: row.canonical_slug?.trim() || null,
      seoIndex: row.seo_index === "" ? undefined : Number(row.seo_index) || 0,
      isActive: row.is_active === "" ? undefined : Number(row.is_active) || 0,
    });
  }
  return decisions;
}

function buildUpdate(
  product: ProductRow,
  masters: Map<string, MasterDecision>,
  mappings: Map<string, MappingDecision>,
): UpdateDecision | null {
  const mapped = mappings.get(product.slug);
  const cluster = clusterOf(product.slug);
  const master = masters.get(cluster);
  const isMaster = master?.masterSlug === product.slug;

  if (mapped) {
    return {
      slug: product.slug,
      displayName: mapped.displayName,
      canonicalSlug: mapped.canonicalSlug,
      seoIndex: mapped.seoIndex,
      isActive: mapped.isActive,
    };
  }

  if (isMaster) {
    const displayName = master.displayName || product.displayName || titleCaseTr(product.nameTr);
    return {
      slug: product.slug,
      displayName,
      canonicalSlug: null,
      seoIndex: product.dataQuality >= 70 && displayName ? 1 : 0,
      searchVolume: master.searchVolume,
    };
  }

  if (master && isTrashVariant(product.slug)) {
    return {
      slug: product.slug,
      canonicalSlug: master.masterSlug,
      seoIndex: 0,
    };
  }

  return null;
}

async function main() {
  const masters = loadMasterDecisions(mastersPath);
  const mappings = loadMappingDecisions(mappingPath);

  const rows = await db
    .select({
      slug: hfProducts.slug,
      nameTr: hfProducts.nameTr,
      displayName: hfProducts.displayName,
      canonicalSlug: hfProducts.canonicalSlug,
      seoIndex: hfProducts.seoIndex,
      dataQuality: hfProducts.dataQuality,
      searchVolume: hfProducts.searchVolume,
    })
    .from(hfProducts)
    .where(eq(hfProducts.isActive, 1));

  const updates = rows
    .map((row) => buildUpdate(row, masters, mappings))
    .filter((row): row is UpdateDecision => row !== null);

  const existingSlugs = new Set(rows.map((row) => row.slug));
  const skippedMissingCanonical = updates.filter(
    (row) => row.canonicalSlug && !existingSlugs.has(row.canonicalSlug),
  );
  const applicableUpdates = updates.filter(
    (row) => !row.canonicalSlug || existingSlugs.has(row.canonicalSlug),
  );

  const missingMasters = [...masters.values()]
    .map((master) => master.masterSlug)
    .filter((slug) => !existingSlugs.has(slug));

  console.log(`[seo-master] products=${rows.length}`);
  console.log(`[seo-master] masters=${masters.size}`);
  console.log(`[seo-master] mappings=${mappings.size}`);
  console.log(`[seo-master] updates=${updates.length}`);
  console.log(`[seo-master] applicable_updates=${applicableUpdates.length}`);
  console.log(`[seo-master] skipped_missing_canonical=${skippedMissingCanonical.length}`);
  console.log(`[seo-master] missing_masters=${missingMasters.length}`);

  if (!shouldApply) {
    console.log("\n[seo-master] Dry-run. İlk 30 update:");
    for (const update of applicableUpdates.slice(0, 30)) {
      console.log(`  ${update.slug} display=${update.displayName ?? ""} canonical=${update.canonicalSlug ?? ""} seo=${update.seoIndex ?? ""} active=${update.isActive ?? ""}`);
    }
    if (skippedMissingCanonical.length) {
      console.log("\n[seo-master] Eksik canonical hedefi nedeniyle atlananlar:");
      for (const update of skippedMissingCanonical.slice(0, 30)) {
        console.log(`  ${update.slug} -> ${update.canonicalSlug}`);
      }
    }
    if (missingMasters.length) {
      console.log("\n[seo-master] Eksik master slug'lar:");
      console.log(`  ${missingMasters.slice(0, 30).join(", ")}`);
    }
    console.log("\n[seo-master] DB'ye yazmak için --apply kullan.");
    return;
  }

  if (skippedMissingCanonical.length) {
    console.warn("[seo-master] Eksik canonical hedefleri atlandi:");
    for (const update of skippedMissingCanonical.slice(0, 30)) {
      console.warn(`  ${update.slug} -> ${update.canonicalSlug}`);
    }
  }

  for (const batch of chunk(applicableUpdates, 50)) {
    const slugs = batch.map((row) => row.slug);
    for (const update of batch) {
      await db.update(hfProducts).set({
        ...(update.displayName !== undefined && { displayName: update.displayName }),
        ...(update.canonicalSlug !== undefined && { canonicalSlug: update.canonicalSlug }),
        ...(update.seoIndex !== undefined && { seoIndex: update.seoIndex }),
        ...(update.isActive !== undefined && { isActive: update.isActive }),
        ...(update.searchVolume !== undefined && { searchVolume: update.searchVolume }),
      }).where(eq(hfProducts.slug, update.slug));
    }
    console.log(`[seo-master] applied batch=${slugs.length}`);
  }
}

function chunk<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) chunks.push(items.slice(i, i + size));
  return chunks;
}

main()
  .catch((err) => {
    console.error("[seo-master] Fatal:", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
