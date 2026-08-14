import { Bell, ChartNoAxesCombined, Database, Leaf, Smartphone, Store, type LucideIcon } from "lucide-react";
import { ContentCard } from "@/components/ui/ContentCard";

interface Feature {
  icon: LucideIcon;
  title: string;
  desc: string;
}

function buildFeatures(activeCities?: number, targetCoverage = "81 il hedef"): ReadonlyArray<Feature> {
  const coverageTitle = activeCities && activeCities > 0
    ? `${activeCities.toLocaleString("tr-TR")} Aktif İl`
    : targetCoverage;
  return [
  {
    icon: Database,
    title: "Anlık Fiyat Verileri",
    desc: "Tüm büyük hallerden günde iki kez güncellenen canlı sebze ve meyve fiyatları. Min, max ve ortalama değerler.",
  },
  {
    icon: ChartNoAxesCombined,
    title: "Trend Grafikleri",
    desc: "Haftalık, aylık ve yıllık fiyat grafikleri ile piyasa trendlerini analiz edin. Karşılaştırmalı görünüm.",
  },
  {
    icon: Bell,
    title: "Akıllı Fiyat Uyarıları",
    desc: "Hedef fiyat belirleyin, ürün istediğiniz fiyata düştüğünde veya çıktığında anında bildirim alın.",
  },
  {
    icon: Store,
    title: coverageTitle,
    desc: `${targetCoverage} doğrultusunda, aktif kaynaklardan gelen bölgesel fiyat farklılıklarını tek ekranda karşılaştırın.`,
  },
  {
    icon: Smartphone,
    title: "Mobil Uyumlu",
    desc: "Tarlada, halde veya masabaşında — her cihazdan kesintisiz erişim. PWA desteği ile offline kullanım.",
  },
  {
    icon: Leaf,
    title: "Tamamen Ücretsiz",
    desc: "Hiçbir ücret veya gizli maliyet yok. Çiftçiden tüketiciye herkese açık, bağımsız fiyat platformu.",
  },
  ];
}

/**
 * Features grid (server component).
 *
 * NEDEN: Tamamen statik icerik — hicbir state, fetch veya effect yok.
 * RSC olarak kalmasi bundle'a sifir JS ekler.
 */
export default function FeaturesGrid({ activeCities, targetCoverage }: { activeCities?: number; targetCoverage?: string }) {
  const features = buildFeatures(activeCities, targetCoverage);
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
          {features.map((feat) => {
            const Icon = feat.icon;
            return (
            <ContentCard
              key={feat.title}
              kind="editorial"
              className="group relative rounded-[20px] p-10 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl"
            >
              <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-[14px] border border-(--color-brand)/20 bg-(--color-brand-light)">
                <Icon className="h-7 w-7 text-(--color-brand)" aria-hidden />
              </div>
              <h3 className="mb-2.5 font-(family-name:--font-display) text-[18px] font-bold tracking-[-0.01em] text-(--color-foreground)">
                {feat.title}
              </h3>
              <p className="text-[14px] leading-[1.7] text-(--color-muted)">
                {feat.desc}
              </p>
            </ContentCard>
          );})}
        </div>
      </div>
    </section>
  );
}
