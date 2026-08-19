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
};

/** Urun slug'indan piyasa sayfasina erisim (urun sayfasindaki ic link icin). */
export const PIYASA_BY_PRODUCT: Record<string, PiyasaPageConfig> = Object.fromEntries(
  Object.values(PIYASA_PAGES).map((page) => [page.productSlug, page]),
);

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
