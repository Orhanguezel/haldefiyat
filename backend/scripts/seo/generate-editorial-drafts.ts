/**
 * Generate AI editorial drafts for master product pages.
 *
 * Usage:
 *   bun scripts/seo/generate-editorial-drafts.ts --dry-run --limit=1
 *   bun scripts/seo/generate-editorial-drafts.ts --apply --priority=cluster --provider=groq
 */
import "dotenv/config";
import { eq, inArray } from "drizzle-orm";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { db, pool } from "../../src/db/client";
import { hfProductEditorial, hfProducts } from "../../src/db/schema";

type Priority = "cluster" | "singleton" | "all";
type Provider = "groq" | "openai" | "anthropic";
type EditorialDraft = {
  about: string;
  priceFactors: string;
  season: string;
  productionRegion: string;
  qualityIndicators: string;
  culinaryUses: string;
};
type PriorityRow = {
  priority: number;
  type: "cluster" | "singleton";
  masterSlug: string;
  displayNameHam: string;
  categorySlug: string;
  clusterSize: number;
};
type ProductRow = {
  slug: string;
  nameTr: string;
  categorySlug: string;
  aliases: string[] | null;
  displayName: string | null;
};

const rawArgs = process.argv.slice(2);
const shouldApply = rawArgs.includes("--apply");
const priority = readArg("--priority=", "all") as Priority;
const provider = readArg("--provider=", "groq") as Provider;
const priorityPath = readArg("--priority-csv=", "../data/seo/editorial-priority.csv");
const limit = Number(readArg("--limit=", "5"));
const force = rawArgs.includes("--force");
const delayMs = Number(readArg("--delay-ms=", "5000"));

if (rawArgs.includes("--help") || rawArgs.includes("-h")) {
  console.log(`Usage:
  bun scripts/seo/generate-editorial-drafts.ts [--dry-run] [--apply]
    --provider=groq|openai|anthropic
    --priority=cluster|singleton|all
    --priority-csv=../data/seo/editorial-priority.csv
    --limit=5
    --force
    --delay-ms=5000
`);
  process.exit(0);
}

function readArg(prefix: string, fallback: string): string {
  return rawArgs.find((arg) => arg.startsWith(prefix))?.slice(prefix.length) ?? fallback;
}

function parseCsvLine(line: string): string[] {
  const cells: string[] = [];
  let current = "";
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    const next = line[i + 1];
    if (ch === '"' && quoted && next === '"') {
      current += '"';
      i++;
      continue;
    }
    if (ch === '"') {
      quoted = !quoted;
      continue;
    }
    if (ch === "," && !quoted) {
      cells.push(current.trim());
      current = "";
      continue;
    }
    current += ch;
  }
  cells.push(current.trim());
  return cells;
}

function readPriorityRows(path: string): PriorityRow[] {
  const absolute = resolve(process.cwd(), path);
  if (!existsSync(absolute)) throw new Error(`Priority CSV bulunamadi: ${absolute}`);
  const lines = readFileSync(absolute, "utf8")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const header = parseCsvLine(lines[0]!);
  const rows = lines.slice(1).map((line) => {
    const cells = parseCsvLine(line);
    const row = Object.fromEntries(header.map((key, i) => [key, cells[i] ?? ""]));
    return {
      priority: Number(row.priority) || 9999,
      type: row.type === "cluster" ? "cluster" : "singleton",
      masterSlug: row.master_slug,
      displayNameHam: row.display_name_ham,
      categorySlug: row.category_slug,
      clusterSize: Number(row.cluster_size) || 1,
    } satisfies PriorityRow;
  });
  return rows.sort((a, b) => a.priority - b.priority);
}

function promptFor(product: ProductRow, meta: PriorityRow, relatedSlugs: string[]) {
  const displayName = product.displayName || product.nameTr || meta.displayNameHam;
  const aliases = Array.isArray(product.aliases) ? product.aliases.join(", ") : "";
  const genitiveName = withTurkishGenitive(displayName);
  return `Tarım ürünü için hal fiyatları sayfasında kullanılacak editoryel içerik yaz.

Ürün bilgisi:
- slug: ${product.slug}
- display_name: ${displayName}
- category_slug: ${product.categorySlug}
- biliyor olduğun aliases (varsa): ${aliases || "yok"}
- cluster büyüklüğü (varsa): ${meta.clusterSize}
- ilgili master slugları (varsa): ${relatedSlugs.join(", ") || "yok"}

Üretmeni istediğim 6 alan, JSON formatında:

{
  "about": "90-120 kelime. ${genitiveName} Türkiye'deki yeri, yıllık üretim hacmi (TÜİK gerçek sayı bil veya yaklaşık ver), kültürel önemi, dünya sıralaması.",
  "priceFactors": "60-100 kelime. Bu ürüne özel 3-5 fiyat faktörü. Spesifik ol.",
  "season": "40-60 kelime. Spesifik hasat tarihleri, açık alan ve sera ayrımı, depo ürünü penceresi.",
  "productionRegion": "60-80 kelime. İlk 3 üretici il, ilçe detayı, iklim/toprak gerekçesi.",
  "qualityIndicators": "50-70 kelime. Toptancıların aradığı kalite kriterleri.",
  "culinaryUses": "50-70 kelime. Türk mutfağında kullanım örnekleri, yıllık kişi başı tüketim."
}

Hatırla:
- Yalnızca yukarıdaki 6 anahtarlı JSON döndür.
- Markdown veya ek açıklama ekleme.
- Sayılar yaklaşık ama gerçekçi olmalı; kanıtsız üstünlük iddiası yazma.`;
}

function withTurkishGenitive(name: string) {
  const trimmed = name.trim();
  const lastVowel = [...trimmed.toLocaleLowerCase("tr-TR")]
    .reverse()
    .find((ch) => "aıoueiöü".includes(ch));
  const suffix = lastVowel && "eiöü".includes(lastVowel) ? "in" : "ın";
  const separator = /[a-zçğıöşü]$/u.test(trimmed) ? "" : "'";
  return `${trimmed}${separator}${suffix}`;
}

const systemPrompt = `Sen Türkiye tarım sektöründe uzman bir editörsün. Toptancı hal sektörünü
ve hal fiyat dinamiklerini biliyorsun. Sade, faktüel, pazarlama dilinden
arınmış Türkçe ile yazıyorsun.

Yazım kuralları:
- Cümleler 12-22 kelime arası.
- "Ayrıca", "üstelik", "kesinlikle", "şüphesiz" gibi AI-style bağlaçlardan kaçın.
- Kanıtsız iddialarda bulunma.
- Sayı verirken kaynağı belirt: TÜİK, FAO veya sektör raporu.
- Her cümle bilgi taşımalı; süs cümle kullanma.
- Yanıt formatı yalnızca JSON.`;

const rejectPatterns = [
  /\b(ayrıca|üstelik|kesinlikle|şüphesiz|elbette)\b/giu,
  /\b(en lezzetli|dünyaca ünlü|gururu)\b/giu,
  /\b(çok|son derece|oldukça)\s+(önemli|büyük|geniş)\b/giu,
];

function wordCount(text: string) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function validateDraft(draft: EditorialDraft): string[] {
  const errors: string[] = [];
  for (const [key, text] of Object.entries(draft)) {
    const words = wordCount(text);
    if (words < 30) errors.push(`${key} too short (${words} kelime)`);
    if (words > 200) errors.push(`${key} too long (${words} kelime)`);
    for (const pattern of rejectPatterns) {
      pattern.lastIndex = 0;
      if (pattern.test(text)) errors.push(`${key} matched reject pattern: ${pattern}`);
    }
  }
  return errors;
}

function parseDraft(content: string): EditorialDraft {
  const match = content.match(/\{[\s\S]*\}/u);
  const raw = match ? match[0] : content;
  const parsed = JSON.parse(raw) as Partial<EditorialDraft>;
  const required: Array<keyof EditorialDraft> = [
    "about",
    "priceFactors",
    "season",
    "productionRegion",
    "qualityIndicators",
    "culinaryUses",
  ];
  for (const key of required) {
    if (typeof parsed[key] !== "string" || !parsed[key]?.trim()) {
      throw new Error(`LLM JSON eksik alan: ${key}`);
    }
  }
  return parsed as EditorialDraft;
}

async function callOpenAiCompatible(url: string, apiKey: string, model: string, userPrompt: string) {
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      temperature: 0.35,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    }),
    signal: AbortSignal.timeout(90_000),
  });
  if (!res.ok) throw new Error(`${provider} API ${res.status}: ${await res.text()}`);
  const json = await res.json() as { choices?: Array<{ message?: { content?: string } }> };
  return json.choices?.[0]?.message?.content ?? "";
}

async function callAnthropic(apiKey: string, userPrompt: string) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.ANTHROPIC_MODEL ?? "claude-3-5-haiku-latest",
      max_tokens: 1800,
      temperature: 0.35,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    }),
    signal: AbortSignal.timeout(90_000),
  });
  if (!res.ok) throw new Error(`anthropic API ${res.status}: ${await res.text()}`);
  const json = await res.json() as { content?: Array<{ type: string; text?: string }> };
  return json.content?.find((part) => part.type === "text")?.text ?? "";
}

async function generateDraft(userPrompt: string): Promise<EditorialDraft> {
  const content = provider === "groq"
    ? await callOpenAiCompatible(
      "https://api.groq.com/openai/v1/chat/completions",
      requiredEnv("GROQ_API_KEY"),
      process.env.GROQ_MODEL ?? "llama-3.3-70b-versatile",
      userPrompt,
    )
    : provider === "openai"
      ? await callOpenAiCompatible(
        "https://api.openai.com/v1/chat/completions",
        requiredEnv("OPENAI_API_KEY"),
        process.env.OPENAI_MODEL ?? "gpt-4o-mini",
        userPrompt,
      )
      : await callAnthropic(requiredEnv("ANTHROPIC_API_KEY"), userPrompt);

  return parseDraft(content);
}

function requiredEnv(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} env tanimli degil`);
  return value;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function upsertDraft(product: ProductRow, draft: EditorialDraft, relatedSlugs: string[]) {
  await db.insert(hfProductEditorial).values({
    productSlug: product.slug,
    aboutMd: draft.about,
    priceFactorsMd: draft.priceFactors,
    seasonMd: draft.season,
    productionRegionMd: draft.productionRegion,
    qualityIndicatorsMd: draft.qualityIndicators,
    culinaryUsesMd: draft.culinaryUses,
    relatedSlugs,
    source: "ai_draft",
    publishedAt: null,
  }).onDuplicateKeyUpdate({
    set: {
      aboutMd: draft.about,
      priceFactorsMd: draft.priceFactors,
      seasonMd: draft.season,
      productionRegionMd: draft.productionRegion,
      qualityIndicatorsMd: draft.qualityIndicators,
      culinaryUsesMd: draft.culinaryUses,
      relatedSlugs,
      source: "ai_draft",
      publishedAt: null,
    },
  });
}

async function main() {
  if (!["cluster", "singleton", "all"].includes(priority)) {
    throw new Error("--priority cluster|singleton|all olmali");
  }
  if (!["groq", "openai", "anthropic"].includes(provider)) {
    throw new Error("--provider groq|openai|anthropic olmali");
  }

  const allPriorityRows = readPriorityRows(priorityPath);
  const priorityRows = allPriorityRows
    .filter((row) => priority === "all" || row.type === priority)
    .slice(0, Number.isFinite(limit) && limit > 0 ? limit : 5);
  const slugs = priorityRows.map((row) => row.masterSlug);
  const products = await db.select({
    slug: hfProducts.slug,
    nameTr: hfProducts.nameTr,
    categorySlug: hfProducts.categorySlug,
    aliases: hfProducts.aliases,
    displayName: hfProducts.displayName,
  }).from(hfProducts).where(inArray(hfProducts.slug, slugs));
  const productMap = new Map(products.map((product) => [product.slug, product]));

  const existing = force ? [] : await db.select({ productSlug: hfProductEditorial.productSlug })
    .from(hfProductEditorial)
    .where(inArray(hfProductEditorial.productSlug, slugs));
  const existingSlugs = new Set(existing.map((row) => row.productSlug));

  console.log(`[editorial] provider=${provider} priority=${priority} limit=${priorityRows.length} apply=${shouldApply}`);

  for (const row of priorityRows) {
    const product = productMap.get(row.masterSlug);
    if (!product) {
      console.warn(`[editorial] skip missing product=${row.masterSlug}`);
      continue;
    }
    if (existingSlugs.has(product.slug)) {
      console.log(`[editorial] skip existing product=${product.slug}`);
      continue;
    }

    const relatedSlugs = allPriorityRows
      .filter((item) => item.masterSlug !== product.slug && item.categorySlug === row.categorySlug)
      .slice(0, 8)
      .map((item) => item.masterSlug);
    const userPrompt = promptFor(product, row, relatedSlugs);

    if (!shouldApply) {
      console.log(`[editorial] dry-run prompt product=${product.slug}`);
      console.log(userPrompt.slice(0, 1200));
      continue;
    }

    const draft = await generateDraft(userPrompt);
    const warnings = validateDraft(draft);
    if (warnings.length) {
      console.warn(`[editorial] validation warnings product=${product.slug}`);
      for (const warning of warnings) console.warn(`  - ${warning}`);
    }
    await upsertDraft(product, draft, relatedSlugs);
    console.log(`[editorial] upserted ai_draft product=${product.slug} warnings=${warnings.length}`);
    if (delayMs > 0) await sleep(delayMs);
  }
}

main()
  .catch((err) => {
    console.error("[editorial] Fatal:", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
