/**
 * Rakip site HTML'inden metrik çıkarır.
 * Her siteKey için özelleştirilmiş parser, yoksa genel heuristic çalışır.
 */

export interface CompetitorMetrics {
  productCount: number | null;
  marketCount: number | null;
  detectedFeatures: string[];
  rawMetrics: Record<string, unknown>;
}

// Genel özellik tespiti için anahtar kelimeler
const FEATURE_SIGNALS: Array<{ label: string; patterns: RegExp[] }> = [
  { label: "fiyat_grafigi",    patterns: [/chart|grafik|trend/i] },
  { label: "arama",            patterns: [/search|ara[mş]/i] },
  { label: "harita",           patterns: [/map|harita|leaflet|mapbox/i] },
  { label: "api_endpoint",     patterns: [/\/api\//i] },
  { label: "mobil_uygulama",   patterns: [/app-store|google-play|playstore|appstore/i] },
  { label: "uye_sistemi",      patterns: [/login|signin|giris|kayit|register/i] },
  { label: "uyari_sistemi",    patterns: [/alert|uyari|bildirim|notification/i] },
  { label: "canli_fiyat",      patterns: [/realtime|canl[ıi]|live/i] },
  { label: "rss_feed",         patterns: [/rss|feed\.xml|atom/i] },
  { label: "reklam",           patterns: [/adsbygoogle|doubleclick|googletag/i] },
  { label: "telegram",         patterns: [/t\.me\/|telegram/i] },
  { label: "newsletter",       patterns: [/bulten|newsletter|subscribe/i] },
];

function detectFeatures(html: string): string[] {
  return FEATURE_SIGNALS
    .filter(({ patterns }) => patterns.some((p) => p.test(html)))
    .map(({ label }) => label);
}

// Sayfa üzerindeki olası ürün sayısı (tablo satırı, kart, liste öğesi sayısı)
function heuristicCount(html: string, patterns: RegExp[]): number | null {
  for (const p of patterns) {
    const matches = html.match(p);
    if (matches && matches.length > 3) return matches.length;
  }
  return null;
}

// ─── Site-spesifik parser'lar ─────────────────────────────────────────────

function parseTarimpiyasa(html: string): CompetitorMetrics {
  // Ürün kartları: <div class="product-card"> veya data-product
  const productMatches = html.match(/class="[^"]*product[^"]*"/gi) ?? [];
  const productCount = productMatches.length > 0 ? productMatches.length : null;

  // Hal sayısı: "X hal" veya "X piyasa" metni
  const marketMatch = html.match(/(\d+)\s*(?:hal|piyasa|market)/i);
  const marketCount = marketMatch ? parseInt(marketMatch[1], 10) : null;

  // Ürün sayısı metin olarak da olabilir
  const countTextMatch = html.match(/(\d+)\s*(?:ürün|urun)/i);
  const countFromText = countTextMatch ? parseInt(countTextMatch[1], 10) : null;

  return {
    productCount: countFromText ?? productCount,
    marketCount,
    detectedFeatures: detectFeatures(html),
    rawMetrics: {
      productCardMatches: productMatches.length,
      countFromText,
      marketTextMatch: marketMatch?.[0] ?? null,
    },
  };
}

function parseGuncelfiyatlari(html: string): CompetitorMetrics {
  // Tablo satırları veya fiyat listesi
  const rowMatches = html.match(/<tr[^>]*>/gi) ?? [];
  const productCount = rowMatches.length > 5 ? rowMatches.length - 2 : null;

  const marketMatch = html.match(/(\d+)\s*(?:hal|şehir|sehir)/i);
  const marketCount = marketMatch ? parseInt(marketMatch[1], 10) : null;

  return {
    productCount,
    marketCount,
    detectedFeatures: detectFeatures(html),
    rawMetrics: { tableRowCount: rowMatches.length },
  };
}

function parseHalfiyatVercel(html: string): CompetitorMetrics {
  // Next.js JSON data içinde ürün sayısı arayabiliriz
  const jsonMatch = html.match(/"products?\s*":\s*\[([^\]]*)\]/i);
  const productCount = jsonMatch
    ? (jsonMatch[1].match(/\{/g) ?? []).length
    : heuristicCount(html, [/<li[^>]*>/gi, /<tr[^>]*>/gi]);

  return {
    productCount,
    marketCount: null,
    detectedFeatures: detectFeatures(html),
    rawMetrics: { hasJsonData: !!jsonMatch },
  };
}

// ─── Ana dispatch ─────────────────────────────────────────────────────────

const PARSERS: Record<string, (html: string) => CompetitorMetrics> = {
  tarimpiyasa: parseTarimpiyasa,
  guncelfiyatlari: parseGuncelfiyatlari,
  halfiyat_vercel: parseHalfiyatVercel,
};

export function parseCompetitorHtml(siteKey: string, html: string): CompetitorMetrics {
  const parser = PARSERS[siteKey];
  if (parser) return parser(html);

  // Genel fallback
  return {
    productCount: heuristicCount(html, [/<tr[^>]*>/gi, /<li[^>]*>/gi]),
    marketCount: null,
    detectedFeatures: detectFeatures(html),
    rawMetrics: { htmlLength: html.length },
  };
}

export function buildDiffSummary(
  prev: { productCount: number | null; marketCount: number | null; detectedFeatures: string[] | null } | null,
  curr: CompetitorMetrics,
): string | null {
  if (!prev) return "İlk snapshot — karşılaştırma yok.";

  const lines: string[] = [];

  if (prev.productCount !== null && curr.productCount !== null) {
    const delta = curr.productCount - prev.productCount;
    if (delta !== 0) {
      lines.push(`Ürün sayısı: ${prev.productCount} → ${curr.productCount} (${delta > 0 ? "+" : ""}${delta})`);
    }
  }

  if (prev.marketCount !== null && curr.marketCount !== null) {
    const delta = curr.marketCount - prev.marketCount;
    if (delta !== 0) {
      lines.push(`Hal sayısı: ${prev.marketCount} → ${curr.marketCount} (${delta > 0 ? "+" : ""}${delta})`);
    }
  }

  const prevFeatures = new Set(prev.detectedFeatures ?? []);
  const newFeatures = curr.detectedFeatures.filter((f) => !prevFeatures.has(f));
  const removedFeatures = [...prevFeatures].filter((f) => !curr.detectedFeatures.includes(f));

  if (newFeatures.length > 0) lines.push(`Yeni özellik: ${newFeatures.join(", ")}`);
  if (removedFeatures.length > 0) lines.push(`Kaldırılan özellik: ${removedFeatures.join(", ")}`);

  return lines.length > 0 ? lines.join("\n") : "Değişiklik yok.";
}
