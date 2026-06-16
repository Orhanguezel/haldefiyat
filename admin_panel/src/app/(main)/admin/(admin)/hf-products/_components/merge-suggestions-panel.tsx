"use client";

import { useMemo, useState } from "react";

import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { useGetMergeSuggestionsAdminQuery, useMergeHfProductsAdminMutation } from "@/integrations/hooks";

type MergeCandidate = {
  id: number;
  slug: string;
  nameTr: string;
  displayName: string | null;
  seoIndex: number;
  dataQuality: number;
  searchVolume: number;
  hal: number;
};

type Cluster = {
  signature: string;
  master: MergeCandidate;
  variants: MergeCandidate[];
};

function MergeCluster({ cluster }: { cluster: Cluster }) {
  const members = useMemo(() => [cluster.master, ...cluster.variants], [cluster]);
  const [masterId, setMasterId] = useState(cluster.master.id);
  // Varsayılan: tüm üyeler seçili. Kullanıcı farklı çeşitleri (fuji vs granny) çıkarır.
  const [checked, setChecked] = useState<Set<number>>(() => new Set(members.map((m) => m.id)));
  const [merge, mergeState] = useMergeHfProductsAdminMutation();
  const [done, setDone] = useState<string | null>(null);

  const toggle = (id: number) =>
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const variantIds = [...checked].filter((id) => id !== masterId);

  const handleMerge = async () => {
    if (!checked.has(masterId) || variantIds.length < 1) return;
    try {
      const res = await merge({ masterId, variantIds }).unwrap();
      setDone(`${res.merged.length} ürün "${res.master}" altında birleştirildi`);
      toast.success(`${res.merged.length} ürün birleştirildi`);
    } catch {
      toast.error("Birleştirme başarısız");
    }
  };

  if (done) {
    return (
      <div className="rounded-md border border-emerald-300 bg-emerald-50 p-3 text-emerald-800 text-sm dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
        ✓ {done}
      </div>
    );
  }

  return (
    <div className="rounded-md border p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="font-mono text-muted-foreground text-xs">[{cluster.signature}]</span>
        <Button size="sm" onClick={handleMerge} disabled={variantIds.length < 1 || mergeState.isLoading}>
          Birleştir ({variantIds.length})
        </Button>
      </div>
      <ul className="space-y-1">
        {members.map((m) => {
          const isMaster = m.id === masterId;
          const isChecked = checked.has(m.id);
          return (
            <li key={m.id} className="flex items-center gap-2 text-sm">
              <Checkbox checked={isChecked} onCheckedChange={() => toggle(m.id)} aria-label="Birleştirmeye dahil et" />
              <button
                type="button"
                onClick={() => isChecked && setMasterId(m.id)}
                className={`rounded px-1.5 py-0.5 text-xs ${isMaster ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}
                title="Ana ürün (master) yap"
              >
                {isMaster ? "★ master" : "master yap"}
              </button>
              <span className={isMaster ? "font-medium" : ""}>{m.displayName || m.nameTr}</span>
              <span className="text-muted-foreground text-xs">/{m.slug}</span>
              <span className="ml-auto flex items-center gap-1.5 text-muted-foreground text-xs">
                <span title="Son 30 günde fiyat veren hal sayısı">{m.hal} hal</span>
                <Badge variant={m.seoIndex ? "default" : "outline"} className="text-[10px]">
                  {m.seoIndex ? "index" : "noindex"}
                </Badge>
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function MergeSuggestionsPanel({ onClose }: { onClose: () => void }) {
  const { data, isLoading, isFetching } = useGetMergeSuggestionsAdminQuery();
  const clusters = data?.clusters ?? [];

  return (
    <Card className="mb-4 rounded-lg border-amber-300 dark:border-amber-800">
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
        <div>
          <CardTitle className="text-base">Birleştirme önerileri</CardTitle>
          <p className="mt-1 text-muted-foreground text-sm">
            İsim benzerliğiyle kümelenmiş dublike adayları. Her kümede gerçek dublikeleri bırak, farklı çeşitleri (örn.
            elma fuji ≠ granny) işaretten çıkar; en çok hal'de görünen master önerilir.
          </p>
        </div>
        <Button size="sm" variant="ghost" onClick={onClose}>
          Kapat
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {(isLoading || isFetching) && <p className="text-muted-foreground text-sm">Öneriler hesaplanıyor...</p>}
        {!isLoading && clusters.length === 0 && <p className="text-muted-foreground text-sm">Öneri bulunamadı.</p>}
        {clusters.map((cluster) => (
          <MergeCluster key={cluster.signature} cluster={cluster} />
        ))}
      </CardContent>
    </Card>
  );
}
