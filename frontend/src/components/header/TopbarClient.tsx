"use client";

import { useEffect, useState } from "react";

type Props = {
  trackedProducts?: number;
  latestRecordedDate?: string | null;
};

/**
 * "İzlenen ürün" + "Son veri" GERÇEK veriden (server prop) gelir — hard-code yok, saat de değil.
 * Sağdaki güncel tarih client'ta render edilir (hydration mismatch'i önlemek için).
 */
export default function TopbarClient({ trackedProducts, latestRecordedDate }: Props) {
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

  const lastUpdateLabel = latestRecordedDate
    ? new Date(latestRecordedDate + "T12:00:00").toLocaleDateString("tr-TR", {
        day: "numeric",
        month: "long",
      })
    : "—";

  return (
    <div className="hidden md:flex h-12 items-center justify-between text-[12px] text-(--color-muted)">
      <div className="flex items-center gap-5">
        <span className="flex items-center gap-2 font-mono text-(--color-brand)">
          <span className="live-dot" aria-hidden />
          Canlı Veri
        </span>
        <span className="text-(--color-faint)">|</span>
        <span>
          İzlenen: <span className="text-(--color-foreground)">{trackedLabel}</span>
        </span>
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
