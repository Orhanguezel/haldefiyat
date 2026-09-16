import { formatDateTr, parseIsoDate } from "@/lib/date-format";
import { pickTitle } from "@/lib/meta-title";

export type FirmCityPriceSample = {
  productName?: string | null;
  avgPrice?: string | number | null;
  unit?: string | null;
  recordedDate?: string | null;
};

/** Hal sayfasindaki "Bugün" / "— Son Liste" esigiyle ayni: bundan eskisi taze sayilmaz. */
const MAX_PRICE_AGE_DAYS = 7;
const DESCRIPTION_MAX = 160;

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

function isFresh(recordedDate: string | null | undefined, today: Date): boolean {
  const date = parseIsoDate(recordedDate);
  if (!date) return false;
  return today.getTime() - date.getTime() <= MAX_PRICE_AGE_DAYS * 86400000;
}

/**
 * Aciklama YALNIZCA sayfanin tutabilecegi sozu verir.
 *
 * Iki ayri tuzak vardi:
 * - Eski metin her sehirde "<sehir> hal guncel sebze meyve fiyatlari" diyordu;
 *   oysa Sivas, Osmaniye, Sanliurfa, Nigde gibi sehirlerin ETL kaynagi yok ve
 *   sayfa yalniz firma dizini. "sivas hal" sorgusu 5,7. sirada 0 tiklama aliyordu.
 * - Kaynagi kapali hallerde (Mersin, 86 gunluk veri) fiyat cumlesi kuruluyor ve
 *   snippet aylar oncesinin fiyatini bugunun listesi gibi gosteriyordu.
 *
 * Ornekler 160 karakterlik butceye gore eklenir: sigmayan ornek hic yazilmaz,
 * boylece aciklama "Erik 42,50…" gibi yarim bir fiyatla bitmez.
 */
export function firmCityDescription(
  cityName: string,
  total: number,
  prices: FirmCityPriceSample[],
  today: Date = new Date(),
): string {
  const head = `${cityName} halindeki ${total} komisyoncu ve firma`;
  const fresh = prices.filter((price) => Number(price.avgPrice) > 0 && Boolean(price.productName) && isFresh(price.recordedDate, today));
  const dateTr = formatDateTr(fresh[0]?.recordedDate);

  if (fresh.length === 0 || !dateTr) {
    return `${head}: telefon numarası, adres ve çalıştıkları ürünler. İlçe bazlı liste, firma tipine göre filtre.`;
  }

  const prefix = `${head}: telefon, adres, çalıştıkları ürünler. ${cityName} hali ${dateTr}: `;
  const samples: string[] = [];
  for (const price of fresh.slice(0, 3)) {
    const sample = `${price.productName} ${formatPriceTry(price.avgPrice as string | number)}/${price.unit || "kg"}`;
    const candidate = [...samples, sample];
    if (`${prefix}${candidate.join(", ")}.`.length > DESCRIPTION_MAX) break;
    samples.push(sample);
  }
  if (samples.length === 0) {
    return `${head}: telefon numarası, adres ve çalıştıkları ürünler. İlçe bazlı liste, firma tipine göre filtre.`;
  }
  return `${prefix}${samples.join(", ")}.`;
}
