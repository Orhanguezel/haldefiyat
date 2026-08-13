"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Props = {
  trackedProducts?: number;
  activeCities?: number;
  targetCoverage?: string;
  latestRecordedDate?: string | null;
  freshness?: "fresh" | "stale" | "unknown";
};

/**
 * "İzlenen ürün" + "Son veri" GERÇEK veriden (server prop) gelir — hard-code yok, saat de değil.
 * Sağdaki güncel tarih client'ta render edilir (hydration mismatch'i önlemek için).
 */
export default function TopbarClient({ trackedProducts, activeCities, targetCoverage, latestRecordedDate, freshness = "unknown" }: Props) {
  const [today, setToday] = useState<string>("");

  useEffect(() => {
    setToday(
      new Date().toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" }),
    );
  }, []);

  const trackedLabel =
    typeof trackedProducts === "number" && trackedProducts > 0
      ? `${trackedProducts.toLocaleString("tr-TR")} ürün`
      : "—";

  const date = latestRecordedDate ? new Date(latestRecordedDate + "T12:00:00") : null;
  const lastUpdateLabel = date && !Number.isNaN(date.getTime())
    ? date.toLocaleDateString("tr-TR", { day: "numeric", month: "long" })
    : "—";
  const cityLabel =
    typeof activeCities === "number" && activeCities > 0
      ? `${activeCities.toLocaleString("tr-TR")} aktif il`
      : targetCoverage || "81 il hedef";
  const freshnessLabel = freshness === "fresh" ? "Güncel veri" : freshness === "stale" ? "Gecikmeli veri" : "Tazelik bilinmiyor";
  const freshnessClass = freshness === "fresh" ? "text-(--color-brand)" : freshness === "stale" ? "text-amber-700 dark:text-amber-300" : "text-(--color-muted)";

  return (
    <div className="hidden md:flex h-12 items-center justify-between text-[12px] text-(--color-muted)">
      <div className="flex items-center gap-5">
        <Link href="/metodoloji" className={`flex items-center gap-2 font-mono hover:underline ${freshnessClass}`} title="Veri tazeliği metodolojisi">
          <span className="live-dot" aria-hidden />
          {freshnessLabel}
        </Link>
        <span className="text-(--color-faint)">|</span>
        <span>
          İzlenen: <span className="text-(--color-foreground)">{trackedLabel}</span>
        </span>
        <span className="text-(--color-faint)">|</span>
        <span className="text-(--color-foreground)">{cityLabel}</span>
        <span className="text-(--color-faint)">|</span>
        <span>
          Son veri:{" "}
          <span className="font-mono text-(--color-foreground)">{lastUpdateLabel}</span>
        </span>
      </div>
      <div className="font-mono text-(--color-foreground)" suppressHydrationWarning>
        {today}
      </div>
    </div>
  );
}
