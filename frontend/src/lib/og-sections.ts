const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://haldefiyat.com").replace(/\/$/, "");

export interface SectionCover {
  kicker: string;
  title: string;
  subtitle: string;
  alt: string;
}

/**
 * Bolum kok sayfalarinin paylasim kapaklari.
 *
 * Kapak vermeyen sayfa seo.ts'teki marka yedegine (/og/default) dusuyordu;
 * 17 sayfa ayni karti paylasiyordu ve paylasilan sayfa ayirt edilemiyordu
 * (Tanitio katalogu, 22 Eyl 2026). Metin burada, canli rakamlar route'ta.
 */
export const SECTION_COVERS = {
  "borsa": {
    kicker: "TMO · Ticaret Borsaları",
    title: "Borsa ve Resmi Tarım Fiyatları",
    subtitle: "Kaynak ve tarih etiketli güncel fiyatlar",
    alt: "Borsa ve resmi tarım fiyatları kapağı",
  },
  "et-fiyatlari": {
    kicker: "Karkas · Ticaret Borsası",
    title: "Et Fiyatları",
    subtitle: "Kaynak ve tarih etiketli güncel fiyatlar",
    alt: "Et fiyatları kapağı",
  },
  "canli-hayvan-fiyatlari": {
    kicker: "Borsa · Canlı Hayvan",
    title: "Canlı Hayvan Fiyatları",
    subtitle: "Ticaret borsası bültenlerinden derlenen kayıtlar",
    alt: "Canlı hayvan fiyatları kapağı",
  },
  "fiyat": {
    kicker: "Şehir × Ürün",
    title: "Şehir Şehir Hal Fiyatları",
    subtitle: "Her il kendi toptancı hal bülteninden",
    alt: "Şehir şehir hal fiyatları kapağı",
  },
  "piyasa": {
    kicker: "Bölgesel Piyasa",
    title: "Bölgesel Günlük Piyasalar",
    subtitle: "Yerel kayıt, Türkiye kıyası, çeşit ve birim ayrımı",
    alt: "Bölgesel günlük piyasalar kapağı",
  },
  "canli-hal-fiyatlari": {
    kicker: "Canlı Veri Akışı",
    title: "Canlı Hal Fiyatları",
    subtitle: "Günlük güncellenen toptan sebze ve meyve fiyatları",
    alt: "Canlı hal fiyatları kapağı",
  },
  "firmalar": {
    kicker: "Firma Rehberi",
    title: "Hal Firmaları ve Komisyoncular",
    subtitle: "Şehir ve hizmet türüne göre kayıtlı firmalar",
    alt: "Hal firmaları rehberi kapağı",
  },
  "analiz": {
    kicker: "Piyasa Analizi",
    title: "Hal Fiyatları Analizleri",
    subtitle: "Haftalık rapor, sezon değerlendirmesi ve fiyat açıklamaları",
    alt: "Hal fiyatları analizleri kapağı",
  },
  "rehber": {
    kicker: "Alım Rehberleri",
    title: "Mevsim ve Alım Rehberleri",
    subtitle: "Hangi ürün ne zaman, hangi fiyata alınır",
    alt: "Mevsim ve alım rehberleri kapağı",
  },
  "harita": {
    kicker: "Kapsama Haritası",
    title: "Hal Fiyatları Haritası",
    subtitle: "İl il kayıt yoğunluğu ve güncel ortalamalar",
    alt: "Hal fiyatları haritası kapağı",
  },
  "embed": {
    kicker: "Ücretsiz Widget",
    title: "Hal Fiyatları Widget’ı",
    subtitle: "Kendi sitenize güncel fiyat tablosu ekleyin",
    alt: "Hal fiyatları widget kapağı",
  },
  "basin": {
    kicker: "Basın Odası",
    title: "Basın ve Veri Kullanımı",
    subtitle: "Kaynak gösterimi, veri lisansı ve iletişim",
    alt: "Basın odası kapağı",
  },
  "reklam-ver": {
    kicker: "Reklam ve Sponsorluk",
    title: "HaldeFiyat’ta Reklam",
    subtitle: "Tarım ve hal piyasasını takip eden kitleye doğrudan erişim",
    alt: "Reklam ve sponsorluk kapağı",
  },
  "ilan-ver": {
    kicker: "Ücretsiz İlan",
    title: "Ürün İlanı Ver",
    subtitle: "Alım ve satım ilanınızı yayına alın",
    alt: "Ürün ilanı ver kapağı",
  },
  "editoryal-politika": {
    kicker: "Yayın İlkeleri",
    title: "Editoryal Politika",
    subtitle: "İçerik nasıl üretilir, kim denetler",
    alt: "Editoryal politika kapağı",
  },
  "duzeltme-politikasi": {
    kicker: "Yayın İlkeleri",
    title: "Düzeltme Politikası",
    subtitle: "Hatalı veri ve içerik nasıl düzeltilir",
    alt: "Düzeltme politikası kapağı",
  },
  "veri-kaynagi-politikasi": {
    kicker: "Veri İlkeleri",
    title: "Veri Kaynağı Politikası",
    subtitle: "Hangi kaynak, hangi sıklıkla, nasıl doğrulanır",
    alt: "Veri kaynağı politikası kapağı",
  },
  "sahiplik-finansman": {
    kicker: "Şeffaflık",
    title: "Sahiplik ve Finansman",
    subtitle: "Platformu kim işletiyor, gelir nereden geliyor",
    alt: "Sahiplik ve finansman kapağı",
  },
} as const satisfies Record<string, SectionCover>;

export type SectionSlug = keyof typeof SECTION_COVERS;

/** generateMetadata icin hazir openGraph gorseli: tek satirda dogru boyut + alt. */
export function sectionOgImage(slug: SectionSlug) {
  return {
    url: `${SITE_URL}/og/bolum/${slug}`,
    width: 1200,
    height: 630,
    alt: SECTION_COVERS[slug].alt,
  };
}
