/**
 * marketfiyati.org.tr (TÜBİTAK BİLGEM × T.C. Ticaret Bakanlığı) ETL.
 *
 * Yöntem: REST API (auth-free, sadece UA gerekli).
 * Endpoint: POST /api/v2/search { keywords, pages, size }
 * 5 zincir aynı response içinde: a101, bim, carrefour, migros, tarim_kredi
 * Bir ürünün her zincirde birden fazla şube fiyatı dönebilir → AVG ile aggregate edilir.
 *
 * Kapsam: menu_category === "Meyve ve Sebze" + Kg-bazlı taze ürünler.
 * Lokasyon: API IP-geolocation ile çalışır, koordinat parametresi yok sayılır
 * → tüm sonuçlar İstanbul depot'larından. UI tarafında "(İstanbul depot ortalaması)" not.
 *
 * Kayıt: hf_retail_prices (chain_slug = "a101" | "bim" | "carrefour" | "migros" | "tarim_kredi")
 * UNIQUE (product_id, chain_slug, recorded_date) → ON DUPLICATE KEY UPDATE
 */

import { db } from "@/db/client";
import { hfProducts, hfRetailPrices } from "@/db/schema";
import { eq } from "drizzle-orm";
import { turkishToAscii, getAliasMap, invalidateAliasCache } from "../normalizer";

const API_BASE = "https://api.marketfiyati.org.tr/api/v2";
const UA =
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36";
const TARGET_MENU_CATEGORY = "Meyve ve Sebze";
const PAGE_SIZE = 25;
const MAX_PAGES_PER_KEYWORD = 4;
const REQUEST_TIMEOUT_MS = 20000;

const SUPPORTED_CHAINS = ["a101", "bim", "carrefour", "migros", "tarim_kredi"] as const;
type ChainSlug = (typeof SUPPORTED_CHAINS)[number];

interface DepotInfo {
  marketAdi: string;
  unitPriceValue: number;
  price: number;
}

interface MfProduct {
  id: string;
  title: string;
  brand?: string | null;
  menu_category?: string | null;
  productDepotInfoList?: DepotInfo[];
}

interface MfSearchResponse {
  numberOfFound?: number;
  content?: MfProduct[];
}

async function fetchSearchPage(
  keyword: string,
  page: number,
): Promise<MfSearchResponse | null> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), REQUEST_TIMEOUT_MS);
  try {
    const res = await fetch(`${API_BASE}/search`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "User-Agent": UA },
      body: JSON.stringify({ keywords: keyword, pages: page, size: PAGE_SIZE }),
      signal: ctrl.signal,
    });
    if (!res.ok) return null;
    return (await res.json()) as MfSearchResponse;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

async function searchKeyword(keyword: string): Promise<MfProduct[]> {
  const all: MfProduct[] = [];
  for (let page = 0; page < MAX_PAGES_PER_KEYWORD; page++) {
    const data = await fetchSearchPage(keyword, page);
    if (!data?.content?.length) break;
    all.push(...data.content);
    if (data.content.length < PAGE_SIZE) break;
  }
  return all;
}

// "Patates 1 Kg" → "Patates"; "Markasız Salatalık 1 Kg" → "Salatalık"
function cleanTitle(raw: string): string {
  let s = raw.trim();
  for (let i = 0; i < 3; i++) {
    s = s
      .replace(/\s+\d+(?:[.,]\d+)?\s*[Kk][Gg]\s*$/u, "")
      .replace(/\s+\d+(?:[.,]\d+)?\s*[Gg][Rr]?\s*$/u, "")
      .replace(/\s+\d+(?:[.,]\d+)?\s*[Mm][Ll]\s*$/u, "")
      .replace(/\s+\d+(?:[.,]\d+)?\s*[Ll]\s*$/u, "")
      .replace(/\s+[Aa]det\s*$/u, "")
      .replace(/\s+[Pp]aket\s*$/u, "")
      .replace(/\s+[Dd]emet\s*$/u, "")
      .replace(/\s+[Ff]ile\s*$/u, "")
      .replace(/[()]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }
  // "Markasız" gibi brand öneki gelmişse temizle
  s = s.replace(/^[Mm]arkas[ıi]z\s+/u, "").trim();
  return s;
}

async function resolveProductId(rawTitle: string): Promise<number | null> {
  const aliasMap = await getAliasMap();
  const cleaned = cleanTitle(rawTitle);
  let slug = aliasMap.get(turkishToAscii(cleaned));

  // Cleaning yetmediyse word-by-word ilk eşleşeni dene (örn. "Kızartmalık Patates" → "Patates")
  if (!slug) {
    const words = cleaned.split(/\s+/);
    for (let cut = 1; cut < words.length; cut++) {
      const candidate = words.slice(cut).join(" ");
      slug = aliasMap.get(turkishToAscii(candidate));
      if (slug) break;
    }
  }

  if (!slug) return null;
  const rows = await db
    .select({ id: hfProducts.id })
    .from(hfProducts)
    .where(eq(hfProducts.slug, slug))
    .limit(1);
  return rows[0]?.id ?? null;
}

// (chain, productId) → tüm depot unitPriceValue'larını topla
type Bucket = { sum: number; count: number; productNameRaw: string };
const bucketKey = (chain: ChainSlug, productId: number) => `${chain}::${productId}`;

export interface MarketfiyatiEtlResult {
  inserted: number;
  skipped: number;
  unmatched: number;
  unmatchedNames: string[];
  errors: string[];
  keywordCount: number;
  apiCallCount: number;
}

export async function runMarketfiyatiEtl(
  targetDate?: string,
): Promise<MarketfiyatiEtlResult> {
  invalidateAliasCache();

  const recordedDate = targetDate ?? new Date().toISOString().slice(0, 10);
  const result: MarketfiyatiEtlResult = {
    inserted: 0,
    skipped: 0,
    unmatched: 0,
    unmatchedNames: [],
    errors: [],
    keywordCount: 0,
    apiCallCount: 0,
  };

  // 1) Keyword listesi: hf_products'taki taze sebze + meyve (kg birimli)
  const products = await db
    .select({ slug: hfProducts.slug, nameTr: hfProducts.nameTr, unit: hfProducts.unit })
    .from(hfProducts)
    .where(eq(hfProducts.isActive, 1));

  const keywords = new Set<string>();
  for (const p of products) {
    if (p.unit !== "kg") continue;
    const base = p.nameTr
      .replace(/\(.*?\)/g, "")
      .replace(/\s+/g, " ")
      .trim()
      .toLocaleLowerCase("tr-TR");
    if (base.length >= 3) keywords.add(base);
  }
  result.keywordCount = keywords.size;

  if (keywords.size === 0) {
    result.errors.push("hf_products içinde kg-bazli sebze/meyve bulunamadı");
    return result;
  }

  // 2) Her keyword için search → menu_category filter → bucket
  const buckets = new Map<string, Bucket>();

  for (const keyword of keywords) {
    const found = await searchKeyword(keyword);
    result.apiCallCount++;

    for (const p of found) {
      if (p.menu_category !== TARGET_MENU_CATEGORY) continue;
      const depots = p.productDepotInfoList ?? [];
      if (depots.length === 0) continue;

      const productId = await resolveProductId(p.title);
      if (productId === null) {
        result.unmatched++;
        if (result.unmatchedNames.length < 30) result.unmatchedNames.push(p.title);
        continue;
      }

      for (const d of depots) {
        const chain = d.marketAdi as ChainSlug;
        if (!SUPPORTED_CHAINS.includes(chain)) continue;
        const price = Number(d.unitPriceValue);
        if (!Number.isFinite(price) || price <= 0) continue;

        const key = bucketKey(chain, productId);
        const existing = buckets.get(key);
        if (existing) {
          existing.sum += price;
          existing.count += 1;
        } else {
          buckets.set(key, { sum: price, count: 1, productNameRaw: p.title });
        }
      }
    }
  }

  // 3) Bucket → hf_retail_prices upsert (AVG)
  for (const [key, b] of buckets.entries()) {
    const [chain, productIdStr] = key.split("::");
    const productId = Number(productIdStr);
    const avg = b.sum / b.count;
    try {
      await db
        .insert(hfRetailPrices)
        .values({
          productId,
          chainSlug: chain!,
          price: avg.toFixed(2),
          currency: "TRY",
          unit: "kg",
          productNameRaw: b.productNameRaw,
          productUrl: null,
          recordedDate: new Date(`${recordedDate}T12:00:00`),
        })
        .onDuplicateKeyUpdate({
          set: {
            price: avg.toFixed(2),
            productNameRaw: b.productNameRaw,
          },
        });
      result.inserted++;
    } catch (err) {
      result.skipped++;
      if (result.errors.length < 5) {
        result.errors.push(err instanceof Error ? err.message : String(err));
      }
    }
  }

  return result;
}
