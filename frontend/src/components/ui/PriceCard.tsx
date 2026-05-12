import Link from "next/link";
import type { PriceRow } from "@/lib/api";
import { getEmoji } from "@/lib/emoji";
import FavoriteButton from "@/components/ui/FavoriteButton";

interface PriceCardProps {
  row: PriceRow;
  changePct?: number;
}

type Trend = "up" | "down" | "stable";

function trendOf(changePct: number | undefined): Trend {
  if (changePct === undefined || changePct === 0 || Number.isNaN(changePct)) {
    return "stable";
  }
  return changePct > 0 ? "up" : "down";
}

function fmt(value: string | null | undefined): string {
  if (value == null || value === "") return "—";
  const n = parseFloat(value);
  if (!Number.isFinite(n)) return "—";
  return n.toLocaleString("tr-TR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

const BADGE_CLASS: Record<Trend, string> = {
  up:     "bg-(--color-success-bg) text-(--color-success)",
  down:   "bg-(--color-danger-bg) text-(--color-danger)",
  stable: "bg-(--color-info-bg) text-(--color-info)",
};

const BADGE_LABEL: Record<Trend, string> = {
  up:     "▲ Yükseliş",
  down:   "▼ Düşüş",
  stable: "■ Sabit",
};

const CHANGE_CLASS: Record<Trend, string> = {
  up:     "text-(--color-success)",
  down:   "text-(--color-danger)",
  stable: "text-(--color-muted)",
};

const SPARK_STROKE: Record<Trend, string> = {
  up:     "var(--success)",
  down:   "var(--danger)",
  stable: "var(--info)",
};

/**
 * Statik placeholder sparkline. Gercek price history sonraki sprintte
 * fetchPriceHistory ile beslenecek.
 */
function PlaceholderSpark({ trend }: { trend: Trend }) {
  const linePath =
    trend === "up"
      ? "M2 32 L18 28 L34 30 L50 22 L66 18 L82 12 L98 8"
      : trend === "down"
      ? "M2 8 L18 14 L34 12 L50 20 L66 24 L82 30 L98 34"
      : "M2 20 L18 22 L34 18 L50 22 L66 19 L82 21 L98 20";
  const areaPath = `${linePath} L98 40 L2 40 Z`;
  const stroke = SPARK_STROKE[trend];
  return (
    <svg
      viewBox="0 0 100 40"
      preserveAspectRatio="none"
      className="h-10 w-full"
      aria-hidden
    >
      <path d={areaPath} fill={stroke} opacity={0.15} />
      <path
        d={linePath}
        fill="none"
        stroke={stroke}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function PriceCard({ row, changePct }: PriceCardProps) {
  const trend = trendOf(changePct);
  const emoji = getEmoji(row.productSlug, row.categorySlug);
  const sign = changePct !== undefined && changePct > 0 ? "+" : "";

  return (
    <div className="group relative overflow-hidden rounded-[16px] border border-(--color-border) bg-(--color-surface) p-6 transition-all duration-300 hover:-translate-y-1 hover:border-(--color-brand)/30 shadow-(--shadow-card)">

      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-[16px] opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background:
            "linear-gradient(135deg, transparent 40%, var(--brand-light))",
        }}
      />
      <div className="relative">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="text-[28px] shrink-0" aria-hidden>
              {emoji}
            </span>
            <div className="min-w-0">
              <Link href={`/urun/${row.productSlug}`} className="block truncate text-[15px] font-bold text-(--color-foreground) hover:text-(--color-brand) transition-colors">
                {row.productName}
              </Link>
              <div className="mt-px truncate text-[11px] text-(--color-muted)">
                <Link href={`/hal/${row.marketSlug}`} className="hover:text-(--color-brand) transition-colors font-medium">
                  {row.marketName}
                </Link>
                <span className="mx-1">·</span>
                <span className="font-semibold text-(--color-brand)/80">{row.cityName}</span>
              </div>
            </div>
          </div>
          <span
            className={
              "rounded-[5px] px-2 py-0.5 font-(family-name:--font-mono) text-[10px] font-semibold uppercase tracking-[0.05em] " +
              BADGE_CLASS[trend]
            }
          >
            {BADGE_LABEL[trend]}
          </span>
        </div>

        <div className="mb-1.5 flex items-baseline gap-2">
          <span className="font-(family-name:--font-mono) text-[30px] font-bold tracking-[-0.02em] text-(--color-foreground)">
            ₺{fmt(row.avgPrice)}
          </span>
          <span className="font-(family-name:--font-mono) text-[13px] text-(--color-muted)">
            /{row.unit || "kg"}
          </span>
        </div>

        {changePct !== undefined && changePct !== 0 ? (
          <div
            className={
              "mb-4 font-(family-name:--font-mono) text-[13px] font-semibold " +
              CHANGE_CLASS[trend]
            }
          >
            {trend === "up" ? "▲ " : "▼ "}
            {sign}
            {changePct.toFixed(2)}%
          </div>
        ) : (
          <div className="mb-4 h-[19px]" aria-hidden />
        )}

        <div className="overflow-hidden rounded-md bg-(--color-bg-alt)">
          <PlaceholderSpark trend={trend} />
        </div>

        <div className="mt-3 flex items-center justify-between gap-2 text-[11px] text-(--color-muted)">
          {(fmt(row.minPrice) !== "—" || fmt(row.maxPrice) !== "—") ? (
            <span className="truncate">
              min ₺{fmt(row.minPrice)} · max ₺{fmt(row.maxPrice)}
            </span>
          ) : (
            <span className="truncate text-(--color-muted)/40">yalnızca ort. fiyat mevcut</span>
          )}
          <div className="relative z-20 shrink-0">
            <FavoriteButton
              slug={row.productSlug}
              productName={row.productName}
              variant="icon"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
