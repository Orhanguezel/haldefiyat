import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { JSDOM } from "jsdom";

const url = process.argv[2] || "https://haldefiyat.com/hal/antalya-hal-serik";
const outputDir = process.argv[3] || "artifacts/seo/keyword-density-2026-07-27";
const phrases = [
  "antalya",
  "serik",
  "hal",
  "fiyat",
  "fiyatları",
  "antalya serik hali",
  "antalya serik hali fiyatları",
  "serik hali",
  "hal fiyatları",
  "güncel hal fiyatları",
  "toptan fiyat",
  "güncel fiyat listesi",
];

function normalizedText(node) {
  return (node?.textContent ?? "")
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function countWords(text) {
  return text.match(/[\p{L}\p{N}]+(?:['’.-][\p{L}\p{N}]+)*/gu)?.length ?? 0;
}

function countPhrase(text, phrase) {
  const source = text.toLocaleLowerCase("tr-TR");
  const target = phrase.toLocaleLowerCase("tr-TR");
  let count = 0;
  let offset = 0;
  while ((offset = source.indexOf(target, offset)) !== -1) {
    count += 1;
    offset += target.length;
  }
  return count;
}

function cleanClone(node, selectors) {
  const clone = node.cloneNode(true);
  clone.querySelectorAll(selectors).forEach((item) => item.remove());
  return clone;
}

const response = await fetch(url, { headers: { "user-agent": "HalDeFiyat-SEO-Audit/1.0" } });
if (!response.ok) throw new Error(`HTTP ${response.status}: ${url}`);
const html = await response.text();
const dom = new JSDOM(html);
const { document } = dom.window;
const baseNoise = "script,style,noscript,svg,template,[aria-hidden='true'],[hidden]";
const body = cleanClone(document.body, baseNoise);
const main = document.querySelector("main") ?? document.body;
const editorial = cleanClone(
  main,
  `${baseNoise},table,nav,footer,form,select,option,button,aside,[role='dialog'],[data-nosnippet]`,
);
const fullText = normalizedText(body);
const editorialText = normalizedText(editorial);
const fullWords = countWords(fullText);
const editorialWords = countWords(editorialText);
const title = normalizedText(document.querySelector("title"));
const description = document.querySelector("meta[name='description']")?.getAttribute("content")?.trim() ?? "";
const canonical = document.querySelector("link[rel='canonical']")?.getAttribute("href") ?? "";
const robots = document.querySelector("meta[name='robots']")?.getAttribute("content") ?? "";
const h1 = [...document.querySelectorAll("h1")].map(normalizedText).filter(Boolean);
const h2 = [...document.querySelectorAll("h2")].map(normalizedText).filter(Boolean);

const counts = phrases.map((phrase) => {
  const full = countPhrase(fullText, phrase);
  const edit = countPhrase(editorialText, phrase);
  return {
    phrase,
    full,
    editorial: edit,
    fullPer100Words: fullWords ? Number(((full / fullWords) * 100).toFixed(2)) : 0,
    editorialPer100Words: editorialWords ? Number(((edit / editorialWords) * 100).toFixed(2)) : 0,
  };
});

const report = {
  url,
  checkedAt: new Date().toISOString(),
  httpStatus: response.status,
  htmlBytes: Buffer.byteLength(html),
  title,
  description,
  canonical,
  robots,
  h1,
  h2,
  fullVisibleWords: fullWords,
  editorialWords,
  excludedAsBoilerplate: [
    "script/style/noscript/svg/template",
    "aria-hidden/hidden",
    "table",
    "nav/footer/aside",
    "form/select/option/button/dialog",
  ],
  counts,
};

const lines = [
  "# Anahtar Kelime Yoğunluğu Canlı Kabulü — 2026-07-27",
  "",
  `- URL: \`${url}\``,
  `- Denetim zamanı: \`${report.checkedAt}\``,
  `- HTTP: **${response.status}**`,
  `- Title: ${title}`,
  `- Description: ${description}`,
  `- H1: ${h1.join(" | ")}`,
  `- H2: ${h2.join(" | ")}`,
  `- Canonical: \`${canonical}\``,
  `- Robots: \`${robots || "(varsayılan index/follow)"}\``,
  `- Tüm görünür metin: **${fullWords} kelime**`,
  `- Boilerplate/tablo/form hariç ana içerik: **${editorialWords} kelime**`,
  "",
  "| İfade | Tüm görünür | /100 kelime | Ana içerik | /100 kelime |",
  "|---|---:|---:|---:|---:|",
  ...counts.map((row) =>
    `| ${row.phrase} | ${row.full} | ${row.fullPer100Words} | ${row.editorial} | ${row.editorialPer100Words} |`
  ),
  "",
  "## Yöntem sınırı",
  "",
  "Bu bir sıralama puanı değildir. Tablo, navigasyon, footer, form kontrolleri,",
  "gizli/aria-hidden kopyalar, script/style/SVG ve seçenekler ana editoryal",
  "yoğunluktan çıkarılmıştır. Sonuç keyword stuffing hedefi olarak kullanılmaz.",
  "",
];

await mkdir(outputDir, { recursive: true });
await writeFile(path.join(outputDir, "report.json"), `${JSON.stringify(report, null, 2)}\n`);
await writeFile(path.join(outputDir, "report.md"), `${lines.join("\n")}\n`);
console.log(lines.join("\n"));

