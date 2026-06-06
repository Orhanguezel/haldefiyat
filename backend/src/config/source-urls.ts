export type SourceType = "municipality" | "exchange" | "official" | "cooperative" | "manual";

export interface SourceInfo {
  name: string;
  url: string;
  type?: SourceType;
  official?: boolean;
}

const SOURCE_URLS: Record<string, SourceInfo> = {
  izmir_sebzemeyve: {
    name: "İzmir Büyükşehir Belediyesi Hal Fiyatları",
    url: "https://openapi.izmir.bel.tr",
    type: "municipality",
    official: true,
  },
  izmir_balik: {
    name: "İzmir Büyükşehir Belediyesi Balık Hali",
    url: "https://openapi.izmir.bel.tr",
    type: "municipality",
    official: true,
  },
  ankara_resmi: {
    name: "Ankara Büyükşehir Belediyesi Hal Fiyatları",
    url: "https://www.ankara.bel.tr/hal-fiyatlari",
    type: "municipality",
    official: true,
  },
  mersin_resmi: {
    name: "Mersin Büyükşehir Belediyesi Hal Fiyatları",
    url: "https://www.mersin.bel.tr/hal-fiyatlari",
    type: "municipality",
    official: true,
  },
  konya_resmi: {
    name: "Konya Büyükşehir Belediyesi Hal Fiyatları",
    url: "https://www.konya.bel.tr/hal-fiyatlari",
    type: "municipality",
    official: true,
  },
  kayseri_resmi: {
    name: "Kayseri Büyükşehir Belediyesi Hal Fiyatları",
    url: "https://www.kayseri.bel.tr/hal-fiyatlari",
    type: "municipality",
    official: true,
  },
  eskisehir_resmi: {
    name: "Eskişehir Büyükşehir Belediyesi Hal Fiyatları",
    url: "https://www.eskisehir.bel.tr/hal-fiyatlari",
    type: "municipality",
    official: true,
  },
  denizli_resmi: {
    name: "Denizli Büyükşehir Belediyesi Hal Fiyatları",
    url: "https://www.denizli.bel.tr/Default.aspx?k=halfiyatlari",
    type: "municipality",
    official: true,
  },
  tmo_alim_resmi: {
    name: "TMO Resmi Alım Fiyatları",
    url: "https://www.tmo.gov.tr",
    type: "official",
    official: true,
  },
  tmo_piyasa_bulteni: {
    name: "TMO Günlük Piyasa Bülteni",
    url: "https://www.tmo.gov.tr/Upload/Document/piyasabulteni/piyasabulteni_tr.pdf",
    type: "official",
    official: true,
  },
  polatli_borsa: {
    name: "Polatlı Ticaret Borsası Günlük Bülten",
    url: "https://bulten.polatliborsa.org.tr/gunluk-bulten.html",
    type: "exchange",
    official: true,
  },
  izmir_borsa_pamuk: {
    name: "İzmir Ticaret Borsası Pamuk Bülteni",
    url: "https://itb.org.tr/GunlukBultenler/2-pamuk-bulteni",
    type: "exchange",
    official: true,
  },
};

export function sourceTypeFromMarketType(marketType: string | null | undefined): SourceType {
  switch (marketType) {
    case "hal": return "municipality";
    case "borsa": return "exchange";
    case "resmi": return "official";
    case "kooperatif": return "cooperative";
    default: return "manual";
  }
}

export function sourceInfoFor(sourceApi: string | null | undefined, marketType?: string | null): SourceInfo | null {
  if (sourceApi && SOURCE_URLS[sourceApi]) return SOURCE_URLS[sourceApi]!;
  if (!sourceApi) return null;
  return {
    name: sourceApi,
    url: "",
    type: sourceTypeFromMarketType(marketType),
    official: marketType === "hal" || marketType === "resmi",
  };
}
