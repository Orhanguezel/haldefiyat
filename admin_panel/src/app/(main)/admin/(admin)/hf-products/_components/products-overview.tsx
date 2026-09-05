"use client";

import { RefreshCw } from "lucide-react";
import type { HfGscSummary } from "@/integrations/endpoints/hf-products-admin-endpoints";
import type { Filters } from "../_lib/product-meta";
import { ALL, summarize } from "../_lib/product-meta";

type Stats = ReturnType<typeof summarize>;

type Tile = {
  key: string;
  label: string;
  value: number;
  hint: string;
  tone?: "accent" | "warn" | "danger";
  filter?: Partial<Filters>;
};

function tiles(stats: Stats): Tile[] {
  return [
    { key: "total", label: "Ürün", value: stats.total, hint: `${stats.active} aktif`, filter: {} },
    { key: "indexed", label: "İndexlenebilir", value: stats.indexed, hint: "SEO index açık, master", tone: "accent", filter: { seo: "index", variant: "master" } },
    { key: "editorial", label: "Editoryel yazılacak", value: stats.editorialReady, hint: "veri hazır, yazınca indexlenir", tone: stats.editorialReady ? "danger" : undefined, filter: { action: "ready_editorial" } },
    { key: "maintenance", label: "Bakım bekliyor", value: stats.maintenance, hint: "kriter tamam, bakım çalıştır", tone: stats.maintenance ? "warn" : undefined, filter: { action: "maintenance_pending" } },
    { key: "coverage", label: "Veri bekliyor", value: stats.needsCoverage, hint: "hal kapsamı yetersiz", filter: { action: "needs_coverage" } },
    { key: "gsc", label: "Google'da yok", value: stats.gscProblem, hint: "indexlenebilir ama görünmüyor", tone: stats.gscProblem ? "warn" : undefined, filter: { gsc: "actionable" } },
    { key: "variants", label: "Varyant", value: stats.variants, hint: "master'a 301", filter: { variant: "variant" } },
  ];
}

const TONE: Record<NonNullable<Tile["tone"]>, string> = {
  accent: "text-primary",
  warn: "text-amber-600",
  danger: "text-rose-600",
};

type Props = {
  stats: Stats;
  filters: Filters;
  onFilter: (patch: Partial<Filters>) => void;
  gsc?: HfGscSummary;
};

function tileActive(tile: Tile, filters: Filters) {
  if (!tile.filter) return false;
  const keys = Object.keys(tile.filter) as Array<keyof Filters>;
  if (!keys.length) return false;
  return keys.every((key) => filters[key] === tile.filter?.[key]);
}

export function ProductsOverview({ stats, filters, onFilter, gsc }: Props) {
  return (
    <div className="space-y-2">
      <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">
        {tiles(stats).map((tile) => {
          const active = tileActive(tile, filters);
          const isReset = tile.filter && Object.keys(tile.filter).length === 0;
          return (
            <button
              key={tile.key}
              type="button"
              onClick={() => onFilter(isReset ? { seo: ALL, variant: ALL, action: ALL, gsc: ALL } : (tile.filter ?? {}))}
              className={`rounded-lg border p-3 text-left transition hover:border-primary/40 ${active ? "border-primary bg-primary/5" : "bg-background"}`}
            >
              <div className="text-xs text-muted-foreground">{tile.label}</div>
              <div className={`text-2xl font-semibold tabular-nums ${tile.tone ? TONE[tile.tone] : ""}`}>{tile.value}</div>
              <div className="truncate text-xs text-muted-foreground">{tile.hint}</div>
            </button>
          );
        })}
      </div>
      {gsc ? (
        <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          {gsc.running ? <RefreshCw className="size-3 animate-spin text-primary" /> : null}
          <span>Google önbelleği: {gsc.total} URL</span>
          <span>{gsc.indexed} indexli</span>
          <span className={gsc.realIssue > 0 ? "font-medium text-amber-600" : ""}>{gsc.realIssue} gerçek sorun</span>
          <span title="Google en son sayfayı biz index'e almadan önce taramış. Sayfa canlıda doğru; yeniden taranmasını bekliyor.">
            {gsc.awaitingRecrawl ?? 0} yeniden tarama bekliyor
          </span>
          <span>{gsc.expectedExcluded} beklenen dışlama</span>
          {gsc.lastChecked ? <span>son denetim {gsc.lastChecked.replace("T", " ").slice(0, 16)}</span> : null}
        </p>
      ) : null}
    </div>
  );
}
