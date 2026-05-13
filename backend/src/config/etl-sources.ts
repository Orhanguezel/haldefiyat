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
  | "denizli_html"
  | "gaziantep_html"
  | "bursa_html"
  | "kocaeli_html"
  | "balikesir_html"
  | "hal_gov_tr_html"
  | "istanbul_ibb_html"
  | "corum_html"
  | "kutahya_html"
  | "manisa_html"
  | "kahramanmaras_html"
  | "canakkale_html"
  | "yalova_html"
  | "tekirdag_html"
  | "trabzon_html"
  | "batiakdeniz_html"
  | "bolu_html";

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
    // Dernek sayfası yayında; fiyat yayınlanmayan günlerde ETL 0 satırla
    // başarılı kapanır, market pasife alınmaz.
    defaultEnabled:    true,
    defaultMarketSlug: "antalya-hal-serik",
    defaultBaseUrl:    "https://antalyakomisyonculardernegi.com",
    defaultEndpoint:   "/hal-fiyatlari/3",
    responseShape:     "antkomder_html",
    defaultUnit:       "kg",
    defaultCategory:   "sebze-meyve",
  },
  {
    key:               "antalya_kumluca_antkomder",
    // Dernek sayfası yayında; fiyat yayınlanmayan günlerde ETL 0 satırla
    // başarılı kapanır, market pasife alınmaz.
    defaultEnabled:    true,
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
  // Bursa Büyükşehir — SSR HTML, 9 tablo, hepsi: Ürün | BR | FİYAT.
  // FİYAT: "100,00 - 400,00 TL" (min-max). Sayfa tarih parametresi almaz.
  {
    key:               "bursa_resmi",
    defaultEnabled:    true,
    defaultMarketSlug: "bursa-hal",
    defaultBaseUrl:    "https://www.bursa.bel.tr",
    defaultEndpoint:   "/hal_fiyatlari",
    responseShape:     "bursa_html",
    defaultUnit:       "kg",
    defaultCategory:   "sebze-meyve",
  },
  // Gaziantep Büyükşehir — SSR HTML, tek tablo. Kolonlar: Ürün Adı | Az. Fiyat |
  // As. Fiyat | Birim | Tarih. Az.=asgari(min) As.=azami(max). Tarih her satırda.
  // Sayfa tarih parametresi almaz; daima güncel fiyatı döndürür.
  {
    key:               "gaziantep_resmi",
    defaultEnabled:    true,
    defaultMarketSlug: "gaziantep-hal",
    defaultBaseUrl:    "https://www.gaziantep.bel.tr",
    defaultEndpoint:   "/tr/hal-rayic",
    responseShape:     "gaziantep_html",
    defaultUnit:       "kg",
    defaultCategory:   "sebze-meyve",
  },
  // Balıkesir Büyükşehir — POST /Home/Listele, SSR HTML.
  // Kolon sırası: Ürün/Tür | Birimi | Hal/Pazar | En Düşük | En Yüksek | BaşTarih | BitTarih.
  // Birden fazla hal (Altıeylül, Bandırma vb.) aynı sayfada — parser ürün bazında birleştirir.
  // Tarih parametresi: BasT=DD.MM.YYYY & BitT=DD.MM.YYYY → backfill mümkün.
  {
    key:               "balikesir_resmi",
    defaultEnabled:    true,
    defaultMarketSlug: "balikesir-hal",
    defaultBaseUrl:    "https://halvepazarfiyatlari.balikesir.bel.tr",
    defaultEndpoint:   "/Home/Listele",
    responseShape:     "balikesir_html",
    defaultUnit:       "kg",
    defaultCategory:   "sebze-meyve",
  },
  // Kocaeli Büyükşehir — POST form, SSR HTML. Form: date=YYYY-MM-DD & hal=<ID>.
  // endpointTemplate = hal ID'si (1=Merkez, 2=Gebze). Fetcher POST'u üretir.
  // Kolon sırası: Ürün Adı | Kategori | Birim | En az | En çok.
  // Tarih parametresi destekler → backfill mümkün.
  {
    key:               "kocaeli_merkez",
    // 2026-05-13: Kocaeli Belediyesi sitesi sunucu sorunu (timeout VPS+lokal).
    // DNS resolve OK (195.142.243.21) ama hicbir URL yanit vermiyor. Cron her
    // seferinde 120s harcamasin diye disable. Site geri gelince true cevir.
    defaultEnabled:    false,
    defaultMarketSlug: "kocaeli-hal-merkez",
    defaultBaseUrl:    "https://www.kocaeli.bel.tr",
    defaultEndpoint:   "1",
    responseShape:     "kocaeli_html",
    defaultUnit:       "kg",
    defaultCategory:   "sebze-meyve",
  },
  // hal.gov.tr Fiyat İstatistikleri — ASP.NET ViewState + paginasyonlu GridView.
  // Ulusal ortalama fiyatlar (tüm Türkiye haf fiyatı agregasyonu).
  // Kolonlar: Ürün Adı | Ürün Cinsi | Ürün Türü | Ortalama Fiyat | İşlem Hacmi | Birim.
  // Fetcher: GET → ViewState al → POST tarih + btnGet → tüm sayfaları dön.
  // Not: sayfa "bugün" gösterse de bir önceki günün verisi gelir (1 gün gecikme).
  {
    key:               "hal_gov_tr_ulusal",
    defaultEnabled:    true,
    defaultMarketSlug: "ulusal-hal-gov-tr",
    defaultBaseUrl:    "https://www.hal.gov.tr",
    defaultEndpoint:   "/Sayfalar/FiyatDetaylari.aspx",
    responseShape:     "hal_gov_tr_html",
    defaultUnit:       "kg",
    defaultCategory:   "sebze-meyve",
  },
  // İstanbul İBB (Tarımsal Hizmetler) — gunluk_fiyatlar.asp AJAX endpoint.
  // 3 kategori paralel cekilir: 5 (Meyve), 6 (Sebze), 7 (Ithal Urunler).
  // T-1 gun verisi (bugun icin gece sonrasi dolar). Direct fetch yeter, anti-bot yok.
  // Auth params hardcoded inline JS'ten alindi (tUsr/tPas/tVal).
  {
    key:               "istanbul_ibb",
    defaultEnabled:    true,
    defaultMarketSlug: "istanbul-hal-ibb",
    defaultBaseUrl:    "https://tarim.ibb.istanbul",
    defaultEndpoint:   "/inc/halfiyatlari/gunluk_fiyatlar.asp",
    responseShape:     "istanbul_ibb_html",
    defaultUnit:       "kg",
    defaultCategory:   "sebze-meyve",
  },
  // Çorum Belediyesi — SSR HTML, tek tablo.
  // Kolonlar: Ürün | En Düşük Fiyat | En Yüksek Fiyat | Birim | Değişim(ikon).
  // Fiyat formatı "160,00 ₺". Sayfa tarih parametresi almaz.
  {
    key:               "corum_resmi",
    defaultEnabled:    true,
    defaultMarketSlug: "corum-hal",
    defaultBaseUrl:    "https://www.corum.bel.tr",
    defaultEndpoint:   "/hal-fiyatlari",
    responseShape:     "corum_html",
    defaultUnit:       "kg",
    defaultCategory:   "sebze-meyve",
  },
  // Kütahya Belediyesi — SSR HTML, tek tablo.
  // Kolonlar: Ürün Adı | Ürün Cinsi | Minimum | Maksimum | Ortalama.
  // Fiyat formatı "110 ₺". Sayfa tarih parametresi almaz.
  {
    key:               "kutahya_resmi",
    defaultEnabled:    true,
    defaultMarketSlug: "kutahya-hal",
    defaultBaseUrl:    "https://www.kutahya.bel.tr",
    defaultEndpoint:   "/hal.asp",
    responseShape:     "kutahya_html",
    defaultUnit:       "kg",
    defaultCategory:   "sebze-meyve",
  },
  // Manisa Büyükşehir — SSR HTML, tek tablo.
  // Kolonlar: Tip(MEYVE/SEBZE) | Adı | Birim | En Az | En Çok.
  // Fiyat formatı "110,00 TL". Sayfa tarih parametresi almaz (daima güncel).
  {
    key:               "manisa_resmi",
    defaultEnabled:    true,
    defaultMarketSlug: "manisa-hal",
    defaultBaseUrl:    "https://www.manisa.bel.tr",
    defaultEndpoint:   "/apps/sebzemeyvehali/",
    responseShape:     "manisa_html",
    defaultUnit:       "kg",
    defaultCategory:   "sebze-meyve",
  },
  // Kahramanmaraş Büyükşehir — SSR HTML, 2. tablo veri tablosu.
  // Kolonlar: Hal | Ürün Türü | Ürün Adı | Birim | 1.Kalite | 2.Kalite | Rayiç | Tarih.
  // 2 hal: KAHRAMANMARAŞ HALİ + ELBİSTAN HALİ. Fiyatlar ondalıksız tam sayı.
  {
    key:               "kahramanmaras_resmi",
    defaultEnabled:    true,
    defaultMarketSlug: "kahramanmaras-hal",
    defaultBaseUrl:    "https://kahramanmaras.bel.tr",
    defaultEndpoint:   "/sebze-meyve-fiyatlari",
    responseShape:     "kahramanmaras_html",
    defaultUnit:       "kg",
    defaultCategory:   "sebze-meyve",
  },
  // Çanakkale Belediyesi — SSR HTML, tek tablo.
  // Tablo: başlık satırı (tarih) + kategori satırları (SEBZE/MEYVE) + ürün satırları.
  // Kolonlar: MALZEMENİN ADI | BİRİM | ASGARİ SATIŞ FİYATI | AZAMİ SATIŞ FİYATI.
  // Fiyat formatı "55,00TL". URL statik (/tr/sayfa/1481-hal-fiyat-listesi).
  {
    key:               "canakkale_resmi",
    defaultEnabled:    true,
    defaultMarketSlug: "canakkale-hal",
    defaultBaseUrl:    "https://www.canakkale.bel.tr",
    defaultEndpoint:   "/tr/sayfa/1481-hal-fiyat-listesi",
    responseShape:     "canakkale_html",
    defaultUnit:       "kg",
    defaultCategory:   "sebze-meyve",
  },
  // Yalova Belediyesi — SSR HTML, tek tablo.
  // Kolonlar: Urun Adı | Urun Turu | Asgari Fiyat | Azami Fiyat | Fiyat Tarihi.
  // Her satırda kendi tarihi var (bazı ürünler eski tarihli olabilir).
  // Fiyat formatı "150,00 ₺". Sayfa tarih parametresi almaz.
  {
    key:               "yalova_resmi",
    defaultEnabled:    true,
    defaultMarketSlug: "yalova-hal",
    defaultBaseUrl:    "https://ebelediye.yalova.bel.tr",
    defaultEndpoint:   "/BilgiEdinme/FiyatListesi/",
    responseShape:     "yalova_html",
    defaultUnit:       "kg",
    defaultCategory:   "sebze-meyve",
  },
  // Trabzon Büyükşehir — JS-rendered kart yapısı (no table).
  // Her ürün: resim + ad + min fiyat + max fiyat. Dynamic mode gerekli (halfiyat.css widget).
  // Kategori sütunu yok — normalizer'dan gelir. Fiyat formatı "140,00₺".
  // HF_SCRAPER_DYNAMIC listesinde olması gerekir.
  {
    key:               "trabzon_resmi",
    defaultEnabled:    true,
    defaultMarketSlug: "trabzon-hal",
    defaultBaseUrl:    "https://kurumsal.trabzon.bel.tr",
    defaultEndpoint:   "/halurunfiyatlari",
    responseShape:     "trabzon_html",
    defaultUnit:       "kg",
    defaultCategory:   "sebze-meyve",
  },
  // BatıAkdeniz TV — https://www.batiakdeniztv.com/{city}-hal-fiyatlari
  // Antalya ilçe halları için bölgesel haber sitesi. 2-sütunlu tablo: Ürünler | Fiyat (₺/kg).
  // "**" → fiyat yok, satır atlanır. Tek fiyat → avg olarak kullanılır, min/max null.
  // Aynı parser tüm halleri karşılar; source key farklı → market slug farklı.
  {
    key:               "serik_batiakdeniz",
    defaultEnabled:    true,
    defaultMarketSlug: "antalya-hal-serik",
    defaultBaseUrl:    "https://www.batiakdeniztv.com",
    defaultEndpoint:   "/serik-hal-fiyatlari",
    responseShape:     "batiakdeniz_html",
    defaultUnit:       "kg",
    defaultCategory:   "sebze-meyve",
  },
  {
    key:               "kumluca_batiakdeniz",
    defaultEnabled:    true,
    defaultMarketSlug: "antalya-hal-kumluca",
    defaultBaseUrl:    "https://www.batiakdeniztv.com",
    defaultEndpoint:   "/kumluca-hal-fiyatlari",
    responseShape:     "batiakdeniz_html",
    defaultUnit:       "kg",
    defaultCategory:   "sebze-meyve",
  },
  {
    key:               "gazipasa_batiakdeniz",
    defaultEnabled:    true,
    defaultMarketSlug: "gazipasa-hal",
    defaultBaseUrl:    "https://www.batiakdeniztv.com",
    defaultEndpoint:   "/gazipasa-hal-fiyatlari",
    responseShape:     "batiakdeniz_html",
    defaultUnit:       "kg",
    defaultCategory:   "sebze-meyve",
  },
  {
    key:               "alanya_batiakdeniz",
    defaultEnabled:    true,
    defaultMarketSlug: "alanya-hal",
    defaultBaseUrl:    "https://www.batiakdeniztv.com",
    defaultEndpoint:   "/alanya-hal-fiyatlari",
    responseShape:     "batiakdeniz_html",
    defaultUnit:       "kg",
    defaultCategory:   "sebze-meyve",
  },
  {
    key:               "demre_batiakdeniz",
    defaultEnabled:    true,
    defaultMarketSlug: "demre-hal",
    defaultBaseUrl:    "https://www.batiakdeniztv.com",
    defaultEndpoint:   "/demre-hal-fiyatlari",
    responseShape:     "batiakdeniz_html",
    defaultUnit:       "kg",
    defaultCategory:   "sebze-meyve",
  },
  {
    key:               "finike_batiakdeniz",
    defaultEnabled:    true,
    defaultMarketSlug: "finike-hal",
    defaultBaseUrl:    "https://www.batiakdeniztv.com",
    defaultEndpoint:   "/finike-hal-fiyatlari",
    responseShape:     "batiakdeniz_html",
    defaultUnit:       "kg",
    defaultCategory:   "sebze-meyve",
  },
  // Bolu Belediyesi — WordPress tabanlı, haftalık güncelleme (Perşembe/Cuma).
  // Anasayfadan ({DD-MM-YYYY}-toptanci-hal-fiyat-listesi) en güncel URL alınır.
  // Tablo: 12 sütun — Sebze Adı|Birim|Asgari|kr|Azami|kr|Meyve Adı|Birim|Asgari|kr|Azami|kr.
  // Her satır 2 ürün (sebze + meyve) üretir. Fiyat formatı "75,00 TL".
  {
    key:               "bolu_resmi",
    defaultEnabled:    true,
    defaultMarketSlug: "bolu-hal",
    defaultBaseUrl:    "https://www.bolu.bel.tr",
    defaultEndpoint:   "/",
    responseShape:     "bolu_html",
    defaultUnit:       "kg",
    defaultCategory:   "sebze-meyve",
  },
  // Tekirdağ Büyükşehir — 2 adımlı: önce listing sayfasından en yüksek ardışık
  // ID bulunur (/hal_fiyat_gunluk), sonra /hal_fiyat_liste_detay/{ID} çekilir.
  // Tablo kolonları: Ürün Adı | Ürün Türü | Birim | Tip(Meyve/Sebze) | Max | Min.
  // Ürün adı "ANANAS (ANANAS)" şeklinde çift yazılı — parser tekrarı temizler.
  // Fiyat formatı "140 TL". Scrapling gerekiyor (TLS korumalı).
  {
    key:               "tekirdag_resmi",
    defaultEnabled:    true,
    defaultMarketSlug: "tekirdag-hal",
    defaultBaseUrl:    "https://www.tekirdag.bel.tr",
    defaultEndpoint:   "/hal_fiyat_gunluk",
    responseShape:     "tekirdag_html",
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
