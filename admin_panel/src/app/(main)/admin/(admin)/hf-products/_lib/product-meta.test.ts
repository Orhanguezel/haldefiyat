import { expect, test } from "bun:test";
import { applyLocalFilters, EMPTY_FILTERS, summarize } from "./product-meta";
import type { HfProductItem } from "@/integrations/endpoints/hf-products-admin-endpoints";
const rows = [
 { id: 1, seoIndex: 1, gscCategory: "issue", gscAwaitingRecrawl: false },
 { id: 2, seoIndex: 1, gscCategory: "not_indexed", gscAwaitingRecrawl: false },
 { id: 3, seoIndex: 1, gscCategory: "issue", gscAwaitingRecrawl: true },
 { id: 4, seoIndex: 0, gscCategory: "issue" },
 { id: 5, seoIndex: 1, gscCategory: "issue", canonicalSlug: "master" },
 { id: 6, seoIndex: 1, gscCategory: "indexed" },
].map(r => ({ nameTr: "Ürün", slug: `urun-${r.id}`, categorySlug: "sebze", isActive: 1, ...r })) as HfProductItem[];
test("Google cards and their filters partition actionable products identically", () => {
 const stats=summarize(rows);
 const problems=applyLocalFilters(rows,{...EMPTY_FILTERS,gsc:"real_issue"});
 const pending=applyLocalFilters(rows,{...EMPTY_FILTERS,gsc:"awaiting_recrawl"});
 expect(problems.map(r=>r.id)).toEqual([1,2]);
 expect(pending.map(r=>r.id)).toEqual([3]);
 expect(stats.gscRealIssue).toBe(problems.length);
 expect(stats.gscAwaiting).toBe(pending.length);
 expect(stats.gscProblem).toBe(problems.length+pending.length);
});
test("local filters retain search, category, status and SEO behavior",()=>{
 expect(applyLocalFilters(rows,{...EMPTY_FILTERS,q:"urun-4",seo:"noindex"}).map(r=>r.id)).toEqual([4]);
 expect(applyLocalFilters(rows,{...EMPTY_FILTERS,category:"meyve"})).toEqual([]);
 expect(applyLocalFilters(rows,{...EMPTY_FILTERS,status:"passive"})).toEqual([]);
});
test("search folds Turkish I variants like the server collation did",()=>{
 const incir=[{id:9,nameTr:"İncir",slug:"incir",categorySlug:"meyve",isActive:1,seoIndex:1}] as unknown as HfProductItem[];
 for(const q of ["incir","İncir","Incir","İNCİR"]) expect(applyLocalFilters(incir,{...EMPTY_FILTERS,q}).map(r=>r.id)).toEqual([9]);
 expect(applyLocalFilters(incir,{...EMPTY_FILTERS,q:"elma"})).toEqual([]);
});
