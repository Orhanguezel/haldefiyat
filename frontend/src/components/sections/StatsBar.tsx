import StatsBarClient from "./StatsBarClient";
import type { Stat } from "./StatsBarClient";

/**
 * Stats bar — server wrapper.
 *
 * NEDEN: Dinamik veri server'da hesaplanir, sadece counter animasyonu icin
 * client component'e bolunur. Bundle minimize.
 */
interface StatsBarProps {
  stats: Stat[];
}

export default function StatsBar({ stats }: StatsBarProps) {
  return (
    <section className="relative z-0 clear-both px-6 py-20 lg:px-8">
      <StatsBarClient stats={stats} />
    </section>
  );
}
