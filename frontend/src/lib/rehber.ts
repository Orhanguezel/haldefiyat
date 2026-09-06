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
  /** Rehber kartlarında kullanılan gerçek, yerel ürün fotoğrafı. */
  coverImageSlug: string;
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
    coverImageSlug: "salatalik-tursuluk",
    title: "Turşu Rehberi — Sepet Fiyatları ve En Uygun Alım Zamanı",
    description:
      "Turşu sepetinin (kornişon, acur, sivri biber, lahana, sarımsak...) güncel hal fiyatları ve son 12 ayın fiyat eğrisi: her ürün için en ucuz ay kayıtlardan.",
    h1: "Turşu Rehberi",
    tagline: "Kornişonu şimdi mi almalı? Sepetin her ürünü için en ucuz ay, kayıtlardan.",
    seasonWindow: "Ağustos – Kasım",
    intro: [
      "Turşuluk ürünlerin fiyatı ay ay değişir. Aşağıdaki kartlar, bugünkü fiyatın geçmişteki en uygun aya ne kadar yakın olduğunu gösterir. Böylece uzun grafikleri çözmeden şimdi almak mı, biraz beklemek mi daha avantajlı görebilirsiniz.",
    ],
    sections: [
      {
        heading: "Grafik nasıl okunur?",
        paragraphs: [
          "Gri çubuk geçen yılın, yeşil çubuk bu yılın ortanca hal fiyatını gösterir. Kartın üstündeki üç kutu daha kısa cevaptır: bugünkü fiyat, kayıtlardaki en uygun ay ve bugünkü fiyat farkı.",
          "Kornişon ve yeşil domates bazı hallerde ayrı ürün adıyla kaydedilmez. Bu nedenle az sayıda hal görünen ürünleri kesin fiyat değil, yaklaşık yön bilgisi olarak değerlendirin.",
        ],
      },
      {
        heading: "Kısa özet: neyi ne zaman?",
        paragraphs: [
          "Genel eğilim şöyle: kornişon ve acur yaz sonunda, yeşil domates ekim–kasım döneminde, beyaz lahana ise sonbaharın sonunda daha avantajlı olur. Yine de alışveriş kararında her ürün kartındaki güncel özeti esas alın; fiyatlar yeni hal kayıtları geldikçe değişir.",
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
    coverImageSlug: "domates-salcalik",
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
          "Her ayda açık ton geçen yılın, koyu ton bu yılın hal medyanıdır; “en uygun dönem” iki yılın geniş tabanlı kayıtlarından seçilir. Salçalık sınıfı (domates-salçalık, kapya) sofralıktan ayrı kayda girer — salça maliyeti hesaplarken sofralık domates fiyatına değil bu satırlara bakılmalıdır.",
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
    coverImageSlug: "cilek",
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
          "Her ayda açık ton geçen yılın, koyu ton bu yılın hal medyanıdır; “en uygun dönem” iki yılın geniş tabanlı kayıtlarından seçilir. Meyvede boy ve kalite sınıfı fiyatı sofralık-sanayilik ekseninde ayrıştırır: reçel için birinci sınıf sofralık şart değildir, aralığın alt ucundaki kayıtlar çoğu zaman reçellik iş görür.",
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
  "sonbahar-meyveleri": {
    slug: "sonbahar-meyveleri",
    emoji: "🍇",
    coverImageSlug: "nar",
    title: "Sonbahar Meyveleri Rehberi — Nar, Ayva, Üzüm Hal Fiyatları",
    description:
      "Sonbaharda tezgâha gelen meyvelerin (nar, ayva, üzüm, incir, elma, armut, kivi) güncel hal fiyatları ve son 12 ayın eğrisi: her ürün için en uygun ay kayıtlardan.",
    h1: "Sonbahar Meyveleri Rehberi",
    tagline: "İncir kapanırken nar ve ayva açılıyor. Hangi meyve ne zaman ucuzluyor?",
    seasonWindow: "Eylül – Kasım",
    intro: [
      "Sonbahar, hal tezgâhının en hızlı değiştiği dönemdir: yaz meyveleri birkaç hafta içinde çekilir, yerine nar, ayva ve kışlık elma gelir. Aşağıdaki kartlar her meyvenin bugünkü fiyatını, son 12 ayın en uygun ayıyla karşılaştırır.",
    ],
    sections: [
      {
        heading: "Sezon nasıl dönüyor?",
        paragraphs: [
          "İncir ve üzüm eylül boyunca bollaşır, ekimde kayıt sayısı hızla düşer. Nar ve ayva ise eylülde girer ve kasım–aralıkta en geniş hal tabanına ulaşır. Bir meyvenin kaç ayrı halde göründüğü, fiyatın ne kadar güvenilir olduğunu da söyler.",
          "Kartlarda \"az hal\" uyarısı gördüğünüz üründe fiyatı kesin değer değil, yön bilgisi olarak okuyun: sezonun başında ve sonunda kayıt tabanı daralır.",
        ],
      },
      {
        heading: "Alım için pratik kural",
        paragraphs: [
          "Sezona yeni giren meyvede ilk iki hafta fiyat yüksektir; hal sayısı artmaya başladığında fiyat oturur. Kışlık alım (nar, ayva, elma) için bu geniş taban dönemi beklenir. Sezonu kapanan meyvede ise beklemek pahalıya gelir.",
        ],
      },
    ],
    basket: [
      { slug: "nar", label: "Nar" },
      { slug: "ayva", label: "Ayva", note: "dar kayıt tabanı" },
      { slug: "uzum", label: "Üzüm" },
      { slug: "incir", label: "İncir" },
      { slug: "elma", label: "Elma" },
      { slug: "armut", label: "Armut" },
      { slug: "kivi", label: "Kivi" },
      { slug: "kestane", label: "Kestane", note: "dar kayıt tabanı" },
    ],
    related: [
      { href: "/urun/nar", label: "Nar fiyat sayfası" },
      { href: "/fiyatlar", label: "Canlı fiyat tablosu" },
    ],
  },
  narenciye: {
    slug: "narenciye",
    emoji: "🍊",
    coverImageSlug: "mandalina",
    title: "Narenciye Rehberi — Limon, Mandalina, Portakal Hal Fiyatları",
    description:
      "Narenciye sezonunun hal fiyatları: limon, mandalina, portakal ve greyfurtun güncel toptan fiyatı, son 12 ayın eğrisi ve kayıtlardan çıkan en uygun ay.",
    h1: "Narenciye Rehberi",
    tagline: "Mandalina ne zaman ucuzlar, limon ne zaman zirve yapar? Cevap kayıtlarda.",
    seasonWindow: "Kasım – Mart",
    intro: [
      "Narenciye, yılın en belirgin fiyat döngüsüne sahip gruptur: sezon açılışında yüksek, hasat yayıldıkça düşen, sezon sonunda depodan satılırken yeniden yükselen bir eğri izler. Kartlar bu eğriyi ürün ürün gösterir.",
    ],
    sections: [
      {
        heading: "Limon neden farklı davranır?",
        paragraphs: [
          "Limon depolanabildiği için diğer narenciyeden ayrışır: hasat dışı aylarda da satılır ve fiyatı depo maliyetiyle yükselir. Mandalina ve portakalda ise fiyat, hasadın yayılmasıyla birlikte kasım–ocak arasında en uygun seviyeye iner.",
        ],
      },
      {
        heading: "Şehir farkı en çok burada görünür",
        paragraphs: [
          "Narenciyede üretim bölgesi ile tüketim bölgesi arasındaki fark fiyata net yansır. Aynı gün Mersin ile Karadeniz halleri arasında belirgin fark oluşabilir; şehir karşılaştırmasını fiyat sayfasından kontrol edin.",
        ],
      },
    ],
    basket: [
      { slug: "limon", label: "Limon" },
      { slug: "mandalina", label: "Mandalina" },
      { slug: "portakal", label: "Portakal" },
      { slug: "greyfurt", label: "Greyfurt" },
    ],
    related: [
      { href: "/urun/limon", label: "Limon fiyat sayfası" },
      { href: "/piyasa/erdemli-limon", label: "Erdemli limon piyasası" },
      { href: "/fiyatlar", label: "Canlı fiyat tablosu" },
    ],
  },
  "kislik-sebze": {
    slug: "kislik-sebze",
    emoji: "🥬",
    coverImageSlug: "pirasa",
    title: "Kışlık Sebze Rehberi — Pırasa, Lahana, Kereviz Hal Fiyatları",
    description:
      "Kış sebzelerinin hal fiyatları: pırasa, lahana, kereviz, ıspanak, karnabahar ve brokolinin güncel toptan fiyatı ve son 12 ayın en uygun ayı.",
    h1: "Kışlık Sebze Rehberi",
    tagline: "Kış sebzesi soğukla ucuzlar mı, pahalanır mı? Kayıtlar ay ay gösteriyor.",
    seasonWindow: "Kasım – Şubat",
    intro: [
      "Kış sebzeleri yaz ürünlerinin tersine çalışır: hava soğudukça arz artar ve fiyat oturur. Ancak don olayları birkaç gün içinde sert sıçrama yaratabilir. Kartlar hem normal seyri hem bugünkü sapmayı gösterir.",
    ],
    sections: [
      {
        heading: "Don riski fiyata nasıl yansır?",
        paragraphs: [
          "Yaprak sebzelerde (ıspanak, pazı, marul) don sonrası birkaç gün içinde hal fiyatı sıçrar, arz normale dönünce geri iner. Pırasa, lahana ve kereviz gibi dayanıklı ürünlerde bu sıçrama daha sınırlıdır.",
        ],
      },
      {
        heading: "Kışlık alım için ne zaman?",
        paragraphs: [
          "Depolanabilen kök ve baş sebzelerde (kereviz, lahana, havuç) en uygun dönem genellikle aralık–ocak arasıdır. Yaprak sebzeler depolanmadığı için toplu alım yerine haftalık alım daha mantıklıdır.",
        ],
      },
    ],
    basket: [
      { slug: "pirasa", label: "Pırasa" },
      { slug: "lahana-beyaz", label: "Beyaz lahana", note: "dar kayıt tabanı" },
      { slug: "kereviz", label: "Kereviz" },
      { slug: "ispanak", label: "Ispanak" },
      { slug: "karnabahar", label: "Karnabahar" },
      { slug: "brokoli", label: "Brokoli" },
      { slug: "havuc", label: "Havuç" },
      { slug: "pazi", label: "Pazı" },
    ],
    related: [
      { href: "/urun/pirasa", label: "Pırasa fiyat sayfası" },
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

export interface SeasonPoint {
  price: number | null;
  marketCount: number;
}

export interface CalendarCell {
  month: number;
  label: string;
  lastYear: SeasonPoint;
  thisYear: SeasonPoint;
}

export interface Seasonality {
  cells: CalendarCell[];
  /** Iki serinin ≥3 hallik degerleri arasindaki en dusuk nokta. */
  cheapest: { label: string; year: number; price: number } | null;
  current: { label: string; price: number | null; marketCount: number } | null;
  maxPrice: number;
  thisYearLabel: number;
  lastYearLabel: number;
}

/**
 * Aylik bucket'li history'den (≤24 ay) takvim-hizali cift seri mevsimsellik:
 * gecen yilin egrisi + bu yilin egrisi yan yana, "en ucuz donem" iki yilin
 * ≥3 hallik degerlerinden secilir (tek-hal ayi yaniltir).
 */
export function buildSeasonality(history: PriceHistoryRow[], now: Date): Seasonality {
  const byYearMonth = new Map<string, Map<string, number[]>>();
  for (const row of history) {
    if (row.cityName === "Türkiye") continue;
    const value = toNum(row.avgPrice);
    if (value == null) continue;
    const ym = row.recordedDate.slice(0, 7);
    const markets = byYearMonth.get(ym) ?? new Map<string, number[]>();
    const list = markets.get(row.marketSlug) ?? [];
    list.push(value);
    markets.set(row.marketSlug, list);
    byYearMonth.set(ym, markets);
  }

  const pointFor = (year: number, month: number): SeasonPoint => {
    const ym = `${year}-${String(month + 1).padStart(2, "0")}`;
    const markets = byYearMonth.get(ym);
    const marketAvgs = markets
      ? [...markets.values()].map((values) => values.reduce((a, b) => a + b, 0) / values.length)
      : [];
    return { price: median(marketAvgs), marketCount: marketAvgs.length };
  };

  const thisYearLabel = now.getUTCFullYear();
  const lastYearLabel = thisYearLabel - 1;
  const currentMonth = now.getUTCMonth();

  const cells: CalendarCell[] = [];
  for (let month = 0; month < 12; month += 1) {
    cells.push({
      month,
      label: AY_KISA[month],
      lastYear: pointFor(lastYearLabel, month),
      thisYear: month <= currentMonth ? pointFor(thisYearLabel, month) : { price: null, marketCount: 0 },
    });
  }

  // Rozet/"en uygun donem" SON 12 AYDAN secilir: 24 aylik nominal dip enflasyon
  // yuzunden bu yilin her ayini "pahali" gosterir. Grafik yine iki yili cizer.
  const rolling: Array<{ label: string; year: number; price: number; marketCount: number }> = [];
  const all: Array<{ price: number }> = [];
  for (const cell of cells) {
    if (cell.lastYear.price != null) {
      all.push({ price: cell.lastYear.price });
      if (cell.month > currentMonth) rolling.push({ label: cell.label, year: lastYearLabel, price: cell.lastYear.price, marketCount: cell.lastYear.marketCount });
    }
    if (cell.thisYear.price != null) {
      all.push({ price: cell.thisYear.price });
      rolling.push({ label: cell.label, year: thisYearLabel, price: cell.thisYear.price, marketCount: cell.thisYear.marketCount });
    }
  }
  const broadBase = rolling.filter((c) => c.marketCount >= 3);
  const pool = broadBase.length ? broadBase : rolling;
  const cheapest = pool.length ? pool.reduce((best, c) => (c.price < best.price ? c : best)) : null;
  const currentCell = cells[currentMonth];

  return {
    cells,
    cheapest: cheapest ? { label: cheapest.label, year: cheapest.year, price: cheapest.price } : null,
    current: { label: currentCell.label, price: currentCell.thisYear.price, marketCount: currentCell.thisYear.marketCount },
    maxPrice: Math.max(1, ...all.map((c) => c.price)),
    thisYearLabel,
    lastYearLabel,
  };
}
