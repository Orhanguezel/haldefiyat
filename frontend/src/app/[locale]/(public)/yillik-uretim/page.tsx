import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { fetchProductionSpecies, fetchProduction } from "@/lib/api";
import ProductionExplorer from "@/components/sections/ProductionExplorer";

type Props = { params: Promise<{ locale: string }> };

export function generateMetadata(): Metadata {
  return {
    title: "Yıllık Su Ürünleri Üretimi",
    description:
      "Türkiye'de yıllık balık ve su ürünleri üretim istatistikleri. İBB ve TÜİK kaynaklı veriler.",
    openGraph: {
      title: "Yıllık Üretim İstatistikleri | HaldeFiyat",
      type: "website",
      locale: "tr_TR",
    },
    alternates: { canonical: "/yillik-uretim" },
  };
}

export default async function YillikUretimPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const [species, initialRows] = await Promise.all([
    fetchProductionSpecies(),
    fetchProduction({ limit: 500 }),
  ]);

  return (
    <main className="relative z-10 mx-auto max-w-[1400px] px-8 py-12">
      <div className="mb-8">
        <span className="font-(family-name:--font-mono) text-[11px] font-semibold uppercase tracking-[0.12em] text-(--color-brand)">
          Yıllık Üretim
        </span>
        <h1 className="mt-1 font-(family-name:--font-display) text-3xl font-bold text-(--color-foreground)">
          Su Ürünleri Üretim İstatistikleri
        </h1>
        <p className="mt-3 max-w-2xl text-[14px] text-(--color-muted)">
          Yıllık üretim verileri (ton) — İstanbul yetiştiricilik (İBB Açık Veri)
          ve ileride TÜİK ulusal istatistikleri. Her ayın 5'inde otomatik
          güncellenir.
        </p>
      </div>

      <ProductionExplorer initialRows={initialRows} species={species} />
    </main>
  );
}
