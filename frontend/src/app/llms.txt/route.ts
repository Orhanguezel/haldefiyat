import { NextResponse } from "next/server";

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://haldefiyat.com").replace(/\/$/, "");
const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "https://haldefiyat.com").replace(/\/$/, "");

export const revalidate = 3600;

export async function GET() {
  const content = `# HalDeFiyat
> Türkiye genelindeki hal ve toptancı pazar fiyatlarını günlük olarak izleyen bağımsız veri platformu. Sebze, meyve ve bakliyat için resmi belediye hal müdürlüklerinden otomatik olarak derlenen veriler.

## Platformun Kapsamı

- Türkiye genelindeki aktif toptancı halleri (çoklu il ve bölge)
- 250+ ürün — sebze, meyve, bakliyat, ithal ürünler
- 16 resmi ETL kaynağı — belediye hal müdürlükleri + hal.gov.tr
- Güncelleme sıklığı: Her gün TSİ 06:15 (gece ETL çalışır)
- Veri geçmişi: 2025'ten itibaren

## Ana Sayfalar

- [Anasayfa](${SITE_URL}/): Platform özeti, günlük fiyat tickers, şehir seçimi
- [Güncel Hal Fiyatları](${SITE_URL}/fiyatlar): Tüm ürünlerin günlük fiyat tablosu, şehir ve kategori filtreli
- [HalDeFiyat Endeksi](${SITE_URL}/endeks): 15 temel tarım ürününden oluşan haftalık sepet endeksi, baz haftaya göre değişim
- [Hal Listesi](${SITE_URL}/hal): Türkiye genelindeki tüm haller — şehir, bölge, kaynak bilgisi
- [Fiyat Karşılaştırma](${SITE_URL}/karsilastirma): Ürün ve hal bazlı yan yana karşılaştırma
- [Metodoloji](${SITE_URL}/metodoloji): Veri kaynakları, derleme süreci, güvenilirlik standartları
- [Hakkımızda](${SITE_URL}/hakkimizda): Platform amacı, kapsam, ekip
- [API Dokümantasyonu](${SITE_URL}/api-docs): Geliştiriciler için açık veri API erişimi
- [API Kullanım Politikası](${SITE_URL}/api-policy): API serbest, HTML scraping yasak, atıf ve cache kuralları
- [Veri Sağlığı](${SITE_URL}/data-health): ETL kaynaklarının son çekim ve hata durumları
- [OpenAPI JSON](${SITE_URL}/openapi.json): Makine-okunur API sözleşmesi

## Dinamik Sayfalar

- Ürün detayı: ${SITE_URL}/urun/{slug} — örn. /urun/domates, /urun/patates, /urun/elma
- Hal detayı: ${SITE_URL}/hal/{slug} — örn. /hal/istanbul-hal-ibb, /hal/ankara-hal, /hal/antalya-hal-merkez

## Açık Veri API

- OpenAPI sözleşmesi: ${SITE_URL}/openapi.json
- API politikası: ${SITE_URL}/api-policy
- Kaynak sağlığı: ${SITE_URL}/data-health
- Tüm ürün fiyatları: ${API_URL}/api/v1/prices
- Güncel fiyat niyeti: ${API_URL}/api/v1/prices/latest?city={city}&product={product}
- Kaynak durumları: ${API_URL}/api/v1/sources/status
- Ürün bazlı fiyat geçmişi: ${API_URL}/api/v1/prices/history/{slug}
- Ürün arama: ${API_URL}/api/v1/products/search?q={query}
- Ürün aliasları: ${API_URL}/api/v1/products/{slug}/aliases
- Hal listesi: ${API_URL}/api/v1/prices/markets
- Fiyat endeksi: ${API_URL}/api/v1/index/latest
- Endeks geçmişi: ${API_URL}/api/v1/index/history

## Bot ve Ajan Kullanımı

- HTML sayfalarını scrape etmeyin; JSON API ve OpenAPI sözleşmesini kullanın.
- Yanıtları en az 5 dakika cache'leyin.
- Bayat veri için API response içindeki warnings, isStale, fetchedAt ve sourceUrl alanlarını dikkate alın.
- Önerilen atıf: "Kaynak: HaldeFiyat.com; birincil kaynak: {sourceName/sourceUrl}".

## Veri Kaynakları

Veriler aşağıdaki resmi kaynaklardan otomatik olarak derlenmektedir:
- Türkiye Hal Bilgi Sistemi (hal.gov.tr) — ulusal ortalama fiyatlar
- İstanbul Büyükşehir Belediyesi Hal Müdürlüğü
- İzmir Büyükşehir Belediyesi Hal Müdürlüğü
- Ankara, Bursa, Adana, Kocaeli, Gaziantep, Mersin, Balıkesir, Kayseri belediye halleri
- Antalya Toptancılar Kooperatifi (antkomder.com.tr)

## Lisans

İçerik Creative Commons Atıf 4.0 (CC BY 4.0) lisansı altındadır.
Kaynak belirtilerek serbestçe kullanılabilir: haldefiyat.com
HTML scraping kullanım koşullarına aykırıdır; açık veri erişimi API üzerinden serbesttir.
`;

  return new NextResponse(content, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
