"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useListHfProductsAdminQuery, useMergeHfProductsAdminMutation } from "@/integrations/hooks";
import {
  type HfProductItem,
  useBulkRefreshHfGscMutation,
  useGetHfGscSummaryQuery,
  useRunHfSeoMaintenanceMutation,
} from "@/integrations/endpoints/hf-products-admin-endpoints";
import { MergeBar } from "./_components/merge-bar";
import { MergeSuggestionsPanel } from "./_components/merge-suggestions-panel";
import { ProductSheet } from "./_components/product-sheet";
import { ProductsOverview } from "./_components/products-overview";
import { ProductsTable } from "./_components/products-table";
import { ProductsToolbar } from "./_components/products-toolbar";
import { ALL, applyLocalFilters, EMPTY_FILTERS, type Filters, sortItems, summarize } from "./_lib/product-meta";

const PAGE_SIZE = 50;

function useDebounced<T>(value: T, ms: number) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => { const t = setTimeout(() => setDebounced(value), ms); return () => clearTimeout(t); }, [value, ms]);
  return debounced;
}

export default function Page() {
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [masterId, setMasterId] = useState("");
  const [openId, setOpenId] = useState<number | null>(null);
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);

  const q = useDebounced(filters.q, 300);
  const { data, isLoading } = useListHfProductsAdminQuery({
    q: q.trim() || undefined,
    category: filters.category === ALL ? undefined : filters.category,
    isActive: filters.status === ALL ? undefined : filters.status === "active",
    seoIndex: filters.seo === ALL ? undefined : filters.seo === "index",
  });
  const { data: gscSummary } = useGetHfGscSummaryQuery(undefined, { pollingInterval: 20000 });
  const [merge, mergeState] = useMergeHfProductsAdminMutation();
  const [bulkRefreshGsc, bulkState] = useBulkRefreshHfGscMutation();
  const [runMaintenance, maintenanceState] = useRunHfSeoMaintenanceMutation();

  const items = data?.items ?? [];
  const categories = useMemo(() => Array.from(new Set(items.map((i) => i.categorySlug).filter(Boolean))).sort(), [items]);
  const bySlug = useMemo(() => new Map(items.map((i) => [i.slug, i])), [items]);
  const stats = useMemo(() => summarize(items), [items]);
  const visible = useMemo(() => sortItems(applyLocalFilters(items, filters), filters.sort), [items, filters]);
  // Panel, liste yeniden cekildiginde guncel satiri gostersin (kayit sonrasi rozetler eskimesin).
  const open = useMemo(() => (openId == null ? null : items.find((i) => i.id === openId) ?? null), [items, openId]);

  useEffect(() => { setPage(1); }, [filters, q]);

  const patch = (next: Partial<Filters>) => setFilters((prev) => ({ ...prev, ...next }));
  const selectedItems = items.filter((i) => selected.has(i.id));

  async function handleMerge() {
    const mid = Number(masterId);
    if (!mid || selected.size < 2) return;
    try {
      const res = await merge({ masterId: mid, variantIds: [...selected].filter((id) => id !== mid) }).unwrap();
      toast.success(`${res.merged.length} ürün "${res.master}" altında birleştirildi.`);
      setSelected(new Set()); setMasterId("");
    } catch { toast.error("Birleştirme başarısız."); }
  }

  async function handleMaintenance() {
    try {
      const r = await runMaintenance().unwrap();
      toast.success(`SEO bakımı: ${r.flippedUp} hal + ${r.flippedUpBorsa} borsa + ${r.flippedUpRetail} market + ${r.flippedUpNiche} niş index'e alındı, ${r.demoted} düşürüldü.`);
    } catch { toast.error("SEO bakımı çalıştırılamadı."); }
  }

  async function handleBulkGsc() {
    try {
      await bulkRefreshGsc({}).unwrap();
      toast.success("Toplu Google denetimi arka planda başladı. Birkaç dakika sonra liste dolar.");
    } catch { toast.error("Toplu denetim başlatılamadı, zaten çalışıyor olabilir."); }
  }

  return (
    <div className="space-y-4 pb-24">
      <div>
        <h1 className="text-xl font-semibold">Hal ürünleri</h1>
        <p className="text-sm text-muted-foreground">
          {isLoading ? "Yükleniyor…" : `${stats.total.toLocaleString("tr-TR")} ürün · ${stats.withEditorial} editoryel yayında · ortalama kalite ${Math.round(items.reduce((s, i) => s + Number(i.dataQuality ?? 0), 0) / (items.length || 1))}`}
        </p>
      </div>

      <ProductsOverview stats={stats} filters={filters} onFilter={patch} gsc={gscSummary} />

      <ProductsToolbar
        filters={filters}
        onChange={patch}
        categories={categories}
        onBulkGsc={handleBulkGsc}
        onMaintenance={handleMaintenance}
        onSuggestions={() => setSuggestionsOpen(true)}
        gscRunning={Boolean(bulkState.isLoading || gscSummary?.running)}
        maintenanceRunning={maintenanceState.isLoading}
      />

      <ProductsTable
        items={visible}
        loading={isLoading}
        selected={selected}
        onToggle={(id) => setSelected((prev) => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n; })}
        onToggleAll={(ids, checked) => setSelected((prev) => { const n = new Set(prev); ids.forEach((id) => (checked ? n.add(id) : n.delete(id))); return n; })}
        onOpen={(item: HfProductItem) => setOpenId(item.id)}
        bySlug={bySlug}
        page={page}
        pageSize={PAGE_SIZE}
        onPage={setPage}
      />

      <MergeBar
        selected={selectedItems}
        masterId={masterId}
        onMaster={setMasterId}
        onMerge={handleMerge}
        onClear={() => { setSelected(new Set()); setMasterId(""); }}
        busy={mergeState.isLoading}
      />

      <ProductSheet item={open} categories={categories} onClose={() => setOpenId(null)} />

      <Sheet open={suggestionsOpen} onOpenChange={setSuggestionsOpen}>
        <SheetContent side="right" className="w-full overflow-y-auto p-4 sm:max-w-3xl">
          <SheetHeader className="sr-only"><SheetTitle>Birleştirme önerileri</SheetTitle></SheetHeader>
          <MergeSuggestionsPanel onClose={() => setSuggestionsOpen(false)} />
        </SheetContent>
      </Sheet>
    </div>
  );
}
