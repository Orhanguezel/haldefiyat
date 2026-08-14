export const PUBLIC_METRICS = {
  mapCities: {
    label: "Endeks hesaplanan il",
    note: "Son 7 günlük sabit ürün sepetinde karşılaştırılabilir fiyatı olan il",
  },
  currentCities: {
    label: "Güncel şehir",
    note: "Son 30 günde fiyat verisi olan şehir",
  },
  activeMarkets: {
    label: "Aktif hal",
    note: "Son 30 günde fiyat verisi sağlayan hal",
  },
  currentProducts: {
    label: "Güncel ürün",
    note: "Son 7 günde fiyatı olan canonical ürün",
  },
  activeSources: {
    label: "Aktif kaynak",
    note: "Son 30 günde veri sağlayan resmî kaynak",
  },
  latestRecordedDate: {
    label: "Son veri tarihi",
    note: "Karantina dışındaki en yeni fiyat kaydı",
  },
} as const;

export function publicFreshnessLabel(value: "fresh" | "stale" | "unknown" | undefined): string {
  if (value === "fresh") return "Veri güncel";
  if (value === "stale") return "Veri gecikmeli";
  return "Tazelik bilinmiyor";
}

