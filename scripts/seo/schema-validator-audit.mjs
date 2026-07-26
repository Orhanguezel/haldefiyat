import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const outputDir = process.argv[2] || "artifacts/seo/schema-validator-2026-07-27";
const urls = [
  "https://haldefiyat.com/",
  "https://haldefiyat.com/fiyatlar",
  "https://haldefiyat.com/urun/acur",
  "https://haldefiyat.com/hal/izmir-hal",
  "https://haldefiyat.com/analiz/hal-fiyati-nasil-belirlenir",
  "https://haldefiyat.com/rapor/yillik/2025",
  "https://haldefiyat.com/metodoloji",
  "https://haldefiyat.com/yazar/orhan-guzel",
];

function fileSlug(url) {
  const pathname = new URL(url).pathname;
  return pathname === "/" ? "home" : pathname.slice(1).replaceAll("/", "--");
}

function stripXssi(text) {
  return text.replace(/^\)\]\}'\s*/, "");
}

await mkdir(outputDir, { recursive: true });
const results = [];

for (const url of urls) {
  const body = new URLSearchParams({ url });
  const response = await fetch("https://validator.schema.org/validate", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded;charset=UTF-8" },
    body,
  });
  const raw = await response.text();
  if (!response.ok) throw new Error(`${url}: validator HTTP ${response.status}`);
  const parsed = JSON.parse(stripXssi(raw));
  const row = {
    url,
    checkedAt: new Date().toISOString(),
    totalNumErrors: parsed.totalNumErrors ?? null,
    totalNumWarnings: parsed.totalNumWarnings ?? null,
    types: [...new Set((parsed.tripleGroups ?? []).map((group) => group.type).filter(Boolean))].sort(),
  };
  results.push(row);
  await writeFile(
    path.join(outputDir, `${fileSlug(url)}.json`),
    `${JSON.stringify(parsed, null, 2)}\n`,
  );
  console.log(`${url} errors=${row.totalNumErrors} warnings=${row.totalNumWarnings} types=${row.types.join(",")}`);
}

await writeFile(path.join(outputDir, "summary.json"), `${JSON.stringify(results, null, 2)}\n`);

