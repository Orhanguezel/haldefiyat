/**
 * Migros sebze/meyve fiyat ETL.
 *
 * Yöntem: scraper-service → DynamicFetcher (Playwright) → JSON-LD ItemList
 * Sayfalama: ?sayfa=N (her sayfada 30 ürün), boş sayfa gelince dur.
 * Kayıt: hf_retail_prices (chain_slug = "migros")
 *
 * Env:
 *   SCRAPER_URL      = https://scraper.guezelwebdesign.com
 *   SCRAPER_API_KEY  = ...
 *   SCRAPER_ENABLED  = true (varsayılan)
 */

import { db } from "@/db/client";
import { hfProducts, hfRetailPrices } from "@/db/schema";
import { eq } from "drizzle-orm";
import { fetchViaScraper } from "../scraper-client";
import { turkishToAscii, getAliasMap, invalidateAliasCache } from "../normalizer";

const MIGROS_BASE = "https://www.migros.com.tr/sebze-meyve-c-2";
const CHAIN_SLUG = "migros";
const MAX_PAGES = 10; // 300 ürün üst sınır

export interface MigrosProduct {
  nameRaw: string;
  price: number;
  url: string;
}

export function parseMigrosJsonLd(html: string): MigrosProduct[] {
  const results: MigrosProduct[] = [];
  const re = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    try {
      const data = JSON.parse(m[1]!);
      if (data["@type"] !== "ItemList") continue;
      for (const elem of data.itemListElement ?? []) {
        const product = elem.item ?? {};
        const offers = product.offers ?? {};
        const priceRaw = offers.price ?? offers.lowPrice;
        const price = parseFloat(String(priceRaw ?? ""));
        const name: string = String(product.name ?? "").trim();
        const url: string = String(product.url ?? product["@id"] ?? "").trim();
        if (!name || !Number.isFinite(price) || price <= 0) continue;
        results.push({ nameRaw: name, price, url });
      }
    } catch {
      // malformed block — skip
    }
  }
  return results;
}

async function scrapePageHtml(page: number): Promise<string | null> {
  const url = page === 1 ? MIGROS_BASE : `${MIGROS_BASE}?sayfa=${page}`;
  const result = await fetchViaScraper(url, {
    mode: "dynamic",
    timeoutSeconds: 60,
    waitFor: "[class*=product], [class*=price]",
  });
  if (!result.ok || !result.html) return null;
  return result.html;
}

export async function resolveMigrosProductId(nameRaw: string): Promise<number | null> {
  const aliasMap = await getAliasMap();
  // Migros ürün adları bazen birim/paket ifadesi içerir; sondan temizle.
  // Sıralama önemli: önce gram/sayı, sonra etiketler (sırasıyla peelinmeli)
  let cleaned = nameRaw.trim();
  for (let i = 0; i < 4; i++) {
    cleaned = cleaned
      .replace(/\s+Kg\s*$/i, "")
      .replace(/\s+Adet\s*$/i, "")
      .replace(/\s+\d+(?:\.\d+)?\s*[Gg]\s*$/i, "")
      .replace(/\s+Paket\s*$/i, "")
      .replace(/\s+Demet\s*$/i, "")
      .replace(/\s+File\s*$/i, "")
      .replace(/\s+\d+'?l[uü]\s*$/i, "")
      .replace(/[()]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  const slug = aliasMap.get(turkishToAscii(cleaned));
  if (!slug) return null;

  const rows = await db
    .select({ id: hfProducts.id })
    .from(hfProducts)
    .where(eq(hfProducts.slug, slug))
    .limit(1);

  return rows[0]?.id ?? null;
}

export interface MigrosEtlResult {
  inserted: number;
  skipped: number;
  unmatched: number;
  unmatchedNames: string[];
  errors: string[];
}

export async function runMigrosEtl(targetDate?: string): Promise<MigrosEtlResult> {
  // hf_products alias degisiklikleri hemen yansisin (5dk TTL cache'ini bypass et)
  invalidateAliasCache();

  const recordedDate = targetDate ?? new Date().toISOString().slice(0, 10);
  const result: MigrosEtlResult = { inserted: 0, skipped: 0, unmatched: 0, unmatchedNames: [], errors: [] };

  // Collect all products across pages
  const allProducts: MigrosProduct[] = [];
  for (let page = 1; page <= MAX_PAGES; page++) {
    const html = await scrapePageHtml(page);
    if (!html) {
      if (page === 1) result.errors.push("Sayfa 1 alınamadı — scraper yanıt vermedi");
      break;
    }
    const found = parseMigrosJsonLd(html);
    if (found.length === 0) break; // boş sayfa = son sayfa
    allProducts.push(...found);
    if (found.length < 30) break; // son sayfa kısa geldi
  }

  if (allProducts.length === 0) {
    result.errors.push("Migros'tan hiç ürün çekilemedi");
    return result;
  }

  // Deduplicate by name (keep lowest price per product)
  const deduped = new Map<string, MigrosProduct>();
  for (const p of allProducts) {
    const key = turkishToAscii(p.nameRaw);
    const existing = deduped.get(key);
    if (!existing || p.price < existing.price) deduped.set(key, p);
  }

  for (const p of deduped.values()) {
    // Sadece Kg-bazli fiyatlar dahil edilir; "Adet", "125 G Paket" gibi paket
    // fiyatlari hal toptan ile kiyaslanamaz (yaniltici karsilastirma riski)
    if (!/\s+Kg\s*$/i.test(p.nameRaw.trim())) {
      result.skipped++;
      continue;
    }

    const productId = await resolveMigrosProductId(p.nameRaw);
    if (productId === null) {
      result.unmatched++;
      result.unmatchedNames.push(p.nameRaw);
      continue;
    }

    try {
      await db
        .insert(hfRetailPrices)
        .values({
          productId,
          chainSlug: CHAIN_SLUG,
          price: p.price.toFixed(2),
          currency: "TRY",
          unit: "kg",
          productNameRaw: p.nameRaw,
          productUrl: p.url || null,
          recordedDate: new Date(`${recordedDate}T12:00:00`),
        })
        .onDuplicateKeyUpdate({
          set: {
            price: p.price.toFixed(2),
            productNameRaw: p.nameRaw,
            productUrl: p.url || null,
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
