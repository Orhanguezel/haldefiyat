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
    "slug": "erdemli-limon",
    "productSlug": "limon",
    "productName": "Limon",
    "region": "Mersin / Erdemli",
    "title": "Erdemli Limon Piyasası — Kaynak ve Fiyat Kapsamı",
    "description": "Erdemli Limon Piyasası: yerel kaydın durumu, Türkiye hal fiyatları, çeşit ve birim ayrımı. Bahçe fiyatıyla toptan hal fiyatını ayrı değerlendirin.",
    "h1": "Erdemli Limon Piyasası",
    "intro": [
      "Mersin / Erdemli için limon fiyatını ararken ürün çeşidini, kaydın tarihini ve satış aşamasını birlikte kontrol edin. Bu sayfa yerel kaydın durumunu Türkiye genelindeki hal kayıtlarından ayırır.",
      "Ulusal tablodaki ürünlerin üretim yeri bu kayıtlardan doğrulanamaz. Başka bir şehirdeki fiyat, Adana veya Erdemli bahçe alım fiyatı yerine kullanılmaz."
    ],
    "regionSections": [
      {
        "heading": "Yerel fiyat ile Türkiye tablosu nasıl ayrılır?",
        "paragraphs": [
          "Yerel kayıt, ilgili halde yayımlanan toptan fiyat bültenidir. Türkiye tablosu farklı hallerin kayıtlarını gösterir; aynı çeşit, kalite, ambalaj ve tarih eşleşmedikçe şehirler arası fiyat farkı kazanç veya ucuzluk olarak yorumlanmaz."
        ]
      },
      {
        "heading": "Çeşit ve fiyat türü neden önemli?",
        "paragraphs": [
          "Kaynakta yazan çeşit ve ambalaj adı korunur. Alt–üst aralığın orta noktası işlem hacmi ağırlıklı ortalama değildir. Toptan hal, bahçe alımı, salon referansı ve perakende fiyatları ayrı aşamalardır."
        ]
      }
    ],
    "seasonCalendar": [],
    "faq": [
      {
        "q": "Limon için bugünün yerel fiyatı var mı?",
        "a": "Yerel kayıt kutusunda son yayımlanan tarih gösterilir. Kayıt yoksa veya gecikmişse güncel fiyat iddiası yapılmaz; ulusal tablo bu eksikliğin yerine geçmez."
      },
      {
        "q": "Fiyat yayımlanmayan gün nasıl değerlendirilir?",
        "a": "Fiyat boşluğu sıfır veya fiyat değişmedi anlamına gelmez. Kaynakta fiyat oluşmadıysa ya da kaynağa erişilemiyorsa bu durum ayrı belirtilmelidir."
      }
    ],
    "related": [
      {
        "href": "/urun/limon",
        "label": "Limon fiyatları — Türkiye hal kayıtları"
      },
      {
        "href": "/hal/mersin-hal",
        "label": "Mersin hali — kaynak ve son kayıt"
      }
    ]
  },
  "adana-mayer-limon": {
    "slug": "adana-mayer-limon",
    "productSlug": "limon-mayer",
    "productName": "Mayer Limon",
    "region": "Adana / Çukurova",
    "title": "Adana Mayer Limon Piyasası — Kaynak ve Fiyat Kapsamı",
    "description": "Adana Mayer Limon Piyasası: yerel kaydın durumu, Türkiye hal fiyatları, çeşit ve birim ayrımı. Bahçe fiyatıyla toptan hal fiyatını ayrı değerlendirin.",
    "h1": "Adana Mayer Limon Piyasası",
    "intro": [
      "Adana / Çukurova için mayer limon fiyatını ararken ürün çeşidini, kaydın tarihini ve satış aşamasını birlikte kontrol edin. Bu sayfa yerel kaydın durumunu Türkiye genelindeki hal kayıtlarından ayırır.",
      "Ulusal tablodaki ürünlerin üretim yeri bu kayıtlardan doğrulanamaz. Başka bir şehirdeki fiyat, Adana veya Erdemli bahçe alım fiyatı yerine kullanılmaz."
    ],
    "regionSections": [
      {
        "heading": "Yerel fiyat ile Türkiye tablosu nasıl ayrılır?",
        "paragraphs": [
          "Yerel kayıt, ilgili halde yayımlanan toptan fiyat bültenidir. Türkiye tablosu farklı hallerin kayıtlarını gösterir; aynı çeşit, kalite, ambalaj ve tarih eşleşmedikçe şehirler arası fiyat farkı kazanç veya ucuzluk olarak yorumlanmaz."
        ]
      },
      {
        "heading": "Çeşit ve fiyat türü neden önemli?",
        "paragraphs": [
          "Kaynakta yazan çeşit ve ambalaj adı korunur. Alt–üst aralığın orta noktası işlem hacmi ağırlıklı ortalama değildir. Toptan hal, bahçe alımı, salon referansı ve perakende fiyatları ayrı aşamalardır."
        ]
      }
    ],
    "seasonCalendar": [],
    "faq": [
      {
        "q": "Mayer Limon için bugünün yerel fiyatı var mı?",
        "a": "Yerel kayıt kutusunda son yayımlanan tarih gösterilir. Kayıt yoksa veya gecikmişse güncel fiyat iddiası yapılmaz; ulusal tablo bu eksikliğin yerine geçmez."
      },
      {
        "q": "Fiyat yayımlanmayan gün nasıl değerlendirilir?",
        "a": "Fiyat boşluğu sıfır veya fiyat değişmedi anlamına gelmez. Kaynakta fiyat oluşmadıysa ya da kaynağa erişilemiyorsa bu durum ayrı belirtilmelidir."
      }
    ],
    "related": [
      {
        "href": "/urun/limon-mayer",
        "label": "Mayer Limon fiyatları — Türkiye hal kayıtları"
      },
      {
        "href": "/hal/adana-hal",
        "label": "Adana hali — kaynak ve son kayıt"
      }
    ]
  },
  "adana-limon": {
    "slug": "adana-limon",
    "productSlug": "limon",
    "productName": "Limon",
    "region": "Adana / Çukurova",
    "title": "Adana Limon Piyasası — Kaynak ve Fiyat Kapsamı",
    "description": "Adana Limon Piyasası: yerel kaydın durumu, Türkiye hal fiyatları, çeşit ve birim ayrımı. Bahçe fiyatıyla toptan hal fiyatını ayrı değerlendirin.",
    "h1": "Adana Limon Piyasası",
    "intro": [
      "Adana / Çukurova için limon fiyatını ararken ürün çeşidini, kaydın tarihini ve satış aşamasını birlikte kontrol edin. Bu sayfa yerel kaydın durumunu Türkiye genelindeki hal kayıtlarından ayırır.",
      "Ulusal tablodaki ürünlerin üretim yeri bu kayıtlardan doğrulanamaz. Başka bir şehirdeki fiyat, Adana veya Erdemli bahçe alım fiyatı yerine kullanılmaz."
    ],
    "regionSections": [
      {
        "heading": "Yerel fiyat ile Türkiye tablosu nasıl ayrılır?",
        "paragraphs": [
          "Yerel kayıt, ilgili halde yayımlanan toptan fiyat bültenidir. Türkiye tablosu farklı hallerin kayıtlarını gösterir; aynı çeşit, kalite, ambalaj ve tarih eşleşmedikçe şehirler arası fiyat farkı kazanç veya ucuzluk olarak yorumlanmaz."
        ]
      },
      {
        "heading": "Çeşit ve fiyat türü neden önemli?",
        "paragraphs": [
          "Kaynakta yazan çeşit ve ambalaj adı korunur. Alt–üst aralığın orta noktası işlem hacmi ağırlıklı ortalama değildir. Toptan hal, bahçe alımı, salon referansı ve perakende fiyatları ayrı aşamalardır."
        ]
      }
    ],
    "seasonCalendar": [],
    "faq": [
      {
        "q": "Limon için bugünün yerel fiyatı var mı?",
        "a": "Yerel kayıt kutusunda son yayımlanan tarih gösterilir. Kayıt yoksa veya gecikmişse güncel fiyat iddiası yapılmaz; ulusal tablo bu eksikliğin yerine geçmez."
      },
      {
        "q": "Fiyat yayımlanmayan gün nasıl değerlendirilir?",
        "a": "Fiyat boşluğu sıfır veya fiyat değişmedi anlamına gelmez. Kaynakta fiyat oluşmadıysa ya da kaynağa erişilemiyorsa bu durum ayrı belirtilmelidir."
      }
    ],
    "related": [
      {
        "href": "/urun/limon",
        "label": "Limon fiyatları — Türkiye hal kayıtları"
      },
      {
        "href": "/hal/adana-hal",
        "label": "Adana hali — kaynak ve son kayıt"
      }
    ]
  },
  "mersin-limon": {
    "slug": "mersin-limon",
    "productSlug": "limon",
    "productName": "Limon",
    "region": "Mersin",
    "title": "Mersin Limon Piyasası — Kaynak ve Fiyat Kapsamı",
    "description": "Mersin Limon Piyasası: yerel kaydın durumu, Türkiye hal fiyatları, çeşit ve birim ayrımı. Bahçe fiyatıyla toptan hal fiyatını ayrı değerlendirin.",
    "h1": "Mersin Limon Piyasası",
    "intro": [
      "Mersin için limon fiyatını ararken ürün çeşidini, kaydın tarihini ve satış aşamasını birlikte kontrol edin. Bu sayfa yerel kaydın durumunu Türkiye genelindeki hal kayıtlarından ayırır.",
      "Ulusal tablodaki ürünlerin üretim yeri bu kayıtlardan doğrulanamaz. Başka bir şehirdeki fiyat, Adana veya Erdemli bahçe alım fiyatı yerine kullanılmaz."
    ],
    "regionSections": [
      {
        "heading": "Yerel fiyat ile Türkiye tablosu nasıl ayrılır?",
        "paragraphs": [
          "Yerel kayıt, ilgili halde yayımlanan toptan fiyat bültenidir. Türkiye tablosu farklı hallerin kayıtlarını gösterir; aynı çeşit, kalite, ambalaj ve tarih eşleşmedikçe şehirler arası fiyat farkı kazanç veya ucuzluk olarak yorumlanmaz."
        ]
      },
      {
        "heading": "Çeşit ve fiyat türü neden önemli?",
        "paragraphs": [
          "Kaynakta yazan çeşit ve ambalaj adı korunur. Alt–üst aralığın orta noktası işlem hacmi ağırlıklı ortalama değildir. Toptan hal, bahçe alımı, salon referansı ve perakende fiyatları ayrı aşamalardır."
        ]
      }
    ],
    "seasonCalendar": [],
    "faq": [
      {
        "q": "Limon için bugünün yerel fiyatı var mı?",
        "a": "Yerel kayıt kutusunda son yayımlanan tarih gösterilir. Kayıt yoksa veya gecikmişse güncel fiyat iddiası yapılmaz; ulusal tablo bu eksikliğin yerine geçmez."
      },
      {
        "q": "Fiyat yayımlanmayan gün nasıl değerlendirilir?",
        "a": "Fiyat boşluğu sıfır veya fiyat değişmedi anlamına gelmez. Kaynakta fiyat oluşmadıysa ya da kaynağa erişilemiyorsa bu durum ayrı belirtilmelidir."
      }
    ],
    "related": [
      {
        "href": "/urun/limon",
        "label": "Limon fiyatları — Türkiye hal kayıtları"
      },
      {
        "href": "/hal/mersin-hal",
        "label": "Mersin hali — kaynak ve son kayıt"
      }
    ]
  },
  "adana-mandalina": {
    "slug": "adana-mandalina",
    "productSlug": "mandalina",
    "productName": "Mandalina",
    "region": "Adana / Çukurova",
    "title": "Adana Mandalina Piyasası — Kaynak ve Fiyat Kapsamı",
    "description": "Adana Mandalina Piyasası: yerel kaydın durumu, Türkiye hal fiyatları, çeşit ve birim ayrımı. Bahçe fiyatıyla toptan hal fiyatını ayrı değerlendirin.",
    "h1": "Adana Mandalina Piyasası",
    "intro": [
      "Adana / Çukurova için mandalina fiyatını ararken ürün çeşidini, kaydın tarihini ve satış aşamasını birlikte kontrol edin. Bu sayfa yerel kaydın durumunu Türkiye genelindeki hal kayıtlarından ayırır.",
      "Ulusal tablodaki ürünlerin üretim yeri bu kayıtlardan doğrulanamaz. Başka bir şehirdeki fiyat, Adana veya Erdemli bahçe alım fiyatı yerine kullanılmaz."
    ],
    "regionSections": [
      {
        "heading": "Yerel fiyat ile Türkiye tablosu nasıl ayrılır?",
        "paragraphs": [
          "Yerel kayıt, ilgili halde yayımlanan toptan fiyat bültenidir. Türkiye tablosu farklı hallerin kayıtlarını gösterir; aynı çeşit, kalite, ambalaj ve tarih eşleşmedikçe şehirler arası fiyat farkı kazanç veya ucuzluk olarak yorumlanmaz."
        ]
      },
      {
        "heading": "Çeşit ve fiyat türü neden önemli?",
        "paragraphs": [
          "Kaynakta yazan çeşit ve ambalaj adı korunur. Alt–üst aralığın orta noktası işlem hacmi ağırlıklı ortalama değildir. Toptan hal, bahçe alımı, salon referansı ve perakende fiyatları ayrı aşamalardır."
        ]
      }
    ],
    "seasonCalendar": [],
    "faq": [
      {
        "q": "Mandalina için bugünün yerel fiyatı var mı?",
        "a": "Yerel kayıt kutusunda son yayımlanan tarih gösterilir. Kayıt yoksa veya gecikmişse güncel fiyat iddiası yapılmaz; ulusal tablo bu eksikliğin yerine geçmez."
      },
      {
        "q": "Fiyat yayımlanmayan gün nasıl değerlendirilir?",
        "a": "Fiyat boşluğu sıfır veya fiyat değişmedi anlamına gelmez. Kaynakta fiyat oluşmadıysa ya da kaynağa erişilemiyorsa bu durum ayrı belirtilmelidir."
      }
    ],
    "related": [
      {
        "href": "/urun/mandalina",
        "label": "Mandalina fiyatları — Türkiye hal kayıtları"
      },
      {
        "href": "/hal/adana-hal",
        "label": "Adana hali — kaynak ve son kayıt"
      }
    ]
  }
};

/** Urun slug'indan piyasa sayfasina erisim (urun sayfasindaki ic link icin). */
// Ayni urunun birden cok bolge sayfasi olabilir (limon: erdemli, adana, mersin); urun
// sayfasindaki tek link ILK tanimlanana gider (Object.entries sirasi).
export const PIYASA_BY_PRODUCT: Record<string, PiyasaPageConfig> = Object.fromEntries(
  Object.values(PIYASA_PAGES).reverse().map((page) => [page.productSlug, page]),
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
  let best: { page: PiyasaPageConfig; score: number } | null = null;
  for (const page of Object.values(PIYASA_PAGES)) {
    // Urun slug'i cok parcali olabilir ("limon-mayer"); makale "adana-mayer-limon" derse
    // sira farkli ama her parca gecer — parca parca aranir.
    const productTokens = page.productSlug.toLocaleLowerCase("tr-TR").split("-").filter(Boolean);
    // Bolge adi slug'da gecen ilk kelimeden alinir ("erdemli-limon" -> "erdemli").
    const regionToken = page.slug.split("-")[0]?.toLocaleLowerCase("tr-TR") ?? "";
    if (!regionToken || !haystack.includes(regionToken) || !productTokens.every((tok) => haystack.includes(tok))) continue;
    // En ozgul eslesme kazanir: "adana-mayer-limon" makalesi adana-limon degil adana-mayer-limon sayfasina gider.
    const score = productTokens.length;
    if (!best || score > best.score) best = { page, score };
  }
  return best?.page ?? null;
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
