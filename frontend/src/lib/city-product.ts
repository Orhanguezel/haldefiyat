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
