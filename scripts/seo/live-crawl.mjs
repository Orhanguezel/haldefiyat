#!/usr/bin/env node

import { mkdir, writeFile } from "node:fs/promises";
import { load } from "cheerio";

const origin = new URL(process.argv[2] ?? "https://haldefiyat.com").origin;
const outputDir = process.argv[3] ?? "artifacts/seo/live-crawl-2026-07-26";
const concurrency = Math.max(1, Math.min(4, Number(process.env.CRAWL_CONCURRENCY ?? 1)));
const crawlDelayMs = Math.max(0, Number(process.env.CRAWL_DELAY_MS ?? 500));
const crawlMaxUrls = Math.max(0, Number(process.env.CRAWL_MAX_URLS ?? 0));
const fetchTimeoutMs = Math.max(3_000, Number(process.env.CRAWL_FETCH_TIMEOUT_MS ?? 45_000));
const fetchAttempts = Math.max(1, Math.min(3, Number(process.env.CRAWL_FETCH_ATTEMPTS ?? 3)));
const userAgent = "HalDeFiyat-SEO-Audit/1.0 (+https://haldefiyat.com/security.txt)";

async function fetchText(url, redirect = "follow") {
  let lastError;
  for (let attempt = 1; attempt <= fetchAttempts; attempt++) {
    try {
      const response = await fetch(url, {
        redirect,
        headers: { "user-agent": userAgent, accept: "text/html,application/xml;q=0.9,*/*;q=0.8" },
        signal: AbortSignal.timeout(fetchTimeoutMs),
      });
      const text = await response.text();
      if (![404, 429, 500, 502, 503, 504].includes(response.status) || attempt === fetchAttempts) {
        return { response, text, attempts: attempt };
      }
      lastError = new Error(`retryable HTTP ${response.status}`);
    } catch (error) {
      lastError = error;
      if (attempt === fetchAttempts) throw error;
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
    anchors: [],
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
  result.anchors = $("a[href]").map((_, node) => {
    const href = cleanUrl($(node).attr("href"), url);
    if (!href) return null;
    const text = textOrNull(
      $(node).text()
      || $(node).attr("aria-label")
      || $(node).find("img[alt]").first().attr("alt"),
    );
    return { href, text };
  }).get().filter(Boolean);
  result.links = [...new Set(result.anchors.map((anchor) => anchor.href))];
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

function calculateAnchorDistribution(pages) {
  const genericPattern = /^(buraya|tıkla|detay|devam|daha fazla|incele|link)$/i;
  const values = new Map();
  let total = 0;
  let empty = 0;
  let generic = 0;
  for (const page of pages) {
    for (const anchor of page.anchors ?? []) {
      total++;
      if (!anchor.text) {
        empty++;
        continue;
      }
      if (genericPattern.test(anchor.text)) generic++;
      const key = anchor.text.toLocaleLowerCase("tr-TR");
      const item = values.get(key) ?? { text: anchor.text, count: 0, targets: new Set() };
      item.count++;
      item.targets.add(anchor.href);
      values.set(key, item);
    }
  }
  const top = [...values.values()]
    .map((item) => ({ text: item.text, count: item.count, uniqueTargets: item.targets.size }))
    .sort((a, b) => b.count - a.count || a.text.localeCompare(b.text, "tr"))
    .slice(0, 100);
  return { total, empty, generic, uniqueTexts: values.size, top };
}

function representativeSample(urls, limit) {
  if (!limit || urls.length <= limit) return urls;
  const families = new Map();
  for (const url of urls) {
    const path = new URL(url).pathname;
    const first = path.split("/").filter(Boolean)[0] ?? "home";
    const family = ["urun", "hal", "firma", "firmalar", "analiz", "rapor", "yazar"].includes(first)
      ? first
      : "static";
    const list = families.get(family) ?? [];
    list.push(url);
    families.set(family, list);
  }

  const selected = [];
  const seen = new Set();
  const add = (url) => {
    if (!url || seen.has(url) || selected.length >= limit) return;
    seen.add(url);
    selected.push(url);
  };
  add(`${origin}/`);

  // Her dinamik aileden örnek almadan statik sayfaların limiti tüketmesine izin verme.
  const familyOrder = ["urun", "hal", "firma", "firmalar", "analiz", "rapor", "yazar", "static"];
  let cursor = 0;
  while (selected.length < limit) {
    let added = false;
    for (const family of familyOrder) {
      const url = families.get(family)?.[cursor];
      if (!url) continue;
      const before = selected.length;
      add(url);
      added ||= selected.length > before;
      if (selected.length >= limit) break;
    }
    if (!added) break;
    cursor++;
  }
  return selected;
}

function markdown(report) {
  const s = report.summary;
  const lines = [
    `# HalDeFiyat Canlı SEO Crawl — ${report.generatedAt.slice(0, 10)}`,
    "",
    `- Origin: \`${origin}\``,
    `- Eşzamanlılık: **${report.crawl.concurrency}**; istek aralığı: **${report.crawl.delayMs} ms**`,
    `- Sitemap URL: **${s.total}**`,
    `- Sitemap toplamı: **${report.crawl.sitemapTotal}**; tarama modu: **${report.crawl.sampled ? "temsili örneklem" : "tam"}**`,
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
    `- Anchor: **${s.anchorTotal}** toplam, **${s.anchorUniqueTexts}** benzersiz metin, **${s.emptyAnchors}** boş, **${s.genericAnchors}** genel`,
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
  lines.push("", "## En yaygın anchor metinleri", "");
  for (const item of report.anchorDistribution.top.slice(0, 30)) {
    lines.push(`- **${item.text}** — ${item.count} kullanım, ${item.uniqueTargets} farklı hedef`);
  }
  lines.push("", "## Orphan adayları", "");
  if (!report.orphanCandidates.length) lines.push("- Yok.");
  for (const url of report.orphanCandidates) lines.push(`- ${url}`);
  lines.push("", "## Not", "",
    report.crawl.sampled
      ? "Bu çalışma sitemap'ten sayfa ailelerine dengeli temsili örnek alır; orphan sayısı yalnız örneklem içi bağlantı grafiğidir. Tam orphan bazı için son tam crawl ayrıca değerlendirilmelidir."
      : "Bu tarama sitemap tabanlıdır. GSC indeksleme nedenleri ve dış validator sonuçları ayrı veri kaynaklarıdır.");
  return `${lines.join("\n")}\n`;
}

await mkdir(outputDir, { recursive: true });
const sitemapUrls = [...new Set(await loadSitemap())];
const urls = representativeSample(sitemapUrls, crawlMaxUrls);
const pages = await pool(urls, inspectPage);
const validPages = pages.filter((page) => !page.error);
const depths = calculateDepth(validPages);
const anchorDistribution = calculateAnchorDistribution(validPages);
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
  anchorTotal: anchorDistribution.total,
  anchorUniqueTexts: anchorDistribution.uniqueTexts,
  emptyAnchors: anchorDistribution.empty,
  genericAnchors: anchorDistribution.generic,
};
const report = {
  generatedAt: new Date().toISOString(),
  origin,
  crawl: {
    concurrency,
    delayMs: crawlDelayMs,
    userAgent,
    sitemapTotal: sitemapUrls.length,
    sampled: urls.length < sitemapUrls.length,
    requestedLimit: crawlMaxUrls || null,
    fetchTimeoutMs,
    fetchAttempts,
  },
  summary,
  duplicates,
  anchorDistribution,
  orphanCandidates,
  depths,
  pages,
};
await writeFile(`${outputDir}/report.json`, `${JSON.stringify(report, null, 2)}\n`);
await writeFile(`${outputDir}/report.md`, markdown(report));
console.log(JSON.stringify(summary, null, 2));
