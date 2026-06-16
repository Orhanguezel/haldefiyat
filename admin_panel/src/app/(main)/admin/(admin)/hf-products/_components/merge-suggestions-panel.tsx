"use client";

import { useState } from "react";

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
  size: number;
  master: MergeCandidate;
  variants: MergeCandidate[];
};

// Bir aile (kök isim) = aynı üründen tüm dağınık varyantlar. Aile içinde birden çok çeşit
// olabilir (marul → kıvırcık/aysberg/lolorosso). Bu yüzden tek seferde değil, tekrarlı
// alt-birleştirme: bir çeşit grubunu seç + master belirle + birleştir; kalanlar listede durur.
function MergeFamily({ cluster }: { cluster: Cluster }) {
  const [members, setMembers] = useState<MergeCandidate[]>(() => [cluster.master, ...cluster.variants]);
  const [selected, setSelected] = useState<Set<number>>(() => new Set());
  const [masterId, setMasterId] = useState<number | null>(null);
  const [merge, mergeState] = useMergeHfProductsAdminMutation();
  const [mergedCount, setMergedCount] = useState(0);

  const toggle = (id: number) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const selectAll = () => setSelected(new Set(members.map((m) => m.id)));
  const clearAll = () => {
    setSelected(new Set());
    setMasterId(null);
  };

  // Etkin master: seçilenler içinde elle seçilmiş varsa o; yoksa en çok hal'li seçili üye.
  const selectedMembers = members.filter((m) => selected.has(m.id));
  const effectiveMaster =
    (masterId && selected.has(masterId) ? masterId : null) ??
    (selectedMembers.length ? selectedMembers.reduce((a, b) => (Number(b.hal) > Number(a.hal) ? b : a)).id : null);
  const variantIds = [...selected].filter((id) => id !== effectiveMaster);

  const handleMerge = async () => {
    if (!effectiveMaster || variantIds.length < 1) return;
    try {
      const res = await merge({ masterId: effectiveMaster, variantIds }).unwrap();
      const mergedSet = new Set(variantIds);
      setMembers((prev) => prev.filter((m) => !mergedSet.has(m.id))); // master kalır, varyantlar düşer
      setMergedCount((c) => c + res.merged.length);
      clearAll();
      toast.success(`${res.merged.length} ürün "${res.master}" altında birleştirildi`);
    } catch {
      toast.error("Birleştirme başarısız");
    }
  };

  return (
    <div className="rounded-md border p-3">
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <span className="font-mono text-muted-foreground text-xs">[{cluster.signature}]</span>
        <span className="text-muted-foreground text-xs">{members.length} üye kaldı</span>
        {mergedCount > 0 && (
          <span className="text-emerald-600 text-xs dark:text-emerald-400">✓ {mergedCount} birleşti</span>
        )}
        <div className="ml-auto flex items-center gap-1.5">
          <Button size="sm" variant="ghost" onClick={selected.size ? clearAll : selectAll}>
            {selected.size ? "Temizle" : "Tümünü seç"}
          </Button>
          <Button size="sm" onClick={handleMerge} disabled={variantIds.length < 1 || mergeState.isLoading}>
            Birleştir ({variantIds.length})
          </Button>
        </div>
      </div>
      {members.length < 2 ? (
        <p className="text-muted-foreground text-sm">Aile temiz — tek master kaldı.</p>
      ) : (
        <ul className="space-y-1">
          {members.map((m) => {
            const isMaster = m.id === effectiveMaster;
            const isChecked = selected.has(m.id);
            return (
              <li key={m.id} className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={isChecked}
                  onCheckedChange={() => toggle(m.id)}
                  aria-label="Birleştirmeye dahil et"
                />
                <button
                  type="button"
                  onClick={() => isChecked && setMasterId(m.id)}
                  className={`rounded px-1.5 py-0.5 text-xs ${isMaster ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}
                  title="Ana ürün (master) yap — seçili üyeler buna 301'lenir"
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
      )}
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
            Kök isme göre <b>aile</b> bazında gruplanmış varyantlar (marul → kıvırcık/aysberg/lolorosso hepsi tek
            ailede). Bir ailede birden çok çeşit olabilir: aynı çeşidi/dublikeleri seç, en çok hal'liyi master yap,
            birleştir; kalanlar listede durur, başka bir çeşidi ayrıca birleştir. Farklı çeşitleri aynı master altında
            <b> toplama</b> (örn. fuji ≠ granny, aysberg ≠ kıvırcık).
          </p>
        </div>
        <Button size="sm" variant="ghost" onClick={onClose}>
          Kapat
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {(isLoading || isFetching) && <p className="text-muted-foreground text-sm">Aileler hesaplanıyor...</p>}
        {!isLoading && clusters.length === 0 && <p className="text-muted-foreground text-sm">Aile bulunamadı.</p>}
        {clusters.map((cluster) => (
          <MergeFamily key={cluster.signature} cluster={cluster} />
        ))}
      </CardContent>
    </Card>
  );
}
