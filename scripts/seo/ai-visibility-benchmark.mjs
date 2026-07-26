#!/usr/bin/env node

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const args = Object.fromEntries(
  process.argv.slice(2).map((arg) => {
    const [key, ...value] = arg.replace(/^--/, "").split("=");
    return [key, value.join("=") || true];
  }),
);

const queryFile = path.resolve(
  String(args.queries || "scripts/seo/ai-visibility-queries.json"),
);
const date = String(args.date || new Date().toISOString().slice(0, 10));
const outputDir = path.resolve(
  String(args.output || `artifacts/seo/ai-visibility-${date}`),
);
const provider = String(args.provider || "openai");
const model = String(
  args.model ||
    (provider === "anthropic"
      ? process.env.ANTHROPIC_MODEL || "claude-sonnet-4-20250514"
      : "gpt-5-nano"),
);
const apiKey =
  provider === "anthropic"
    ? process.env.ANTHROPIC_API_KEY
    : process.env.OPENAI_API_KEY;
if (!apiKey) {
  throw new Error(
    `${provider === "anthropic" ? "ANTHROPIC" : "OPENAI"}_API_KEY tanımlı değil.`,
  );
}
const platform =
  provider === "anthropic"
    ? "Anthropic Messages API + web_search"
    : "OpenAI Responses API + web_search";
const limit = Number(args.limit || 0);
const pauseMs = Number(args.pause || 750);
const source = JSON.parse(await readFile(queryFile, "utf8"));
const queries = limit > 0 ? source.slice(0, limit) : source;

function annotationsFrom(response) {
  return (response.output || [])
    .flatMap((item) => item.content || [])
    .flatMap((content) => content.annotations || [])
    .filter((annotation) => annotation.type === "url_citation")
    .map((annotation, index) => ({
      rank: index + 1,
      url: annotation.url,
      title: annotation.title || null,
      start_index: annotation.start_index ?? null,
      end_index: annotation.end_index ?? null,
      is_haldefiyat:
        /(^|\.)haldefiyat\.com$/i.test(new URL(annotation.url).hostname),
    }));
}

function outputText(response) {
  return (response.output || [])
    .flatMap((item) => item.content || [])
    .filter((content) => content.type === "output_text")
    .map((content) => content.text)
    .join("\n");
}

async function runQuery(item) {
  const startedAt = new Date().toISOString();
  if (provider === "anthropic") {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        max_tokens: 400,
        system:
          "Türkiye'deki bir kullanıcıya Türkçe ve tarafsız cevap ver. Güncel bilgi gerekiyorsa web'de ara. En fazla 120 kelime kullan; yararlandığın kaynakları doğal biçimde belirt ve bağlantılı atıfları koru. Belirli bir marka veya siteyi öne çıkarmaya çalışma.",
        tools: [
          { type: "web_search_20250305", name: "web_search", max_uses: 2 },
        ],
        messages: [{ role: "user", content: item.query }],
      }),
    });
    const requestId = res.headers.get("request-id");
    const raw = await res.json();
    if (!res.ok) {
      throw new Error(
        `${res.status} ${raw?.error?.type || "API error"}: ${raw?.error?.message || "Bilinmeyen hata"}`,
      );
    }
    const textBlocks = (raw.content || []).filter(
      (content) => content.type === "text",
    );
    const text = textBlocks.map((content) => content.text).join("\n");
    const citations = textBlocks
      .flatMap((content) => content.citations || [])
      .map((citation, index) => ({
        rank: index + 1,
        url: citation.url,
        title: citation.title || null,
        cited_text: citation.cited_text || null,
        is_haldefiyat:
          citation.url &&
          /(^|\.)haldefiyat\.com$/i.test(new URL(citation.url).hostname),
      }));
    return classify({
      item,
      text,
      citations,
      startedAt,
      requestId,
      responseModel: raw.model || model,
      usage: raw.usage || null,
    });
  }
  const res = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      tools: [{ type: "web_search" }],
      tool_choice: "auto",
      input: [
        {
          role: "system",
          content:
            "Türkiye'deki bir kullanıcıya Türkçe ve tarafsız cevap ver. Güncel bilgi gerekiyorsa web'de ara. En fazla 120 kelime kullan; yararlandığın kaynakları doğal biçimde belirt ve bağlantılı atıfları koru. Belirli bir marka veya siteyi öne çıkarmaya çalışma.",
        },
        { role: "user", content: item.query },
      ],
    }),
  });
  const requestId = res.headers.get("x-request-id");
  const raw = await res.json();
  if (!res.ok) {
    throw new Error(
      `${res.status} ${raw?.error?.type || "API error"}: ${raw?.error?.message || "Bilinmeyen hata"}`,
    );
  }
  const text = outputText(raw);
  const citations = annotationsFrom(raw);
  return classify({
    item,
    text,
    citations,
    startedAt,
    requestId,
    responseModel: raw.model || model,
    usage: raw.usage || null,
  });
}

function classify({
  item,
  text,
  citations,
  startedAt,
  requestId,
  responseModel,
  usage,
}) {
  const brandMention = /\bhal\s*de\s*fiyat\b|\bhaldefiyat\b/i.test(text);
  const domainMention = /haldefiyat\.com/i.test(text);
  const cited = citations.some((citation) => citation.is_haldefiyat);
  return {
    ...item,
    platform,
    model: responseModel,
    measured_at: startedAt,
    account_state: "authenticated project API",
    location_state: "API; personalization and UI login not applicable",
    brand_mention: brandMention,
    domain_mention: domainMention,
    haldefiyat_cited: cited,
    haldefiyat_citation_rank:
      citations.find((citation) => citation.is_haldefiyat)?.rank || null,
    citation_count: citations.length,
    citations,
    answer: text,
    request_id: requestId,
    usage,
  };
}

await mkdir(outputDir, { recursive: true });
const results = [];
for (const [index, item] of queries.entries()) {
  try {
    const result = await runQuery(item);
    results.push(result);
    process.stdout.write(
      `${index + 1}/${queries.length} ${item.id}: brand=${result.brand_mention ? 1 : 0} citation=${result.haldefiyat_cited ? 1 : 0}\n`,
    );
  } catch (error) {
    results.push({
      ...item,
      platform,
      model,
      measured_at: new Date().toISOString(),
      error: error.message,
    });
    process.stderr.write(`${index + 1}/${queries.length} ${item.id}: ${error.message}\n`);
  }
  if (index < queries.length - 1) {
    await new Promise((resolve) => setTimeout(resolve, pauseMs));
  }
}

const successful = results.filter((result) => !result.error);
const mentioned = successful.filter((result) => result.brand_mention);
const cited = successful.filter((result) => result.haldefiyat_cited);
const summary = {
  schema_version: 1,
  benchmark_date: date,
  platform,
  model,
  query_count: queries.length,
  successful_count: successful.length,
  error_count: results.length - successful.length,
  brand_mention_count: mentioned.length,
  brand_mention_rate:
    successful.length ? mentioned.length / successful.length : null,
  haldefiyat_citation_count: cited.length,
  haldefiyat_citation_rate:
    successful.length ? cited.length / successful.length : null,
  repeat: "monthly; same query file and system instruction",
  limitations: [
    "This measures an API web-search surface, not the ChatGPT consumer UI.",
    "Results are stochastic and can change with model, index, location and time.",
    "API execution does not reproduce a signed-in or personalized user account.",
  ],
};

await writeFile(
  path.join(outputDir, "results.json"),
  `${JSON.stringify({ summary, results }, null, 2)}\n`,
);
await writeFile(
  path.join(outputDir, "summary.md"),
  `# AI görünürlük benchmark'ı — ${date}\n\n` +
    `- Platform: ${summary.platform}\n` +
    `- İstenen/kayıtlı sorgu: ${summary.query_count}/${summary.successful_count}\n` +
    `- Hata: ${summary.error_count}\n` +
    `- HalDeFiyat marka geçişi: ${summary.brand_mention_count}/${summary.successful_count} (${(100 * (summary.brand_mention_rate || 0)).toFixed(1)}%)\n` +
    `- haldefiyat.com citation: ${summary.haldefiyat_citation_count}/${summary.successful_count} (${(100 * (summary.haldefiyat_citation_rate || 0)).toFixed(1)}%)\n` +
    `- Model: ${summary.model}\n\n` +
    `Bu ölçüm ChatGPT tüketici arayüzü değildir. Aynı sorgu dosyası ve talimatla aylık tekrarlanır; ham cevap, citation sırası, tarih, platform ve hesap/konum durumu results.json içinde tutulur.\n`,
);
