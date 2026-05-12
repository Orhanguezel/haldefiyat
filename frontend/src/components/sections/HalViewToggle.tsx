"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import type { Market } from "@/lib/api";
import { LayoutGrid, Map } from "lucide-react";

const TurkeyMapClient = dynamic(
  () => import("@/components/sections/TurkeyMapClient"),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[540px] items-center justify-center rounded-2xl border border-(--color-border) bg-(--color-surface) text-[13px] text-(--color-muted)">
        Harita yükleniyor…
      </div>
    ),
  },
);

interface Props {
  markets: Market[];
  children: React.ReactNode;
}

export default function HalViewToggle({ markets, children }: Props) {
  const [view, setView] = useState<"list" | "map">("list");

  return (
    <div>
      {/* Toggle */}
      <div className="mb-8 flex items-center gap-2">
        <div className="inline-flex items-center rounded-[10px] border border-(--color-border) bg-(--color-bg-alt) p-1 gap-1">
          <button
            onClick={() => setView("list")}
            className={
              "flex items-center gap-1.5 rounded-[8px] px-3 py-1.5 text-[13px] font-medium transition-all " +
              (view === "list"
                ? "bg-(--color-surface) text-(--color-foreground) shadow-sm"
                : "text-(--color-muted) hover:text-(--color-foreground)")
            }
          >
            <LayoutGrid className="h-3.5 w-3.5" />
            Liste
          </button>
          <button
            onClick={() => setView("map")}
            className={
              "flex items-center gap-1.5 rounded-[8px] px-3 py-1.5 text-[13px] font-medium transition-all " +
              (view === "map"
                ? "bg-(--color-surface) text-(--color-foreground) shadow-sm"
                : "text-(--color-muted) hover:text-(--color-foreground)")
            }
          >
            <Map className="h-3.5 w-3.5" />
            Harita
          </button>
        </div>
      </div>

      {view === "list" ? (
        <>{children}</>
      ) : (
        <div className="h-[540px] sm:h-[620px]">
          <TurkeyMapClient markets={markets} />
        </div>
      )}
    </div>
  );
}
