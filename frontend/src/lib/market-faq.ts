/**
 * Hal detay sayfasi SSS uretici (8 Eyl 2026 rakip analizi).
 *
 * Sehir hali sayfamiz icerik olarak rakibin iki kati (7.460 kelimeye karsi
 * 3.532) ama tek eksigi FAQPage semasiydi; rakip ayni sayfada alti soruyla
 * yayimliyor. Sorular sayfadaki gorunur blokla birebir ayni uretilir — sema
 * gorunmeyen icerik iddia etmez.
 *
 * Her cevap yalniz elimizdeki veriden kurulur: tarih yoksa tarih iddiasi,
 * urun sayisi yoksa kapsam iddiasi yazilmaz.
 */

export interface MarketFaqInput {
  marketName: string;
  cityName: string;
  /** Son yayimlanan listenin Turkce tarihi; yoksa bos. */
  latestDateTr: string;
  /** Son listedeki ayri urun sayisi. */
  productCount: number;
  /** Kaynak kurum adi (hal veya belediye). */
  sourceLabel: string;
  /** Son kayit 7 gunden eskiyse tazelik iddiasi yapilmaz. */
  staleBulletin: boolean;
}

export interface FaqItem {
  question: string;
  answer: string;
}

export function buildMarketFaq(input: MarketFaqInput): FaqItem[] {
  const { marketName, cityName, latestDateTr, productCount, sourceLabel, staleBulletin } = input;
  const hasSnapshot = Boolean(latestDateTr) && productCount > 0;
  const items: FaqItem[] = [];

  items.push({
    question: `${cityName} hal fiyatları bugün ne kadar?`,
    answer: hasSnapshot
      ? `${marketName} için doğrulanmış son liste ${latestDateTr} tarihli ve ${productCount} ürünü kapsıyor. Ürün ürün en düşük, ortalama ve en yüksek toptan fiyatlar bu sayfadaki fiyat listesi tablosunda yer alır.${staleBulletin ? " Bu kayıt yedi günden eski olduğu için bugünkü yerel fiyat olarak kullanılmamalıdır." : ""}`
      : `${marketName} için doğrulanmış güncel fiyat listesi bulunmuyor. Kaynak yeni kayıt yayımladığında kapsam ve kesin tarih bu sayfada gösterilir; o zamana kadar tarih veya tazelik iddiası yayımlanmaz.`,
  });

  items.push({
    question: `${cityName} hal fiyatları ne zaman güncellenir?`,
    answer: `Fiyatlar ${sourceLabel} kaynağının resmi yayın takvimine göre otomatik alınır; kaynak listeyi yayımladıkça bu sayfa güncellenir. Yayın yapılmayan günlerde yeni tarih üretilmez, son doğrulanmış kayıt olduğu gibi gösterilir.`,
  });

  if (hasSnapshot) {
    items.push({
      question: `${marketName}'nde kaç ürünün fiyatı yayımlanıyor?`,
      answer: `${latestDateTr} tarihli listede ${productCount} ayrı ürün var. Ürün sayısı kaynağın o gün yayımladığı bültene göre değişir; sebze, meyve ve bakliyat kalemleri aynı tabloda listelenir.`,
    });
  }

  items.push({
    question: "Hal fiyatı ile market fiyatı neden farklı?",
    answer: `Bu sayfadaki rakamlar ${marketName}'nde oluşan toptan fiyatlardır. Market raf fiyatı bunun üzerine nakliye, fire, paketleme ve perakende marjı eklenerek oluşur; bu nedenle hal fiyatının belirgin biçimde üzerindedir. Hal fiyatı üreticiye bahçede ödenen alım fiyatı da değildir.`,
  });

  items.push({
    question: `${cityName} hal fiyatları neden değişir?`,
    answer: "Toptan fiyatlar hasat dönemi, hava koşulları, üretim bölgesinden gelen arz miktarı, nakliye maliyeti ve ürün kalitesine göre gün gün değişir. Sezon dışı dönemlerde ve olumsuz hava koşullarından sonra fiyatlar belirgin biçimde yükselebilir.",
  });

  return items;
}
