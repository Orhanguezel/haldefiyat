export const dynamic = "force-dynamic";

import { setRequestLocale } from "next-intl/server";
import { getPageMetadata } from "@/lib/seo";
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
import IndexCta from "@/components/sections/IndexCta";
import SeasonalGuide from "@/components/sections/SeasonalGuide";
import HomeFaq from "@/components/sections/HomeFaq";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  return getPageMetadata("home", {
    locale,
    pathname: "/",
    title: "Türkiye Hal Fiyatları — Günlük, Gerçek Zamanlı",
    description:
      "81 ilin hal ve pazar fiyatları tek ekranda. Sebze, meyve ve bakliyat fiyatlarını şehir ve kategori bazında karşılaştırın.",
  });
}

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://haldefiyat.com").replace(/\/$/, "");

const organizationSchema = {
  name: "HalDeFiyat",
  url: SITE_URL,
  logo: `${SITE_URL}/logo.png`,
  description: "Türkiye'nin 81 ilindeki hal ve toptancı pazar fiyatlarını günlük olarak izleyen bağımsız veri platformu.",
  contactPoint: {
    "@type": "ContactPoint",
    email: "iletisim@haldefiyat.com",
    contactType: "customer support",
    availableLanguage: "Turkish",
  },
} satisfies Record<string, unknown>;

const webSiteSchema = {
  name: "HalDeFiyat",
  url: SITE_URL,
  description: "Türkiye hal fiyatları — 81 il, 250+ ürün, günlük güncelleme.",
  inLanguage: "tr-TR",
  potentialAction: {
    "@type": "SearchAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate: `${SITE_URL}/fiyatlar?q={search_term_string}`,
    },
    "query-input": "required name=search_term_string",
  },
} satisfies Record<string, unknown>;

const datasetSchema = {
  name: "Türkiye Hal Fiyatları",
  description:
    "Türkiye'nin 81 ilindeki hal ve pazar fiyat verileri. Günlük güncellenir.",
  url: SITE_URL,
  creator: { "@type": "Organization", name: "HalDeFiyat" },
  license: "https://creativecommons.org/licenses/by/4.0/",
  temporalCoverage: "2025/..",
  spatialCoverage: { "@type": "Place", name: "Türkiye" },
  variableMeasured: ["MinFiyat", "MaxFiyat", "OrtalamaFiyat"],
  isAccessibleForFree: true,
} satisfies Record<string, unknown>;

export default async function HomePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const trending = await fetchTrending(50);

  return (
    <>
      <JsonLd type="Organization" data={organizationSchema} />
      <JsonLd type="WebSite" data={webSiteSchema} />
      <JsonLd type="Dataset" data={datasetSchema} />
      <HeroSection />
      <PriceTicker items={trending} />
      <PriceDashboard />
      <CitySelector locale={locale} />
      <StatsBar />
      <IndexCta />
      <SeasonalGuide />
      <FeaturesGrid />
      <HowItWorks />
      <HomeFaq />
      <CtaNewsletter />
    </>
  );
}
