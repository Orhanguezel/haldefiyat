import { formatDateTr } from "@/lib/date-format";
import { pickTitle } from "@/lib/meta-title";

export type FirmCityPriceSample = {
  productName?: string | null;
  avgPrice?: string | number | null;
  unit?: string | null;
  recordedDate?: string | null;
};

function formatPriceTry(value: string | number): string {
  return `${Number(value).toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} TL`;
}

/**
 * Bu sayfalara inen aramanin en buyuk kalibi "<sehir> sebze hali telefon
 * numarasi" (3-13 Eyl 2026: 1.113 gosterim). Eski baslik telefon kelimesini
 * hic tasimiyordu ve 60 karakteri asip "Iletisim &…" diye kirpiliyordu.
 * Kirpmak yerine sigan aday secilir; "Telefon" her adayda korunur.
 */
export function firmCityTitle(cityName: string, total: number, year: number | string): string {
  const head = `${cityName} Hal Komisyoncuları`;
  return pickTitle([
    `${head} — ${total} Firma Telefon & Adres ${year}`,
    `${head} — ${total} Firma Telefon & Adres`,
    `${head} — ${total} Firma Telefon`,
    `${head} ve Telefon Numaraları`,
  ]);
}

/**
 * Fiyat cumlesi YALNIZCA o sehrin gercekten taze hal verisi varsa kurulur.
 *
 * Eski metin her sehirde "<sehir> hal guncel sebze meyve fiyatlari" diyordu;
 * oysa Sivas, Osmaniye, Sanliurfa, Nigde gibi sehirlerin ETL kaynagi yok ve
 * sayfa yalniz firma dizini. "sivas hal" sorgusu 5,7. sirada 0 tiklama
 * aliyordu — snippet tutamayacagi sozu veriyordu.
 */
export function firmCityPriceLine(cityName: string, prices: FirmCityPriceSample[]): string {
  const samples = prices
    .filter((price) => Number(price.avgPrice) > 0 && Boolean(price.productName))
    .slice(0, 3)
    .map((price) => `${price.productName} ${formatPriceTry(price.avgPrice as string | number)}/${price.unit || "kg"}`);
  const dateTr = formatDateTr(prices[0]?.recordedDate);
  if (samples.length === 0 || !dateTr) return "";
  return `${cityName} hali ${dateTr}: ${samples.join(", ")}.`;
}

export function firmCityDescription(cityName: string, total: number, priceLine: string): string {
  const head = `${cityName} halindeki ${total} komisyoncu ve firma`;
  return priceLine
    ? `${head}: telefon, adres, çalıştıkları ürünler. ${priceLine}`
    : `${head}: telefon numarası, adres ve çalıştıkları ürünler. İlçe bazlı liste, firma tipine göre filtre.`;
}
