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
}: {
  activeCities?: number;
  targetCoverage?: string;
}) {
  const t = await getTranslations("home.hero");

  return (
    <section
      id="hero"
      className="relative z-10 px-8 pt-[100px] pb-20 text-center"
    >
      <HeroSectionClient
        activeCities={activeCities}
        targetCoverage={targetCoverage}
        title={t("title")}
        subtitle={t("subtitle")}
      />
    </section>
  );
}
