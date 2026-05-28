"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";

export interface NumericStat {
  kind: "number";
  value: number;
  suffix?: string;
  label: string;
}

export interface StaticStat {
  kind: "static";
  display: string;
  label: string;
}

export type Stat = NumericStat | StaticStat;

const COUNT_DURATION_MS = 1600;

/**
 * Hook: viewport'a girince target'a kadar say.
 *
 * NEDEN: Tek requestAnimationFrame loop, ease-out cubic — performansli ve
 * jank'siz. Library bagimliligi yok.
 */
function useCountUp(target: number, active: boolean): number {
  // Initialize with target so SSR + initial render show the correct value.
  // The animation resets to 0 only when inView fires — at that point the
  // Framer fade-in is running (opacity 0→1), so the reset is invisible.
  const [value, setValue] = useState(target);
  const startedRef = useRef(false);

  useEffect(() => {
    if (!active || startedRef.current) return;
    startedRef.current = true;
    setValue(0);

    let frame = 0;
    const start = performance.now();

    const tick = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / COUNT_DURATION_MS, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(target * eased));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [active, target]);

  return value;
}

interface StatItemProps {
  stat: Stat;
  active: boolean;
  delay: number;
}

function StatItem({ stat, active, delay }: StatItemProps) {
  const numericTarget = stat.kind === "number" ? stat.value : 0;
  const counted = useCountUp(numericTarget, active && stat.kind === "number");

  const display =
    stat.kind === "number"
      ? `${counted.toLocaleString("tr-TR")}${stat.suffix ?? ""}`
      : stat.display;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={active ? { opacity: 1, y: 0 } : undefined}
      transition={{ duration: 0.6, delay, ease: [0.25, 0.1, 0.25, 1] }}
      className="text-center"
    >
      <div className="mb-1 bg-gradient-to-br from-(--color-brand) to-lime-300 bg-clip-text font-(family-name:--font-display) text-[32px] font-black tracking-[-0.03em] text-transparent sm:text-[42px]">
        {display}
      </div>
      <div className="text-[14px] font-medium text-(--color-muted)">
        {stat.label}
      </div>
    </motion.div>
  );
}

export default function StatsBarClient({ stats }: { stats: Stat[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px 0px" });

  return (
    <div
      ref={ref}
      className="mx-auto grid max-w-7xl grid-cols-1 gap-6 rounded-[20px] border border-(--color-border) p-8 sm:grid-cols-2 sm:p-12 2xl:grid-cols-4"
      style={{
        background:
          "linear-gradient(135deg, var(--color-bg-alt), var(--color-surface))",
      }}
    >
      {stats.map((stat, idx) => (
        <StatItem
          key={stat.label}
          stat={stat}
          active={inView}
          delay={idx * 0.08}
        />
      ))}
    </div>
  );
}
