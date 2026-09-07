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

/** Only count explicit JSON-LD Product entities on this fetched page. */
export function parseCompetitorHtml(_siteKey: string, html: string): CompetitorMetrics {
  const products = new Set<string>();
  let blocks = 0, malformed = 0;
  function visit(value: unknown): void {
    if (Array.isArray(value)) { value.forEach(visit); return; }
    if (!value || typeof value !== 'object') return;
    const node = value as Record<string, unknown>;
    const types = [node['@type']].flat();
    if (types.some(t => typeof t === 'string' && /(?:^|[/#])Product$/.test(t))) {
      const identity = node['@id'] ?? node.url ?? node.sku ?? node.name;
      if (typeof identity === 'string' && identity.trim()) products.add(identity.trim());
    }
    Object.values(node).forEach(visit);
  }
  for (const match of html.matchAll(/<script\b[^>]*type\s*=\s*['"]application\/ld\+json['"][^>]*>([\s\S]*?)<\/script>/gi)) {
    blocks++;
    try { visit(JSON.parse(match[1])); } catch { malformed++; }
  }
  return {
    // Page entities are not the site's catalog; unknown totals stay NULL.
    productCount: null, marketCount: null,
    detectedFeatures: detectFeatures(html),
    rawMetrics: { method: 'jsonld-page-v1', scope: 'fetched_page', htmlLength: html.length,
      jsonLdBlocks: blocks, malformedBlocks: malformed,
      pageProductEntities: blocks > 0 && malformed === 0 ? products.size : null },
  };
}

export function buildDiffSummary(
  prev: { productCount: number | null; marketCount: number | null; detectedFeatures: string[] | null; rawMetrics?: Record<string, unknown> | null } | null,
  curr: CompetitorMetrics,
): string | null {
  if (!prev) return 'İlk snapshot — karşılaştırma yok; toplam ürün/hal sayısı bilinmiyor.';
  const lines: string[] = [];
  const before = prev.rawMetrics;
  if (before && before.method === curr.rawMetrics.method && typeof before.pageProductEntities === 'number' && typeof curr.rawMetrics.pageProductEntities === 'number') {
    lines.push(`Bu sayfada JSON-LD ürün kaydı: ${before.pageProductEntities} → ${curr.rawMetrics.pageProductEntities}. Site toplamı değildir.`);
  } else {
    lines.push('Ürün/hal sayısı karşılaştırılamıyor: aynı yöntemle ölçülmüş yapısal kanıt yok.');
  }
  const prevFeatures = new Set(prev.detectedFeatures ?? []);
  const added = curr.detectedFeatures.filter(f => !prevFeatures.has(f));
  const removed = [...prevFeatures].filter(f => !curr.detectedFeatures.includes(f));
  if (added.length) lines.push(`Yeni özellik sinyali: ${added.join(', ')}`);
  if (removed.length) lines.push(`Kaybolan özellik sinyali: ${removed.join(', ')}`);
  if (!added.length && !removed.length) lines.push('İzlenen HTML özellik sinyallerinde değişiklik yok; işlev doğrulaması yapılmadı.');
  return lines.join('\n');
}
