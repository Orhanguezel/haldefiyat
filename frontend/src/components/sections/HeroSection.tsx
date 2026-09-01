import { getTranslations } from "next-intl/server";
import HeroSectionClient from "./HeroSectionClient";
import type { FeaturedPrice } from "@/lib/api";

/**
 * Hero — server wrapper.
 *
 * NEDEN: Server component olarak kalmasi RSC streaming icin onemli.
 * Animasyonlar (framer-motion) icin sadece icerik client componentine bolunur.
 */
export default async function HeroSection({
  activeCities,
  targetCoverage,
  freshness,
  featuredPrice,
}: {
  activeCities?: number;
  targetCoverage?: string;
  freshness?: "fresh" | "stale" | "unknown";
  featuredPrice?: FeaturedPrice;
}) {
  const t = await getTranslations("home.hero");

  return (
    <section
      id="hero"
      className="relative z-10 px-4 pb-12 pt-12 text-center sm:px-8 sm:pb-16 sm:pt-16"
    >
      <HeroSectionClient
        activeCities={activeCities}
        targetCoverage={targetCoverage}
        freshness={freshness}
        featuredPrice={featuredPrice}
        title={t("title")}
        subtitle={t("subtitle")}
      />
    </section>
  );
}
