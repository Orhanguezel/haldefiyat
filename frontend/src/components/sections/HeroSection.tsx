import { getTranslations } from "next-intl/server";
import HeroSectionClient from "./HeroSectionClient";

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
}: {
  activeCities?: number;
  targetCoverage?: string;
  freshness?: "fresh" | "stale" | "unknown";
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
        title={t("title")}
        subtitle={t("subtitle")}
      />
    </section>
  );
}
