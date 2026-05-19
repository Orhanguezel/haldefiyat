import { fetchMarkets } from "@/lib/api";

// Kapsam = canlı veri. "81 il" gibi sabit iddia YOK; gerçekten veri alınan
// aktif hal/şehir sayısı API'den türetilir, yeni hal eklendikçe otomatik artar.
export interface Coverage {
  markets: number;
  cities: number;
}

export async function getCoverage(): Promise<Coverage> {
  try {
    const markets = await fetchMarkets();
    const cities = new Set(
      markets.map((m) => (m.cityName || "").trim()).filter(Boolean),
    );
    return { markets: markets.length, cities: cities.size };
  } catch {
    return { markets: 0, cities: 0 };
  }
}
