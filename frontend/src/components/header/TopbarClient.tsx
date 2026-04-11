"use client";

import { useEffect, useState } from "react";

/**
 * NEDEN: SSR'da `new Date()` server saatini gosterir, hydration mismatch yaratir.
 * Bu yuzden saat/tarih sadece client'ta render edilir; SSR'da placeholder gider.
 */
export default function TopbarClient() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const id = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(id);
  }, []);

  const time = now
    ? now.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })
    : "--:--";

  const date = now
    ? now.toLocaleDateString("tr-TR", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "";

  return (
    <div className="hidden md:flex h-12 items-center justify-between text-[12px] text-(--color-muted)">
      <div className="flex items-center gap-5">
        <span className="flex items-center gap-2 font-mono text-(--color-brand)">
          <span className="live-dot" aria-hidden />
          Canlı Veri
        </span>
        <span className="text-(--color-faint)">|</span>
        <span>
          İzlenen: <span className="text-(--color-foreground)">2,480 ürün</span>
        </span>
        <span className="text-(--color-faint)">|</span>
        <span>
          Son güncelleme:{" "}
          <span className="font-mono text-(--color-foreground)">{time}</span>
        </span>
      </div>
      <div className="font-mono text-(--color-foreground)" suppressHydrationWarning>
        {date}
      </div>
    </div>
  );
}
