"use client";

import { GitMerge, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { HfProductItem } from "@/integrations/endpoints/hf-products-admin-endpoints";
import { productName } from "../_lib/product-meta";

type Props = {
  selected: HfProductItem[];
  masterId: string;
  onMaster: (id: string) => void;
  onMerge: () => void;
  onClear: () => void;
  busy: boolean;
};

/** Iki veya daha fazla urun secilince altta beliren yapiskan birlestirme seridi. */
export function MergeBar({ selected, masterId, onMaster, onMerge, onClear, busy }: Props) {
  if (selected.length < 2) return null;
  const masters = selected.filter((item) => !item.canonicalSlug);
  return (
    <div className="sticky bottom-4 z-20 mx-auto flex w-fit max-w-full flex-wrap items-center gap-3 rounded-xl border bg-background/95 p-3 shadow-lg backdrop-blur">
      <span className="flex items-center gap-2 text-sm font-medium">
        <GitMerge className="size-4 text-primary" /> {selected.length} ürün seçili
      </span>
      <Select value={masterId} onValueChange={onMaster}>
        <SelectTrigger className="w-72"><SelectValue placeholder="Ana ürün (master) seç" /></SelectTrigger>
        <SelectContent>
          {masters.map((item) => (
            <SelectItem key={item.id} value={String(item.id)}>{productName(item)} · {item.slug}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button size="sm" onClick={onMerge} disabled={!masterId || busy}>Birleştir</Button>
      <Button size="sm" variant="ghost" onClick={onClear}><X className="size-4" /> Vazgeç</Button>
      <span className="basis-full text-xs text-muted-foreground sm:basis-auto">
        Seçilenler master'a canonical + noindex bağlanır, 301 yönlenir, adları alias olur.
      </span>
    </div>
  );
}
