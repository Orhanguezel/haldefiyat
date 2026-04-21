/**
 * ETL kaynak konfigürasyonu — tek doğruluk noktası.
 *
 * Yeni kaynak eklemek: aşağıdaki dizide bir kayıt oluştur ve ilgili env
 * değişkenlerini `.env`e ekle. Kod tarafında hiçbir kaynak adı veya URL
 * hard-coded değildir.
 *
 * Her kaynak için env override anahtarları:
 *   HF_SOURCE_<KEY>_ENABLED            → true | false
 *   HF_SOURCE_<KEY>_BASE_URL           → https://openapi.izmir.bel.tr
 *   HF_SOURCE_<KEY>_ENDPOINT           → /api/ibb/halfiyatlari/sebzemeyve/{date}
 *   HF_SOURCE_<KEY>_MARKET_SLUG        → izmir-hal
 *
 * KEY: kaynak anahtarının büyük harflisi, nokta ve tire '_' yapılır.
 *   "izmir_sebzemeyve" → HF_SOURCE_IZMIR_SEBZEMEYVE_*
 */

type ResponseShape =
  | "izmir"
  | "ibb"
  | "antkomder_html"
  | "ankara_html"
  | "mersin_html"
  | "konya_html"
  | "kayseri_html"
  | "eskisehir_html"
  | "denizli_html";

export interface EtlSourceConfig {
  key:              string;          // DB'de source_api olarak yazılır
  enabled:          boolean;
  marketSlug:       string;          // hf_markets.slug — FK referansı
  baseUrl:          string;
  endpointTemplate: string;          // {date} placeholder'ı değiştirilir (günlük)
  /**
   * Geçmiş tarih için farklı bir URL şablonu. Örn. Konya SSR: default
   * /hal-fiyatlari (bugün) vs backfill /hal-fiyatlari?tarih={date}.
   * Boş ise `endpointTemplate` backfill için de kullanılır.
   */
  backfillEndpoint: string;
  responseShape:    ResponseShape;   // yanıtın nasıl parse edileceği
  defaultUnit:      string;          // kaynak birim vermiyorsa (örn. HTML scrape)
  defaultCategory:  string;          // kaynak kategori vermiyorsa auto-register fallback
}

interface RawSource {
  key: string;
  defaultEnabled:    boolean;
  defaultMarketSlug: string;
  defaultBaseUrl:    string;
  defaultEndpoint:   string;
  defaultBackfill?:  string;        // opsiyonel — boşsa endpoint ile aynı
  responseShape:     ResponseShape;
  defaultUnit:       string;
  defaultCategory:   string;
}

const RAW_SOURCES: RawSource[] = [
  {
    key:               "izmir_sebzemeyve",
    defaultEnabled:    true,
    defaultMarketSlug: "izmir-hal",
    defaultBaseUrl:    "https://openapi.izmir.bel.tr",
    defaultEndpoint:   "/api/ibb/halfiyatlari/sebzemeyve/{date}",
    responseShape:     "izmir",
    defaultUnit:       "kg",
    defaultCategory:   "diger",
  },
  {
    key:               "izmir_balik",
    defaultEnabled:    true,
    defaultMarketSlug: "izmir-hal",
    defaultBaseUrl:    "https://openapi.izmir.bel.tr",
    defaultEndpoint:   "/api/ibb/halfiyatlari/balik/{date}",
    responseShape:     "izmir",
    defaultUnit:       "kg",
    defaultCategory:   "diger",
  },
  // Antalya — ANTKOMDER (Antalya Yaş Sebze ve Meyve Komisyoncular Derneği).
  // HTML tablo: bugün + dün fiyatı. Tek sayfada iki gün veri gelir; fetcher
  // başlıktan tarihleri okur ve her ürün/gün için ayrı kayıt üretir.
  // URL pattern'i hal id'sine göre — Merkez=1, Serik=3, Kumluca=4.
  {
    key:               "antalya_merkez_antkomder",
    defaultEnabled:    true,
    defaultMarketSlug: "antalya-hal-merkez",
    defaultBaseUrl:    "https://antalyakomisyonculardernegi.com",
    defaultEndpoint:   "/hal-fiyatlari/1",
    responseShape:     "antkomder_html",
    defaultUnit:       "kg",
    defaultCategory:   "sebze-meyve",
  },
  {
    key:               "antalya_serik_antkomder",
    // Dernek sitesi şu an Serik için fiyat yayınlamıyor — veri görünce
    // env ile açılacak (HF_SOURCE_ANTALYA_SERIK_ANTKOMDER_ENABLED=true).
    defaultEnabled:    false,
    defaultMarketSlug: "antalya-hal-serik",
    defaultBaseUrl:    "https://antalyakomisyonculardernegi.com",
    defaultEndpoint:   "/hal-fiyatlari/3",
    responseShape:     "antkomder_html",
    defaultUnit:       "kg",
    defaultCategory:   "sebze-meyve",
  },
  {
    key:               "antalya_kumluca_antkomder",
    defaultEnabled:    false,
    defaultMarketSlug: "antalya-hal-kumluca",
    defaultBaseUrl:    "https://antalyakomisyonculardernegi.com",
    defaultEndpoint:   "/hal-fiyatlari/4",
    responseShape:     "antkomder_html",
    defaultUnit:       "kg",
    defaultCategory:   "sebze-meyve",
  },
  // Konya Büyükşehir — SSR HTML, 2 tablo (sebze + meyve). Parser kategoriyi
  // tablo sırasından çıkarır, her satırda birim sütunu da var (Kg/Adet/Bağ).
  // Tarih parametresi opsiyonel, default'ta sayfa bugünün verisini döndürür.
  {
    key:               "ankara_resmi",
    defaultEnabled:    true,
    defaultMarketSlug: "ankara-hal",
    defaultBaseUrl:    "https://www.ankara.bel.tr",
    defaultEndpoint:   "/hal-fiyatlari",
    responseShape:     "ankara_html",
    defaultUnit:       "kg",
    defaultCategory:   "sebze-meyve",
  },
  {
    key:               "mersin_resmi",
    defaultEnabled:    true,
    defaultMarketSlug: "mersin-hal",
    defaultBaseUrl:    "https://www.mersin.bel.tr",
    defaultEndpoint:   "/hal-fiyatlari-day",
    responseShape:     "mersin_html",
    defaultUnit:       "kg",
    defaultCategory:   "sebze-meyve",
  },
  {
    key:               "konya_resmi",
    defaultEnabled:    true,
    defaultMarketSlug: "konya-hal",
    defaultBaseUrl:    "https://www.konya.bel.tr",
    defaultEndpoint:   "/hal-fiyatlari",
    // Geçmiş tarih için: ?tarih=YYYY-MM-DD ile option listesindeki herhangi
    // bir günün arşiv sayfasına erişim (2004'ten beri ~2020 gün).
    defaultBackfill:   "/hal-fiyatlari?tarih={date}",
    responseShape:     "konya_html",
    defaultUnit:       "kg",
    defaultCategory:   "diger",
  },
  // Kayseri Büyükşehir — SSR HTML, tek tablo. Kolon sırası: Cinsi | Birim |
  // En Yüksek | En Düşük (min/max sıra ters, parser'da ele alınıyor).
  {
    key:               "kayseri_resmi",
    defaultEnabled:    true,
    defaultMarketSlug: "kayseri-hal",
    defaultBaseUrl:    "https://www.kayseri.bel.tr",
    defaultEndpoint:   "/hal-fiyatlari",
    responseShape:     "kayseri_html",
    defaultUnit:       "kg",
    defaultCategory:   "sebze-meyve",
  },
  // Eskişehir Büyükşehir — SSR HTML, tek tablo. Kolon: Ürün Adı | Cinsi | Tür |
  // Max | Min | Avg. HTML entity'li (&#220; = Ü) — parser'da decode var.
  {
    key:               "eskisehir_resmi",
    defaultEnabled:    true,
    defaultMarketSlug: "eskisehir-hal",
    defaultBaseUrl:    "https://www.eskisehir.bel.tr",
    defaultEndpoint:   "/hal-fiyatlari",
    responseShape:     "eskisehir_html",
    defaultUnit:       "kg",
    defaultCategory:   "sebze-meyve",
  },
  // Denizli Büyükşehir — ASP.NET SSR, 2 tablo. Kolon: Ürün Adı | Asgari |
  // Orta | Ekstra (→ min | avg | max). Fiyat "90,00 TL" formatında.
  {
    key:               "denizli_resmi",
    defaultEnabled:    true,
    defaultMarketSlug: "denizli-hal",
    defaultBaseUrl:    "https://www.denizli.bel.tr",
    defaultEndpoint:   "/Default.aspx?k=halfiyatlari",
    responseShape:     "denizli_html",
    defaultUnit:       "kg",
    defaultCategory:   "sebze-meyve",
  },
];

function envKey(key: string, suffix: string): string {
  return `HF_SOURCE_${key.toUpperCase()}_${suffix}`;
}

function envBool(raw: string | undefined, fallback: boolean): boolean {
  if (raw == null || raw === "") return fallback;
  const v = raw.trim().toLowerCase();
  return v === "true" || v === "1" || v === "yes";
}

function envStr(raw: string | undefined, fallback: string): string {
  return (raw ?? "").trim() || fallback;
}

export function loadEtlSources(): EtlSourceConfig[] {
  return RAW_SOURCES.map((s) => ({
    key:              s.key,
    enabled:          envBool(process.env[envKey(s.key, "ENABLED")], s.defaultEnabled),
    marketSlug:       envStr(process.env[envKey(s.key, "MARKET_SLUG")], s.defaultMarketSlug),
    baseUrl:          envStr(process.env[envKey(s.key, "BASE_URL")], s.defaultBaseUrl).replace(/\/$/, ""),
    endpointTemplate: envStr(process.env[envKey(s.key, "ENDPOINT")], s.defaultEndpoint),
    backfillEndpoint: envStr(
      process.env[envKey(s.key, "BACKFILL_ENDPOINT")],
      s.defaultBackfill ?? s.defaultEndpoint,
    ),
    responseShape:    s.responseShape,
    defaultUnit:      envStr(process.env[envKey(s.key, "DEFAULT_UNIT")], s.defaultUnit),
    defaultCategory:  envStr(process.env[envKey(s.key, "DEFAULT_CATEGORY")], s.defaultCategory),
  }));
}

export function activeSources(): EtlSourceConfig[] {
  return loadEtlSources().filter((s) => s.enabled);
}

export function getSourceByKey(key: string): EtlSourceConfig | undefined {
  return loadEtlSources().find((s) => s.key === key);
}
