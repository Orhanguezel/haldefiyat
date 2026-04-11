type FeatureColor = "lime" | "blue" | "amber" | "red" | "purple" | "teal";

interface Feature {
  icon: string;
  color: FeatureColor;
  title: string;
  desc: string;
}

const FEATURES: ReadonlyArray<Feature> = [
  {
    icon: "📊",
    color: "lime",
    title: "Anlık Fiyat Verileri",
    desc: "Tüm büyük hallerden günde iki kez güncellenen canlı sebze ve meyve fiyatları. Min, max ve ortalama değerler.",
  },
  {
    icon: "📈",
    color: "blue",
    title: "Trend Grafikleri",
    desc: "Haftalık, aylık ve yıllık fiyat grafikleri ile piyasa trendlerini analiz edin. Karşılaştırmalı görünüm.",
  },
  {
    icon: "🔔",
    color: "amber",
    title: "Akıllı Fiyat Uyarıları",
    desc: "Hedef fiyat belirleyin, ürün istediğiniz fiyata düştüğünde veya çıktığında anında bildirim alın.",
  },
  {
    icon: "🏪",
    color: "red",
    title: "81 İl Kapsamı",
    desc: "Türkiye'nin her ilinden hal verilerine erişin. Bölgesel fiyat farklılıklarını tek tıkla karşılaştırın.",
  },
  {
    icon: "📱",
    color: "purple",
    title: "Mobil Uyumlu",
    desc: "Tarlada, hallde veya masabaşında — her cihazdan kesintisiz erişim. PWA desteği ile offline kullanım.",
  },
  {
    icon: "🌿",
    color: "teal",
    title: "Tamamen Ücretsiz",
    desc: "Hiçbir ücret veya gizli maliyet yok. Çiftçiden tüketiciye herkese açık, bağımsız fiyat platformu.",
  },
];

const ICON_CLASSES: Record<FeatureColor, string> = {
  lime: "bg-[rgba(132,240,76,0.10)] border-[rgba(132,240,76,0.15)]",
  blue: "bg-[rgba(59,130,246,0.10)] border-[rgba(59,130,246,0.15)]",
  amber: "bg-[rgba(245,158,11,0.10)] border-[rgba(245,158,11,0.15)]",
  red: "bg-[rgba(239,68,68,0.10)] border-[rgba(239,68,68,0.12)]",
  purple: "bg-[rgba(168,130,255,0.10)] border-[rgba(168,130,255,0.12)]",
  teal: "bg-[rgba(20,184,166,0.10)] border-[rgba(20,184,166,0.12)]",
};

/**
 * Features grid (server component).
 *
 * NEDEN: Tamamen statik icerik — hicbir state, fetch veya effect yok.
 * RSC olarak kalmasi bundle'a sifir JS ekler.
 */
export default function FeaturesGrid() {
  return (
    <section
      id="hakkinda"
      className="relative z-10 px-8 py-20"
    >
      <div className="mx-auto max-w-[1400px]">
        <header className="mb-12">
          <div className="mb-2 font-(family-name:--font-mono) text-[11px] font-semibold uppercase tracking-[0.12em] text-(--color-brand)">
            Platform Özellikleri
          </div>
          <h2 className="font-(family-name:--font-display) text-[28px] font-extrabold tracking-[-0.03em] text-(--color-foreground) sm:text-[32px]">
            Neden HalDeFiyat?
          </h2>
        </header>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feat) => (
            <article
              key={feat.title}
              className="group relative rounded-[20px] border border-(--color-border) bg-(--color-surface) p-10 transition-all duration-300 hover:-translate-y-1 hover:bg-(--color-bg-alt) hover:shadow-2xl"
            >
              <div
                className={`mb-6 flex h-14 w-14 items-center justify-center rounded-[14px] border text-[26px] ${ICON_CLASSES[feat.color]}`}
              >
                {feat.icon}
              </div>
              <h3 className="mb-2.5 font-(family-name:--font-display) text-[18px] font-bold tracking-[-0.01em] text-(--color-foreground)">
                {feat.title}
              </h3>
              <p className="text-[14px] leading-[1.7] text-(--color-muted)">
                {feat.desc}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
