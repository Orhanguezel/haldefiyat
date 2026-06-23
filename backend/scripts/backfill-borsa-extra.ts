/**
 * Backfill — yeni eklenen borsa ürünleri (canlı hayvan + karkas/parça et + zeytin +
 * zeytinyağı) için 5 yıllık TOBB geçmişi. Ürünler DB'de ZATEN var; slug ile çözülür.
 * Kaynak: borsa.tobb.org.tr/fiyat_sorgu2.php?ana_kod=X&alt_kod=Y (borsa=0, tüm borsalar).
 *
 * Kullanım:
 *   bun scripts/backfill-borsa-extra.ts                 # tüm hedefler, 2021→bugün
 *   bun scripts/backfill-borsa-extra.ts --products zeytinyagi,zeytin --dry-run
 */
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { hfMarkets, hfProducts } from "@/db/schema";
import { upsertPriceRow } from "@/modules/prices/repository";

type Target = { slug: string; anaKod: string; altKods: string[] };

// (ana_kod, alt_kod) çiftleri fiyat_sorgu2'de globaldir (borsa sayfasındaki linklerden).
const TARGETS: Target[] = [
  // Canlı hayvan (ana_kod=13)
  { slug: "dana-canli", anaKod: "13", altKods: ["202"] },
  { slug: "duve-canli", anaKod: "13", altKods: ["201"] },
  { slug: "inek-canli", anaKod: "13", altKods: ["203"] },
  { slug: "koyun-canli", anaKod: "13", altKods: ["212"] },
  { slug: "sut-kuzusu-canli", anaKod: "13", altKods: ["107"] },
  // Karkas + parça et (ana_kod=8)
  { slug: "dana-karkas-et", anaKod: "8", altKods: ["812"] },
  { slug: "dana-but-et", anaKod: "8", altKods: ["813"] },
  { slug: "dana-kol-et", anaKod: "8", altKods: ["814"] },
  { slug: "kuzu-karkas-et", anaKod: "8", altKods: ["804"] },
  { slug: "kuzu-but-et", anaKod: "8", altKods: ["805"] },
  { slug: "kuzu-kol-et", anaKod: "8", altKods: ["806"] },
  { slug: "kuzu-pirzola-et", anaKod: "8", altKods: ["807"] },
  { slug: "ot-kuzusu-eti", anaKod: "8", altKods: ["402"] },
  { slug: "sut-kuzusu-eti", anaKod: "8", altKods: ["401"] },
  // Zeytinyağı (ana_kod=6) — ham/yemeklik/sızma → tek ürüne aggregate
  { slug: "zeytinyagi", anaKod: "6", altKods: ["501", "502", "603"] },
  // Zeytin (ana_kod=8) — variantlar → tek ürüne aggregate
  { slug: "zeytin", anaKod: "8", altKods: ["301", "302", "303", "803"] },
];

const KNOWN: Record<string, { slug: string; sourceKey: string; cityName: string; regionSlug: string }> = {
  "5ED10": { slug: "edirne-ticaret-borsasi", sourceKey: "tobb_borsa_edirne", cityName: "Edirne", regionSlug: "marmara" },
  "5UZ10": { slug: "uzunkopru-ticaret-borsasi", sourceKey: "tobb_borsa_uzunkopru", cityName: "Edirne", regionSlug: "marmara" },
  "5GA10": { slug: "gaziantep-ticaret-borsasi", sourceKey: "tobb_borsa_gaziantep", cityName: "Gaziantep", regionSlug: "guneydogu" },
  "5CO20": { slug: "corum-ticaret-borsasi", sourceKey: "tobb_borsa_corum", cityName: "Çorum", regionSlug: "karadeniz" },
  "5AL05": { slug: "alaca-ticaret-borsasi", sourceKey: "tobb_borsa_alaca", cityName: "Çorum", regionSlug: "karadeniz" },
  "5KO10": { slug: "konya-ticaret-borsasi", sourceKey: "tobb_borsa_konya", cityName: "Konya", regionSlug: "ic-anadolu" },
  "5AK30": { slug: "aksehir-ticaret-borsasi", sourceKey: "tobb_borsa_aksehir", cityName: "Konya", regionSlug: "ic-anadolu" },
  "5ED20": { slug: "edremit-ticaret-borsasi", sourceKey: "tobb_borsa_edremit", cityName: "Balıkesir", regionSlug: "marmara" },
  "5AN10": { slug: "ankara-ticaret-borsasi", sourceKey: "tobb_borsa_ankara", cityName: "Ankara", regionSlug: "ic-anadolu" },
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function slugify(raw: string): string {
  return raw.toLocaleLowerCase("tr-TR")
    .replace(/ğ/g, "g").replace(/ü/g, "u").replace(/ş/g, "s").replace(/ı/g, "i").replace(/ö/g, "o").replace(/ç/g, "c")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 128);
}
function parseTrNumber(raw: string): number | null {
  const v = Number.parseFloat(raw.trim().replace(/\./g, "").replace(",", "."));
  return Number.isFinite(v) ? v : null;
}
function parseTrDate(raw: string): string | null {
  const m = raw.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
  return m ? `${m[3]}-${m[2]!.padStart(2, "0")}-${m[1]!.padStart(2, "0")}` : null;
}
function decode(raw: string): string {
  return raw.replace(/<[^>]+>/g, " ").replace(/&nbsp;/gi, " ").replace(/&amp;/gi, "&").replace(/&#39;/g, "'").replace(/\s+/g, " ").trim();
}

type Row = { marketCode: string; marketName: string; date: string; min: number; max: number; avg: number };

function parseHistory(html: string): Row[] {
  const rows: Row[] = [];
  for (const tr of html.match(/<tr\b[^>]*>[\s\S]*?<\/tr>/gi) ?? []) {
    const cells = Array.from(tr.matchAll(/<td\b[^>]*>([\s\S]*?)<\/td>/gi), (m) => m[1] ?? "");
    if (cells.length < 5) continue;
    const marketCode = /borsakod=([^"&']+)/i.exec(cells[0] ?? "")?.[1] ?? "";
    const marketName = decode(cells[0] ?? "");
    const date = parseTrDate(decode(cells[1] ?? ""));
    const min = parseTrNumber(decode(cells[2] ?? ""));
    const max = parseTrNumber(decode(cells[3] ?? ""));
    const avg = parseTrNumber(decode(cells[4] ?? ""));
    if (!marketCode || !marketName || !date || min == null || max == null || avg == null || avg <= 0) continue;
    if (avg > 2000) continue; // hacim/birim hatası (kg fiyatı bu kadar olmaz)
    rows.push({ marketCode, marketName, date, min, max, avg });
  }
  return rows;
}

async function fetchHistory(ana: string, alt: string, y1: number, y2: number): Promise<Row[]> {
  const body = new URLSearchParams({
    gun1: "01", ay1: "01", yil1: String(y1), gun2: "31", ay2: "12", yil2: String(y2),
    borsa: "0", siralama1: "tarih", siralama2: "borsa_adi", gonder: "Sorgula",
  });
  const url = `https://borsa.tobb.org.tr/fiyat_sorgu2.php?ana_kod=${ana}&alt_kod=${alt}`;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded", "User-Agent": "HaldeFiyatBot/1.0 (+https://haldefiyat.com)" },
        body,
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return parseHistory(await res.text());
    } catch (err) {
      if (attempt === 3) { console.warn(`  ! ${ana}/${alt} ${y1}-${y2} hata: ${err}`); return []; }
      await sleep(1500 * attempt);
    }
  }
  return [];
}

function mergeRows(rows: Row[]): Row[] {
  const buckets = new Map<string, Row[]>();
  for (const r of rows) {
    const k = `${r.marketCode}|${r.date}`;
    (buckets.get(k) ?? buckets.set(k, []).get(k)!).push(r);
  }
  return Array.from(buckets.values()).map((b) => b.length === 1 ? b[0]! : ({
    marketCode: b[0]!.marketCode, marketName: b[0]!.marketName, date: b[0]!.date,
    min: Math.min(...b.map((x) => x.min)), max: Math.max(...b.map((x) => x.max)),
    avg: Math.round((b.reduce((s, x) => s + x.avg, 0) / b.length) * 100) / 100,
  }));
}

async function ensureMarket(code: string, name: string, cache: Map<string, { id: number; sourceKey: string }>): Promise<{ id: number; sourceKey: string }> {
  const hit = cache.get(code);
  if (hit) return hit;
  const meta = KNOWN[code] ?? {
    slug: slugify(name), sourceKey: `tobb_borsa_${code.toLocaleLowerCase("tr-TR").replace(/[^a-z0-9]/g, "")}`.slice(0, 64),
    cityName: name.split(" ")[0] ?? "Türkiye", regionSlug: "ulusal",
  };
  await db.insert(hfMarkets).values({
    slug: meta.slug, name, cityName: meta.cityName, regionSlug: meta.regionSlug,
    sourceKey: meta.sourceKey, marketType: "borsa", displayOrder: 140, seoIndex: 0, isActive: 1,
  }).onDuplicateKeyUpdate({ set: { sourceKey: meta.sourceKey, marketType: "borsa" } });
  const row = await db.select({ id: hfMarkets.id }).from(hfMarkets).where(eq(hfMarkets.slug, meta.slug)).limit(1);
  const out = { id: row[0]!.id, sourceKey: meta.sourceKey };
  cache.set(code, out);
  return out;
}

async function main() {
  const argv = process.argv.slice(2);
  const dryRun = argv.includes("--dry-run");
  const pi = argv.indexOf("--products");
  const only = pi >= 0 ? new Set(String(argv[pi + 1] ?? "").split(",").map((s) => s.trim())) : null;
  const fromY = 2021;
  const toY = new Date().getUTCFullYear();
  const targets = only ? TARGETS.filter((t) => only.has(t.slug)) : TARGETS;
  const marketCache = new Map<string, { id: number; sourceKey: string }>();
  let totalWritten = 0;

  for (const t of targets) {
    const prod = await db.select({ id: hfProducts.id }).from(hfProducts).where(eq(hfProducts.slug, t.slug)).limit(1);
    if (!prod[0]) { console.warn(`! ürün yok, atlandı: ${t.slug}`); continue; }
    const productId = prod[0].id;
    const raw: Row[] = [];
    for (let y = fromY; y <= toY; y++) {
      for (const alt of t.altKods) {
        const rows = await fetchHistory(t.anaKod, alt, y, y);
        raw.push(...rows);
        await sleep(700);
      }
    }
    const merged = mergeRows(raw);
    console.log(`${t.slug}: ${raw.length} ham → ${merged.length} satır (${[...new Set(merged.map((r) => r.marketCode))].length} borsa)`);
    if (dryRun) { totalWritten += merged.length; continue; }
    for (const r of merged) {
      const mkt = await ensureMarket(r.marketCode, r.marketName, marketCache);
      await upsertPriceRow({
        productId, marketId: mkt.id, minPrice: String(r.min), maxPrice: String(r.max),
        avgPrice: String(r.avg), recordedDate: r.date, sourceApi: mkt.sourceKey,
      });
      totalWritten++;
    }
  }
  console.log(`\n${dryRun ? "[DRY] " : ""}Toplam ${dryRun ? "parse" : "yazılan"}: ${totalWritten}`);
  process.exit(0);
}
main().catch((e) => { console.error(e); process.exit(1); });
