#!/usr/bin/env node

import { mkdir, readFile, writeFile } from "node:fs/promises";

const inputPath = process.argv[2]
  ?? "artifacts/seo/live-crawl-meta-final-2026-07-26/report.json";
const outputDir = process.argv[3]
  ?? "artifacts/seo/internal-link-status-2026-07-26";
const concurrency = Math.max(1, Math.min(4, Number(process.env.LINK_CHECK_CONCURRENCY ?? 2)));
const delayMs = Math.max(0, Number(process.env.LINK_CHECK_DELAY_MS ?? 250));
const userAgent = "HalDeFiyat-SEO-Link-Audit/1.0 (+https://haldefiyat.com/security.txt)";

const sourceReport = JSON.parse(await readFile(inputPath, "utf8"));
const origin = new URL(sourceReport.origin).origin;
const sourcesByTarget = new Map();

for (const page of sourceReport.pages) {
  for (const target of page.links ?? []) {
    const sources = sourcesByTarget.get(target) ?? new Set();
    sources.add(page.url);
    sourcesByTarget.set(target, sources);
  }
}

function targetKind(rawUrl) {
  const url = new URL(rawUrl);
  if (url.origin !== origin) return "external";
  if (url.pathname.startsWith("/api/")) return "api-action-or-download";
  return "html-navigation";
}

const excluded = [...sourcesByTarget.keys()]
  .filter((url) => targetKind(url) !== "html-navigation")
  .map((url) => ({
    url,
    kind: targetKind(url),
    sources: [...sourcesByTarget.get(url)],
  }));
const targets = [...sourcesByTarget.keys()]
  .filter((url) => targetKind(url) === "html-navigation")
  .sort();

async function request(url, method) {
  return fetch(url, {
    method,
    redirect: "manual",
    headers: {
      "user-agent": userAgent,
      accept: "text/html,application/xhtml+xml;q=0.9,*/*;q=0.8",
    },
    signal: AbortSignal.timeout(45_000),
  });
}

async function requestWithRetry(url, method) {
  let lastError;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const response = await request(url, method);
      if (![429, 500, 502, 503, 504].includes(response.status) || attempt === 3) {
        return { response, attempts: attempt };
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

async function inspectTarget(url) {
  const startedAt = Date.now();
  const chain = [];
  let current = url;
  let method = "HEAD";
  let totalAttempts = 0;

  for (let hop = 0; hop <= 10; hop++) {
    let { response, attempts } = await requestWithRetry(current, method);
    totalAttempts += attempts;
    if ([405, 501].includes(response.status) && method === "HEAD") {
      method = "GET";
      ({ response, attempts } = await requestWithRetry(current, method));
      totalAttempts += attempts;
    }

    const location = response.headers.get("location");
    chain.push({
      url: current,
      status: response.status,
      location: location ? new URL(location, current).href : null,
    });

    if (response.status < 300 || response.status >= 400 || !location) {
      return {
        url,
        status: response.status,
        finalUrl: current,
        redirectCount: chain.length - 1,
        chain,
        method,
        attempts: totalAttempts,
        durationMs: Date.now() - startedAt,
        sources: [...sourcesByTarget.get(url)],
      };
    }
    current = new URL(location, current).href;
  }

  throw new Error("redirect hop limit exceeded");
}

async function pool(items, worker) {
  const output = new Array(items.length);
  let cursor = 0;
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (cursor < items.length) {
      const index = cursor++;
      if (index > 0 && delayMs) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
      try {
        output[index] = await worker(items[index]);
      } catch (error) {
        output[index] = {
          url: items[index],
          error: error instanceof Error ? error.message : String(error),
          sources: [...sourcesByTarget.get(items[index])],
        };
      }
    }
  }));
  return output;
}

const results = await pool(targets, inspectTarget);
const summary = {
  discoveredUniqueTargets: sourcesByTarget.size,
  checkedHtmlTargets: targets.length,
  excludedApiTargets: excluded.length,
  status2xx: results.filter((item) => item.status >= 200 && item.status < 300).length,
  status3xxFinal: results.filter((item) => item.status >= 300 && item.status < 400).length,
  status4xx: results.filter((item) => item.status >= 400 && item.status < 500).length,
  status5xx: results.filter((item) => item.status >= 500).length,
  errors: results.filter((item) => item.error).length,
  redirectedTargets: results.filter((item) => item.redirectCount > 0).length,
  redirectChainsOverOneHop: results.filter((item) => item.redirectCount > 1).length,
};
const report = {
  generatedAt: new Date().toISOString(),
  sourceReport: inputPath,
  origin,
  check: { concurrency, delayMs, userAgent },
  summary,
  issues: results.filter((item) =>
    item.error || item.status < 200 || item.status >= 300 || item.redirectCount > 0),
  excluded,
  results,
};

const lines = [
  "# İç Link HTTP ve Redirect Zinciri Denetimi — 2026-07-26",
  "",
  `- Keşfedilen benzersiz iç hedef: **${summary.discoveredUniqueTargets}**`,
  `- Kontrol edilen HTML navigasyon hedefi: **${summary.checkedHtmlTargets}**`,
  `- Yan etki/indirme riski nedeniyle ayrılan API hedefi: **${summary.excludedApiTargets}**`,
  `- 2xx: **${summary.status2xx}**; nihai 3xx: **${summary.status3xxFinal}**`,
  `- 4xx: **${summary.status4xx}**; 5xx: **${summary.status5xx}**; ağ hatası: **${summary.errors}**`,
  `- Redirect içeren hedef: **${summary.redirectedTargets}**`,
  `- Birden uzun redirect zinciri: **${summary.redirectChainsOverOneHop}**`,
  "",
  "## Sorunlar",
  "",
];
if (!report.issues.length) lines.push("- Yok.");
for (const issue of report.issues) {
  const outcome = issue.error ?? `HTTP ${issue.status}; redirect=${issue.redirectCount}`;
  lines.push(`- \`${issue.url}\` — ${outcome}; kaynak: ${issue.sources.slice(0, 3).join(", ")}`);
}
lines.push(
  "",
  "## Kapsam Notu",
  "",
  "API click ve CSV export hedefleri HTML SEO navigasyonu değildir. Canlıda sayaç",
  "artışı veya pahalı dışa aktarma yan etkisi oluşturmamak için istek gönderilmeden",
  "ayrı envanterlenmiştir. Ham JSON bu URL'leri kaynak sayfalarıyla birlikte içerir.",
  "",
);

await mkdir(outputDir, { recursive: true });
await writeFile(`${outputDir}/report.json`, `${JSON.stringify(report, null, 2)}\n`);
await writeFile(`${outputDir}/report.md`, lines.join("\n"));
console.log(JSON.stringify(summary, null, 2));
