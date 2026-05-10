import { NextResponse } from "next/server";

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://haldefiyat.com").replace(/\/$/, "");
const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "https://haldefiyat.com").replace(/\/$/, "");

export const revalidate = 3600;

export async function GET() {
  const content = `# HalDeFiyat
> Türkiye'nin 81 ilindeki hal ve toptancı pazar fiyatlarını günlük olarak izleyen bağımsız veri platformu. Sebze, meyve ve bakliyat için resmi belediye hal müdürlüklerinden otomatik olarak derlenen veriler.

## Platformun Kapsamı

- 81 il — Türkiye'nin tüm coğrafi bölgeleri
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

## Dinamik Sayfalar

- Ürün detayı: ${SITE_URL}/urun/{slug} — örn. /urun/domates, /urun/patates, /urun/elma
- Hal detayı: ${SITE_URL}/hal/{slug} — örn. /hal/istanbul-hal-ibb, /hal/ankara-hal, /hal/antalya-hal-merkez

## Açık Veri API

- Tüm ürün fiyatları: ${API_URL}/api/v1/prices
- Ürün bazlı fiyat geçmişi: ${API_URL}/api/v1/prices/history/{slug}
- Hal listesi: ${API_URL}/api/v1/markets
- Fiyat endeksi: ${API_URL}/api/v1/index/latest
- Endeks geçmişi: ${API_URL}/api/v1/index/history

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
`;

  return new NextResponse(content, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
