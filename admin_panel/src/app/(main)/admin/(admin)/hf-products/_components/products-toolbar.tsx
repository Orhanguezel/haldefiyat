"use client";

import Link from "next/link";
import { ClipboardList, GitMerge, MoreHorizontal, Plus, RefreshCw, Search, SlidersHorizontal, Wrench, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ACTION_META, ALL, EMPTY_FILTERS, FILTER_LABELS, SORT_OPTIONS, type Filters, type SortKey } from "../_lib/product-meta";

type Props = {
  filters: Filters;
  onChange: (patch: Partial<Filters>) => void;
  categories: string[];
  onBulkGsc: () => void;
  onMaintenance: () => void;
  onSuggestions: () => void;
  gscRunning: boolean;
  maintenanceRunning: boolean;
};

const ADVANCED: Array<{ key: keyof Filters; label: string; options: Array<{ value: string; label: string }> }> = [
  { key: "status", label: "Durum", options: [{ value: "active", label: "Aktif" }, { value: "passive", label: "Pasif" }] },
  { key: "seo", label: "SEO kararı", options: [{ value: "index", label: "Index" }, { value: "noindex", label: "Noindex" }] },
  { key: "variant", label: "Varyant", options: [{ value: "master", label: "Bağımsız / master" }, { value: "variant", label: "Sadece varyantlar (301)" }] },
  {
    key: "gsc", label: "Google",
    options: [
      { value: "actionable", label: "İndexlenebilir ama Google'da yok" },
      { value: "indexed", label: "İndexli" },
      { value: "not_indexed", label: "İndexsiz / sorun" },
      { value: "issue", label: "Sadece sorun" },
      { value: "unchecked", label: "Denetlenmemiş" },
    ],
  },
  {
    key: "action", label: "Sonraki adım",
    options: (Object.keys(ACTION_META) as Array<keyof typeof ACTION_META>)
      .filter((key) => key !== "variant")
      .map((key) => ({ value: key, label: ACTION_META[key].label })),
  },
];

export function ProductsToolbar({ filters, onChange, categories, onBulkGsc, onMaintenance, onSuggestions, gscRunning, maintenanceRunning }: Props) {
  const activeAdvanced = ADVANCED.filter((entry) => filters[entry.key] !== ALL);
  const chips = [
    ...(filters.category !== ALL ? [{ key: "category" as keyof Filters, label: filters.category }] : []),
    ...activeAdvanced.map((entry) => ({ key: entry.key, label: FILTER_LABELS[entry.key]?.[filters[entry.key]] ?? filters[entry.key] })),
  ];

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-9" placeholder="Ad, slug veya görünen ad ara" value={filters.q} onChange={(event) => onChange({ q: event.target.value })} />
        </div>

        <Select value={filters.category} onValueChange={(value) => onChange({ category: value })}>
          <SelectTrigger className="w-44"><SelectValue placeholder="Kategori" /></SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Tüm kategoriler</SelectItem>
            {categories.map((value) => <SelectItem key={value} value={value}>{value}</SelectItem>)}
          </SelectContent>
        </Select>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline">
              <SlidersHorizontal className="size-4" /> Filtreler
              {activeAdvanced.length ? <Badge className="ml-1 h-5 min-w-5 justify-center px-1.5">{activeAdvanced.length}</Badge> : null}
            </Button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-80 space-y-3">
            {ADVANCED.map((entry) => (
              <div key={entry.key} className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">{entry.label}</Label>
                <Select value={filters[entry.key]} onValueChange={(value) => onChange({ [entry.key]: value } as Partial<Filters>)}>
                  <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL}>Tümü</SelectItem>
                    {entry.options.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            ))}
            <Button size="sm" variant="ghost" className="w-full" onClick={() => onChange({ ...EMPTY_FILTERS, q: filters.q, sort: filters.sort })}>
              Filtreleri temizle
            </Button>
          </PopoverContent>
        </Popover>

        <Select value={filters.sort} onValueChange={(value) => onChange({ sort: value as SortKey })}>
          <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}
          </SelectContent>
        </Select>

        <div className="ml-auto flex items-center gap-2">
          <Button variant="outline" onClick={onSuggestions}><GitMerge className="size-4" /> Birleştirme önerileri</Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" aria-label="Diğer işlemler"><MoreHorizontal className="size-4" /></Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-72">
              <DropdownMenuLabel>Toplu işlemler</DropdownMenuLabel>
              <DropdownMenuItem disabled={gscRunning} onClick={onBulkGsc}>
                <RefreshCw className={`size-4 ${gscRunning ? "animate-spin" : ""}`} />
                <div>
                  <div>{gscRunning ? "Google denetimi sürüyor…" : "Google: tümünü denetle"}</div>
                  <div className="text-xs text-muted-foreground">Tüm ürün URL'lerini Search Console'da yoklar</div>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem disabled={maintenanceRunning} onClick={onMaintenance}>
                <Wrench className="size-4" />
                <div>
                  <div>SEO bakımı</div>
                  <div className="text-xs text-muted-foreground">Kaliteyi yeniden hesaplar, kriteri karşılayanı index'e alır</div>
                </div>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/admin/hf-products/review"><ClipboardList className="size-4" /> Eşleme kuyruğu</Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button asChild><Link href="/admin/hf-products/new"><Plus className="size-4" /> Yeni ürün</Link></Button>
        </div>
      </div>

      {chips.length ? (
        <div className="flex flex-wrap items-center gap-1.5">
          {chips.map((chip) => (
            <Badge key={chip.key} variant="secondary" className="gap-1 pr-1 font-normal">
              {chip.label}
              <button type="button" className="rounded-sm hover:bg-foreground/10" onClick={() => onChange({ [chip.key]: ALL } as Partial<Filters>)} aria-label="Filtreyi kaldır">
                <X className="size-3" />
              </button>
            </Badge>
          ))}
        </div>
      ) : null}
    </div>
  );
}
