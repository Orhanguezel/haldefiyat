import { describe, expect, test, mock } from "bun:test";
const inspected: string[] = [];
const candidates = [
  { url: "https://haldefiyat.com/urun/missing", verdict: "NEUTRAL", coverage_state: "Crawled - currently not indexed" },
  { url: "https://haldefiyat.com/urun/stale-noindex", verdict: "FAIL", coverage_state: "Excluded by noindex" },
  { url: "https://haldefiyat.com/urun/indexed", verdict: "PASS", coverage_state: "Submitted and indexed" },
  { url: "https://haldefiyat.com/urun/unchecked", verdict: null, coverage_state: null },
];
mock.module("@/db/client", () => ({ pool: { execute: async () => [], query: async (sql: string) => [sql.includes("JOIN gsc_url_index") ? candidates : sql.startsWith("SELECT url, checked_at") ? candidates.map(r => ({ ...r, checked_at: new Date() })) : []] } }));
mock.module("@agro/shared-backend/modules/searchConsole", () => ({ inspectSearchConsoleUrl: async (url: string) => { inspected.push(url); return { verdict: "PASS", coverage: "Submitted and indexed", last_crawl: null }; } }));
const { runGscBulkRefresh } = await import("../src/modules/seo/gsc-bulk");
describe("targeted Google refresh", () => {
  test("refreshes only known missing products, including recently checked stale noindex", async () => {
    inspected.length = 0;
    const result = await runGscBulkRefresh({ scope: "missing_products", force: true });
    expect(inspected.sort()).toEqual(candidates.slice(0, 2).map(r => r.url).sort());
    expect(result).toEqual({ total: 2, pending: 2, checked: 2, failed: 0, skipped: 0 });
  });
  test("keeps the freshness guard unless explicitly forced", async () => {
    inspected.length = 0;
    const result = await runGscBulkRefresh({ scope: "missing_products" });
    expect(inspected).toEqual([]);
    expect(result.skipped).toBe(2);
  });
});
