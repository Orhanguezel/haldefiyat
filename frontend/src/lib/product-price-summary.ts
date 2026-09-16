import { fetchPrices } from "@/lib/api";
import { formatDateTr } from "@/lib/date-format";

export type ProductPriceSummary = {
  /** Gunun ortalamasi; hicbir gecerli fiyat yoksa null. */
  avg: number | null;
  unit: string;
  /** "16 Eylül 2026" — veri yoksa "". */
  dateTr: string;
  /** Ulusal satir haric, o gun veri yayinlayan sehirler. */
  cities: string[];
  marketCount: number;
};

function toNumberSafe(value: unknown): number {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : NaN;
}

/**
 * Bir urunun EN SON gununun hal ortalamasi.
 *
 * Tek kaynak: hem /urun/[slug] aciklamasi hem /analiz/[slug] koprusu ayni
 * sayiyi gostersin diye burada hesaplanir. "Ulusal ortalama" satiri bir sehir
 * degildir — sehir listesinden dislanir ama hal sayisina girer.
 */
export async function fetchProductPriceSummary(slug: string, fallbackUnit = "kg"): Promise<ProductPriceSummary> {
  const empty: ProductPriceSummary = { avg: null, unit: fallbackUnit, dateTr: "", cities: [], marketCount: 0 };
  try {
    const prices = await fetchPrices({ product: slug, range: "1d", limit: 50 });
    if (prices.length === 0) return empty;
    const latestDate = prices.reduce((max, p) => (p.recordedDate > max ? p.recordedDate : max), "");
    const dayRows = prices.filter((p) => p.recordedDate === latestDate);

    const cities = [...new Set(
      dayRows
        .map((row) => (row.cityName ?? "").trim())
        .filter((city) => city && city.toLocaleLowerCase("tr-TR") !== "türkiye"),
    )];
    const marketCount = new Set(dayRows.map((row) => row.marketSlug).filter(Boolean)).size;
    const dateTr = formatDateTr(latestDate) ?? "";
    const unit = dayRows.find((p) => p.unit)?.unit ?? fallbackUnit;

    const avgs = dayRows.map((p) => toNumberSafe(p.avgPrice)).filter((n) => Number.isFinite(n) && n > 0);
    if (avgs.length === 0) return { avg: null, unit, dateTr, cities, marketCount };
    return { avg: avgs.reduce((a, b) => a + b, 0) / avgs.length, unit, dateTr, cities, marketCount };
  } catch {
    return empty;
  }
}

export function formatAveragePrice(summary: ProductPriceSummary): string {
  if (summary.avg == null) return "";
  return `${summary.avg.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} TL/${summary.unit}`;
}
