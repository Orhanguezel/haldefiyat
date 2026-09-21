#!/usr/bin/env node

/**
 * Harman gap calismasi icin tekrar uretilebilir, salt-okunur baseline toplayici.
 *
 * Veri kaynaklari:
 * - Tanitio canli DB: sabit sorgu kosusu ve ham SERP satirlari
 * - Google Search Console: TR + mobil + Web + final performans ve URL Inspection
 * - Canli site: HTTP, HTML bayti, TTFB, canonical, robots, title ve H1
 *
 * Kullanim:
 *   node scripts/seo/harman-gap-baseline.mjs
 *   node scripts/seo/harman-gap-baseline.mjs --out=artifacts/seo/harman-gap-2026-09-21
 */

import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const args = process.argv.slice(2);
const valueOf = (prefix, fallback) => args.find((arg) => arg.startsWith(prefix))?.slice(prefix.length) ?? fallback;
const outDir = resolve(valueOf("--out=", "artifacts/seo/harman-gap-2026-09-21"));
const sshHost = valueOf("--ssh=", "vps-vistainsaat");
const collectedAt = new Date().toISOString();

mkdirSync(outDir, { recursive: true });

function writeJson(name, value) {
  writeFileSync(resolve(outDir, name), `${JSON.stringify(value, null, 2)}\n`);
}

function remoteBun(cwd, source) {
  const encoded = Buffer.from(source).toString("base64");
  const command = `cd ${cwd} && printf %s ${encoded} | base64 -d | timeout 180s bun -`;
  const stdout = execFileSync("ssh", [sshHost, command], {
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
    stdio: ["ignore", "pipe", "inherit"],
  });
  return JSON.parse(stdout);
}

const competitor = remoteBun("/var/www/ekosistem-sosyal-medya/backend", String.raw`
import { pool } from "./src/db/client";
const tenant = "haldefiyat";
const [runs] = await pool.query(
  "SELECT id,engine,status,query_source,queries_total,queries_done,results_total,error_msg,started_at,finished_at,depth FROM competitor_serp_runs WHERE tenant_key=? AND status='ok' ORDER BY started_at DESC LIMIT 1",
  [tenant],
);
if (!runs[0]) throw new Error("HALDEFIYAT_SERP_RUN_NOT_FOUND");
const run = runs[0];
const [results] = await pool.query(
  "SELECT query,position,title,url,domain,actual_engine,is_ours FROM competitor_serp_results WHERE tenant_key=? AND run_id=? ORDER BY query,position",
  [tenant, run.id],
);
console.log(JSON.stringify({ collectedAt: new Date().toISOString(), tenant, run, results }));
await pool.end();
`);
writeJson("competitor-brave.json", competitor);

const gsc = remoteBun("/var/www/ekosistem-sosyal-medya/backend", String.raw`
import { google } from "googleapis";
import { createMarketingJwt, buildMarketingOAuthClient } from "./src/modules/marketing/google-sa";

const auth = await createMarketingJwt("haldefiyat", "gsc") ?? await buildMarketingOAuthClient("haldefiyat", "gsc");
if (!auth) throw new Error("HALDEFIYAT_GSC_AUTH_NOT_FOUND");
const api = google.webmasters({ version: "v3", auth });
const siteUrl = "sc-domain:haldefiyat.com";
const baseFilters = [
  { dimension: "country", operator: "equals", expression: "tur" },
  { dimension: "device", operator: "equals", expression: "MOBILE" },
];
const requests = [
  ["query-current", { startDate: "2026-09-13", endDate: "2026-09-18", dimensions: ["query"] }],
  ["query-previous", { startDate: "2026-09-06", endDate: "2026-09-11", dimensions: ["query"] }],
  ["grape-query-page-90d", { startDate: "2026-06-21", endDate: "2026-09-18", dimensions: ["query", "page"], queryRegex: "(üzüm|uzum)" }],
  ["grape-date-query-90d", { startDate: "2026-06-21", endDate: "2026-09-18", dimensions: ["date", "query"], queryRegex: "(üzüm|uzum)" }],
  ["lemon-query-page-90d", { startDate: "2026-06-21", endDate: "2026-09-18", dimensions: ["query", "page"], queryRegex: "limon" }],
  ["lemon-date-query-90d", { startDate: "2026-06-21", endDate: "2026-09-18", dimensions: ["date", "query"], queryRegex: "limon" }],
];
const performance = {};
for (const [key, config] of requests) {
  console.error("gsc-request-start", key);
  const filters = [...baseFilters];
  if (config.queryRegex) filters.push({ dimension: "query", operator: "includingRegex", expression: config.queryRegex });
  const request = {
    startDate: config.startDate,
    endDate: config.endDate,
    type: "web",
    dataState: "final",
    dimensions: config.dimensions,
    rowLimit: 25000,
    dimensionFilterGroups: [{ filters }],
  };
  performance[key] = { request, data: (await api.searchanalytics.query({ siteUrl, requestBody: request })).data };
  console.error("gsc-request-ok", key, performance[key].data.rows?.length ?? 0);
}

const inspectedUrls = [
  "https://haldefiyat.com/urun/uzum",
  "https://haldefiyat.com/urun/kuru-uzum",
  "https://haldefiyat.com/hal/mersin-hal",
  "https://haldefiyat.com/hal/istanbul-hal-ibb",
];
const inspection = {};
for (const inspectionUrl of inspectedUrls) {
  console.error("gsc-inspection-start", inspectionUrl);
  const response = await google.searchconsole({ version: "v1", auth }).urlInspection.index.inspect({
    requestBody: { inspectionUrl, siteUrl },
  });
  inspection[inspectionUrl] = response.data.inspectionResult?.indexStatusResult ?? null;
  console.error("gsc-inspection-ok", inspectionUrl);
}
await new Promise((resolve) => process.stdout.write(
  JSON.stringify({ collectedAt: new Date().toISOString(), siteUrl, performance, inspection }),
  resolve,
));
process.exit(0);
`);
writeJson("gsc-baseline.json", gsc);

const urls = [
  "/urun/uzum",
  "/urun/kuru-uzum",
  "/hal/mersin-hal",
  "/hal/istanbul-hal-ibb",
  "/hal/konya-hal",
  "/hal/denizli-hal",
  "/hal/kocaeli-hal-merkez",
  "/hal/bursa-hal",
  "/hal/gaziantep-hal",
  "/urun/limon",
  "/fiyat/adana/limon",
  "/urun/limon-mayer",
];

function textMatch(html, expression) {
  return html.match(expression)?.[1]?.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim() ?? null;
}

const technical = [];
for (const path of urls) {
  const url = `https://haldefiyat.com${path}`;
  console.error("technical-start", url);
  const samples = [];
  let html = "";
  let response;
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const started = performance.now();
    response = await fetch(url, {
      redirect: "follow",
      headers: { "user-agent": "HaldeFiyatBaseline/1.0" },
      signal: AbortSignal.timeout(20_000),
    });
    const headersAt = performance.now();
    html = await response.text();
    const ended = performance.now();
    samples.push({
      status: response.status,
      bytes: Buffer.byteLength(html),
      ttfbMs: Math.round(headersAt - started),
      totalMs: Math.round(ended - started),
      finalUrl: response.url,
    });
  }
  const sorted = (key) => samples.map((sample) => sample[key]).sort((a, b) => a - b);
  const median = (key) => sorted(key)[Math.floor(samples.length / 2)];
  technical.push({
    url,
    samples,
    median: { bytes: median("bytes"), ttfbMs: median("ttfbMs"), totalMs: median("totalMs") },
    html: {
      title: textMatch(html, /<title[^>]*>([\s\S]*?)<\/title>/i),
      h1: textMatch(html, /<h1[^>]*>([\s\S]*?)<\/h1>/i),
      canonical: html.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)/i)?.[1]
        ?? html.match(/<link[^>]+href=["']([^"']+)["'][^>]+rel=["']canonical["']/i)?.[1]
        ?? null,
      robots: html.match(/<meta[^>]+name=["']robots["'][^>]+content=["']([^"']+)/i)?.[1]
        ?? html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']robots["']/i)?.[1]
        ?? null,
      hasAnswerBlock: html.includes("bugunun-hal-fiyatlari") || html.includes("ortalama-fiyat") || html.includes("Günün kısa cevabı"),
    },
  });
  console.error("technical-ok", url, technical.at(-1).median);
}
writeJson("technical-baseline.json", { collectedAt, urls: technical });

const ownDomain = "haldefiyat.com";
const rivalDomain = "harmanapps.com";
const byQuery = new Map();
for (const row of competitor.results) {
  const current = byQuery.get(row.query) ?? { query: row.query, ours: null, harman: null };
  if (row.domain === ownDomain) current.ours = current.ours == null ? row.position : Math.min(current.ours, row.position);
  if (row.domain === rivalDomain) current.harman = current.harman == null ? row.position : Math.min(current.harman, row.position);
  byQuery.set(row.query, current);
}
const pairs = [...byQuery.values()].sort((a, b) => a.query.localeCompare(b.query, "tr"));
const counts = pairs.reduce((acc, row) => {
  if (row.harman != null && row.ours != null) row.harman < row.ours ? acc.harmanAhead++ : row.ours < row.harman ? acc.oursAhead++ : acc.tied++;
  else if (row.harman != null) acc.harmanAhead++;
  else if (row.ours != null) acc.oursAhead++;
  return acc;
}, { harmanAhead: 0, oursAhead: 0, tied: 0 });

const currentRows = gsc.performance["query-current"].data.rows ?? [];
const previousRows = gsc.performance["query-previous"].data.rows ?? [];
const previousByQuery = new Map(previousRows.map((row) => [row.keys?.[0], row]));
const targetQueries = [
  "bayrampaşa hal fiyatları", "istanbul hal fiyatları", "istanbul hal fiyatları bugün",
  "istanbul sebze hali fiyatları", "bayrampaşa meyve sebze hali fiyat listesi",
  "konya hal fiyatları", "denizli hal fiyatları", "kocaeli hal fiyatları",
  "bursa hal fiyatları", "gaziantep hal fiyatları", "ankara hal fiyatları",
  "ankara hal fiyatları bugün", "mersin hal fiyatları", "üzüm fiyatları",
  "adana limon fiyatları", "adana mayer limon fiyatları", "mersin limon fiyatları",
  "limon fiyatları", "limon piyasası", "soğan fiyatları", "elma fiyatları",
  "salçalık domates fiyatları", "ankara balık fiyatları bugün", "hal fiyatları",
];
const currentByQuery = new Map(currentRows.map((row) => [row.keys?.[0], row]));
const queryTable = targetQueries.map((query) => ({
  query,
  current: currentByQuery.get(query) ?? null,
  previous: previousByQuery.get(query) ?? null,
}));

writeJson("summary.json", {
  collectedAt,
  observation: {
    competitorRun: competitor.run,
    competitorPairCounts: counts,
    harmanVisibleQueries: pairs.filter((row) => row.harman != null).length,
    haldeFiyatVisibleQueries: pairs.filter((row) => row.ours != null).length,
    queryTable,
  },
  inference: [
    "Brave kosusu Google siralamasi degildir.",
    "query+page satirlari mulk toplami gibi toplanmamistir; query snapshotlari ayri saklanir.",
  ],
  target: [
    "Degisiklikler parti bazinda ve T+14/T+28 final verisiyle degerlendirilir.",
    "Yanlis canonical, robots, veri tarihi veya temel tablonun SSR HTML'den kaybi rollback nedenidir.",
  ],
});

writeJson("validation.json", {
  checkedAt: collectedAt,
  checks: {
    competitorRunComplete: competitor.run.status === "ok" && competitor.run.queries_done === competitor.run.queries_total,
    competitorEngineIsBrave: competitor.run.engine === "brave",
    gscFiltersAreComparable: Object.values(gsc.performance).every(({ request }) =>
      request.type === "web" && request.dataState === "final"
      && request.dimensionFilterGroups[0].filters.some((filter) => filter.dimension === "country" && filter.expression === "tur")
      && request.dimensionFilterGroups[0].filters.some((filter) => filter.dimension === "device" && filter.expression === "MOBILE")
    ),
    pageRowsNotUsedAsPropertyTotal: true,
    allTechnicalUrlsResolved: technical.every((row) => row.samples.every((sample) => sample.status === 200)),
    selfCanonicalOnAllTargets: technical.every((row) => row.html.canonical === row.url),
  },
  note: "Mulk/query toplamlari query snapshotindan okunur. query+page verisi yalniz URL payi teshisi icindir ve satirlari mulk toplami diye toplanmaz.",
});

console.log(JSON.stringify({ outDir, competitorRun: competitor.run.id, counts, technicalUrls: technical.length }, null, 2));
