"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { HfProductItem } from "@/integrations/endpoints/hf-products-admin-endpoints";
import { ACTION_META, productName, qualityTone } from "../_lib/product-meta";
import { GSC_SHORT_LABEL, ProductGscBadge } from "./product-gsc-panel";
import { ProductThumb } from "./product-thumb";

function QualityCell({ score }: { score: number }) {
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-14 overflow-hidden rounded-full bg-muted">
        <div className={`h-full ${qualityTone(score)}`} style={{ width: `${Math.max(0, Math.min(100, score))}%` }} />
      </div>
      <span className="w-6 text-right text-sm tabular-nums">{score}</span>
    </div>
  );
}

function StatusCell({ item, masterId }: { item: HfProductItem; masterId?: number }) {
  if (item.canonicalSlug) {
    return (
      <div className="flex flex-wrap items-center gap-1">
        <Badge variant="outline" className="font-normal">Varyant</Badge>
        <Link
          className="max-w-[140px] truncate text-xs text-primary hover:underline"
          href={masterId ? `/admin/hf-products/${masterId}` : "/admin/hf-products"}
          title={`Master: ${item.canonicalSlug}`}
          onClick={(event) => event.stopPropagation()}
        >
          → {item.canonicalSlug}
        </Link>
      </div>
    );
  }
  const expectedExcluded = !item.seoIndex;
  return (
    <div className="flex flex-wrap items-center gap-1">
      <Badge variant={item.seoIndex ? "default" : "outline"} className="font-normal">{item.seoIndex ? "Index" : "Noindex"}</Badge>
      {item.gscCategory ? (
        expectedExcluded && item.gscCategory !== "indexed"
          ? <Badge variant="outline" className="font-normal text-muted-foreground">Google: beklenen</Badge>
          : <ProductGscBadge category={item.gscCategory} label={GSC_SHORT_LABEL[item.gscCategory]} />
      ) : null}
    </div>
  );
}

type Props = {
  items: HfProductItem[];
  loading: boolean;
  selected: Set<number>;
  onToggle: (id: number) => void;
  onToggleAll: (ids: number[], checked: boolean) => void;
  onOpen: (item: HfProductItem) => void;
  bySlug: Map<string, HfProductItem>;
  page: number;
  pageSize: number;
  onPage: (page: number) => void;
};

export function ProductsTable({ items, loading, selected, onToggle, onToggleAll, onOpen, bySlug, page, pageSize, onPage }: Props) {
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const slice = items.slice((page - 1) * pageSize, page * pageSize);
  const allChecked = slice.length > 0 && slice.every((item) => selected.has(item.id));

  if (loading) return <div className="rounded-lg border border-dashed py-16 text-center text-sm text-muted-foreground">Yükleniyor…</div>;
  if (!items.length) return <div className="rounded-lg border border-dashed py-16 text-center text-sm text-muted-foreground">Bu filtrede ürün yok.</div>;

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead className="w-10">
                <Checkbox checked={allChecked} onCheckedChange={(checked) => onToggleAll(slice.map((item) => item.id), Boolean(checked))} aria-label="Sayfadakileri seç" />
              </TableHead>
              <TableHead className="min-w-[280px]">Ürün</TableHead>
              <TableHead className="w-28">Kalite</TableHead>
              <TableHead className="w-20 text-right">Arama</TableHead>
              <TableHead className="w-28">Kapsam (30g)</TableHead>
              <TableHead className="min-w-[200px]">SEO · Google</TableHead>
              <TableHead className="min-w-[160px]">Sonraki adım</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {slice.map((item) => {
              const action = ACTION_META[item.action ?? "variant"];
              return (
                <TableRow
                  key={item.id}
                  data-state={selected.has(item.id) ? "selected" : undefined}
                  className="cursor-pointer"
                  onClick={() => onOpen(item)}
                >
                  <TableCell onClick={(event) => event.stopPropagation()}>
                    <Checkbox checked={selected.has(item.id)} onCheckedChange={() => onToggle(item.id)} aria-label="Seç" />
                  </TableCell>
                  <TableCell className="py-2.5">
                    <div className="flex items-center gap-3">
                      <ProductThumb slug={item.slug} canonicalSlug={item.canonicalSlug} name={productName(item)} imageUrl={item.imageUrl} size={36} />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="truncate font-medium">{productName(item)}</span>
                          {!item.isActive ? <Badge variant="secondary" className="font-normal">pasif</Badge> : null}
                          {item.hasEditorial ? <span className="text-xs text-emerald-600" title="Editoryel yayında">✎</span> : null}
                        </div>
                        <div className="truncate text-xs text-muted-foreground">
                          <span className="font-mono">{item.slug}</span> · {item.categorySlug} · {item.unit}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell><QualityCell score={Number(item.dataQuality ?? 0)} /></TableCell>
                  <TableCell className="text-right tabular-nums">{Number(item.searchVolume ?? 0).toLocaleString("tr-TR")}</TableCell>
                  <TableCell className="text-sm">
                    <span className={Number(item.halMarkets30d ?? 0) >= 3 ? "" : "text-muted-foreground"}>{item.halMarkets30d ?? 0} hal</span>
                    {Number(item.borsaMarkets30d ?? 0) > 0 ? <span className="text-muted-foreground"> · {item.borsaMarkets30d} borsa</span> : null}
                  </TableCell>
                  <TableCell><StatusCell item={item} masterId={item.canonicalSlug ? bySlug.get(item.canonicalSlug)?.id : undefined} /></TableCell>
                  <TableCell>
                    {item.action === "variant" ? <span className="text-xs text-muted-foreground">—</span> : (
                      <Badge variant={action.variant} title={action.hint} className="whitespace-nowrap font-normal">{action.label}</Badge>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between gap-3 text-sm text-muted-foreground">
        <span>{items.length.toLocaleString("tr-TR")} ürün · sayfa {page} / {totalPages}</span>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => onPage(page - 1)}><ChevronLeft className="size-4" /> Önceki</Button>
          <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => onPage(page + 1)}>Sonraki <ChevronRight className="size-4" /></Button>
        </div>
      </div>
    </div>
  );
}
