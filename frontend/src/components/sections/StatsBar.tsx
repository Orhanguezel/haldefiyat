import StatsBarClient from "./StatsBarClient";

/**
 * Stats bar — server wrapper.
 *
 * NEDEN: Statik veri server'da kalir, sadece counter animasyonu icin
 * client component'e bolunur. Bundle minimize.
 */
export default function StatsBar() {
  return (
    <section className="relative z-10 px-8 pb-20">
      <StatsBarClient />
    </section>
  );
}
