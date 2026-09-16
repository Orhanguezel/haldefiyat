import { readFile, writeFile, rename } from "node:fs/promises";
import { join } from "node:path";
import { isVerifiedRetail } from "@/modules/prices/retail-observations";
import { pool } from "@/db/client";
import { RETAIL_PILOT, retailDay } from "./retail-pilot";
import { RetailPilotStore } from "./retail-pilot-store";

type Run = { day: string; executionKind: string; result: { source?: string; inserted?: number; apiCallCount?: number; errors?: string[]; pilot?: { cachedPages?: number } } };
export function summarizePilotRuns(runs: Run[], now = new Date()) {
  const today = retailDay(now);
  const dates = Array.from({ length: 7 }, (_, i) => new Date(Date.parse(today + "T12:00:00Z") - (i + 1) * 86400000).toISOString().slice(0, 10)).reverse();
  const scheduled = runs.filter(r => r.executionKind === "scheduled");
  const completedObservationDays = dates.filter(day => scheduled.some(r => r.day === day));
  return {
    reviewReady: completedObservationDays.length === 7,
    automaticExpansion: false,
    completedObservationDays: completedObservationDays.length,
    requiredObservationDays: 7,
    dailyRuns: [...dates, today].map(day => {
      const daily = scheduled.filter(r => r.day === day);
      return { day, runs: daily.length, marketfiyatiCalls: daily.reduce((n, r) => n + (r.result.apiCallCount ?? 0), 0),
        cachedPages: daily.reduce((n, r) => n + (r.result.pilot?.cachedPages ?? 0), 0),
        runsWithErrors: daily.filter(r => r.result.errors?.length).length,
        errors: [...new Set(daily.flatMap(r => r.result.errors ?? []))] };
    }),
  };
}
export async function writeRetailPilotReport() {
  const store = await new RetailPilotStore().open();
  let text = "";
  try { text = await readFile(join(store.directory, "runs.jsonl"), "utf8"); } catch (e: any) { if (e.code !== "ENOENT") throw e; }
  const runs: Run[] = text.trim().split("\n").filter(Boolean).map(line => JSON.parse(line));
  const slugs = RETAIL_PILOT.map(([slug]) => slug);
  const today = retailDay();
  const since = new Date(Date.parse(today + "T12:00:00Z") - 7 * 86400000).toISOString().slice(0, 10);
  const [rows]: any = await pool.query(`SELECT DATE_FORMAT(r.recorded_date,'%Y-%m-%d') day,
    p.slug, r.chain_slug chain, 1 observations, p.slug productSlug, p.unit productUnit,
    r.chain_slug chainSlug, r.price, r.unit, r.product_name_raw productNameRaw, r.product_url productUrl,
    DATE_FORMAT(r.recorded_date,'%Y-%m-%d') recordedDate,
    CASE WHEN r.product_url LIKE 'https://www.migros.com.tr/%' THEN 'migros' ELSE 'marketfiyati' END source
    FROM hf_retail_prices r JOIN hf_products p ON p.id=r.product_id
    WHERE p.slug IN (${slugs.map(() => "?").join(",")}) AND r.recorded_date BETWEEN ? AND ?
    AND r.price > 0 AND r.currency='TRY'
    AND NOT EXISTS (SELECT 1 FROM hf_retail_price_quarantine q WHERE q.product_id=r.product_id AND q.chain_slug=r.chain_slug AND q.recorded_date=r.recorded_date AND q.status <> 'rejected')`, [...slugs, since, today]);
  const summary = summarizePilotRuns(runs);
  const verifiedRows = rows.filter(isVerifiedRetail);
  const coverage = summary.dailyRuns.map(({ day }) => {
    const daily = verifiedRows.filter((r: any) => r.day === day);
    const present = new Set(daily.map((r: any) => r.slug));
    return { day, products: present.size, targetProducts: slugs.length, coveragePercent: Math.round(present.size / slugs.length * 100),
      chains: [...new Set(daily.map((r: any) => r.chain))], missingProducts: slugs.filter(s => !present.has(s)), observations: daily.map(({ day, slug, chain, observations, source }: any) => ({ day, slug, chain, observations, source })) };
  });
  const report = { generatedAt: new Date().toISOString(), startedAt: store.state.startedAt,
    ...summary, coverage, scope: "40-product pilot; stored source-date observations, not national prices", keywords: store.state.keywords };
  const tmp = join(store.directory, `report.${process.pid}.tmp`);
  await writeFile(tmp, JSON.stringify(report, null, 2), { mode: 0o600 });
  await rename(tmp, join(store.directory, "report.json"));
  return report;
}
