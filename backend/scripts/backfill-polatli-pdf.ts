/**
 * Polatli Ticaret Borsasi Piyasa Analiz Bulteni PDF backfill.
 *
 * Günlük JSON endpoint'i 2025-01-01 öncesini vermiyor. 2021-2023 eski veri
 * haftalik PDF arşivinde var; bu script PDF metninden Polatli ortalama
 * TL/Ton değerlerini çekip TL/kg olarak hf_price_history'ye yazar.
 *
 * Gereksinim: pdftotext CLI (poppler-utils). Lokal makinede mevcut; VPS'te yoksa
 * script orada dry-run bile yapamaz.
 *
 * Kullanım:
 *   bun scripts/backfill-polatli-pdf.ts --from 2021 --to 2023 --dry-run
 *   bun scripts/backfill-polatli-pdf.ts --from 2021 --to 2023
 */

import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { eq } from "drizzle-orm";
import { db, pool } from "@/db/client";
import { hfMarkets, hfProducts } from "@/db/schema";
import { upsertPriceRow } from "@/modules/prices/repository";

type ProductSlug = "bugday" | "arpa" | "misir";

interface Args {
  fromYear: number;
  toYear: number;
  dryRun: boolean;
  limit: number | null;
}

interface ParsedRow {
  productSlug: ProductSlug;
  recordedDate: string;
  avgPrice: string;
  rawTonPrice: number;
  pdfUrl: string;
}

const ARCHIVE_BASE = "https://www.polatliborsa.org.tr/ptb-piyasa-analiz-bulteni";
const MARKET_SLUG = "polatli-ticaret-borsasi";
const SOURCE_API = "polatli_borsa_pdf";
const PRODUCT_HEADINGS: Array<{ slug: ProductSlug; heading: string; next: string[] }> = [
  { slug: "bugday", heading: "BUĞDAY", next: ["ARPA", "MISIR", "MERCİMEK", "BAKLİYAT"] },
  { slug: "arpa", heading: "ARPA", next: ["MISIR", "MERCİMEK", "BAKLİYAT", "NOHUT"] },
  { slug: "misir", heading: "MISIR", next: ["MERCİMEK", "BAKLİYAT", "NOHUT", "FASULYE"] },
];

function parseArgs(argv: string[]): Args {
  const args: Args = { fromYear: 2021, toYear: 2023, dryRun: false, limit: null };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]!;
    if (a === "--from") args.fromYear = Number(argv[++i] ?? args.fromYear);
    else if (a === "--to") args.toYear = Number(argv[++i] ?? args.toYear);
    else if (a === "--dry-run") args.dryRun = true;
    else if (a === "--limit") args.limit = Number(argv[++i] ?? "0") || null;
  }
  return args;
}

function dateFromPdfUrl(url: string): string | null {
  const m = /\/(\d{2})(\d{2})(\d{2})-[^/]+\.pdf/i.exec(url);
  if (!m) return null;
  const yy = Number(m[1]);
  const mm = Number(m[2]);
  const dd = Number(m[3]);
  if (!yy || !mm || !dd) return null;
  return `20${String(yy).padStart(2, "0")}-${String(mm).padStart(2, "0")}-${String(dd).padStart(2, "0")}`;
}

function normalizeText(text: string): string {
  return text
    .replace(/\u00a0/g, " ")
    .replace(/[ĐÐ]/g, "İ")
    .replace(/[ýı]/g, "ı")
    .replace(/[’‘]/g, "'")
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+$/gm, "")
    .trim();
}

function sectionFor(text: string, heading: string, nextHeadings: string[]): string {
  const upper = text.toLocaleUpperCase("tr-TR");
  const startMatch = new RegExp(`(^|\\n)\\s*${heading}\\s*(\\n|$)`, "u").exec(upper);
  const start = startMatch?.index ?? -1;
  if (start < 0) return "";
  let end = text.length;
  for (const next of nextHeadings) {
    const re = new RegExp(`(^|\\n)\\s*${next}\\s*(\\n|$)`, "gu");
    for (const match of upper.matchAll(re)) {
      const idx = match.index ?? -1;
      if (idx > start && idx < end) end = idx;
    }
  }
  return text.slice(start, end);
}

function parseTurkishNumber(raw: string): number {
  const compact = raw.trim();
  if (/^\d{1,2}[.,]\d{3}$/.test(compact)) {
    return Number(compact.replace(/[.,]/g, ""));
  }
  if (/^\d{1,3}([.,]\d{3})+[.,]\d{1,2}$/.test(compact)) {
    return Number(compact.replace(/\./g, "").replace(",", "."));
  }
  if (/^\d{1,3}([.,]\d{3})+$/.test(compact)) {
    return Number(compact.replace(/[.,]/g, ""));
  }
  return Number(compact.replace(/\./g, "").replace(",", "."));
}

function tonToKg(raw: number): string {
  return (raw / 1000).toFixed(2);
}

function extractPolatliTonPrice(section: string): number | null {
  const re = /Polatlı\s+Ticaret\s+Borsası[\s\S]{0,260}?([0-9]{1,3}(?:[.,][0-9]{3})+(?:[.,][0-9]{1,2})?|[0-9]{3,5}(?:[.,][0-9]{1,2})?)\s*TL\s*\/?\s*Ton/i;
  const match = re.exec(section);
  if (!match) return null;
  const value = parseTurkishNumber(match[1]!);
  return Number.isFinite(value) && value > 0 ? value : null;
}

async function fetchArchivePdfLinks(year: number): Promise<string[]> {
  const url = `${ARCHIVE_BASE}/${year}-ptb/`;
  const res = await fetch(url, {
    headers: { "User-Agent": "HaldeFiyatBot/1.0 (+https://haldefiyat.com)" },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} @ ${url}`);
  const html = await res.text();
  const links = [...html.matchAll(/href=["']([^"']+\.pdf[^"']*)["']/gi)]
    .map((m) => m[1]!)
    .map((href) => new URL(href, url).toString())
    .filter((href, index, arr) => arr.indexOf(href) === index)
    .sort();
  return links;
}

async function pdfToText(pdfUrl: string): Promise<string> {
  const res = await fetch(pdfUrl, {
    headers: { "User-Agent": "HaldeFiyatBot/1.0 (+https://haldefiyat.com)" },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} @ ${pdfUrl}`);
  const dir = await mkdtemp(join(tmpdir(), "polatli-pdf-"));
  const pdfPath = join(dir, "bulletin.pdf");
  try {
    await Bun.write(pdfPath, await res.arrayBuffer());
    const proc = Bun.spawn(["pdftotext", "-layout", pdfPath, "-"], {
      stdout: "pipe",
      stderr: "pipe",
    });
    const [stdout, stderr, exitCode] = await Promise.all([
      new Response(proc.stdout).text(),
      new Response(proc.stderr).text(),
      proc.exited,
    ]);
    if (exitCode !== 0) throw new Error(`pdftotext failed (${exitCode}): ${stderr}`);
    return normalizeText(stdout);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

async function parsePdf(pdfUrl: string): Promise<ParsedRow[]> {
  const recordedDate = dateFromPdfUrl(pdfUrl);
  if (!recordedDate) return [];
  const text = await pdfToText(pdfUrl);
  const rows: ParsedRow[] = [];
  for (const product of PRODUCT_HEADINGS) {
    const section = sectionFor(text, product.heading, product.next);
    if (!section) continue;
    const tonPrice = extractPolatliTonPrice(section);
    if (!tonPrice) continue;
    rows.push({
      productSlug: product.slug,
      recordedDate,
      avgPrice: tonToKg(tonPrice),
      rawTonPrice: tonPrice,
      pdfUrl,
    });
  }
  return rows;
}

async function productIds(): Promise<Record<ProductSlug, number>> {
  const out = {} as Record<ProductSlug, number>;
  for (const slug of PRODUCT_HEADINGS.map((p) => p.slug)) {
    const row = await db.select({ id: hfProducts.id }).from(hfProducts).where(eq(hfProducts.slug, slug)).limit(1);
    if (!row[0]) throw new Error(`Product not found: ${slug}`);
    out[slug] = row[0].id;
  }
  return out;
}

async function marketId(): Promise<number> {
  const row = await db.select({ id: hfMarkets.id }).from(hfMarkets).where(eq(hfMarkets.slug, MARKET_SLUG)).limit(1);
  if (!row[0]) throw new Error(`Market not found: ${MARKET_SLUG}`);
  return row[0].id;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const years = Array.from({ length: args.toYear - args.fromYear + 1 }, (_, i) => args.fromYear + i);
  const links = (await Promise.all(years.map(fetchArchivePdfLinks))).flat();
  const selected = args.limit ? links.slice(0, args.limit) : links;
  console.log(`[polatli-pdf] ${selected.length}/${links.length} PDF taranacak (${years.join(", ")})`);

  const ids = args.dryRun ? null : await productIds();
  const mid = args.dryRun ? null : await marketId();
  let parsed = 0;
  let written = 0;
  let empty = 0;

  for (let i = 0; i < selected.length; i++) {
    const pdfUrl = selected[i]!;
    try {
      const rows = await parsePdf(pdfUrl);
      parsed += rows.length;
      if (rows.length === 0) empty++;
      if (args.dryRun) {
        if (rows.length > 0) {
          console.log(`[${i + 1}/${selected.length}] ${rows[0]!.recordedDate}: ${rows.map((r) => `${r.productSlug}=${r.avgPrice}`).join(" ")}`);
        }
      } else {
        for (const row of rows) {
          await upsertPriceRow({
            productId: ids![row.productSlug],
            marketId: mid!,
            minPrice: null,
            maxPrice: null,
            avgPrice: row.avgPrice,
            recordedDate: row.recordedDate,
            sourceApi: SOURCE_API,
          });
          written++;
        }
      }
    } catch (err) {
      console.error(`[${i + 1}/${selected.length}] HATA ${pdfUrl}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  console.log(`[polatli-pdf] parsed=${parsed} empty=${empty} written=${written} dryRun=${args.dryRun}`);
  await pool.end();
}

main().catch(async (err) => {
  console.error("Fatal:", err);
  await pool.end();
  process.exit(1);
});
