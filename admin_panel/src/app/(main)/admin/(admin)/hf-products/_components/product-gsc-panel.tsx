"use client";

import { AlertTriangle, CheckCircle2, Globe, HelpCircle, RefreshCw, Search, XCircle } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { GscIndexCategory } from "@/integrations/endpoints/hf-products-admin-endpoints";
import {
  useGetHfProductGscAdminQuery,
  useInspectHfProductGscAdminMutation,
} from "@/integrations/endpoints/hf-products-admin-endpoints";
import { trGscCoverage, trGscVerdict } from "@/integrations/shared";
import { useAdminT } from "../../../_components/common/use-admin-t";

const gscMeta: Record<
  GscIndexCategory,
  { variant: "default" | "secondary" | "destructive" | "outline"; Icon: typeof CheckCircle2 }
> = {
  indexed: { variant: "default", Icon: CheckCircle2 },
  not_indexed: { variant: "secondary", Icon: AlertTriangle },
  issue: { variant: "destructive", Icon: XCircle },
  unknown: { variant: "outline", Icon: HelpCircle },
};

/** Kisa rozet etiketi locale'den gelir (admin.hf-products.gsc.labels.*). */
export const GSC_SHORT_LABEL: Record<GscIndexCategory, string> = {
  indexed: "gsc.labels.indexed",
  not_indexed: "gsc.labels.not_indexed",
  issue: "gsc.labels.issue",
  unknown: "gsc.labels.unknown",
};

export function ProductGscBadge({ category, label }: { category: GscIndexCategory; label: string }) {
  const t = useAdminT("admin.hf-products");
  const meta = gscMeta[category];
  const Icon = meta.Icon;
  const text = label.startsWith("gsc.labels.") ? t(label) : label;
  return (
    <Badge variant={meta.variant} className="gap-1">
      <Icon className="h-3.5 w-3.5" />
      {text}
    </Badge>
  );
}

function formatDateTime(value: string | null): string {
  if (!value) return "—";
  return value.replace("T", " ").slice(0, 16);
}

export function ProductGscPanel({ id, isNew }: { id: string; isNew: boolean }) {
  const t = useAdminT("admin.hf-products.gsc");
  const { data, isFetching, refetch } = useGetHfProductGscAdminQuery({ id }, { skip: isNew });
  const [inspect, { isLoading: inspecting }] = useInspectHfProductGscAdminMutation();

  if (isNew) {
    return (
      <div className="rounded-md border bg-muted/30 p-4 text-sm text-muted-foreground">
        {t("afterSave")}
      </div>
    );
  }

  if (!data) {
    return (
      <div className="rounded-md border p-4 text-sm text-muted-foreground">
        {isFetching ? t("loading") : t("noData")}
      </div>
    );
  }

  const { gsc, seoIndex } = data;
  const isProblem = gsc.category === "issue" || gsc.category === "not_indexed";

  async function handleInspect() {
    try {
      await inspect({ id }).unwrap();
      await refetch();
      toast.success(t("updated"));
    } catch {
      toast.error(t("failed"));
    }
  }

  return (
    <div className="rounded-md border p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 font-medium text-sm">
          <Search className="h-4 w-4" />
          {t("title")}
        </div>
        <Button size="sm" variant="outline" onClick={handleInspect} disabled={inspecting}>
          <RefreshCw className={`mr-1.5 h-4 w-4 ${inspecting ? "animate-spin" : ""}`} />
          {inspecting ? t("inspecting") : t("inspect")}
        </Button>
      </div>

      {isProblem && (
        <div
          className={`mb-3 flex items-start gap-2 rounded-md border p-3 text-sm ${
            gsc.category === "issue"
              ? "border-destructive/40 bg-destructive/10 text-destructive"
              : "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-400"
          }`}
        >
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            <strong>{gsc.category === "issue" ? t("issue") : t("notIndexed")}:</strong>{" "}
            {trGscCoverage(gsc.label)}
            {!seoIndex && t("noindexNote")}
          </span>
        </div>
      )}

      {seoIndex && (gsc.category === "issue" || gsc.category === "not_indexed") && (
        <div className="mb-3 rounded-md border border-sky-500/40 bg-sky-500/10 p-3 text-sm text-sky-700 dark:text-sky-300">
          ℹ️ {t("staleVerdict", { when: gsc.lastCrawl ? ` (${formatDateTime(gsc.lastCrawl)})` : "" })}
        </div>
      )}

      <ProductGscBadge category={gsc.category} label={trGscCoverage(gsc.label)} />

      <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 text-muted-foreground text-xs">
        <dt>{t("verdict")}</dt>
        <dd className="text-right text-foreground">{trGscVerdict(gsc.verdict)}</dd>
        <dt>{t("coverage")}</dt>
        <dd className="text-right text-foreground">{trGscCoverage(gsc.coverageState)}</dd>
        <dt>{t("lastCrawl")}</dt>
        <dd className="text-right text-foreground">{formatDateTime(gsc.lastCrawl)}</dd>
        <dt>{t("lastCheck")}</dt>
        <dd className="text-right text-foreground">{formatDateTime(gsc.checkedAt)}</dd>
        <dt>{t("seoDecision")}</dt>
        <dd className="text-right text-foreground">{seoIndex ? t("seoOn") : t("seoOff")}</dd>
      </dl>

      <div className="mt-3 flex items-center justify-between gap-2 rounded-md bg-muted/30 p-2 text-xs">
        <span className="truncate text-muted-foreground">{gsc.url}</span>
        <a
          href={gsc.url}
          target="_blank"
          rel="noreferrer"
          className="flex shrink-0 items-center gap-1 text-foreground hover:underline"
        >
          <Globe className="h-3.5 w-3.5" /> {t("open")}
        </a>
      </div>

      {!gsc.checked && (
        <p className="mt-2 text-muted-foreground text-xs">
          {t("unchecked")}
        </p>
      )}
    </div>
  );
}
