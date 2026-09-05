"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Maximize2, Save } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  type HfProductEditorialItem,
  useGetHfProductEditorialAdminQuery,
  useUpdateHfProductEditorialAdminMutation,
} from "@/integrations/endpoints/hf-products-admin-endpoints";
import {
  countWords, EDITORIAL_FIELDS, EDITORIAL_SOURCES, type EditorialFieldKey, qualityTone, scoreEditorial, splitCsv,
} from "../_lib/product-meta";
import { useAdminT } from "../../../_components/common/use-admin-t";

type Form = Record<EditorialFieldKey, string> & {
  relatedSlugs: string; source: HfProductEditorialItem["source"]; reviewedBy: string; published: boolean;
};

const EMPTY: Form = {
  aboutMd: "", priceFactorsMd: "", seasonMd: "", productionRegionMd: "", qualityIndicatorsMd: "", culinaryUsesMd: "",
  relatedSlugs: "", source: "manual", reviewedBy: "", published: false,
};

function fromApi(data: HfProductEditorialItem): Form {
  return {
    aboutMd: data.aboutMd ?? "", priceFactorsMd: data.priceFactorsMd ?? "", seasonMd: data.seasonMd ?? "",
    productionRegionMd: data.productionRegionMd ?? "", qualityIndicatorsMd: data.qualityIndicatorsMd ?? "",
    culinaryUsesMd: data.culinaryUsesMd ?? "", relatedSlugs: (data.relatedSlugs ?? []).join(", "),
    source: data.source ?? "manual", reviewedBy: data.reviewedBy ?? "", published: Boolean(data.publishedAt),
  };
}

export function ProductEditorialTab({ productId }: { productId: number }) {
  const t = useAdminT("admin.hf-products.editorial");
  const { data, isLoading, isError } = useGetHfProductEditorialAdminQuery(productId);
  const [save, saveState] = useUpdateHfProductEditorialAdminMutation();
  const [form, setForm] = useState<Form>(EMPTY);
  const [expanded, setExpanded] = useState<EditorialFieldKey | null>(null);

  useEffect(() => { setForm(data ? fromApi(data) : EMPTY); }, [data]);

  const score = useMemo(() => scoreEditorial(form), [form]);
  const set = <K extends keyof Form>(key: K, value: Form[K]) => setForm((prev) => ({ ...prev, [key]: value }));

  async function handleSave() {
    try {
      await save({
        id: productId,
        body: {
          aboutMd: form.aboutMd, priceFactorsMd: form.priceFactorsMd, seasonMd: form.seasonMd,
          productionRegionMd: form.productionRegionMd,
          qualityIndicatorsMd: form.qualityIndicatorsMd || null, culinaryUsesMd: form.culinaryUsesMd || null,
          relatedSlugs: splitCsv(form.relatedSlugs), source: form.source,
          reviewedBy: form.reviewedBy.trim() || null, published: form.published,
        },
      }).unwrap();
      toast.success(t("saved"));
    } catch {
      toast.error(t("saveFailed"));
    }
  }

  if (isLoading) return <p className="text-sm text-muted-foreground">{t("loading")}</p>;

  const isEmpty = !data || (isError && !data);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3">
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="font-medium">{t("quality")}</span>
          <span className="tabular-nums">{score}/100</span>
          <div className="h-1.5 w-24 overflow-hidden rounded-full bg-muted"><div className={`h-full ${qualityTone(score)}`} style={{ width: `${score}%` }} /></div>
          {data?.publishedAt ? <Badge className="font-normal">{t("live")}</Badge> : <Badge variant="outline" className="font-normal">{isEmpty ? t("none") : t("draft")}</Badge>}
          {data ? <Badge variant="secondary" className="font-normal">{t(`sources.${data.source}`, undefined, data.source)}</Badge> : null}
          {data?.reviewedBy ? <span className="text-xs text-muted-foreground">{t("reviewedBy", { name: data.reviewedBy })}</span> : null}
        </div>
        <Button asChild size="sm" variant="ghost">
          <Link href={`/admin/hf-products/${productId}?tab=editorial`}><Maximize2 className="size-3.5" /> {t("wideEditor")}</Link>
        </Button>
      </div>

      {isEmpty ? (
        <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
          {t("empty")}
        </p>
      ) : null}

      <div className="grid gap-3">
        {EDITORIAL_FIELDS.map((field) => {
          const words = countWords(form[field.key]);
          const target = field.required ? 35 : 15;
          const open = expanded === field.key;
          return (
            <div key={field.key} className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-sm">{t(`fields.${field.key}`)}{field.required ? "" : <span className="ml-1 text-xs text-muted-foreground">{t("optional")}</span>}</Label>
                <button type="button" className={`text-xs ${words >= target ? "text-emerald-600" : "text-muted-foreground"}`} onClick={() => setExpanded(open ? null : field.key)}>
                  {t("words", { count: words, target, toggle: open ? t("collapse") : t("expand") })}
                </button>
              </div>
              <Textarea rows={open ? 12 : 4} value={form[field.key]} onChange={(e) => set(field.key, e.target.value)} className="text-sm leading-relaxed" />
            </div>
          );
        })}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5 sm:col-span-2">
          <Label className="text-sm">{t("related")}</Label>
          <Input value={form.relatedSlugs} onChange={(e) => set("relatedSlugs", e.target.value)} className="font-mono text-xs" placeholder={t("relatedPlaceholder")} />
          {splitCsv(form.relatedSlugs).length ? (
            <div className="flex flex-wrap gap-1">{splitCsv(form.relatedSlugs).map((slug) => <Badge key={slug} variant="outline" className="font-mono font-normal">{slug}</Badge>)}</div>
          ) : null}
        </div>
        <div className="space-y-1.5">
          <Label className="text-sm">{t("source")}</Label>
          <Select value={form.source} onValueChange={(v) => set("source", v as Form["source"])}>
            <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              {EDITORIAL_SOURCES.map((key) => <SelectItem key={key} value={key}>{t(`sources.${key}`)}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-sm">{t("reviewer")}</Label>
          <Input value={form.reviewedBy} onChange={(e) => set("reviewedBy", e.target.value)} />
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 rounded-lg border p-3">
        <label className="flex items-center gap-2 text-sm"><Switch checked={form.published} onCheckedChange={(v) => set("published", v)} /> {t("published")}</label>
        <Button size="sm" onClick={handleSave} disabled={saveState.isLoading}><Save className="size-4" /> {saveState.isLoading ? t("saving", undefined, "…") : t("save")}</Button>
      </div>
    </div>
  );
}
