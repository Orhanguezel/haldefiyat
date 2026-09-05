import type { HfProductAction, HfProductItem } from "@/integrations/endpoints/hf-products-admin-endpoints";

export const ALL = "all";

export type BadgeVariant = "default" | "secondary" | "destructive" | "outline";

/** Backend'in urettigi "sonraki adim" kodu icin rozet rengi; etiket ve aciklama locale'den (actions.*, actionHints.*). */
export const ACTION_VARIANT: Record<HfProductAction, BadgeVariant> = {
  indexed: "default", recrawl_pending: "secondary", ready_editorial: "destructive",
  maintenance_pending: "secondary", needs_coverage: "outline", seasonal_dry: "outline", variant: "outline",
};
export const ACTION_KEYS = Object.keys(ACTION_VARIANT) as HfProductAction[];

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

export const SORT_KEYS: SortKey[] = ["opportunity", "search", "quality", "coverage", "name", "category"];

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

/** Editoryel alanlar — tam sayfa editoru ile panel ayni listeyi kullanir. */
export const EDITORIAL_FIELDS = [
  { key: "aboutMd", required: true },
  { key: "priceFactorsMd", required: true },
  { key: "seasonMd", required: true },
  { key: "productionRegionMd", required: true },
  { key: "qualityIndicatorsMd", required: false },
  { key: "culinaryUsesMd", required: false },
] as const;

export type EditorialFieldKey = (typeof EDITORIAL_FIELDS)[number]["key"];

export const EDITORIAL_SOURCES = ["manual", "ai_draft", "ai_reviewed"] as const;

export function splitCsv(value: string) {
  return value.split(",").map((item) => item.trim()).filter(Boolean);
}

export function countWords(value: string) {
  return value.trim().split(/\s+/).filter(Boolean).length;
}

/** Editoryel kalite puani: 4 zorunlu alan x15, 2 istege bagli x8, iliskili urun 8. */
export function scoreEditorial(form: Record<EditorialFieldKey, string> & { relatedSlugs: string }) {
  const required = EDITORIAL_FIELDS.filter((f) => f.required).map((f) => form[f.key]);
  const optional = EDITORIAL_FIELDS.filter((f) => !f.required).map((f) => form[f.key]);
  const requiredScore = required.reduce((sum, v) => sum + (countWords(v) >= 35 ? 15 : countWords(v) >= 15 ? 8 : 0), 0);
  const optionalScore = optional.reduce((sum, v) => sum + (countWords(v) >= 15 ? 8 : v.trim() ? 4 : 0), 0);
  return Math.min(100, requiredScore + optionalScore + (splitCsv(form.relatedSlugs).length ? 8 : 0));
}
