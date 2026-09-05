import type { PriceHistoryRow, PriceRow } from "@/lib/api";

/**
 * Bolgesel "gunluk piyasa" landing sayfalari (/piyasa/[slug]).
 *
 * Neden ayri sayfa ailesi: "erdemli gunluk limon piyasasi" gibi sorgular urun
 * sayfasinin (ulusal tablo) degil, bolge baglami + gunluk yorum isteyen kalici
 * bir sayfanin isi. Icerik config'de durur; sayi iceren her sey API'den canli
 * hesaplanir (sabit iddiali sayi yazilmaz). Yeni bolge eklemek = buraya kayit.
 */
export interface PiyasaPageConfig {
  slug: string;
  productSlug: string;
  productName: string;
  region: string;
  title: string;
  description: string;
  h1: string;
  intro: string[];
  regionSections: Array<{ heading: string; paragraphs: string[] }>;
  seasonCalendar: Array<{ period: string; note: string }>;
  faq: Array<{ q: string; a: string }>;
  related: Array<{ href: string; label: string }>;
}

export const PIYASA_PAGES: Record<string, PiyasaPageConfig> = {
  "erdemli-limon": {
    slug: "erdemli-limon",
    productSlug: "limon",
    productName: "Limon",
    region: "Mersin / Erdemli",
    title: "Erdemli Günlük Limon Piyasası — Mersin Limon Fiyatları",
    description:
      "Erdemli ve Mersin limon piyasası için günlük güncellenen sayfa: Türkiye hallerindeki güncel limon fiyatları, şehir karşılaştırması, Mayer ve yatak limon ayrımı, sezon takvimi.",
    h1: "Erdemli Günlük Limon Piyasası",
    intro: [
      "Türkiye limon üretiminin merkezi Mersin, Mersin'in merkezi de Erdemli'dir. Bölgede yetişen ve depolanan ürün yalnız hasat döneminde değil, yatak limon çıkışlarıyla yaz aylarında da tüm ülkedeki hal fiyatlarını etkiler.",
      "Bu sayfa her gün otomatik güncellenir: belediye halleri ve HKS (Ticaret Bakanlığı) kayıtlarından gelen güncel limon fiyatlarını, şehirler arası farkı ve piyasanın yönünü tek yerde gösterir.",
    ],
    regionSections: [
      {
        heading: "Erdemli fiyatı neden tek rakam değil?",
        paragraphs: [
          "\"Erdemli limon piyasası\" denildiğinde tek bir resmi günlük fiyat beklemek yanıltıcı olur. Fiyat; çeşide, boya, kalite sınıfına, ürünün dalından yeni kesilmesine veya depolanmış yatak limon olmasına göre ayrışır. Aynı gün içinde dökme, file ve sınıflı ürün farklı kilogram fiyatı görür.",
          "Mersin'deki üretici ve bahçe fiyatı ile diğer şehirlerdeki toptancı hali fiyatı aynı zincirin farklı halkalarıdır. Aşağıdaki tablo hal ve HKS kayıtlarını gösterir; üretici bahçe fiyatı ayrıca belirtilmedikçe bu tabloyla eşit kabul edilmemelidir.",
        ],
      },
      {
        heading: "Mayer limon ve yatak limon ayrımı",
        paragraphs: [
          "Mayer limon erkenci karakterlidir; sezonun erken bölümünde piyasaya ilk çıkan üründür ve bu dönemde ayrı fiyatlanır. Yatak limon ise hasattan sonra depolanarak sezon dışına taşınan üründür — depolama, fire, ayıklama ve finansman maliyeti fiyata yansır. \"Limonun kilosu kaç TL?\" sorusunun doğru cevabı bu yüzden bir aralıktır.",
        ],
      },
      {
        heading: "Şehirler arasında neden büyük fark var?",
        paragraphs: [
          "Aynı gün farklı şehirlerin hal ortalamaları arasında iki katına varan fark görülebilir. Bunlar aynı kalite için birebir eşleştirilmiş teklifler değildir: üretim bölgesine uzaklık, nakliye, depolama süresi, o gün kayıt üreten çeşitlerin bileşimi ve boy/kalite sınıfı farkı yaratır. En uygun fiyatı bulmak için ulusal ortalamaya değil, güncel şehir satırlarına bakılmalıdır.",
        ],
      },
    ],
    seasonCalendar: [
      { period: "Eylül – Kasım", note: "Yeni sezon hasadı başlar; erkenci Mayer piyasaya ilk çıkan üründür, taze ürün arzı artar." },
      { period: "Aralık – Nisan", note: "Kış çeşitleri ve depoya alınan ürün birlikte fiyatlanır; arz genellikle en geniş dönemdedir." },
      { period: "Mayıs – Ağustos", note: "Taze hasat azalır; piyasayı depodan kontrollü çıkan yatak limon taşır, kalite sınıfları ayrışır." },
    ],
    faq: [
      {
        q: "Erdemli günlük limon fiyatı nereden geliyor?",
        a: "Bu sayfadaki fiyatlar belediye toptancı halleri ve HKS (Ticaret Bakanlığı) kayıtlarından her gün otomatik derlenir. Erdemli'ye özel tek bir resmi günlük fiyat yayınlanmaz; bölge ürünü Türkiye'nin dört bir yanındaki hallerde fiyatlanır ve bu sayfa o tabloyu bölge bağlamıyla birlikte sunar.",
      },
      {
        q: "Mersin limon fiyatları neden tek rakam değil?",
        a: "Fiyat çeşide (Mayer, yatak limon), boya, kalite sınıfına ve ambalaja (dökme, file, sınıflı) göre ayrışır. Bu yüzden doğru cevap tek sayı değil bir aralıktır; tablodaki minimum–maksimum sütunları bu aralığı gösterir.",
      },
      {
        q: "Yatak limon nedir?",
        a: "Hasattan sonra depolanarak sezon dışına taşınan limondur. Depolama, fire ve finansman maliyeti eklendiği için taze üründen farklı fiyatlanır; yaz aylarında piyasadaki ürünün önemli bölümü yatak limondur.",
      },
      {
        q: "Limon fiyatı şehirden şehre neden farklı?",
        a: "Üretim bölgesine uzaklık, nakliye maliyeti, depolama süresi ve o gün kayıt üreten çeşit/kalite bileşimi şehir ortalamalarını ayrıştırır. Üretim merkezine yakın hallerde fiyat genellikle daha düşüktür.",
      },
    ],
    related: [
      { href: "/urun/limon", label: "Limon fiyatları — tüm haller ve geçmiş" },
      { href: "/analiz/limon-fiyatlari-2026-mersin-erdemli-piyasa-analizi", label: "Limon fiyatları 2026 — Mersin/Erdemli piyasa analizi" },
      { href: "/fiyatlar?urun=limon", label: "Canlı fiyat tablosunda limonu filtrele" },
    ],
  },
  "adana-mayer-limon": {
    slug: "adana-mayer-limon",
    productSlug: "limon-mayer",
    productName: "Mayer Limon",
    region: "Adana / Çukurova",
    title: "Adana Mayer Limon Fiyatları — Günlük Mayer Limon Piyasası",
    description:
      "Adana ve Çukurova Mayer limon piyasası için günlük güncellenen sayfa: Türkiye hallerindeki güncel Mayer limon fiyatları, şehir karşılaştırması, erkenci sezon takvimi ve fiyatı belirleyen etkenler.",
    h1: "Adana Mayer Limon Fiyatları",
    intro: [
      "Mayer, Türkiye'de sezonu açan erkenci limon çeşididir; Adana ve Çukurova bahçeleri Mersin ile birlikte bu çeşidin ana üretim alanıdır. Sezonun ilk haftalarında piyasadaki taze limonun büyük bölümü Mayer olduğu için Adana Mayer fiyatı ülke genelindeki limon fiyatının öncü göstergesi sayılır.",
      "Bu sayfa her gün otomatik güncellenir: belediye halleri ve HKS (Ticaret Bakanlığı) kayıtlarında Mayer olarak ayrı yazılan satırları toplar, şehirler arası farkı ve haftalık yönü tek yerde gösterir. Adana hali fiyatını yayınlayan resmi bir günlük kaynak bulunmadığı için tablo, Adana ürününün satıldığı diğer illerin hal kayıtlarına dayanır.",
    ],
    regionSections: [
      {
        heading: "Adana Mayer fiyatı ile hal fiyatı aynı şey mi?",
        paragraphs: [
          "Hayır. Üreticinin Adana'da bahçede aldığı fiyat, ürünün hal veya toptancı fiyatı ve marketteki raf fiyatı aynı zincirin üç farklı halkasıdır. Aşağıdaki tablo hal ve HKS kayıtlarını gösterir; bahçe fiyatı genellikle bu değerlerin altında, market fiyatı üstünde seyreder.",
          "Mayer erkenci olduğu için sezon başında az sayıda hal kayıt üretir; tek bir günün tek bir hal satırı bütün piyasayı temsil etmez. Şehir tablosundaki hal sayısı ve minimum–maksimum aralığı bu yüzden fiyatın kendisi kadar önemlidir.",
        ],
      },
      {
        heading: "Mayer neden diğer limonlardan farklı fiyatlanır?",
        paragraphs: [
          "Mayer, kabuğu ince, suyu bol ve asidi görece düşük bir çeşittir; raf ömrü Lamas ve Enterdonat gibi depo çeşitlerinden kısadır. Bu yüzden depolanmaz, hasat edildiği haftalarda tüketilir. Sezon başında rakipsiz olduğu için yüksek açar, diğer çeşitler piyasaya girdikçe geriler.",
          "Aynı gün Mayer ile Lamas veya yatak limon arasında büyük fark görülmesi normaldir; ürün sayfasındaki çeşit tablosu bu farkı yan yana gösterir.",
        ],
      },
      {
        heading: "Şehirler arası fark neden var?",
        paragraphs: [
          "Adana ve Mersin'e yakın hallerde nakliye payı düşüktür; İstanbul, Ankara ve Karadeniz hallerinde taşıma ve ara kademe maliyeti eklenir. Ayrıca her hal aynı boy ve kalite sınıfını kayda geçirmez; kalın kabuklu ve küçük boy ürün aynı gün farklı fiyatlanır.",
        ],
      },
    ],
    seasonCalendar: [
      { period: "Eylül – Ekim", note: "Mayer hasadı başlar; Adana ve Mersin bahçelerinden ilk erkenci ürün hallere iner, fiyat sezonun en yüksek bandındadır." },
      { period: "Kasım – Aralık", note: "Arz genişler, Lamas ve Enterdonat piyasaya girer; Mayer fiyatı geriler ve çeşitler arası fark açılır." },
      { period: "Ocak – Ağustos", note: "Mayer taze arzı biter; piyasayı depo çeşitleri ve yatak limon taşır, Mayer satırı hallerde nadiren görünür." },
    ],
    faq: [
      { q: "Adana'da Mayer limonun kilosu kaç lira?", a: "Tek bir resmi Adana günlük fiyatı yayınlanmaz. Bu sayfadaki tablo, Adana ürününün satıldığı Türkiye hallerindeki güncel Mayer kayıtlarını ve şehir medyanını gösterir; bahçe fiyatı bu değerlerin altında kalır." },
      { q: "Mayer limon ne zaman çıkar?", a: "Eylül ayında hasat başlar; Ekim ve Kasım en yoğun dönemdir. Aralık'tan sonra taze Mayer azalır, yerini depolanabilen çeşitler alır." },
      { q: "Mayer ile Lamas limon arasındaki fark ne?", a: "Mayer erkenci, ince kabuklu ve düşük asitli bir sofralık çeşittir; Lamas kalın kabuklu, yüksek asitli ve depoya uygundur. Fiyatları aynı gün farklı seyreder; depo maliyeti Lamas'a, erkencilik primi Mayer'e yansır." },
      { q: "Bu fiyatlar nereden geliyor?", a: "Belediye toptancı halleri ve HKS (Ticaret Bakanlığı) günlük kayıtlarından otomatik derlenir; sayfa her gün yenilenir. Adana Toptancı Hali kendi listesini çevrimiçi yayınlamadığı için tabloda Adana satırı görünmez." },
    ],
    related: [
      { href: "/urun/limon-mayer", label: "Mayer limon fiyatları — tüm haller ve geçmiş" },
      { href: "/urun/limon", label: "Limon fiyatları — tüm çeşitler" },
      { href: "/piyasa/erdemli-limon", label: "Erdemli günlük limon piyasası" },
      { href: "/fiyatlar?urun=limon-mayer", label: "Canlı fiyat tablosunda Mayer limonu filtrele" },
    ],
  },
};

/** Urun slug'indan piyasa sayfasina erisim (urun sayfasindaki ic link icin). */
export const PIYASA_BY_PRODUCT: Record<string, PiyasaPageConfig> = Object.fromEntries(
  Object.values(PIYASA_PAGES).map((page) => [page.productSlug, page]),
);

/**
 * Bir analiz makalesini, ayni arama niyetine hizmet eden piyasa sayfasiyla eslestirir.
 *
 * Neden: 19-28 Agustos GSC olcumu, tarihli analiz makalesinin gunluk guncellenen
 * piyasa sayfasini yediligini gosterdi. "mersin limon fiyatlari" sorgusunda makale
 * 1.035 gosterim / %0,58 CTR alirken piyasa sayfasi 189 gosterim / %1,06; "erdemli
 * limon piyasasi"nda makale %0,50, piyasa sayfasi %2,53. Piyasa sayfasi her gorundugu
 * yerde 2-5 kat daha iyi tiklaniyor ama gosterimin kucuk kismini aliyor.
 *
 * Fiyat niyetli okuyucu tarihli bir analize dusunce geri donuyor; bu eslestirme
 * makalenin basindan canli sayfaya kopru kurar.
 */
export function findPiyasaForArticle(
  articleSlug: string,
  tags: readonly string[] = [],
): PiyasaPageConfig | null {
  const haystack = [articleSlug, ...tags].join(" ").toLocaleLowerCase("tr-TR");
  for (const page of Object.values(PIYASA_PAGES)) {
    const product = page.productSlug.toLocaleLowerCase("tr-TR");
    // Bolge adi slug'da gecen ilk kelimeden alinir ("erdemli-limon" -> "erdemli").
    const regionToken = page.slug.split("-")[0]?.toLocaleLowerCase("tr-TR") ?? "";
    if (haystack.includes(product) && regionToken && haystack.includes(regionToken)) {
      return page;
    }
  }
  return null;
}

// hal.gov.tr ulusal kaydi "Türkiye" sehri olarak gelir; sehir kiyasina ve
// hal-basi medyana katilirsa (bircok halin ortalamasi oldugu icin) cift sayilir.
const isCityRow = (row: PriceRow) => row.cityName !== "Türkiye";

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

export interface CitySummaryRow {
  city: string;
  medianPrice: number;
  minPrice: number | null;
  maxPrice: number | null;
  marketCount: number;
  latestDate: string;
}

/** Sehir bazli ozet: her sehirdeki hal ortalamalarinin medyani + aralik. */
export function summarizeByCity(rows: PriceRow[]): CitySummaryRow[] {
  const byCity = new Map<string, PriceRow[]>();
  for (const row of rows) {
    if (!isCityRow(row) || toNum(row.avgPrice) == null) continue;
    const list = byCity.get(row.cityName) ?? [];
    list.push(row);
    byCity.set(row.cityName, list);
  }
  const out: CitySummaryRow[] = [];
  for (const [city, cityRows] of byCity) {
    const avgValues = cityRows.map((r) => toNum(r.avgPrice)).filter((n): n is number => n != null);
    const med = median(avgValues);
    if (med == null) continue;
    const mins = cityRows.map((r) => toNum(r.minPrice)).filter((n): n is number => n != null);
    const maxs = cityRows.map((r) => toNum(r.maxPrice)).filter((n): n is number => n != null);
    out.push({
      city,
      medianPrice: med,
      minPrice: mins.length ? Math.min(...mins) : null,
      maxPrice: maxs.length ? Math.max(...maxs) : null,
      marketCount: new Set(cityRows.map((r) => r.marketSlug)).size,
      latestDate: cityRows.map((r) => r.recordedDate).sort().at(-1) ?? "",
    });
  }
  return out.sort((a, b) => a.medianPrice - b.medianPrice);
}

export interface DailySnapshot {
  marketCount: number;
  medianPrice: number | null;
  weekChangePct: number | null;
  cheapest: CitySummaryRow | null;
  priciest: CitySummaryRow | null;
  latestDate: string | null;
}

/** Gunluk yorum cumlesinin veri tarafi: bugunku medyan + 7 gun oncesine kiyas. */
export function buildDailySnapshot(latestRows: PriceRow[], history: PriceHistoryRow[]): DailySnapshot {
  const cityRows = latestRows.filter(isCityRow);
  const cities = summarizeByCity(cityRows);
  const perMarket = cityRows
    .map((r) => toNum(r.avgPrice))
    .filter((n): n is number => n != null);
  const medianPrice = median(perMarket);

  const byDate = new Map<string, number[]>();
  for (const row of history) {
    const value = toNum(row.avgPrice);
    if (value == null) continue;
    const list = byDate.get(row.recordedDate) ?? [];
    list.push(value);
    byDate.set(row.recordedDate, list);
  }
  const dates = [...byDate.keys()].sort();
  let weekChangePct: number | null = null;
  if (dates.length && medianPrice != null) {
    const lastDate = dates.at(-1) as string;
    const target = new Date(`${lastDate.slice(0, 10)}T00:00:00Z`).getTime() - 7 * 86_400_000;
    const refDate = dates.filter((d) => new Date(`${d.slice(0, 10)}T00:00:00Z`).getTime() <= target).at(-1);
    const refMedian = refDate ? median(byDate.get(refDate) ?? []) : null;
    if (refMedian != null && refMedian > 0) {
      weekChangePct = Math.round(((medianPrice - refMedian) / refMedian) * 1000) / 10;
    }
  }

  return {
    marketCount: new Set(cityRows.map((r) => r.marketSlug)).size,
    medianPrice,
    weekChangePct,
    cheapest: cities[0] ?? null,
    priciest: cities.at(-1) ?? null,
    latestDate: cityRows.map((r) => r.recordedDate).sort().at(-1) ?? null,
  };
}
