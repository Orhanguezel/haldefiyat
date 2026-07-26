#!/usr/bin/env node

import { mkdir, writeFile } from "node:fs/promises";
import { load } from "cheerio";

const origin = new URL(process.argv[2] ?? "https://haldefiyat.com").origin;
const outputDir = process.argv[3] ?? "artifacts/seo/live-crawl-2026-07-26";
const concurrency = Math.max(1, Math.min(4, Number(process.env.CRAWL_CONCURRENCY ?? 1)));
const crawlDelayMs = Math.max(0, Number(process.env.CRAWL_DELAY_MS ?? 500));
const userAgent = "HalDeFiyat-SEO-Audit/1.0 (+https://haldefiyat.com/security.txt)";

async function fetchText(url, redirect = "follow") {
  let lastError;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const response = await fetch(url, {
        redirect,
        headers: { "user-agent": userAgent, accept: "text/html,application/xml;q=0.9,*/*;q=0.8" },
        signal: AbortSignal.timeout(45_000),
      });
      const text = await response.text();
      if (![404, 429, 500, 502, 503, 504].includes(response.status) || attempt === 3) {
        return { response, text, attempts: attempt };
      }
      lastError = new Error(`retryable HTTP ${response.status}`);
    } catch (error) {
      lastError = error;
      if (attempt === 3) throw error;
    }
    await new Promise((resolve) => setTimeout(resolve, attempt * 750));
  }
  throw lastError;
}

function cleanUrl(raw, base) {
  try {
    const url = new URL(raw, base);
    if (url.origin !== origin || !["http:", "https:"].includes(url.protocol)) return null;
    url.hash = "";
    for (const key of [...url.searchParams.keys()]) {
      if (key.startsWith("utm_") || ["gclid", "fbclid", "_rsc"].includes(key)) url.searchParams.delete(key);
    }
    return url.href;
  } catch {
    return null;
  }
}

function textOrNull(value) {
  const text = value?.replace(/\s+/g, " ").trim();
  return text || null;
}

async function pool(items, worker) {
  const output = new Array(items.length);
  let cursor = 0;
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (cursor < items.length) {
      const index = cursor++;
      if (index > 0 && crawlDelayMs > 0) {
        await new Promise((resolve) => setTimeout(resolve, crawlDelayMs));
      }
      try {
        output[index] = await worker(items[index], index);
      } catch (error) {
        output[index] = { url: items[index], error: error instanceof Error ? error.message : String(error) };
      }
    }
  }));
  return output;
}

async function loadSitemap() {
  const { response, text } = await fetchText(`${origin}/sitemap.xml`);
  if (!response.ok) throw new Error(`sitemap HTTP ${response.status}`);
  const $ = load(text, { xmlMode: true });
  return $("loc").map((_, node) => textOrNull($(node).text())).get().filter(Boolean);
}

function inspectJsonLd($) {
  const types = [];
  const errors = [];
  $("script[type='application/ld+json']").each((index, node) => {
    try {
      const value = JSON.parse($(node).text());
      const entries = Array.isArray(value) ? value : value?.["@graph"] ?? [value];
      for (const entry of entries) {
        const raw = entry?.["@type"];
        for (const type of Array.isArray(raw) ? raw : raw ? [raw] : []) types.push(String(type));
      }
    } catch (error) {
      errors.push(`block ${index + 1}: ${error instanceof Error ? error.message : String(error)}`);
    }
  });
  return { types: [...new Set(types)].sort(), errors };
}

async function inspectPage(url) {
  const started = Date.now();
  const { response, text, attempts } = await fetchText(url);
  const contentType = response.headers.get("content-type") ?? "";
  const result = {
    url,
    status: response.status,
    finalUrl: response.url,
    redirectCount: response.redirected ? 1 : 0,
    contentType,
    bytes: Buffer.byteLength(text),
    durationMs: Date.now() - started,
    attempts,
    title: null,
    description: null,
    h1: [],
    canonical: null,
    robots: null,
    hreflang: [],
    links: [],
    jsonLdTypes: [],
    jsonLdErrors: [],
  };
  if (!contentType.includes("text/html")) return result;
  const $ = load(text);
  result.title = textOrNull($("title").first().text());
  result.description = textOrNull($("meta[name='description']").attr("content"));
  result.h1 = $("h1").map((_, node) => textOrNull($(node).text())).get().filter(Boolean);
  result.canonical = cleanUrl($("link[rel='canonical']").attr("href"), url);
  result.robots = textOrNull($("meta[name='robots']").attr("content"));
  result.hreflang = $("link[rel='alternate'][hreflang]").map((_, node) => ({
    lang: $(node).attr("hreflang"),
    href: cleanUrl($(node).attr("href"), url),
  })).get();
  result.links = [...new Set($("a[href]").map((_, node) => cleanUrl($(node).attr("href"), url)).get().filter(Boolean))];
  const jsonLd = inspectJsonLd($);
  result.jsonLdTypes = jsonLd.types;
  result.jsonLdErrors = jsonLd.errors;
  return result;
}

function duplicateMap(pages, field) {
  const values = new Map();
  for (const page of pages) {
    const value = page[field];
    if (!value) continue;
    const urls = values.get(value) ?? [];
    urls.push(page.url);
    values.set(value, urls);
  }
  return [...values.entries()].filter(([, urls]) => urls.length > 1)
    .map(([value, urls]) => ({ value, urls }));
}

function calculateDepth(pages) {
  const pageMap = new Map(pages.map((page) => [page.url, page]));
  const root = `${origin}/`;
  const depths = new Map([[root, 0]]);
  const queue = [root];
  while (queue.length) {
    const current = queue.shift();
    const depth = depths.get(current);
    for (const link of pageMap.get(current)?.links ?? []) {
      if (pageMap.has(link) && !depths.has(link)) {
        depths.set(link, depth + 1);
        queue.push(link);
      }
    }
  }
  return Object.fromEntries(depths);
}

function markdown(report) {
  const s = report.summary;
  const lines = [
    "# HalDeFiyat Canlı SEO Crawl — 2026-07-26",
    "",
    `- Origin: \`${origin}\``,
    `- Eşzamanlılık: **${report.crawl.concurrency}**; istek aralığı: **${report.crawl.delayMs} ms**`,
    `- Sitemap URL: **${s.total}**`,
    `- HTTP 200: **${s.status200}**`,
    `- Hatalı/redirect yanıt: **${s.non200}**`,
    `- Noindex: **${s.noindex}**`,
    `- Canonical eksik/farklı: **${s.canonicalIssues}**`,
    `- Title eksik: **${s.missingTitle}**; duplicate kümesi: **${s.duplicateTitleGroups}**`,
    `- Description eksik: **${s.missingDescription}**; duplicate kümesi: **${s.duplicateDescriptionGroups}**`,
    `- H1 sayısı 1 olmayan: **${s.h1Issues}**`,
    `- JSON-LD parse hatası olan URL: **${s.jsonLdErrorPages}**`,
    `- Sitemap içinde ana sayfadan ulaşılamayan URL: **${s.orphanCandidates}**`,
    `- En yüksek iç link derinliği: **${s.maxDepth}**`,
    "",
    "## Sorunlu URL'ler",
    "",
  ];
  const issuePages = report.pages.filter((page) =>
    page.error || page.status !== 200 || !page.title || !page.description ||
    page.h1?.length !== 1 || page.canonical !== page.url || page.jsonLdErrors?.length);
  if (!issuePages.length) lines.push("- Yok.");
  for (const page of issuePages) {
    const issues = [
      page.error,
      page.status && page.status !== 200 ? `HTTP ${page.status}` : null,
      !page.title ? "title eksik" : null,
      !page.description ? "description eksik" : null,
      page.h1?.length !== 1 ? `H1=${page.h1?.length ?? 0}` : null,
      page.canonical !== page.url ? `canonical=${page.canonical ?? "eksik"}` : null,
      page.jsonLdErrors?.length ? `JSON-LD: ${page.jsonLdErrors.join("; ")}` : null,
    ].filter(Boolean);
    lines.push(`- \`${page.url}\` — ${issues.join(", ")}`);
  }
  lines.push("", "## Duplicate title kümeleri", "");
  if (!report.duplicates.title.length) lines.push("- Yok.");
  for (const group of report.duplicates.title) lines.push(`- **${group.value}** — ${group.urls.join(", ")}`);
  lines.push("", "## Orphan adayları", "");
  if (!report.orphanCandidates.length) lines.push("- Yok.");
  for (const url of report.orphanCandidates) lines.push(`- ${url}`);
  lines.push("", "## Not", "",
    "Bu tarama sitemap tabanlıdır. GSC indeksleme nedenleri ve dış validator sonuçları ayrı veri kaynaklarıdır.");
  return `${lines.join("\n")}\n`;
}

await mkdir(outputDir, { recursive: true });
const urls = [...new Set(await loadSitemap())];
const pages = await pool(urls, inspectPage);
const validPages = pages.filter((page) => !page.error);
const depths = calculateDepth(validPages);
const orphanCandidates = urls.filter((url) => url !== `${origin}/` && depths[url] == null);
const duplicates = {
  title: duplicateMap(validPages, "title"),
  description: duplicateMap(validPages, "description"),
};
const summary = {
  total: urls.length,
  status200: validPages.filter((page) => page.status === 200).length,
  non200: pages.filter((page) => page.error || page.status !== 200).length,
  noindex: validPages.filter((page) => /\bnoindex\b/i.test(page.robots ?? "")).length,
  canonicalIssues: validPages.filter((page) => page.canonical !== page.url).length,
  missingTitle: validPages.filter((page) => !page.title).length,
  missingDescription: validPages.filter((page) => !page.description).length,
  h1Issues: validPages.filter((page) => page.h1.length !== 1).length,
  jsonLdErrorPages: validPages.filter((page) => page.jsonLdErrors.length).length,
  duplicateTitleGroups: duplicates.title.length,
  duplicateDescriptionGroups: duplicates.description.length,
  orphanCandidates: orphanCandidates.length,
  maxDepth: Math.max(0, ...Object.values(depths)),
};
const report = {
  generatedAt: new Date().toISOString(),
  origin,
  crawl: { concurrency, delayMs: crawlDelayMs, userAgent },
  summary,
  duplicates,
  orphanCandidates,
  depths,
  pages,
};
await writeFile(`${outputDir}/report.json`, `${JSON.stringify(report, null, 2)}\n`);
await writeFile(`${outputDir}/report.md`, markdown(report));
console.log(JSON.stringify(summary, null, 2));
