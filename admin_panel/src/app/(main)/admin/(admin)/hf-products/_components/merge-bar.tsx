"use client";

import { GitMerge, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { HfProductItem } from "@/integrations/endpoints/hf-products-admin-endpoints";
import { productName } from "../_lib/product-meta";
type T = (key: string, params?: Record<string, string | number>, fallback?: string) => string;

type Props = {
  selected: HfProductItem[];
  masterId: string;
  onMaster: (id: string) => void;
  onMerge: () => void;
  onClear: () => void;
  busy: boolean;
  t: T;
  tc: T;
};

/** Iki veya daha fazla urun secilince altta beliren yapiskan birlestirme seridi. */
export function MergeBar({ selected, masterId, onMaster, onMerge, onClear, busy, t, tc }: Props) {
  if (selected.length < 2) return null;
  const masters = selected.filter((item) => !item.canonicalSlug);
  return (
    <div className="sticky bottom-4 z-20 mx-auto flex w-fit max-w-full flex-wrap items-center gap-3 rounded-xl border bg-background/95 p-3 shadow-lg backdrop-blur">
      <span className="flex items-center gap-2 text-sm font-medium">
        <GitMerge className="size-4 text-primary" /> {t("merge.selected", { count: selected.length })}
      </span>
      <Select value={masterId} onValueChange={onMaster}>
        <SelectTrigger className="w-72"><SelectValue placeholder={t("merge.pickMaster")} /></SelectTrigger>
        <SelectContent>
          {masters.map((item) => (
            <SelectItem key={item.id} value={String(item.id)}>{productName(item)} · {item.slug}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button size="sm" onClick={onMerge} disabled={!masterId || busy}>{t("merge.merge")}</Button>
      <Button size="sm" variant="ghost" onClick={onClear}><X className="size-4" /> {tc("giveUp")}</Button>
      <span className="basis-full text-xs text-muted-foreground sm:basis-auto">
        {t("merge.hint")}
      </span>
    </div>
  );
}
