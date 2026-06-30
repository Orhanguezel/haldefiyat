"use client";

import { type ReactNode, useMemo, useState } from "react";

import Link from "next/link";

import { Edit, GitMerge, Plus, RefreshCw, Search } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useListHfProductsAdminQuery, useMergeHfProductsAdminMutation } from "@/integrations/hooks";
import {
  useBulkRefreshHfGscMutation,
  useGetHfGscSummaryQuery,
} from "@/integrations/endpoints/hf-products-admin-endpoints";

import { MergeSuggestionsPanel } from "./_components/merge-suggestions-panel";
import { GSC_SHORT_LABEL, ProductGscBadge } from "./_components/product-gsc-panel";

const ALL = "all";

function qualityVariant(score: number): "default" | "secondary" | "destructive" | "outline" {
  if (score >= 75) return "default";
  if (score >= 45) return "secondary";
  return "destructive";
}

export default function Page() {
  const [q, setQ] = useState("");
  const [category, setCategory] = useState(ALL);
  const [isActive, setIsActive] = useState(ALL);
  const [seoIndex, setSeoIndex] = useState(ALL);
  const [variantFilter, setVariantFilter] = useState(ALL);
  const [gscFilter, setGscFilter] = useState(ALL);
  const [sortKey, setSortKey] = useState<"name" | "category" | "quality" | "search">("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [masterId, setMasterId] = useState<string>("");
  const [merge, mergeState] = useMergeHfProductsAdminMutation();
  const [showSuggestions, setShowSuggestions] = useState(false);
  const { data: gscSummary } = useGetHfGscSummaryQuery(undefined, { pollingInterval: 20000 });
  const [bulkRefreshGsc, bulkState] = useBulkRefreshHfGscMutation();

  const handleBulkGsc = async () => {
    try {
      await bulkRefreshGsc({}).unwrap();
      toast.success("Toplu Google denetimi başladı (arka planda). Birkaç dakika sonra liste dolar.");
    } catch {
      toast.error("Toplu denetim başlatılamadı (zaten çalışıyor olabilir).");
    }
  };

  const query = {
    q: q.trim() || undefined,
    category: category === ALL ? undefined : category,
    isActive: isActive === ALL ? undefined : isActive === "active",
    seoIndex: seoIndex === ALL ? undefined : seoIndex === "index",
  };
  const { data, isLoading, isFetching } = useListHfProductsAdminQuery(query);
  const items = data?.items ?? [];
  const categories = useMemo(
    () => Array.from(new Set(items.map((item) => item.categorySlug).filter(Boolean))).sort(),
    [items],
  );
  const stats = useMemo(() => {
    const indexed = items.filter((item) => Boolean(item.seoIndex)).length;
    const active = items.filter((item) => Boolean(item.isActive)).length;
    const variants = items.filter((item) => Boolean(item.canonicalSlug)).length;
    const avgQuality = items.length
      ? Math.round(items.reduce((sum, item) => sum + Number(item.dataQuality ?? 0), 0) / items.length)
      : 0;
    const gscProblem = items.filter(
      (item) => item.gscCategory === "not_indexed" || item.gscCategory === "issue",
    ).length;
    return { indexed, active, variants, avgQuality, gscProblem };
  }, [items]);

  // slug → ürün (varyantın master'ına admin linki için)
  const bySlug = useMemo(() => new Map(items.map((item) => [item.slug, item])), [items]);

  const sortedItems = useMemo(() => {
    const arr = items.filter((item) => {
      if (variantFilter === "variant" && !item.canonicalSlug) return false;
      if (variantFilter === "master" && item.canonicalSlug) return false;
      if (gscFilter === "indexed" && item.gscCategory !== "indexed") return false;
      if (gscFilter === "not_indexed" && item.gscCategory !== "not_indexed" && item.gscCategory !== "issue")
        return false;
      if (gscFilter === "issue" && item.gscCategory !== "issue") return false;
      if (gscFilter === "unchecked" && item.gscCategory) return false;
      return true;
    });
    arr.sort((a, b) => {
      let cmp = 0;
      if (sortKey === "name")
        cmp = (a.displayName || a.nameTr || "").localeCompare(b.displayName || b.nameTr || "", "tr");
      else if (sortKey === "category") cmp = (a.categorySlug || "").localeCompare(b.categorySlug || "", "tr");
      else if (sortKey === "quality") cmp = Number(a.dataQuality ?? 0) - Number(b.dataQuality ?? 0);
      else cmp = Number(a.searchVolume ?? 0) - Number(b.searchVolume ?? 0);
      return sortDir === "asc" ? cmp : -cmp;
    });
    return arr;
  }, [items, sortKey, sortDir, variantFilter, gscFilter]);

  const toggleSort = (key: typeof sortKey) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir(key === "quality" || key === "search" ? "desc" : "asc");
    }
  };
  const SortHead = ({ k, children, className }: { k: typeof sortKey; children: ReactNode; className?: string }) => (
    <TableHead className={className}>
      <button
        type="button"
        onClick={() => toggleSort(k)}
        className="inline-flex items-center gap-1 hover:text-foreground"
      >
        {children}
        <span className="text-muted-foreground text-xs">{sortKey === k ? (sortDir === "asc" ? "▲" : "▼") : "↕"}</span>
      </button>
    </TableHead>
  );

  const toggleSelect = (id: number) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const selectedList = items.filter((item) => selected.has(item.id));
  const masterOptions = selectedList.filter((item) => !item.canonicalSlug);
  const handleMerge = async () => {
    const mid = Number(masterId);
    if (!mid || selected.size < 2) return;
    const variantIds = [...selected].filter((id) => id !== mid);
    try {
      const res = await merge({ masterId: mid, variantIds }).unwrap();
      toast.success(`${res.merged.length} ürün "${res.master}" altında birleştirildi`);
      setSelected(new Set());
      setMasterId("");
    } catch {
      toast.error("Birleştirme başarısız");
    }
  };

  return (
    <Card className="rounded-lg">
      <CardHeader className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle className="text-base">Hal ürünleri</CardTitle>
            <p className="mt-1 text-muted-foreground text-sm">
              {items.length} ürün · {stats.active} aktif · {stats.indexed} index · {stats.variants} varyant · ortalama
              kalite {stats.avgQuality} · {stats.gscProblem} Google’da indexsiz
            </p>
            {gscSummary && (
              <p className="mt-0.5 text-muted-foreground text-xs">
                GSC önbelleği: {gscSummary.total} URL denetli · {gscSummary.indexed} indexli · {gscSummary.issue} sorunlu
                {gscSummary.lastChecked
                  ? ` · son: ${gscSummary.lastChecked.replace("T", " ").slice(0, 16)}`
                  : ""}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handleBulkGsc}
              disabled={bulkState.isLoading || gscSummary?.running}
              title="Tüm hal URL'lerini Google Search Console'da denetle (tek indirici; sonuç ürün listesine yansır)"
            >
              <RefreshCw className={`mr-2 size-4 ${gscSummary?.running ? "animate-spin" : ""}`} />
              {gscSummary?.running ? "Google denetimi sürüyor…" : "Google: tümünü denetle"}
            </Button>
            <Button
              size="sm"
              variant={showSuggestions ? "secondary" : "outline"}
              onClick={() => setShowSuggestions((v) => !v)}
            >
              <GitMerge className="mr-2 size-4" />
              Birleştirme önerileri
            </Button>
            <Button asChild size="sm">
              <Link href="/admin/hf-products/new">
                <Plus className="mr-2 size-4" />
                Yeni ürün
              </Link>
            </Button>
          </div>
        </div>
        <div className="grid gap-2 md:grid-cols-[minmax(180px,1fr)_140px_130px_130px_140px_150px]">
          <div className="relative">
            <Search className="-translate-y-1/2 pointer-events-none absolute top-1/2 left-3 size-4 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Ad, slug veya görünen ad ara"
              value={q}
              onChange={(event) => setQ(event.target.value)}
            />
          </div>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger>
              <SelectValue placeholder="Kategori" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Tüm kategoriler</SelectItem>
              {categories.map((value) => (
                <SelectItem key={value} value={value}>
                  {value}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={isActive} onValueChange={setIsActive}>
            <SelectTrigger>
              <SelectValue placeholder="Durum" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Tüm durumlar</SelectItem>
              <SelectItem value="active">Aktif</SelectItem>
              <SelectItem value="passive">Pasif</SelectItem>
            </SelectContent>
          </Select>
          <Select value={seoIndex} onValueChange={setSeoIndex}>
            <SelectTrigger>
              <SelectValue placeholder="SEO" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Index + noindex</SelectItem>
              <SelectItem value="index">Index</SelectItem>
              <SelectItem value="noindex">Noindex</SelectItem>
            </SelectContent>
          </Select>
          <Select value={variantFilter} onValueChange={setVariantFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Varyant" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Tümü</SelectItem>
              <SelectItem value="master">Bağımsız / master</SelectItem>
              <SelectItem value="variant">Sadece varyantlar (301)</SelectItem>
            </SelectContent>
          </Select>
          <Select value={gscFilter} onValueChange={setGscFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Google" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Google: tümü</SelectItem>
              <SelectItem value="indexed">İndexli</SelectItem>
              <SelectItem value="not_indexed">İndexsiz / sorun</SelectItem>
              <SelectItem value="issue">Sadece sorun</SelectItem>
              <SelectItem value="unchecked">Denetlenmemiş</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {showSuggestions && <MergeSuggestionsPanel onClose={() => setShowSuggestions(false)} />}
        {selected.size >= 2 && (
          <div className="mb-3 flex flex-wrap items-center gap-2 rounded-md border bg-muted/40 p-2">
            <span className="font-medium text-sm">{selected.size} ürün seçili → birleştir</span>
            <Select value={masterId} onValueChange={setMasterId}>
              <SelectTrigger className="w-72">
                <SelectValue placeholder="Ana ürün (master) seç" />
              </SelectTrigger>
              <SelectContent>
                {masterOptions.map((item) => (
                  <SelectItem key={item.id} value={String(item.id)}>
                    {item.displayName || item.nameTr} ({item.slug})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button size="sm" onClick={handleMerge} disabled={!masterId || mergeState.isLoading}>
              Birleştir
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setSelected(new Set());
                setMasterId("");
              }}
            >
              İptal
            </Button>
            <span className="text-muted-foreground text-xs">
              Seçilenler master'a canonical+noindex bağlanır (301 yönlenir), isimleri alias olur.
            </span>
          </div>
        )}
        <div className="w-full overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8" />
                <SortHead k="name">Ad</SortHead>
                <TableHead>Slug</TableHead>
                <SortHead k="category">Kategori</SortHead>
                <TableHead>Birim</TableHead>
                <SortHead k="quality">Kalite</SortHead>
                <SortHead k="search">Arama</SortHead>
                <TableHead>SEO</TableHead>
                <TableHead>Google</TableHead>
                <TableHead className="w-24 text-right">İşlem</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(isLoading || isFetching) && (
                <TableRow>
                  <TableCell colSpan={10}>Yükleniyor...</TableCell>
                </TableRow>
              )}
              {!isLoading && items.length === 0 && (
                <TableRow>
                  <TableCell colSpan={10}>Kayıt bulunamadı.</TableCell>
                </TableRow>
              )}
              {sortedItems.map((item) => (
                <TableRow key={item.id} data-state={selected.has(item.id) ? "selected" : undefined}>
                  <TableCell>
                    <Checkbox
                      checked={selected.has(item.id)}
                      onCheckedChange={() => toggleSelect(item.id)}
                      aria-label="Seç"
                    />
                  </TableCell>
                  <TableCell>
                    <Link className="text-primary" href={`/admin/hf-products/${item.id}`}>
                      {item.displayName || item.nameTr}
                    </Link>
                  </TableCell>
                  <TableCell className="max-w-[150px] truncate text-muted-foreground" title={item.slug}>
                    {item.slug}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">{item.categorySlug}</TableCell>
                  <TableCell className="max-w-[130px] truncate" title={item.unit ?? ""}>
                    {item.unit}
                  </TableCell>
                  <TableCell>
                    <Badge variant={qualityVariant(Number(item.dataQuality ?? 0))}>{item.dataQuality ?? 0}</Badge>
                  </TableCell>
                  <TableCell>{item.searchVolume ?? 0}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap items-center gap-1">
                      {item.canonicalSlug ? (
                        <span className="inline-flex items-center gap-1 whitespace-nowrap">
                          <Badge variant="secondary">Varyant</Badge>
                          <Link
                            className="text-primary text-xs"
                            href={
                              bySlug.get(item.canonicalSlug)
                                ? `/admin/hf-products/${bySlug.get(item.canonicalSlug)?.id}`
                                : "/admin/hf-products"
                            }
                            title="Master ürüne git"
                          >
                            301 → {item.canonicalSlug}
                          </Link>
                        </span>
                      ) : (
                        <Badge variant={item.seoIndex ? "default" : "outline"}>
                          {item.seoIndex ? "Index" : "Noindex"}
                        </Badge>
                      )}
                      {!item.isActive && <Badge variant="secondary">Pasif</Badge>}
                    </div>
                  </TableCell>
                  <TableCell>
                    {item.gscCategory ? (
                      <ProductGscBadge category={item.gscCategory} label={GSC_SHORT_LABEL[item.gscCategory]} />
                    ) : (
                      <span className="text-muted-foreground text-xs">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button asChild variant="ghost" size="icon">
                      <Link href={`/admin/hf-products/${item.id}`} aria-label="Düzenle">
                        <Edit className="size-4" />
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
