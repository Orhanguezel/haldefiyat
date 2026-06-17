import { fetchMarkets, fetchPricesOverview } from "@/lib/api";

// Kapsam = canlı veri. "81 il" gibi sabit iddia YOK; gerçekten veri alınan
// aktif hal/şehir sayısı API'den türetilir, yeni hal eklendikçe otomatik artar.
export interface Coverage {
  markets: number;
  cities: number;
}

export async function getCoverage(): Promise<Coverage> {
  try {
    const [markets, overview] = await Promise.all([fetchMarkets(), fetchPricesOverview()]);
    // "Veri alınan il" = gerçekten fiyat verisi gelen il sayısı (overview.activeCities,
    // topbar ile aynı kaynak). Tüm hallerin distinct şehri DEĞİL — veri üretmeyen
    // hallerin illeri sayılırsa rakam şişer (34 gibi). overview boşsa distinct'e düş.
    const cityFallback = new Set(
      markets.map((m) => (m.cityName || "").trim()).filter(Boolean),
    ).size;
    const cities = overview.activeCities && overview.activeCities > 0 ? overview.activeCities : cityFallback;
    return { markets: markets.length, cities };
  } catch {
    return { markets: 0, cities: 0 };
  }
}
