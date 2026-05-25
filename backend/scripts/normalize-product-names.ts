/**
 * hf_products.name_tr -> display_name normalizer.
 *
 * Usage:
 *   bun scripts/normalize-product-names.ts --dry-run
 *   bun scripts/normalize-product-names.ts --apply
 *   bun scripts/normalize-product-names.ts --csv=data/seo/manual-name-mapping.csv --apply
 */
import "dotenv/config";
import { and, eq } from "drizzle-orm";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { PRODUCT_NAME_ABBREVIATIONS } from "../src/config/name-abbreviations";
import { db, pool } from "../src/db/client";
import { hfProducts } from "../src/db/schema";

type ProductRow = {
  id: number;
  slug: string;
  nameTr: string;
};

type ManualMapping = {
  displayName?: string | null;
  canonicalSlug?: string | null;
  seoIndex?: number;
  isActive?: number;
  notes?: string;
};

type NormalizedProduct = {
  slug: string;
  nameTr: string;
  displayName: string | null;
  canonicalSlug: string | null;
  seoIndex: number;
  isActive?: number;
  suspicious: boolean;
  notes: string[];
};

const args = new Set(process.argv.slice(2).filter((arg) => !arg.startsWith("--csv=")));
const csvArg = process.argv.slice(2).find((arg) => arg.startsWith("--csv="));
const csvPath = csvArg?.split("=", 2)[1] ?? "data/seo/manual-name-mapping.csv";
const shouldApply = args.has("--apply");
const shouldHelp = args.has("--help") || args.has("-h");

if (shouldHelp) {
  console.log(`Usage:
  bun scripts/normalize-product-names.ts [--dry-run] [--apply] [--csv=data/seo/manual-name-mapping.csv]

Default mode is --dry-run. --apply updates display_name, canonical_slug and seo_index.
`);
  process.exit(0);
}

function cleanupPunctuation(input: string): string {
  return input
    .replace(/\s+/g, " ")
    .replace(/\s*\(\s*/g, " (")
    .replace(/\s*\)\s*/g, ") ")
    .replace(/\(\s*\.{2,}\s*\)/g, "")
    .replace(/\(\s*(kg\.?|kilogram|adet|ad\.?|bag|bağ|demet)\s*\)/giu, "")
    .replace(/\s*\(\s*(muhtelif|diğer|diger)\s*\)\s*/giu, " ")
    .replace(/\s*\(?\s*(1|2|3)\.?\s*s[ıi]n[ıi]f\s*\)?/giu, "")
    .replace(/\s+\(?I+\)?\.?$/gu, "")
    .replace(/[.。\s]+$/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}

function applyAbbreviations(input: string): string {
  return PRODUCT_NAME_ABBREVIATIONS.reduce((value, rule) => {
    const re = new RegExp(rule.pattern, "giu");
    return value.replace(re, rule.replacement);
  }, input).replace(/\s+/g, " ").trim();
}

function titleCaseTr(input: string): string {
  return input
    .toLocaleLowerCase("tr-TR")
    .split(/(\s|\(|\)|-|,)/)
    .map((part) => {
      if (!part || /^\s+$/.test(part) || /^[()\-,]+$/.test(part)) return part;
      return part.charAt(0).toLocaleUpperCase("tr-TR") + part.slice(1);
    })
    .join("")
    .replace(/\(\s+/g, "(")
    .replace(/\s+\)/g, ")")
    .replace(/\s+/g, " ")
    .trim();
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

function readManualMappings(path: string): Map<string, ManualMapping> {
  const absolute = resolve(process.cwd(), path);
  if (!existsSync(absolute)) return new Map();

  const lines = readFileSync(absolute, "utf8")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"));
  if (lines.length === 0) return new Map();

  const header = parseCsvLine(lines[0]!).map((cell) => cell.trim());
  const index = (name: string) => header.indexOf(name);
  const slugIdx = index("slug");
  const displayIdx = index("display_name");
  const canonicalIdx = index("canonical_slug");
  const seoIdx = index("seo_index");
  const activeIdx = index("is_active");
  const notesIdx = index("notes");

  const mappings = new Map<string, ManualMapping>();
  for (const line of lines.slice(1)) {
    const cells = parseCsvLine(line);
    const slug = cells[slugIdx]?.trim();
    if (!slug) continue;
    mappings.set(slug, {
      displayName: displayIdx >= 0 ? cells[displayIdx]?.trim() || null : undefined,
      canonicalSlug: canonicalIdx >= 0 ? cells[canonicalIdx]?.trim() || null : undefined,
      seoIndex: seoIdx >= 0 && cells[seoIdx] !== "" ? Number(cells[seoIdx]) : undefined,
      isActive: activeIdx >= 0 && cells[activeIdx] !== "" ? Number(cells[activeIdx]) : undefined,
      notes: notesIdx >= 0 ? cells[notesIdx]?.trim() : undefined,
    });
  }
  return mappings;
}

function baseSlugForQualityVariant(slug: string): string | null {
  return slug
    .replace(/-(1|2|3)-?sinif$/u, "")
    .replace(/-(i|ii|iii)$/u, "")
    .replace(/-muhtelif$/u, "")
    .replace(/-diger$/u, "") || null;
}

function isSuspicious(displayName: string, cleaned: string): boolean {
  return (
    displayName.length < 2 ||
    /[?]/u.test(displayName) ||
    /^[A-ZÇĞİÖŞÜ]\.?(\s|$)/u.test(cleaned.trim()) ||
    /(^|\s)[A-ZÇĞİÖŞÜ]\.?($|\s)/u.test(cleaned.trim()) ||
    displayName.includes(".")
  );
}

function normalizeProduct(row: ProductRow, mappings: Map<string, ManualMapping>): NormalizedProduct {
  const manual = mappings.get(row.slug);
  const notes: string[] = [];

  let cleaned = cleanupPunctuation(row.nameTr);
  cleaned = applyAbbreviations(cleaned);
  const automaticDisplayName = cleaned ? titleCaseTr(cleaned) : null;
  const baseSlug = baseSlugForQualityVariant(row.slug);

  let displayName = manual?.displayName !== undefined
    ? manual.displayName
    : automaticDisplayName;
  let canonicalSlug = manual?.canonicalSlug !== undefined
    ? manual.canonicalSlug
    : baseSlug && baseSlug !== row.slug
      ? baseSlug
      : null;

  const suspicious = displayName ? isSuspicious(displayName, cleaned) : true;
  if (suspicious && manual?.displayName === undefined) {
    notes.push("manual_review");
    displayName = null;
  }
  if (canonicalSlug === row.slug) canonicalSlug = null;
  if (baseSlug && canonicalSlug) notes.push("quality_variant");
  if (manual?.notes) notes.push(manual.notes);

  return {
    slug: row.slug,
    nameTr: row.nameTr,
    displayName,
    canonicalSlug,
    seoIndex: manual?.seoIndex ?? 0,
    isActive: manual?.isActive,
    suspicious,
    notes,
  };
}

async function main() {
  const mappings = readManualMappings(csvPath);
  const rows = await db
    .select({ id: hfProducts.id, slug: hfProducts.slug, nameTr: hfProducts.nameTr })
    .from(hfProducts)
    .where(eq(hfProducts.isActive, 1))
    .orderBy(hfProducts.slug);

  const normalized = rows.map((row) => normalizeProduct(row, mappings));
  const suspicious = normalized.filter((row) => row.suspicious);
  const canonicalized = normalized.filter((row) => row.canonicalSlug);

  console.log(`[normalize] products=${normalized.length}`);
  console.log(`[normalize] csv_mappings=${mappings.size}`);
  console.log(`[normalize] display_name=${normalized.filter((row) => row.displayName).length}`);
  console.log(`[normalize] canonical_slug=${canonicalized.length}`);
  console.log(`[normalize] manual_review=${suspicious.length}`);

  if (!shouldApply) {
    console.log("\n[normalize] Dry-run. İlk 20 manuel inceleme adayı:");
    for (const row of suspicious.slice(0, 20)) {
      console.log(`  ${row.slug},${row.nameTr},${row.notes.join("|")}`);
    }
    console.log("\n[normalize] DB'ye yazmak için --apply kullan.");
    return;
  }

  for (const row of normalized) {
    await db
      .update(hfProducts)
      .set({
        displayName: row.displayName,
        canonicalSlug: row.canonicalSlug,
        seoIndex: row.seoIndex,
        ...(row.isActive !== undefined && { isActive: row.isActive }),
      })
      .where(and(eq(hfProducts.slug, row.slug), eq(hfProducts.isActive, 1)));
  }

  console.log(`[normalize] Applied ${normalized.length} product updates.`);
}

main()
  .catch((err) => {
    console.error("[normalize] Fatal:", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
