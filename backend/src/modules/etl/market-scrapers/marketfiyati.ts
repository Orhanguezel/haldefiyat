/**
 * marketfiyati.org.tr (TÜBİTAK BİLGEM × T.C. Ticaret Bakanlığı) ETL.
 *
 * Yöntem: REST API (auth-free, sadece UA gerekli).
 * Endpoint: POST /api/v2/search { keywords, pages, size }
 * İzlenen altı zincir: a101, bim, carrefour, migros, tarim_kredi, sok
 * Bir ürünün her zincirde birden fazla şube fiyatı dönebilir → aynı kaynak günündeki en düşük doğrulanmış teklif seçilir.
 *
 * Kapsam: menu_category === "Meyve ve Sebze" + Kg-bazlı taze ürünler.
 * Lokasyon: 6 Eylül örneklemi İstanbul şubelerini döndürdü. Sonuçlar tüm
 * şubeleri/ülkeyi temsil etmez; konumdan bağımsız ulusal raf fiyatı iddiası yok.
 *
 * Kayıt: hf_retail_prices (chain_slug = "a101" | "bim" | "carrefour" | "migros" | "tarim_kredi")
 * UNIQUE (product_id, chain_slug, recorded_date) → ON DUPLICATE KEY UPDATE
 */

import { db } from "@/db/client";
import { hfProducts } from "@/db/schema";
import { eq } from "drizzle-orm";
import { turkishToAscii, getAliasMap, invalidateAliasCache } from "../normalizer";
import { MARKETFIYATI_SOURCE, retailTitleMatches, retailUnit, verifiedDepot, depotRejectionReason, type DepotEvidence } from "../retail-source-policy";
import { upsertRetailPriceRow } from "@/modules/prices/repository";

const API_BASE = "https://api.marketfiyati.org.tr/api/v2";
const UA =
  "HaldeFiyat/1.0 (+https://haldefiyat.com/metodoloji)";
const TARGET_MENU_CATEGORY = "Meyve ve Sebze";
const PAGE_SIZE = 25;
const MAX_PAGES_PER_KEYWORD = 4;
const REQUEST_TIMEOUT_MS = 20000;

const SUPPORTED_CHAINS = ["a101", "bim", "carrefour", "migros", "tarim_kredi", "sok"] as const;
type ChainSlug = (typeof SUPPORTED_CHAINS)[number];

// Faz A2: sebze-meyve dışı perakende dikeyleri (süt/et). Ham keyword araması aromalı/
// markalı varyant getirdiği için include/exclude başlık filtresi şart (sade ürün temsili).
interface RetailExtra {
  slug: string;
  name: string;
  category: string;
  unit: string;
  keyword: string;
  menuCategory: string;
  include: RegExp;
  exclude: RegExp;
}
const RETAIL_EXTRA: RetailExtra[] = [
  { slug: "dana-kiyma", name: "Dana Kıyma", category: "et", unit: "kg", keyword: "dana kıyma",
    menuCategory: "Et, Tavuk ve Balık", include: /KIYMA/i, exclude: /K[ÖO]FTE|HAZIR|BAHARATLI|DONUK|DONDURUL|KARI[ŞS]IK|TAVUK|HİND[İI]/i },
  { slug: "dana-kusbasi", name: "Dana Kuşbaşı", category: "et", unit: "kg", keyword: "dana kuşbaşı",
    menuCategory: "Et, Tavuk ve Balık", include: /KU[ŞS]BA[ŞS]I/i, exclude: /DONUK|DONDURUL|HAZIR|BAHARATLI|TAVUK|HİND[İI]/i },
  { slug: "tavuk-gogsu", name: "Tavuk Göğsü", category: "et", unit: "kg", keyword: "tavuk göğüs",
    menuCategory: "Et, Tavuk ve Balık", include: /TAVUK.*(G[ÖO][ĞG][ÜU]S|B[ÖO]N|F[İI]LETO)|G[ÖO][ĞG][ÜU]S/i, exclude: /DONUK|[ŞS][İI]N[İI]TZEL|SCHNITZEL|MAR[İI]NE|BAHARAT|NUGGET|KANAT|BUT\b|PİRZOLA/i },
  { slug: "sut", name: "Süt", category: "sut", unit: "lt", keyword: "süt",
    menuCategory: "Süt Ürünleri ve Kahvaltılık", include: /\bS[ÜU]T\b/i, exclude: /[ÇC][İI]LEK|[ÇC][İI]KOLAT|KAKAO|MUZ|AROMA|VAN[İI]L|BADEM|YULAF|H[İI]ND[İI]STAN|PROTE[İI]N|KAYMAK|TOZ|KONDENS|LABNE|PEYN[İI]R|YO[ĞG]URT/i },
  { slug: "beyaz-peynir", name: "Beyaz Peynir", category: "sut", unit: "kg", keyword: "beyaz peynir",
    menuCategory: "Süt Ürünleri ve Kahvaltılık", include: /BEYAZ\s*PEYN[İI]R/i, exclude: /KREM|LOR|[ÜU][ÇC]GEN|TOST|D[İI]L\b|KA[ŞS]AR|LAKTOZSUZ/i },
  { slug: "yogurt", name: "Yoğurt", category: "sut", unit: "kg", keyword: "yoğurt",
    menuCategory: "Süt Ürünleri ve Kahvaltılık", include: /YO[ĞG]URT/i, exclude: /[ÇC][İI]LEK|MEYVE|KIVAM|[İI][ÇC][İI]M\b|KA[ŞS]IK|AROMA|H[ÜU]PP|KIT|PROTE[İI]N|AYRAN|KEF[İI]R|MANT|DANON[İI]NO/i },
  // Faz A3: paketli temel gıda / bakliyat perakende dikeyi (marketfiyati "Temel Gıda").
  // Premium/organik/basmati/marka çeşitleri kg-birim fiyatı şişirdiği için exclude şart —
  // amaç halkın aradığı sade osmancık/baldo pirinç, kırmızı mercimek gibi temsili fiyat.
  { slug: "pirinc", name: "Pirinç", category: "hububat", unit: "kg", keyword: "pirinç",
    menuCategory: "Temel Gıda", include: /P[İI]R[İI]N[ÇC]/i,
    exclude: /ORGAN[İI]K|BASMAT[İI]|JASM[İI]N|ESMER|KEPEKL[İI]|YABAN[İI]|GLUTENS[İI]Z|BEBEK|PATLA|[ÇC]?[İI]?KOLAT/i },
  { slug: "mercimek", name: "Mercimek", category: "bakliyat-kuru", unit: "kg", keyword: "kırmızı mercimek",
    menuCategory: "Temel Gıda", include: /MERC[İI]MEK/i,
    exclude: /ORGAN[İI]K|F[İI]L[İI]Z|BEBEK|[ÇC]ORBA|HAZIR|SARI|YE[ŞS][İI]L/i },
  { slug: "kuru-fasulye", name: "Kuru Fasulye", category: "bakliyat-kuru", unit: "kg", keyword: "kuru fasulye",
    menuCategory: "Temel Gıda", include: /FASULYE/i,
    exclude: /TAZE|BARBUNYA|B[ÖO]R[ÜU]LCE|[ÇC]ALI|AY[ŞS]E|HAZIR|KONSERVE|ORGAN[İI]K|YE[ŞS][İI]L/i },
  { slug: "nohut", name: "Nohut", category: "bakliyat-kuru", unit: "kg", keyword: "nohut",
    menuCategory: "Temel Gıda", include: /NOHUT/i,
    exclude: /LEBLEB[İI]|CA[ĞG]LA|HAZIR|KONSERVE|ORGAN[İI]K|[ÇC][İI][ĞG]|HUMUS/i },
  { slug: "bulgur", name: "Bulgur", category: "bakliyat-kuru", unit: "kg", keyword: "bulgur",
    menuCategory: "Temel Gıda", include: /BULGUR/i,
    exclude: /ORGAN[İI]K|[ÇC][İI][ĞG]|ESMER|S[İI]YAH|A[ŞS]UREL[İI]K/i },
];

interface DepotInfo extends DepotEvidence {
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
): Promise<{ data: MfSearchResponse | null; throttled: boolean; error?: string }> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), REQUEST_TIMEOUT_MS);
  try {
    const res = await fetch(`${API_BASE}/search`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "User-Agent": UA, "Connection": "close" },
      body: JSON.stringify({ keywords: keyword, pages: page, size: PAGE_SIZE }),
      signal: ctrl.signal,
    });
    if (!res.ok) {
      return { data: null, throttled: res.status === 403 || res.status === 429, error: `SEARCH_HTTP_${res.status}` };
    }
    return { data: (await res.json()) as MfSearchResponse, throttled: false };
  } catch (error) {
    const code = error && typeof error === "object" && "code" in error ? String(error.code) : "";
    const category = ["ECONNRESET", "ETIMEDOUT", "ECONNREFUSED", "ENOTFOUND"].includes(code) ? code : "NETWORK_OR_RESPONSE";
    return { data: null, throttled: false, error: `SEARCH_${category}_ERROR` };
  } finally {
    clearTimeout(timer);
  }
}

async function searchKeyword(keyword: string): Promise<{
  products: MfProduct[];
  errors: string[];
  calls: number;
  throttled: boolean;
}> {
  const all: MfProduct[] = [];
  const errors: string[] = [];
  let calls = 0;
  for (let page = 0; page < MAX_PAGES_PER_KEYWORD; page++) {
    const response = await fetchSearchPage(keyword, page);
    calls++;
    if (response.error) errors.push(response.error);
    if (response.throttled) return { products: all, calls, errors, throttled: true };
    const data = response.data;
    if (!data?.content?.length) break;
    all.push(...data.content);
    if (data.content.length < PAGE_SIZE) break;
  }
  return { products: all, calls, errors, throttled: false };
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
      .replace(/\s+[Kk][Gg]\s*$/u, "")
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
  const exactOverrides: Record<string, string> = { "sogan": "sogan-kuru", "kuru sogan": "sogan-kuru" };
  const slug = exactOverrides[turkishToAscii(cleaned)] ?? aliasMap.get(turkishToAscii(cleaned));

  if (!slug || !retailTitleMatches(slug, rawTitle)) return null;
  const rows = await db
    .select({ id: hfProducts.id, unit: hfProducts.unit })
    .from(hfProducts)
    .where(eq(hfProducts.slug, slug))
    .limit(1);
  return rows[0] && retailUnit(rows[0].unit) === "kg" ? rows[0].id : null;
}

// (chain, productId) → en yeni kaynak günündeki en düşük doğrulanmış teklif
type Bucket = { price: number; productNameRaw: string; unit: string; recordedDate: string };
const bucketKey = (chain: ChainSlug, productId: number) => `${chain}::${productId}`;

// Küratörlü perakende ürünü (süt/et) — yoksa oluştur, id döndür.
async function findOrCreateRetailProduct(x: RetailExtra, dryRun = false): Promise<number | null> {
  const rows = await db.select({ id: hfProducts.id }).from(hfProducts).where(eq(hfProducts.slug, x.slug)).limit(1);
  if (rows[0]) return rows[0].id;
  if (dryRun) return null;
  await db.insert(hfProducts).values({
    slug: x.slug, nameTr: x.name, categorySlug: x.category, unit: x.unit,
    aliases: [x.name, x.keyword], isActive: 1, seoIndex: 0,
  }).onDuplicateKeyUpdate({ set: { categorySlug: x.category, unit: x.unit } });
  invalidateAliasCache();
  const created = await db.select({ id: hfProducts.id }).from(hfProducts).where(eq(hfProducts.slug, x.slug)).limit(1);
  return created[0]!.id;
}

export interface MarketfiyatiEtlResult {
  inserted: number;
  skipped: number;
  searchFailures: number;
  searchFailuresByKeyword: Record<string, string[]>;
  unmatched: number;
  unmatchedNames: string[];
  errors: string[];
  keywordCount: number;
  apiCallCount: number;
  throttled: boolean;
  sourceDates: string[];
  rejectedEvidence: number;
  rejectionReasons: Record<string, number>;
  writeFailures: Record<string, number>;
  offersByChain: Record<string, number>;
  verifiedOffers: number;
  sample: Array<{ productId: number; chain: string; price: number; unit: string; recordedDate: string; productNameRaw: string }>;
}

export async function runMarketfiyatiEtl(
  targetDate?: string,
  options: { dryRun?: boolean } = {},
): Promise<MarketfiyatiEtlResult> {
  invalidateAliasCache();

  const today = new Date().toISOString().slice(0, 10);
  if (targetDate && targetDate !== today) throw new Error("Marketfiyati historical backfill is not supported");
  const result: MarketfiyatiEtlResult = {
    inserted: 0,
    skipped: 0,
    searchFailures: 0,
    searchFailuresByKeyword: {},
    unmatched: 0,
    unmatchedNames: [],
    errors: [],
    keywordCount: 0,
    apiCallCount: 0,
    throttled: false,
    sourceDates: [],
    rejectedEvidence: 0,
    rejectionReasons: {},
    writeFailures: {},
    offersByChain: {},
    verifiedOffers: 0,
    sample: [],
  };

  // 1) Keyword listesi: hf_products'taki taze sebze + meyve (kg birimli)
  const products = await db
    .select({ slug: hfProducts.slug, nameTr: hfProducts.nameTr, unit: hfProducts.unit, category: hfProducts.categorySlug, canonical: hfProducts.canonicalSlug })
    .from(hfProducts)
    .where(eq(hfProducts.isActive, 1));

  const keywords = new Set<string>();
  for (const p of products) {
    if (p.unit !== "kg" || p.canonical || !["sebze", "meyve", "sebze-meyve"].includes(p.category ?? "")) continue;
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
  // Keep one real offer, not an average labelled with the first SKU's title.
  const collect = (chain: ChainSlug, productId: number, title: string, d: DepotInfo, unit: string) => {
    const offer = verifiedDepot(d, unit, today);
    if (!offer) {
      result.skipped++; result.rejectedEvidence++;
      const reason = depotRejectionReason(d, unit, today) ?? "UNVERIFIED";
      result.rejectionReasons[reason] = (result.rejectionReasons[reason] ?? 0) + 1;
      return;
    }
    const key = bucketKey(chain, productId);
    const existing = buckets.get(key);
    if (!existing || offer.date > existing.recordedDate ||
        (offer.date === existing.recordedDate && offer.price < existing.price)) {
      buckets.set(key, { price: offer.price, productNameRaw: title, unit: offer.unit, recordedDate: offer.date });
    }
  };

  // 2a) Faz A2/A3: küratörlü perakende dikeyi (süt/et + paketli bakliyat). Fresh-produce
  // döngüsünden ÖNCE çalışır — marketfiyati ~750 çağrıdan sonra IP'yi throttle'layıp boş
  // döndürüyor; kürasyonlu az sayıda keyword taze rate budget ile veri alsın diye başta.
  let throttleDetected = false;
  for (const x of RETAIL_EXTRA) {
    const search = await searchKeyword(x.keyword);
    result.apiCallCount += search.calls;
    result.searchFailures += search.errors.length;
    if (search.errors.length) result.searchFailuresByKeyword[x.keyword] = search.errors;
    for (const error of search.errors) if (result.errors.length < 10) result.errors.push(error);
    if (search.throttled) {
      throttleDetected = true;
      result.throttled = true;
      result.errors.push(`marketfiyati throttle: kuratorlu dikey ${x.slug} sirasinda durduruldu`);
    }
    const found = search.products;
    const productId = await findOrCreateRetailProduct(x, options.dryRun);
    if (productId == null) continue;
    for (const p of found) {
      if (p.menu_category !== x.menuCategory) continue;
      // Türkçe büyütme (ı→I, i→İ) — JS /i flag'i Türkçe katlamaz; uppercased başlıkta eşleştir.
      const title = (p.title ?? "").toLocaleUpperCase("tr-TR");
      if (!x.include.test(title) || x.exclude.test(title) || !retailTitleMatches(x.slug, p.title)) continue;
      for (const d of p.productDepotInfoList ?? []) {
        const chain = d.marketAdi as ChainSlug;
        if (!SUPPORTED_CHAINS.includes(chain)) continue;
        collect(chain, productId, p.title, d, x.unit);
      }
    }
    if (throttleDetected) break;
  }

  // 2b) Fresh produce (sebze-meyve) — çok sayıda keyword; throttle riski en son burada.
  for (const keyword of throttleDetected ? [] : keywords) {
    const search = await searchKeyword(keyword);
    result.apiCallCount += search.calls;
    result.searchFailures += search.errors.length;
    if (search.errors.length) result.searchFailuresByKeyword[keyword] = search.errors;
    for (const error of search.errors) if (result.errors.length < 10) result.errors.push(error);
    if (search.throttled) {
      result.throttled = true;
      result.errors.push(`marketfiyati throttle: fresh-produce ${keyword} sirasinda durduruldu`);
    }
    const found = search.products;

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
        collect(chain, productId, p.title, d, "kg");
      }
    }
    if (search.throttled) break;
  }


  // 3) Kaynak tarihli, gerçek tek teklif → mevcut retail tablosu
  for (const [key, b] of buckets.entries()) {
    const [chain, productIdStr] = key.split("::");
    const productId = Number(productIdStr);

    result.verifiedOffers++;
    result.offersByChain[chain!] = (result.offersByChain[chain!] ?? 0) + 1;
    if (result.sample.length < 12) result.sample.push({ productId, chain: chain!, ...b });
    if (options.dryRun) continue;
    try {
      await upsertRetailPriceRow({ productId, chainSlug: chain!, price: b.price, unit: b.unit,
        productNameRaw: b.productNameRaw, productUrl: MARKETFIYATI_SOURCE, recordedDate: b.recordedDate });
      result.inserted++;
    } catch (err) {
      result.skipped++;
      const message = err instanceof Error ? err.message : String(err);
      const reason = message.startsWith("RETAIL_PRICE_QUARANTINED:") ? message : "RETAIL_WRITE_ERROR";
      result.writeFailures[reason] = (result.writeFailures[reason] ?? 0) + 1;
      if (!result.errors.includes(reason)) result.errors.push(reason);
    }
  }

  result.sourceDates = [...new Set([...buckets.values()].map(b => b.recordedDate))].sort();
  if (result.verifiedOffers === 0) result.errors.push("NO_VERIFIED_RETAIL_OBSERVATIONS");
  return result;
}
