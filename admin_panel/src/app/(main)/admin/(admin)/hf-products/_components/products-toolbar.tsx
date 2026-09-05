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
import { ACTION_KEYS, ALL, EMPTY_FILTERS, SORT_KEYS, type Filters, type SortKey } from "../_lib/product-meta";
type T = (key: string, params?: Record<string, string | number>, fallback?: string) => string;

type Props = {
  filters: Filters;
  onChange: (patch: Partial<Filters>) => void;
  categories: string[];
  onBulkGsc: () => void;
  onMaintenance: () => void;
  onSuggestions: () => void;
  gscRunning: boolean;
  maintenanceRunning: boolean;
  t: T;
  tc: T;
};

// Secenek etiketleri: options.<value> (gsc icin options.gsc<Value>), cip etiketleri chips.*
const GSC_OPTIONS = ["actionable", "indexed", "not_indexed", "issue", "unchecked"];
const gscKey = (v: string) => "gsc" + v.split("_").map((p) => p[0].toUpperCase() + p.slice(1)).join("");
const ADVANCED: Array<{ key: keyof Filters; labelKey: string; options: string[]; optionLabel: (v: string, t: T) => string }> = [
  { key: "status", labelKey: "filters.status", options: ["active", "passive"], optionLabel: (v, t) => t(`filters.options.${v}`) },
  { key: "seo", labelKey: "filters.seo", options: ["index", "noindex"], optionLabel: (v, t) => t(`filters.options.${v}`) },
  { key: "variant", labelKey: "filters.variant", options: ["master", "variant"], optionLabel: (v, t) => t(`filters.options.${v}`) },
  { key: "gsc", labelKey: "filters.google", options: GSC_OPTIONS, optionLabel: (v, t) => t(`filters.options.${gscKey(v)}`) },
  { key: "action", labelKey: "filters.nextStep", options: ACTION_KEYS.filter((k) => k !== "variant"), optionLabel: (v, t) => t(`actions.${v}`) },
];

export function ProductsToolbar({ filters, onChange, categories, onBulkGsc, onMaintenance, onSuggestions, gscRunning, maintenanceRunning, t, tc }: Props) {
  const activeAdvanced = ADVANCED.filter((entry) => filters[entry.key] !== ALL);
  const chips = [
    ...(filters.category !== ALL ? [{ key: "category" as keyof Filters, label: filters.category }] : []),
    ...activeAdvanced.map((entry) => ({
      key: entry.key,
      label: entry.key === "gsc" ? t(`filters.chips.${gscKey(filters.gsc)}`) : entry.optionLabel(filters[entry.key], t),
    })),
  ];

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-9" placeholder={t("filters.search")} value={filters.q} onChange={(event) => onChange({ q: event.target.value })} />
        </div>

        <Select value={filters.category} onValueChange={(value) => onChange({ category: value })}>
          <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>{t("filters.allCategories")}</SelectItem>
            {categories.map((value) => <SelectItem key={value} value={value}>{value}</SelectItem>)}
          </SelectContent>
        </Select>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline">
              <SlidersHorizontal className="size-4" /> {tc("filters")}
              {activeAdvanced.length ? <Badge className="ml-1 h-5 min-w-5 justify-center px-1.5">{activeAdvanced.length}</Badge> : null}
            </Button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-80 space-y-3">
            {ADVANCED.map((entry) => (
              <div key={entry.key} className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">{t(entry.labelKey)}</Label>
                <Select value={filters[entry.key]} onValueChange={(value) => onChange({ [entry.key]: value } as Partial<Filters>)}>
                  <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL}>{tc("all")}</SelectItem>
                    {entry.options.map((option) => <SelectItem key={option} value={option}>{entry.optionLabel(option, t)}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            ))}
            <Button size="sm" variant="ghost" className="w-full" onClick={() => onChange({ ...EMPTY_FILTERS, q: filters.q, sort: filters.sort })}>
              {tc("clearFilters")}
            </Button>
          </PopoverContent>
        </Popover>

        <Select value={filters.sort} onValueChange={(value) => onChange({ sort: value as SortKey })}>
          <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            {SORT_KEYS.map((key) => <SelectItem key={key} value={key}>{t(`sort.${key}`)}</SelectItem>)}
          </SelectContent>
        </Select>

        <div className="ml-auto flex items-center gap-2">
          <Button variant="outline" onClick={onSuggestions}><GitMerge className="size-4" /> {t("toolbar.suggestions")}</Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" aria-label={t("toolbar.more")}><MoreHorizontal className="size-4" /></Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-72">
              <DropdownMenuLabel>{t("toolbar.bulkTitle")}</DropdownMenuLabel>
              <DropdownMenuItem disabled={gscRunning} onClick={onBulkGsc}>
                <RefreshCw className={`size-4 ${gscRunning ? "animate-spin" : ""}`} />
                <div>
                  <div>{gscRunning ? t("toolbar.gscRunning") : t("toolbar.gscRun")}</div>
                  <div className="text-xs text-muted-foreground">{t("toolbar.gscHint")}</div>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem disabled={maintenanceRunning} onClick={onMaintenance}>
                <Wrench className="size-4" />
                <div>
                  <div>{t("toolbar.maintenance")}</div>
                  <div className="text-xs text-muted-foreground">{t("toolbar.maintenanceHint")}</div>
                </div>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/admin/hf-products/review"><ClipboardList className="size-4" /> {t("toolbar.reviewQueue")}</Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button asChild><Link href="/admin/hf-products/new"><Plus className="size-4" /> {t("toolbar.newProduct")}</Link></Button>
        </div>
      </div>

      {chips.length ? (
        <div className="flex flex-wrap items-center gap-1.5">
          {chips.map((chip) => (
            <Badge key={chip.key} variant="secondary" className="gap-1 pr-1 font-normal">
              {chip.label}
              <button type="button" className="rounded-sm hover:bg-foreground/10" onClick={() => onChange({ [chip.key]: ALL } as Partial<Filters>)} aria-label={tc("clear")}>
                <X className="size-3" />
              </button>
            </Badge>
          ))}
        </div>
      ) : null}
    </div>
  );
}
