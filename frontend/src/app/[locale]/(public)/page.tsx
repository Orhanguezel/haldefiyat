export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { fetchTrending } from "@/lib/api";
import JsonLd from "@/components/seo/JsonLd";
import HeroSection from "@/components/sections/HeroSection";
import PriceTicker from "@/components/sections/PriceTicker";
import PriceDashboard from "@/components/sections/PriceDashboard";
import CitySelector from "@/components/sections/CitySelector";
import StatsBar from "@/components/sections/StatsBar";
import FeaturesGrid from "@/components/sections/FeaturesGrid";
import HowItWorks from "@/components/sections/HowItWorks";
import CtaNewsletter from "@/components/sections/CtaNewsletter";

type Props = { params: Promise<{ locale: string }> };

export function generateMetadata(): Metadata {
  return {
    title: "Türkiye Hal Fiyatları — Günlük, Gerçek Zamanlı",
    description:
      "81 ilin hal ve pazar fiyatları tek ekranda. Sebze, meyve ve bakliyat fiyatlarını şehir ve kategori bazında karşılaştırın.",
    openGraph: {
      title: "HaldeFiyat — Türkiye Hal Fiyatları",
      description:
        "Türkiye'nin 81 ilindeki hal fiyatlarını günlük takip edin. Trend analizleri, karşılaştırma grafikleri ve bölgesel veriler.",
      type: "website",
      locale: "tr_TR",
    },
    alternates: {
      canonical: "/",
    },
  };
}

const datasetSchema = {
  name: "Türkiye Hal Fiyatları",
  description:
    "Türkiye'nin 81 ilindeki hal ve pazar fiyat verileri. Günlük güncellenir.",
  url: "https://haldefiyat.com",
  creator: { "@type": "Organization", name: "HaldeFiyat" },
  license: "https://creativecommons.org/licenses/by/4.0/",
  temporalCoverage: "2025/..",
  spatialCoverage: { "@type": "Place", name: "Türkiye" },
  variableMeasured: ["MinFiyat", "MaxFiyat", "OrtalamaFiyat"],
  isAccessibleForFree: true,
} satisfies Record<string, unknown>;

export default async function HomePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const trending = await fetchTrending(20);

  return (
    <>
      <JsonLd type="Dataset" data={datasetSchema} />
      <HeroSection />
      <PriceTicker items={trending} />
      <PriceDashboard />
      <CitySelector locale={locale} />
      <StatsBar />
      <FeaturesGrid />
      <HowItWorks />
      <CtaNewsletter />
    </>
  );
}
