/**
 * Backfill borsa product history for public product pages.
 *
 * Sources:
 * - TOBB product history POST form: aycicegi, mercimek, nohut, fasulye
 * - Izmir Ticaret Borsasi daily cotton PDF archive: pamuk
 *
 * Usage:
 *   bun scripts/backfill-borsa-products.ts --from 2021-06-17 --to 2026-06-17 --products aycicegi,pamuk,mercimek,nohut,fasulye --dry-run
 *   bun scripts/backfill-borsa-products.ts --from 2021-06-17 --to 2026-06-17 --products aycicegi,pamuk,mercimek,nohut,fasulye
 */

import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawn } from "node:child_process";
import { eq } from "drizzle-orm";
import { db, pool } from "@/db/client";
import { hfMarkets, hfProducts } from "@/db/schema";
import { upsertPriceRow } from "@/modules/prices/repository";
import { parseItbPamukPdfText } from "@/modules/etl/sources/borsa/text-parsers";

type ProductSlug =
  | "aycicegi"
  | "pamuk"
  | "mercimek"
  | "nohut"
  | "kuru-fasulye"
  | "bugday-ekmeklik"
  | "bugday-makarnalik"
  | "celtik"
  | "pirinc"
  | "yulaf"
  | "cavdar";

interface Args {
  from: string;
  to: string;
  products: ProductSlug[];
  dryRun: boolean;
  limit: number | null;
}

interface TobbProduct {
  slug: Exclude<ProductSlug, "pamuk">;
  nameTr: string;
  categorySlug: string;
  anaKod: string;
  altKods: string[];
}

interface ParsedTobbRow {
  marketCode: string;
  marketName: string;
  recordedDate: string;
  min: number;
  max: number;
  avg: number;
}

const TOBB_PRODUCTS: Record<Exclude<ProductSlug, "pamuk">, TobbProduct> = {
  "bugday-ekmeklik": {
    slug: "bugday-ekmeklik",
    nameTr: "Ekmeklik Buğday",
    categorySlug: "hububat",
    anaKod: "1",
    altKods: ["813", "814", "815", "816", "817", "818", "823"],
  },
  "bugday-makarnalik": {
    slug: "bugday-makarnalik",
    nameTr: "Makarnalık Buğday",
    categorySlug: "hububat",
    anaKod: "1",
    altKods: ["807"],
  },
  celtik: {
    slug: "celtik",
    nameTr: "Çeltik",
    categorySlug: "hububat",
    anaKod: "1",
    altKods: ["403"],
  },
  pirinc: {
    slug: "pirinc",
    nameTr: "Pirinç",
    categorySlug: "hububat",
    anaKod: "1",
    altKods: ["701", "702", "703", "704"],
  },
  yulaf: {
    slug: "yulaf",
    nameTr: "Yulaf",
    categorySlug: "hububat",
    anaKod: "1",
    altKods: ["801", "828", "829"],
  },
  cavdar: {
    slug: "cavdar",
    nameTr: "Çavdar",
    categorySlug: "hububat",
    anaKod: "1",
    altKods: ["301", "826", "827"],
  },
  aycicegi: {
    slug: "aycicegi",
    nameTr: "Ayçiçeği",
    categorySlug: "yagli-tohum",
    anaKod: "4",
    altKods: ["602"],
  },
  mercimek: {
    slug: "mercimek",
    nameTr: "Mercimek",
    categorySlug: "bakliyat-kuru",
    anaKod: "3",
    altKods: ["602"],
  },
  nohut: {
    slug: "nohut",
    nameTr: "Nohut",
    categorySlug: "bakliyat-kuru",
    anaKod: "3",
    altKods: ["704"],
  },
  "kuru-fasulye": {
    slug: "kuru-fasulye",
    nameTr: "Kuru Fasulye",
    categorySlug: "bakliyat-kuru",
    anaKod: "3",
    altKods: ["501", "502", "509"],
  },
};

const PRODUCT_SEEDS: Record<ProductSlug, { nameTr: string; categorySlug: string; aliases: string[]; displayOrder: number; searchVolume: number; familySlug?: string | null }> = {
  "bugday-ekmeklik": {
    nameTr: "Ekmeklik Buğday",
    categorySlug: "hububat",
    aliases: ["ekmeklik buğday", "ekmeklik bugday", "buğday ekmeklik", "bugday ekmeklik", "buğday ekmeklik kırmızı yarı sert", "bread wheat"],
    displayOrder: 102,
    searchVolume: 4200,
    familySlug: "bugday",
  },
  "bugday-makarnalik": {
    nameTr: "Makarnalık Buğday",
    categorySlug: "hububat",
    aliases: ["makarnalık buğday", "makarnalik bugday", "durum buğday", "durum bugday", "buğday anadolu durum", "durum wheat"],
    displayOrder: 103,
    searchVolume: 3600,
    familySlug: "bugday",
  },
  celtik: {
    nameTr: "Çeltik",
    categorySlug: "hububat",
    aliases: ["çeltik", "celtik", "paddy", "paddy rice"],
    displayOrder: 106,
    searchVolume: 3200,
  },
  pirinc: {
    nameTr: "Pirinç",
    categorySlug: "hububat",
    aliases: ["pirinç", "pirinc", "pirinç uzun tane", "pirinç orta tane", "pirinç kısa tane", "pirinç kırık", "rice"],
    displayOrder: 107,
    searchVolume: 11000,
  },
  yulaf: {
    nameTr: "Yulaf",
    categorySlug: "hububat",
    aliases: ["yulaf", "oat", "oats"],
    displayOrder: 108,
    searchVolume: 4800,
  },
  cavdar: {
    nameTr: "Çavdar",
    categorySlug: "hububat",
    aliases: ["çavdar", "cavdar", "rye"],
    displayOrder: 109,
    searchVolume: 2600,
  },
  aycicegi: {
    nameTr: "Ayçiçeği",
    categorySlug: "yagli-tohum",
    aliases: ["ayçiçeği", "aycicegi", "yağlık ayçiçeği", "sunflower"],
    displayOrder: 110,
    searchVolume: 5400,
  },
  pamuk: {
    nameTr: "Pamuk",
    categorySlug: "sanayi-bitkisi",
    aliases: ["pamuk", "kütlü pamuk", "kutlu pamuk", "lif pamuk", "cotton"],
    displayOrder: 111,
    searchVolume: 7200,
  },
  mercimek: {
    nameTr: "Mercimek",
    categorySlug: "bakliyat-kuru",
    aliases: ["mercimek", "kırmızı mercimek", "kirmizi mercimek", "mercimek kırmızı kırılmış iç", "mercimek kirmizi kirilmis ic", "lentil"],
    displayOrder: 112,
    searchVolume: 6200,
  },
  nohut: {
    nameTr: "Nohut",
    categorySlug: "bakliyat-kuru",
    aliases: ["nohut", "chickpea", "nohut naturel", "nohut natürel"],
    displayOrder: 113,
    searchVolume: 5400,
  },
  "kuru-fasulye": {
    nameTr: "Kuru Fasulye",
    categorySlug: "bakliyat-kuru",
    aliases: ["kuru fasulye", "fasulye kuru", "kuru fasulye naturel", "k.fasulye", "k.fasulye dermason", "k.fasulye barbunya", "white bean"],
    displayOrder: 114,
    searchVolume: 6800,
  },
};

const KNOWN_TO_BB_MARKETS: Record<string, { slug: string; sourceKey: string; cityName: string; regionSlug: string }> = {
  "5ED10": { slug: "edirne-ticaret-borsasi", sourceKey: "tobb_borsa_edirne", cityName: "Edirne", regionSlug: "marmara" },
  "5UZ10": { slug: "uzunkopru-ticaret-borsasi", sourceKey: "tobb_borsa_uzunkopru", cityName: "Edirne", regionSlug: "marmara" },
  "5GA10": { slug: "gaziantep-ticaret-borsasi", sourceKey: "tobb_borsa_gaziantep", cityName: "Gaziantep", regionSlug: "guneydogu" },
  "5CO20": { slug: "corum-ticaret-borsasi", sourceKey: "tobb_borsa_corum", cityName: "Çorum", regionSlug: "karadeniz" },
  "5AL05": { slug: "alaca-ticaret-borsasi", sourceKey: "tobb_borsa_alaca", cityName: "Çorum", regionSlug: "karadeniz" },
  "5KO10": { slug: "konya-ticaret-borsasi", sourceKey: "tobb_borsa_konya", cityName: "Konya", regionSlug: "ic-anadolu" },
  "5AK30": { slug: "aksehir-ticaret-borsasi", sourceKey: "tobb_borsa_aksehir", cityName: "Konya", regionSlug: "ic-anadolu" },
};

function parseArgs(argv: string[]): Args {
  const args: Args = {
    from: "2021-06-17",
    to: new Date().toISOString().slice(0, 10),
    products: [
      "aycicegi",
      "pamuk",
      "mercimek",
      "nohut",
      "kuru-fasulye",
      "bugday-ekmeklik",
      "bugday-makarnalik",
      "celtik",
      "pirinc",
      "yulaf",
      "cavdar",
    ],
    dryRun: false,
    limit: null,
  };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]!;
    if (arg === "--from") args.from = String(argv[++i] ?? args.from);
    else if (arg === "--to") args.to = String(argv[++i] ?? args.to);
    else if (arg === "--products") args.products = String(argv[++i] ?? "")
      .split(",")
      .map((p) => p.trim())
      .filter((p): p is ProductSlug => [
        "aycicegi",
        "pamuk",
        "mercimek",
        "nohut",
        "kuru-fasulye",
        "bugday-ekmeklik",
        "bugday-makarnalik",
        "celtik",
        "pirinc",
        "yulaf",
        "cavdar",
      ].includes(p));
    else if (arg === "--dry-run") args.dryRun = true;
    else if (arg === "--limit") args.limit = Number(argv[++i] ?? "0") || null;
  }
  return args;
}

function parseTrNumber(raw: string): number | null {
  const cleaned = raw.trim().replace(/\./g, "").replace(",", ".");
  const value = Number.parseFloat(cleaned);
  return Number.isFinite(value) ? value : null;
}

function parseTrDate(raw: string): string | null {
  const match = raw.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
  if (!match) return null;
  return `${match[3]}-${match[2]!.padStart(2, "0")}-${match[1]!.padStart(2, "0")}`;
}

function slugify(raw: string): string {
  return raw
    .toLocaleLowerCase("tr-TR")
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ı/g, "i")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 128);
}

function marketMeta(marketCode: string, marketName: string) {
  const known = KNOWN_TO_BB_MARKETS[marketCode];
  if (known) return known;
  return {
    slug: slugify(marketName),
    sourceKey: `tobb_borsa_${marketCode.toLocaleLowerCase("tr-TR").replace(/[^a-z0-9]/g, "")}`.slice(0, 64),
    cityName: marketName.split(" ")[0] ?? "Türkiye",
    regionSlug: "ulusal",
  };
}

function yearChunks(from: string, to: string): Array<{ from: string; to: string }> {
  const startYear = Number(from.slice(0, 4));
  const endYear = Number(to.slice(0, 4));
  const chunks: Array<{ from: string; to: string }> = [];
  for (let year = startYear; year <= endYear; year++) {
    chunks.push({
      from: year === startYear ? from : `${year}-01-01`,
      to: year === endYear ? to : `${year}-12-31`,
    });
  }
  return chunks;
}

function dateParts(iso: string) {
  return { gun: iso.slice(8, 10), ay: iso.slice(5, 7), yil: iso.slice(0, 4) };
}

function decodeHtmlText(raw: string): string {
  return raw
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, "\"")
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function parseTobbHistoryHtml(html: string): ParsedTobbRow[] {
  const rows: ParsedTobbRow[] = [];
  const trBlocks = html.match(/<tr\b[^>]*>[\s\S]*?<\/tr>/gi) ?? [];
  for (const tr of trBlocks) {
    const cells = Array.from(tr.matchAll(/<td\b[^>]*>([\s\S]*?)<\/td>/gi), (match) => match[1] ?? "");
    if (cells.length < 5) continue;

    const marketCode = /borsakod=([^"&']+)/i.exec(cells[0] ?? "")?.[1] ?? "";
    const marketName = decodeHtmlText(cells[0] ?? "");
    const recordedDate = parseTrDate(decodeHtmlText(cells[1] ?? ""));
    const min = parseTrNumber(decodeHtmlText(cells[2] ?? ""));
    const max = parseTrNumber(decodeHtmlText(cells[3] ?? ""));
    const avg = parseTrNumber(decodeHtmlText(cells[4] ?? ""));
    if (!marketCode || !marketName || !recordedDate || min == null || max == null || avg == null || avg <= 0) continue;
    rows.push({ marketCode, marketName, recordedDate, min, max, avg });
  }
  return rows;
}

async function ensureProduct(slug: ProductSlug): Promise<number> {
  const seed = PRODUCT_SEEDS[slug];
  await db.insert(hfProducts).values({
    slug,
    nameTr: seed.nameTr,
    categorySlug: seed.categorySlug,
    unit: "kg",
    aliases: seed.aliases,
    displayName: seed.nameTr,
    familySlug: seed.familySlug ?? null,
    seoIndex: 1,
    dataQuality: 70,
    searchVolume: seed.searchVolume,
    displayOrder: seed.displayOrder,
    isActive: 1,
  }).onDuplicateKeyUpdate({
    set: {
      nameTr: seed.nameTr,
      categorySlug: seed.categorySlug,
      unit: "kg",
      aliases: seed.aliases,
      displayName: seed.nameTr,
      familySlug: seed.familySlug ?? null,
      seoIndex: 1,
      dataQuality: 70,
      searchVolume: seed.searchVolume,
      displayOrder: seed.displayOrder,
      isActive: 1,
    },
  });
  const row = await db.select({ id: hfProducts.id }).from(hfProducts).where(eq(hfProducts.slug, slug)).limit(1);
  if (!row[0]) throw new Error(`Product not found after upsert: ${slug}`);
  return row[0].id;
}

async function ensureMarketByMeta(meta: { slug: string; sourceKey: string; cityName: string; regionSlug: string }, name: string): Promise<number> {
  await db.insert(hfMarkets).values({
    slug: meta.slug,
    name,
    cityName: meta.cityName,
    regionSlug: meta.regionSlug,
    sourceKey: meta.sourceKey,
    marketType: "borsa",
    displayOrder: 120,
    seoIndex: 1,
    isActive: 1,
  }).onDuplicateKeyUpdate({
    set: {
      name,
      cityName: meta.cityName,
      regionSlug: meta.regionSlug,
      sourceKey: meta.sourceKey,
      marketType: "borsa",
      isActive: 1,
    },
  });
  const row = await db.select({ id: hfMarkets.id }).from(hfMarkets).where(eq(hfMarkets.slug, meta.slug)).limit(1);
  if (!row[0]) throw new Error(`Market not found after upsert: ${meta.slug}`);
  return row[0].id;
}

async function fetchTobbHistory(product: TobbProduct, altKod: string, from: string, to: string): Promise<ParsedTobbRow[]> {
  const p1 = dateParts(from);
  const p2 = dateParts(to);
  const body = new URLSearchParams({
    gun1: p1.gun,
    ay1: p1.ay,
    yil1: p1.yil,
    gun2: p2.gun,
    ay2: p2.ay,
    yil2: p2.yil,
    borsa: "0",
    siralama1: "tarih",
    siralama2: "borsa_adi",
    gonder: "Sorgula",
  });
  const url = `https://borsa.tobb.org.tr/fiyat_sorgu2.php?ana_kod=${product.anaKod}&alt_kod=${altKod}`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": "HaldeFiyatBot/1.0 (+https://haldefiyat.com)",
    },
    body,
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} @ ${url}`);
  return parseTobbHistoryHtml(await res.text());
}

function mergeTobbRows(rows: ParsedTobbRow[]): ParsedTobbRow[] {
  const buckets = new Map<string, ParsedTobbRow[]>();
  for (const row of rows) {
    const key = `${row.marketCode}|${row.recordedDate}`;
    const bucket = buckets.get(key) ?? [];
    bucket.push(row);
    buckets.set(key, bucket);
  }

  return Array.from(buckets.values()).map((bucket) => {
    if (bucket.length === 1) return bucket[0]!;
    const first = bucket[0]!;
    return {
      marketCode: first.marketCode,
      marketName: first.marketName,
      recordedDate: first.recordedDate,
      min: Math.min(...bucket.map((row) => row.min)),
      max: Math.max(...bucket.map((row) => row.max)),
      avg: bucket.reduce((sum, row) => sum + row.avg, 0) / bucket.length,
    };
  });
}

async function backfillTobbProduct(product: TobbProduct, args: Args): Promise<{ parsed: number; written: number }> {
  const productId = args.dryRun ? 0 : await ensureProduct(product.slug);
  let parsed = 0;
  let written = 0;
  const marketIds = new Map<string, { id: number; sourceKey: string }>();
  for (const chunk of yearChunks(args.from, args.to)) {
    const rawRows: ParsedTobbRow[] = [];
    for (const altKod of product.altKods) {
      const rows = await fetchTobbHistory(product, altKod, chunk.from, chunk.to);
      rawRows.push(...rows);
      console.log(`[tobb:${product.slug}:${altKod}] ${chunk.from}..${chunk.to} rows=${rows.length}`);
    }
    parsed += rawRows.length;
    const rows = mergeTobbRows(rawRows);
    const selected = args.limit ? rows.slice(0, Math.max(0, args.limit - written)) : rows;
    for (const row of selected) {
      const meta = marketMeta(row.marketCode, row.marketName);
      if (args.dryRun) {
        written++;
        continue;
      }
      let market = marketIds.get(row.marketCode);
      if (!market) {
        market = { id: await ensureMarketByMeta(meta, row.marketName), sourceKey: meta.sourceKey };
        marketIds.set(row.marketCode, market);
      }
      await upsertPriceRow({
        productId,
        marketId: market.id,
        minPrice: String(row.min),
        maxPrice: String(row.max),
        avgPrice: String(row.avg),
        recordedDate: row.recordedDate,
        sourceApi: market.sourceKey,
      });
      written++;
    }
    if (args.limit && written >= args.limit) break;
  }
  return { parsed, written };
}

function itbPdfLinks(html: string, from: string, to: string): Array<{ date: string; url: string }> {
  return [...html.matchAll(/(\d{8})\s*:\s*\[\s*["']([^"']*pamuk-bulteni-2\.pdf)["']/gi)]
    .map((match) => {
      const ymd = match[1]!;
      return {
        date: `${ymd.slice(0, 4)}-${ymd.slice(4, 6)}-${ymd.slice(6, 8)}`,
        url: `https://itb.org.tr/dosya/bulten/${match[2]!}`,
      };
    })
    .filter((item) => item.date >= from && item.date <= to)
    .filter((item, index, arr) => arr.findIndex((other) => other.url === item.url) === index)
    .sort((a, b) => a.date.localeCompare(b.date));
}

async function pdfToText(pdfUrl: string): Promise<string> {
  const res = await fetch(pdfUrl, {
    headers: { "User-Agent": "HaldeFiyatBot/1.0 (+https://haldefiyat.com)" },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} @ ${pdfUrl}`);
  const dir = await mkdtemp(join(tmpdir(), "itb-pamuk-backfill-"));
  const pdfPath = join(dir, "bulletin.pdf");
  try {
    await writeFile(pdfPath, Buffer.from(await res.arrayBuffer()));
    const child = spawn("pdftotext", ["-layout", pdfPath, "-"], { stdio: ["ignore", "pipe", "pipe"] });
    const stdoutChunks: Buffer[] = [];
    const stderrChunks: Buffer[] = [];
    child.stdout.on("data", (chunk: Buffer) => stdoutChunks.push(chunk));
    child.stderr.on("data", (chunk: Buffer) => stderrChunks.push(chunk));
    const exitCode = await new Promise<number>((resolve, reject) => {
      child.on("error", reject);
      child.on("close", resolve);
    });
    if (exitCode !== 0) throw new Error(`pdftotext failed (${exitCode}): ${Buffer.concat(stderrChunks).toString("utf8")}`);
    return Buffer.concat(stdoutChunks).toString("utf8");
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

async function backfillPamuk(args: Args): Promise<{ parsed: number; written: number; errors: number }> {
  const productId = args.dryRun ? 0 : await ensureProduct("pamuk");
  const marketId = args.dryRun ? 0 : await ensureMarketByMeta(
    { slug: "izmir-ticaret-borsasi", sourceKey: "izmir_borsa_pamuk", cityName: "İzmir", regionSlug: "ege" },
    "İzmir Ticaret Borsası",
  );
  const index = await fetch("https://itb.org.tr/GunlukBultenler/2-pamuk-bulteni", {
    headers: { "User-Agent": "HaldeFiyatBot/1.0 (+https://haldefiyat.com)" },
  });
  if (!index.ok) throw new Error(`HTTP ${index.status} @ ITB pamuk index`);
  const links = itbPdfLinks(await index.text(), args.from, args.to);
  const selected = args.limit ? links.slice(0, args.limit) : links;
  let parsed = 0;
  let written = 0;
  let errors = 0;
  console.log(`[itb:pamuk] pdfs=${selected.length}/${links.length}`);
  for (let i = 0; i < selected.length; i++) {
    const item = selected[i]!;
    try {
      const text = await pdfToText(item.url);
      const row = parseItbPamukPdfText(text)[0];
      if (!row?.avg || !row.recordedDate) continue;
      parsed++;
      if (!args.dryRun) {
        await upsertPriceRow({
          productId,
          marketId,
          minPrice: row.min != null ? String(row.min) : null,
          maxPrice: row.max != null ? String(row.max) : null,
          avgPrice: String(row.avg),
          recordedDate: row.recordedDate,
          sourceApi: "izmir_borsa_pamuk",
        });
      }
      written++;
      if ((i + 1) % 50 === 0) console.log(`[itb:pamuk] ${i + 1}/${selected.length} written=${written}`);
    } catch (err) {
      errors++;
      console.error(`[itb:pamuk] error ${item.date} ${item.url}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }
  return { parsed, written, errors };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  console.log(`[borsa-backfill] from=${args.from} to=${args.to} products=${args.products.join(",")} dryRun=${args.dryRun}`);

  for (const slug of args.products) {
    if (slug === "pamuk") {
      const result = await backfillPamuk(args);
      console.log(`[done:pamuk] ${JSON.stringify(result)}`);
      continue;
    }
    const result = await backfillTobbProduct(TOBB_PRODUCTS[slug], args);
    console.log(`[done:${slug}] ${JSON.stringify(result)}`);
  }
  await pool.end();
}

main().catch(async (err) => {
  console.error("Fatal:", err);
  await pool.end();
  process.exit(1);
});
