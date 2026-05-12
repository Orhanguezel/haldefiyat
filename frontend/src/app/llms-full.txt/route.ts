import { NextResponse } from "next/server";

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://haldefiyat.com").replace(/\/$/, "");
// Public API URL for documentation links (not internal BACKEND_URL)
const PUBLIC_API_URL = (process.env.NEXT_PUBLIC_API_URL ?? SITE_URL).replace(/\/$/, "") + "/api/v1";
// Internal URL for server-side data fetching
const INTERNAL_API_URL = (
  process.env.BACKEND_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:8088"
).replace(/\/$/, "") + "/api/v1";

export const revalidate = 3600;

interface Product { slug: string; nameTr: string; categorySlug: string; unit: string; }
interface Market { slug: string; name: string; cityName: string; regionSlug: string | null; }

async function fetchList<T>(path: string): Promise<T[]> {
  try {
    const res = await fetch(`${INTERNAL_API_URL}${path}`, { next: { revalidate: 3600 } });
    if (!res.ok) return [];
    const json = await res.json() as { data?: T[]; items?: T[] } | T[];
    if (Array.isArray(json)) return json;
    return (json as { data?: T[]; items?: T[] }).data ?? (json as { data?: T[]; items?: T[] }).items ?? [];
  } catch {
    return [];
  }
}

export async function GET() {
  const [products, markets] = await Promise.all([
    fetchList<Product>("/products"),
    fetchList<Market>("/markets"),
  ]);

  const productLines = products.length > 0
    ? products.map((p) => `- [${p.nameTr}](${SITE_URL}/urun/${p.slug}) — kategori: ${p.categorySlug}, birim: ${p.unit}`).join("\n")
    : "- (ürün listesi yüklenemedi)";

  const marketLines = markets.length > 0
    ? markets.map((m) => `- [${m.name}](${SITE_URL}/hal/${m.slug}) — ${m.cityName}${m.regionSlug ? ` (${m.regionSlug})` : ""}`).join("\n")
    : "- (hal listesi yüklenemedi)";

  const content = `# HalDeFiyat — Tam Platform Bilgisi

> HalDeFiyat, Türkiye genelindeki sebze ve meyve hallerinden günlük fiyat verisi toplayan bağımsız bir fiyat takip platformudur.
> Kaynak: Belediye hal müdürlükleri, hal.gov.tr (Tarım Bakanlığı). Güncelleme: Her gün TSİ 06:15.
> Lisans: Creative Commons Atıf 4.0 (CC BY 4.0) — haldefiyat.com kaynak gösterilerek kullanılabilir.

## Platform Kapsamı

- 81 il — Türkiye'nin tüm coğrafi bölgeleri
- 250+ ürün — sebze, meyve, bakliyat, ithal ürünler
- Veri geçmişi: 2025'ten itibaren
- Güncelleme: Günlük otomatik (ETL)

## Açık Veri API

- Tüm fiyatlar: ${PUBLIC_API_URL}/prices
- Ürün fiyat geçmişi: ${PUBLIC_API_URL}/prices/history/{slug}
- Hal listesi: ${PUBLIC_API_URL}/markets
- Ürün listesi: ${PUBLIC_API_URL}/products
- Fiyat endeksi: ${PUBLIC_API_URL}/index/latest

## Ana Sayfalar

- Anasayfa: ${SITE_URL}/
- Güncel Fiyatlar: ${SITE_URL}/fiyatlar
- Endeks: ${SITE_URL}/endeks
- Hal Listesi: ${SITE_URL}/hal
- Karşılaştırma: ${SITE_URL}/karsilastirma
- Metodoloji: ${SITE_URL}/metodoloji
- Hakkımızda: ${SITE_URL}/hakkimizda

## Ürün Listesi (${products.length} ürün)

${productLines}

## Hal Listesi (${markets.length} hal)

${marketLines}
`;

  return new NextResponse(content, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
