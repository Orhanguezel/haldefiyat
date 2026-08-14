export type AvgPriceMethod = "reported" | "midpoint" | "unknown";

function finiteNumber(value: string | number | null | undefined): number | null {
  if (value == null || value === "") return null;
  const number = typeof value === "number" ? value : Number(value);
  return Number.isFinite(number) ? number : null;
}

/**
 * Ortalama fiyatın kaynaktan mı geldiğini, yoksa min-max orta noktasından mı
 * türetildiğini kayda geçirir. Açık üretici bilgisi her zaman sezgisel
 * sınıflandırmadan üstündür. Eski ve doğrudan entegrasyonlar için iki ondalık
 * fiyat hassasiyetine uygun, dar bir toleransla güvenli fallback uygulanır.
 */
export function inferAvgPriceMethod(input: {
  avgPrice: string | number;
  minPrice?: string | number | null;
  maxPrice?: string | number | null;
  method?: AvgPriceMethod | null;
}): AvgPriceMethod {
  if (input.method && input.method !== "unknown") return input.method;

  const avg = finiteNumber(input.avgPrice);
  const min = finiteNumber(input.minPrice);
  const max = finiteNumber(input.maxPrice);
  if (avg == null) return "unknown";
  if (min == null || max == null) return input.method ?? "reported";

  const midpoint = (min + max) / 2;
  return Math.abs(avg - midpoint) <= 0.005 ? "midpoint" : "reported";
}
