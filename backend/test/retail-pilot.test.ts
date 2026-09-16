import { afterEach, expect, it } from "bun:test";
import { mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { RetailPilotStore, duePilotQueries } from "../src/modules/etl/retail-pilot-store";
import { RETAIL_PILOT, RETAIL_PILOT_QUERIES, retailDay } from "../src/modules/etl/retail-pilot";
import { summarizePilotRuns } from "../src/modules/etl/retail-pilot-report";
import { parseMigrosJsonLd } from "../src/modules/etl/market-scrapers/migros";
const folders: string[] = [];
const now = new Date("2026-09-16T10:00:00Z");
async function store() { const dir = await mkdtemp(join(tmpdir(), "retail-pilot-")); folders.push(dir); return new RetailPilotStore(dir, true, now).open(); }
afterEach(async () => { for (const dir of folders.splice(0)) await rm(dir, { recursive: true, force: true }); });
it("bounds the pilot and uses Turkey's calendar day", () => {
  expect(new Set(RETAIL_PILOT.map(p => p[0])).size).toBe(40);
  expect(RETAIL_PILOT_QUERIES.length).toBeLessThan(40);
  expect(retailDay(new Date("2026-09-16T22:00:00Z"))).toBe("2026-09-17");
});
it("resumes successful pages after restart without fetching again; detects corruption", async () => {
  const first = await store(); let calls = 0;
  const request = async () => { calls++; return { data: { content: [1] }, calls: 1, throttled: false }; };
  await first.page("domates", 0, request);
  const restarted = await new RetailPilotStore(first.directory, true, now).open();
  expect((await restarted.page("domates", 0, request)).calls).toBe(0);
  expect(calls).toBe(1);
  const folder = join(first.directory, "raw", retailDay(now));
  const path = join(folder, (await readdir(folder))[0]!);
  const data = JSON.parse(await readFile(path, "utf8")); data.data.content = [999];
  await writeFile(path, JSON.stringify(data));
  await expect(restarted.page("domates", 0, request)).rejects.toThrow("CHECKSUM");
});
it("cools down failed and empty searches, persists completion and resumes tomorrow", async () => {
  const s = await store();
  s.finish("domates", 3); s.finish("patates", 0); s.finish("soğan", 0, "reset");
  await s.save({}, "manual");
  const resumed = await new RetailPilotStore(s.directory, true, now).open();
  const due = duePilotQueries(resumed.state, now);
  expect(due.length).toBe(8);
  for (const keyword of ["domates", "patates", "soğan"]) expect(due).not.toContain(keyword);
  const tomorrow = duePilotQueries(resumed.state, new Date(now.getTime() + 86400000));
  expect(tomorrow).toContain("domates"); expect(tomorrow).toContain("soğan"); expect(tomorrow).not.toContain("patates");
});
it("manual or repeated same-day runs cannot satisfy seven days", () => {
  const make = (day: string, executionKind = "scheduled") => ({ day, executionKind, result: {} });
  expect(summarizePilotRuns(Array.from({ length: 7 }, () => make("2026-09-15")), now).reviewReady).toBeFalse();
  const seven = Array.from({ length: 7 }, (_, i) => make(`2026-09-${String(9 + i).padStart(2, "0")}`));
  expect(summarizePilotRuns(seven, now).reviewReady).toBeTrue();
  expect(summarizePilotRuns(seven.map(r => ({ ...r, executionKind: "manual" })), now).reviewReady).toBeFalse();
});
it("Migros rejects aggregate, foreign-currency, unavailable and member offers", () => {
  const product = { name: "Domates Kg", url: "https://www.migros.com.tr/domates-p-1", offers: { "@type": "Offer", price: 35, priceCurrency: "TRY", availability: "https://schema.org/InStock" } };
  const html = (p: unknown) => `<script type="application/ld+json">${JSON.stringify({ "@type": "ItemList", itemListElement: [{ item: p }] })}</script>`;
  expect(parseMigrosJsonLd(html(product))).toHaveLength(1);
  for (const change of [{ "@type": "AggregateOffer" }, { priceCurrency: "USD" }, { availability: "https://schema.org/OutOfStock" }, { description: "Money üyelerine özel" }, { price: "35garbage" }])
    expect(parseMigrosJsonLd(html({ ...product, offers: { ...product.offers, ...change } }))).toHaveLength(0);
});
it("failed pages are retried rather than cached as empty successes", async () => {
  const s = await store(); let attempts = 0;
  const request = async () => { attempts++; return { data: null, calls: 3, throttled: false, unavailable: true, error: "SEARCH_ECONNRESET_ERROR" }; };
  await s.page("domates", 0, request); await s.page("domates", 0, request);
  expect(attempts).toBe(2); expect(s.cachedPages).toBe(0);
});
it("Migros raw HTML survives a restart without another browser fetch", async () => {
  const s = await store(); let attempts = 0;
  const request = async () => { attempts++; return "<html>original offer</html>"; };
  await s.html("https://www.migros.com.tr/sebze-meyve-c-2", request);
  const resumed = await new RetailPilotStore(s.directory, true, now).open();
  expect(await resumed.html("https://www.migros.com.tr/sebze-meyve-c-2", request)).toBe("<html>original offer</html>");
  expect(attempts).toBe(1);
});
