import type { CityProductDetail } from "@/lib/api";

export const fmtTl = (n: number) => n.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
export const pct = (n: number) => `${n > 0 ? "+" : ""}${n.toLocaleString("tr-TR", { maximumFractionDigits: 1 })}%`;

export function cityProductHref(citySlug: string, productSlug: string) {
  return `/fiyat/${citySlug}/${productSlug}`;
}

/** Sayfanin ozet cumlesi: sayilar API'den, iddia yok — veri yoksa sessizce kisalir. */
export function buildCityProductSummary(d: CityProductDetail, dateTr: string): string {
  const { pair, latest, weekAgoAvg, nationalMedian, rank, cities } = d;
  if (!latest) return `${pair.cityName} için ${pair.productName.toLocaleLowerCase("tr-TR")} kaydı son günlerde yayınlanmadı; tablo son yayınlanan hal kayıtlarını gösterir.`;
  const parts = [`${dateTr} itibarıyla ${pair.marketName}'nde ${pair.productName.toLocaleLowerCase("tr-TR")} ortalama ${fmtTl(latest.avgPrice)} TL/${pair.unit}`];
  if (latest.minPrice != null && latest.maxPrice != null && latest.minPrice !== latest.maxPrice) parts.push(`(${fmtTl(latest.minPrice)}–${fmtTl(latest.maxPrice)} aralığında)`);
  let s = `${parts.join(" ")}.`;
  if (weekAgoAvg && weekAgoAvg > 0) {
    const ch = (latest.avgPrice / weekAgoAvg - 1) * 100;
    s += Math.abs(ch) < 1 ? " Bir hafta öncesine göre yatay." : ` Bir hafta öncesine göre %${Math.abs(ch).toLocaleString("tr-TR", { maximumFractionDigits: 1 })} ${ch > 0 ? "yukarıda" : "aşağıda"}.`;
  }
  if (nationalMedian && cities.length >= 3) {
    const diff = (latest.avgPrice / nationalMedian - 1) * 100;
    s += ` ${cities.length} şehrin medyanı ${fmtTl(nationalMedian)} TL/${pair.unit}; ${pair.cityName} ${Math.abs(diff) < 2 ? "medyanla aynı seviyede" : `medyandan %${Math.abs(diff).toLocaleString("tr-TR", { maximumFractionDigits: 1 })} ${diff > 0 ? "pahalı" : "ucuz"}`}${rank ? ` (ucuzdan pahalıya ${rank}. sırada)` : ""}.`;
  }
  return s;
}

/**
 * Sehir x urun sayfasi yapisal verisi (8 Eyl 2026 rakip analizi).
 *
 * Bu aile canlida 498 kelime ve yalniz Organization + WebSite + Breadcrumb ile
 * yayindaydi; ayni tipteki rakip sayfa (harmanapps /limonmayer-fiyati/adana)
 * Dataset + FAQPage dahil sekiz sema tipi tasiyor. Urun sayfamizda bu iki blok
 * zaten vardi, sehir kirilimina inmiyordu — asagidaki uretici o boslugu kapatir.
 *
 * FAQ metinleri sayfada gorunur bloktan uretilir: sema yalniz gorunen icerigi
 * isaretler, gorunmeyeni iddia etmez.
 */

const SITE_URL_META = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://haldefiyat.com").replace(/\/$/, "");

export function buildCityProductDataset(d: CityProductDetail, licenseUrl: string): Record<string, unknown> {
  const { pair, latest, history } = d;
  const dates = [...history.map((row) => row.recordedDate), ...(latest ? [latest.recordedDate] : [])]
    .filter(Boolean)
    .sort();
  const earliest = dates[0];
  const newest = dates[dates.length - 1];

  return {
    name: `${pair.cityName} ${pair.productName} hal fiyatı veri seti`,
    description: `${pair.marketName} kayıtlarından derlenen ${pair.productName.toLocaleLowerCase("tr-TR")} toptan fiyat gözlemleri (en düşük, ortalama, en yüksek).`,
    url: `${SITE_URL_META}${cityProductHref(pair.citySlug, pair.productSlug)}`,
    license: licenseUrl,
    creator: { "@id": `${SITE_URL_META}/#organization` },
    ...(earliest && newest ? { temporalCoverage: `${earliest.slice(0, 10)}/${newest.slice(0, 10)}`, dateModified: newest.slice(0, 10) } : {}),
    spatialCoverage: { "@type": "Place", name: pair.cityName, containedInPlace: { "@type": "Country", name: "Türkiye" } },
    variableMeasured: ["minPrice", "avgPrice", "maxPrice"],
    about: { "@type": "Thing", name: pair.productName },
    isAccessibleForFree: true,
    measurementTechnique: `${pair.marketName} günlük fiyat bülteninden ETL ile derleme; ürün ve birim normalizasyonu`,
    distribution: {
      "@type": "DataDownload",
      encodingFormat: "application/json",
      contentUrl: `${SITE_URL_META}/api/v1/prices?product=${encodeURIComponent(pair.productSlug)}&market=${encodeURIComponent(pair.marketSlug)}`,
    },
  };
}

/** Sayfadaki gorunur SSS bloguyla birebir ayni sorular — sema o blogu isaretler. */
export function buildCityProductFaq(d: CityProductDetail, dateTr: string): Array<{ question: string; answer: string }> {
  const { pair, latest, cities, nationalMedian } = d;
  const lower = pair.productName.toLocaleLowerCase("tr-TR");
  const items: Array<{ question: string; answer: string }> = [];

  items.push({
    question: `${pair.cityName}'da ${lower} bugün kaç lira?`,
    answer: buildCityProductSummary(d, dateTr),
  });

  items.push({
    question: `${pair.cityName} ${lower} fiyatı ne zaman güncellenir?`,
    answer: latest
      ? `${pair.marketName} fiyat bültenini yayınladıkça bu sayfa otomatik güncellenir; son doğrulanmış kayıt ${dateTr} tarihlidir. Kaynak yayın yapmadığı günlerde yeni tarih veya tazelik iddiası yayımlanmaz.`
      : `${pair.marketName} fiyat bültenini yayınladıkça bu sayfa otomatik güncellenir. Şu an doğrulanmış güncel kayıt bulunmadığı için tarih iddiası yayımlanmıyor.`,
  });

  if (nationalMedian && cities.length >= 3) {
    items.push({
      question: `${pair.cityName} ${lower} fiyatı diğer şehirlere göre pahalı mı?`,
      answer: `Karşılaştırmada ${cities.length} şehir var ve medyan ${fmtTl(nationalMedian)} TL/${pair.unit}. ${pair.cityName}'ın bu medyana göre konumu ve şehir şehir tam liste bu sayfadaki karşılaştırma tablosunda yer alır.`,
    });
  }

  items.push({
    question: `Bu fiyat market rafındaki fiyat mı?`,
    answer: `Hayır. Buradaki rakam ${pair.marketName}'nde oluşan toptan hal fiyatıdır; perakende veya bahçede üreticiye ödenen alım fiyatı değildir. Bu fiyat türleri arasında sabit bir sıralama varsayılmaz. Kaynak alt–üst fiyat veriyorsa ortalama bu aralığın orta noktasından türetilir, işlem miktarına göre ağırlıklandırılmaz.`,
  });

  return items;
}
