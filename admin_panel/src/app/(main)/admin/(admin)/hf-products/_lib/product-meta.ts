import type { HfProductAction, HfProductItem } from "@/integrations/endpoints/hf-products-admin-endpoints";

export const ALL = "all";

export type BadgeVariant = "default" | "secondary" | "destructive" | "outline";

/** Backend'in urettigi "sonraki adim" kodu icin etiket, renk ve aciklama. */
export const ACTION_META: Record<HfProductAction, { label: string; variant: BadgeVariant; hint: string }> = {
  indexed: { label: "İndexli", variant: "default", hint: "Google'da indexli, aksiyon yok" },
  recrawl_pending: { label: "Yeniden tarama bekliyor", variant: "secondary", hint: "Index'e alındı; Google yeniden taramalı" },
  ready_editorial: { label: "Editoryel yaz", variant: "destructive", hint: "Veri yeterli; editöryel yazınca index'lenir" },
  maintenance_pending: { label: "Bakım bekliyor", variant: "secondary", hint: "Kriterleri karşılıyor; SEO bakımı çalıştır" },
  needs_coverage: { label: "Veri bekliyor", variant: "outline", hint: "Editöryel var ama hal kapsamı yetersiz" },
  seasonal_dry: { label: "Sezon dışı", variant: "outline", hint: "Son 30 günde fiyat yok; sezon dönünce açılır" },
  variant: { label: "Varyant", variant: "outline", hint: "Master'a 301 yönlenir, aksiyon yok" },
};

/** Firsat sirasi: en yuksek getirili aksiyon en ustte. */
export const ACTION_RANK: Record<HfProductAction, number> = {
  ready_editorial: 0,
  maintenance_pending: 1,
  needs_coverage: 2,
  recrawl_pending: 3,
  seasonal_dry: 4,
  indexed: 5,
  variant: 6,
};

export function qualityVariant(score: number): BadgeVariant {
  if (score >= 75) return "default";
  if (score >= 45) return "secondary";
  return "destructive";
}

export function qualityTone(score: number) {
  if (score >= 75) return "bg-emerald-500";
  if (score >= 45) return "bg-amber-500";
  return "bg-rose-500";
}

export function productName(item: HfProductItem) {
  return item.displayName || item.nameTr;
}

/** Indexlenebilir (seoIndex acik, master) ama Google'da yok ya da sorunlu. */
export function isGscActionable(item: HfProductItem) {
  return Boolean(item.seoIndex) && !item.canonicalSlug &&
    (item.gscCategory === "not_indexed" || item.gscCategory === "issue");
}

export type SortKey = "opportunity" | "name" | "category" | "quality" | "search" | "coverage";

export const SORT_OPTIONS: Array<{ value: SortKey; label: string }> = [
  { value: "opportunity", label: "Fırsat sırası" },
  { value: "search", label: "En çok aranan" },
  { value: "quality", label: "Kalite puanı" },
  { value: "coverage", label: "Hal kapsamı" },
  { value: "name", label: "Ad (A→Z)" },
  { value: "category", label: "Kategori" },
];

export type Filters = {
  q: string;
  category: string;
  status: string;      // all | active | passive
  seo: string;         // all | index | noindex
  variant: string;     // all | master | variant
  gsc: string;         // all | actionable | indexed | not_indexed | issue | unchecked
  action: string;      // all | <HfProductAction>
  sort: SortKey;
};

export const EMPTY_FILTERS: Filters = {
  q: "", category: ALL, status: ALL, seo: ALL, variant: ALL, gsc: ALL, action: ALL, sort: "opportunity",
};

export const FILTER_LABELS: Record<string, Record<string, string>> = {
  status: { active: "Aktif", passive: "Pasif" },
  seo: { index: "Index", noindex: "Noindex" },
  variant: { master: "Bağımsız / master", variant: "Sadece varyantlar" },
  gsc: {
    actionable: "Google'da yok (indexlenebilir)",
    indexed: "Google: indexli",
    not_indexed: "Google: indexsiz / sorun",
    issue: "Google: sadece sorun",
    unchecked: "Google: denetlenmemiş",
  },
  action: Object.fromEntries(Object.entries(ACTION_META).map(([key, meta]) => [key, meta.label])),
};

export function applyLocalFilters(items: HfProductItem[], f: Filters) {
  return items.filter((item) => {
    if (f.variant === "variant" && !item.canonicalSlug) return false;
    if (f.variant === "master" && item.canonicalSlug) return false;
    if (f.gsc === "actionable" && !isGscActionable(item)) return false;
    if (f.gsc === "indexed" && item.gscCategory !== "indexed") return false;
    if (f.gsc === "not_indexed" && item.gscCategory !== "not_indexed" && item.gscCategory !== "issue") return false;
    if (f.gsc === "issue" && item.gscCategory !== "issue") return false;
    if (f.gsc === "unchecked" && item.gscCategory) return false;
    if (f.action !== ALL && item.action !== f.action) return false;
    return true;
  });
}

export function sortItems(items: HfProductItem[], sort: SortKey) {
  const arr = [...items];
  arr.sort((a, b) => {
    switch (sort) {
      case "opportunity": {
        const rank = ACTION_RANK[a.action ?? "variant"] - ACTION_RANK[b.action ?? "variant"];
        return rank !== 0 ? rank : Number(b.searchVolume ?? 0) - Number(a.searchVolume ?? 0);
      }
      case "search": return Number(b.searchVolume ?? 0) - Number(a.searchVolume ?? 0);
      case "quality": return Number(b.dataQuality ?? 0) - Number(a.dataQuality ?? 0);
      case "coverage": return Number(b.halMarkets30d ?? 0) - Number(a.halMarkets30d ?? 0);
      case "category": return (a.categorySlug || "").localeCompare(b.categorySlug || "", "tr");
      default: return productName(a).localeCompare(productName(b), "tr");
    }
  });
  return arr;
}

export function summarize(items: HfProductItem[]) {
  const count = (fn: (item: HfProductItem) => boolean) => items.filter(fn).length;
  return {
    total: items.length,
    active: count((i) => Boolean(i.isActive)),
    indexed: count((i) => Boolean(i.seoIndex) && !i.canonicalSlug),
    variants: count((i) => Boolean(i.canonicalSlug)),
    editorialReady: count((i) => i.action === "ready_editorial"),
    maintenance: count((i) => i.action === "maintenance_pending"),
    needsCoverage: count((i) => i.action === "needs_coverage"),
    gscProblem: count(isGscActionable),
    withEditorial: count((i) => Boolean(i.hasEditorial)),
  };
}
