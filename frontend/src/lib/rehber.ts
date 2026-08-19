import type { PriceHistoryRow } from "@/lib/api";

/**
 * Mevsimlik alim rehberleri (/rehber ailesi).
 *
 * Amac: "neyi ne zaman almali" sorusuna VERIYLE cevap — her sepet urunu icin
 * son 12 ayin hal medyani cizilir, en dusuk ay kayittan bulunur. Icerik
 * config'de durur, sayilar canli API'den gelir (sabit iddiali sayi yazilmaz).
 * Yeni rehber eklemek = REHBER_PAGES'e kayit; sitemap ve ana sayfa otomatik.
 */
export interface RehberBasketItem {
  slug: string;
  label: string;
  note?: string;
}

export interface RehberPageConfig {
  slug: string;
  emoji: string;
  title: string;
  description: string;
  h1: string;
  tagline: string;
  seasonWindow: string;
  intro: string[];
  sections: Array<{ heading: string; paragraphs: string[] }>;
  basket: RehberBasketItem[];
  related: Array<{ href: string; label: string }>;
}

export const REHBER_PAGES: Record<string, RehberPageConfig> = {
  tursu: {
    slug: "tursu",
    emoji: "🥒",
    title: "Turşu Rehberi — Sepet Fiyatları ve En Uygun Alım Zamanı",
    description:
      "Turşu sepetinin (kornişon, acur, sivri biber, lahana, sarımsak...) güncel hal fiyatları ve son 12 ayın fiyat eğrisi: her ürün için en ucuz ay kayıtlardan.",
    h1: "Turşu Rehberi",
    tagline: "Kornişonu şimdi mi almalı? Sepetin her ürünü için en ucuz ay, kayıtlardan.",
    seasonWindow: "Ağustos – Kasım",
    intro: [
      "Turşu maliyetinin büyük bölümü zamanlamadır: aynı ürün, hasat penceresi ile talep zirvesi arasında birkaç kat fiyat değiştirebilir. Bu rehber, turşu sepetindeki her ürün için son 12 ayın hal kayıtlarını çizer ve en düşük fiyatlı ayı veriden gösterir.",
    ],
    sections: [
      {
        heading: "Grafik nasıl okunur?",
        paragraphs: [
          "Her satırdaki çubuklar son 12 ayın ulusal hal medyanıdır (önce hal ortalaması, sonra haller arası medyan). Yeşil çubuk kayıtlardaki en düşük ayı, koyu çerçeve içinde bulunduğumuz ayı gösterir. Tek yılın kaydı olduğu için bunlar kesin takvim değil güçlü ipucudur; kaynak kapsamı ay içinde değişebilir.",
          "Turşuluk sınıfı (kornişon, yeşil domates) az sayıda halde ayrı etiketle kayda girer; bu satırlarda fiyat referans niteliğindedir. Geniş tabanlı satırlarda (10+ hal) medyan güvenilirdir.",
        ],
      },
      {
        heading: "Kısa özet: neyi ne zaman?",
        paragraphs: [
          "Kayıtların söylediği kaba takvim: kornişon ve acur hasat penceresi kısa olduğu için ağustosta, herkes turşu kurarken değil; yeşil domates sezon sonunda (ekim–kasım) dibi görür; lahana kış çeşidi bollaşınca sonbahar sonunda alınır. Ayrıntılı gerekçe için sezon açılış analizimize bakın.",
        ],
      },
    ],
    basket: [
      { slug: "salatalik", label: "Salatalık" },
      { slug: "salatalik-tursuluk", label: "Turşuluk salatalık (kornişon)", note: "dar kayıt tabanı" },
      { slug: "acur", label: "Acur" },
      { slug: "biber-sivri", label: "Sivri biber" },
      { slug: "lahana-beyaz", label: "Beyaz lahana" },
      { slug: "havuc", label: "Havuç" },
      { slug: "karnabahar", label: "Karnabahar" },
      { slug: "sarimsak-kuru", label: "Kuru sarımsak" },
      { slug: "domates-yesil-tursu", label: "Yeşil domates (turşuluk)", note: "dar kayıt tabanı" },
    ],
    related: [
      { href: "/analiz/tursuluk-sezonu-2026-tursu-sepeti-hal-fiyatlari", label: "Turşuluk sezonu 2026 açılış analizi" },
      { href: "/fiyatlar", label: "Canlı fiyat tablosu" },
    ],
  },
  "salca-konserve": {
    slug: "salca-konserve",
    emoji: "🍅",
    title: "Salça ve Kışlık Konserve Rehberi — Hal Fiyatları ve Alım Zamanı",
    description:
      "Salçalık domates, kapya biber ve kışlık konserve sepetinin güncel hal fiyatları; son 12 ayın fiyat eğrisiyle her ürün için en ucuz ay.",
    h1: "Salça ve Kışlık Konserve Rehberi",
    tagline: "Salçalık domatesin dibi hasat aylarında — sepetin tamamı tek grafikte.",
    seasonWindow: "Ağustos – Ekim",
    intro: [
      "Salça ve kışlık hazırlığında fiyat farkı turşudan bile serttir: salçalık domatesin hasat dönemi medyanı ile ilkbahar fiyatı arasında kayıtlarda üç-dört kata varan fark var. Bu rehber salça-konserve sepetinin her kalemini son 12 ayın verisiyle çizer.",
    ],
    sections: [
      {
        heading: "Grafik nasıl okunur?",
        paragraphs: [
          "Çubuklar son 12 ayın ulusal hal medyanı; yeşil çubuk en düşük ay, koyu çerçeve içinde bulunduğumuz ay. Salçalık sınıfı (domates-salçalık, kapya) sofralıktan ayrı kayda girer — salça maliyeti hesaplarken sofralık domates fiyatına değil bu satırlara bakılmalıdır.",
        ],
      },
      {
        heading: "Salçalık takvimi",
        paragraphs: [
          "Kayıtlarda salçalık domatesin en geniş arzlı ve en ucuz dönemi ağustos–ekim penceresidir; kışa doğru arz daralır, ilkbaharda fiyat zirve yapar. Kapya biber de benzer deseni izler. Közlük/konservelik patlıcan ile haşlamalık fasulye-bezelye-bamya için pencere daha kısadır — çubuklarda kendi diplerini görebilirsiniz.",
        ],
      },
    ],
    basket: [
      { slug: "domates-salcalik", label: "Salçalık domates" },
      { slug: "biber-salcalik-kapya", label: "Salçalık kapya biber" },
      { slug: "patlican", label: "Patlıcan (közlük/konserve)" },
      { slug: "biber-carliston", label: "Çarliston biber" },
      { slug: "fasulye-ayse-kadin", label: "Ayşe kadın fasulye" },
      { slug: "bezelye", label: "Bezelye" },
      { slug: "bamya", label: "Bamya" },
    ],
    related: [
      { href: "/urun/domates-salcalik", label: "Salçalık domates fiyat sayfası" },
      { href: "/fiyatlar", label: "Canlı fiyat tablosu" },
    ],
  },
  recel: {
    slug: "recel",
    emoji: "🍓",
    title: "Reçel ve Marmelat Rehberi — Meyve Hal Fiyatları ve Alım Zamanı",
    description:
      "Reçellik meyvelerin (çilek, kayısı, vişne, şeftali, incir, ayva...) güncel hal fiyatları ve son 12 ayın eğrisi: hangi meyvenin reçeli hangi ay kurulur?",
    h1: "Reçel ve Marmelat Rehberi",
    tagline: "Her meyvenin reçel ayı farklı — çilekten ayvaya 12 aylık fiyat eğrisi.",
    seasonWindow: "Mayıs – Kasım (meyveye göre)",
    intro: [
      "Reçelde tek bir sezon yoktur; her meyvenin kendi penceresi vardır. Çilek ve kayısı ilkbahar sonunda, vişne yazın, incir ağustos–eylülde, ayva sonbaharda dibini görür. Bu rehber reçellik meyvelerin son 12 aylık hal eğrisini tek sayfada toplar: sıradaki reçeli hangi ay kurmanın ucuz olduğu çubuklardan okunur.",
    ],
    sections: [
      {
        heading: "Grafik nasıl okunur?",
        paragraphs: [
          "Çubuklar son 12 ayın ulusal hal medyanı; yeşil çubuk en düşük ay, koyu çerçeve bulunduğumuz ay. Meyvede boy ve kalite sınıfı fiyatı sofralık-sanayilik ekseninde ayrıştırır: reçel için birinci sınıf sofralık şart değildir, aralığın alt ucundaki kayıtlar çoğu zaman reçellik iş görür.",
        ],
      },
      {
        heading: "Şeker maliyeti notu",
        paragraphs: [
          "Reçel maliyetinin yaklaşık yarısı şekerdir ve şeker hal ürünü olmadığı için bu tabloda yer almaz; market fiyatı ayrıca hesaba katılmalıdır. Meyve tarafında ise kural basit: meyvenin bol olduğu ay hem en ucuz hem en lezzetli dönemdir.",
        ],
      },
    ],
    basket: [
      { slug: "cilek", label: "Çilek" },
      { slug: "kayisi", label: "Kayısı" },
      { slug: "visne", label: "Vişne" },
      { slug: "seftali", label: "Şeftali" },
      { slug: "incir", label: "İncir" },
      { slug: "ayva", label: "Ayva" },
      { slug: "portakal", label: "Portakal (marmelat)" },
    ],
    related: [
      { href: "/urun/cilek", label: "Çilek fiyat sayfası" },
      { href: "/fiyatlar", label: "Canlı fiyat tablosu" },
    ],
  },
};

export const REHBER_LIST: RehberPageConfig[] = Object.values(REHBER_PAGES);

const AY_KISA = ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"];

const toNum = (v: number | string | null | undefined): number | null => {
  if (v == null) return null;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) && n > 0 ? n : null;
};

const median = (values: number[]): number | null => {
  if (!values.length) return null;
  const s = [...values].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};

export interface SeasonalityMonth {
  ym: string;
  label: string;
  medianPrice: number | null;
  marketCount: number;
}

export interface Seasonality {
  months: SeasonalityMonth[];
  cheapest: SeasonalityMonth | null;
  current: SeasonalityMonth | null;
  maxPrice: number;
}

/** Aylik bucket'li history'den 12 aylik mevsimsellik: hal-basi medyan / ay. */
export function buildSeasonality(history: PriceHistoryRow[], now: Date): Seasonality {
  const byMonth = new Map<string, Map<string, number[]>>();
  for (const row of history) {
    if (row.cityName === "Türkiye") continue;
    const value = toNum(row.avgPrice);
    if (value == null) continue;
    const ym = row.recordedDate.slice(0, 7);
    const markets = byMonth.get(ym) ?? new Map<string, number[]>();
    const list = markets.get(row.marketSlug) ?? [];
    list.push(value);
    markets.set(row.marketSlug, list);
    byMonth.set(ym, markets);
  }

  const months: SeasonalityMonth[] = [];
  for (let i = 11; i >= 0; i -= 1) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
    const ym = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
    const markets = byMonth.get(ym);
    const marketAvgs = markets
      ? [...markets.values()].map((values) => values.reduce((a, b) => a + b, 0) / values.length)
      : [];
    months.push({
      ym,
      label: AY_KISA[d.getUTCMonth()],
      medianPrice: median(marketAvgs),
      marketCount: marketAvgs.length,
    });
  }

  const withData = months.filter((m) => m.medianPrice != null);
  const cheapest = withData.length
    ? withData.reduce((best, m) => ((m.medianPrice as number) < (best.medianPrice as number) ? m : best))
    : null;
  return {
    months,
    cheapest,
    current: months.at(-1) ?? null,
    maxPrice: Math.max(1, ...withData.map((m) => m.medianPrice as number)),
  };
}
