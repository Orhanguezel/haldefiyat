"use client";

import { RefreshCw } from "lucide-react";
import type { HfGscSummary } from "@/integrations/endpoints/hf-products-admin-endpoints";
import type { Filters } from "../_lib/product-meta";
import { ALL, summarize } from "../_lib/product-meta";
type T = (key: string, params?: Record<string, string | number>, fallback?: string) => string;

type Stats = ReturnType<typeof summarize>;

type Tile = {
  key: string;
  value: number;
  hint: string;
  tone?: "accent" | "warn" | "danger";
  filter?: Partial<Filters>;
};

function tiles(stats: Stats, t: T): Tile[] {
  return [
    { key: "total", value: stats.total, hint: t("tiles.totalHint", { active: stats.active }), filter: {} },
    { key: "indexable", value: stats.indexed, hint: t("tiles.indexableHint"), tone: "accent", filter: { seo: "index", variant: "master" } },
    { key: "editorial", value: stats.editorialReady, hint: t("tiles.editorialHint"), tone: stats.editorialReady ? "danger" : undefined, filter: { action: "ready_editorial" } },
    { key: "maintenance", value: stats.maintenance, hint: t("tiles.maintenanceHint"), tone: stats.maintenance ? "warn" : undefined, filter: { action: "maintenance_pending" } },
    { key: "coverage", value: stats.needsCoverage, hint: t("tiles.coverageHint"), filter: { action: "needs_coverage" } },
    { key: "gsc", value: stats.gscProblem, hint: t("tiles.gscHint"), tone: stats.gscProblem ? "warn" : undefined, filter: { gsc: "actionable" } },
    { key: "variants", value: stats.variants, hint: t("tiles.variantsHint"), filter: { variant: "variant" } },
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
  t: T;
};

function tileActive(tile: Tile, filters: Filters) {
  if (!tile.filter) return false;
  const keys = Object.keys(tile.filter) as Array<keyof Filters>;
  if (!keys.length) return false;
  return keys.every((key) => filters[key] === tile.filter?.[key]);
}

export function ProductsOverview({ stats, filters, onFilter, gsc, t }: Props) {
  return (
    <div className="space-y-2">
      <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">
        {tiles(stats, t).map((tile) => {
          const active = tileActive(tile, filters);
          const isReset = tile.filter && Object.keys(tile.filter).length === 0;
          return (
            <button
              key={tile.key}
              type="button"
              onClick={() => onFilter(isReset ? { seo: ALL, variant: ALL, action: ALL, gsc: ALL } : (tile.filter ?? {}))}
              className={`rounded-lg border p-3 text-left transition hover:border-primary/40 ${active ? "border-primary bg-primary/5" : "bg-background"}`}
            >
              <div className="text-xs text-muted-foreground">{t(`tiles.${tile.key}`)}</div>
              <div className={`text-2xl font-semibold tabular-nums ${tile.tone ? TONE[tile.tone] : ""}`}>{tile.value}</div>
              <div className="truncate text-xs text-muted-foreground">{tile.hint}</div>
            </button>
          );
        })}
      </div>
      {gsc ? (
        <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          {gsc.running ? <RefreshCw className="size-3 animate-spin text-primary" /> : null}
          <span>{t("gscLine.cache", { count: gsc.total })}</span>
          <span>{t("gscLine.indexed", { count: gsc.indexed })}</span>
          <span className={gsc.realIssue > 0 ? "font-medium text-amber-600" : ""}>{t("gscLine.realIssue", { count: gsc.realIssue })}</span>
          <span title={t("gscLine.awaitingHint")}>{t("gscLine.awaiting", { count: gsc.awaitingRecrawl ?? 0 })}</span>
          <span>{t("gscLine.excluded", { count: gsc.expectedExcluded })}</span>
          {gsc.lastChecked ? <span>{t("gscLine.last", { date: gsc.lastChecked.replace("T", " ").slice(0, 16) })}</span> : null}
        </p>
      ) : null}
    </div>
  );
}
