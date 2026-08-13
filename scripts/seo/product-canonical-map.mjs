#!/usr/bin/env node

import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const apiBase = (process.env.HAL_API_URL ?? "https://haldefiyat.com/api/v1").replace(/\/$/, "");
const outputPath = resolve(process.argv[2] ?? "artifacts/renewal-2026/urun-eski-canonical-url-haritasi.md");

async function json(path) {
  const response = await fetch(`${apiBase}${path}`, { headers: { accept: "application/json" } });
  if (!response.ok) throw new Error(`${path}: HTTP ${response.status}`);
  return response.json();
}

const [{ items: products = [] }, { items: redirects = [] }] = await Promise.all([
  json("/prices/products"),
  json("/redirects"),
]);

const variants = products
  .filter((product) => product.canonicalSlug && product.canonicalSlug !== product.slug)
  .sort((a, b) => a.slug.localeCompare(b.slug, "tr"));
const redirectBySource = new Map(redirects.map((redirect) => [redirect.sourcePath, redirect]));
const productBySlug = new Map(products.map((product) => [product.slug, product]));

const rows = variants.map((product) => {
  const source = `/urun/${product.slug}`;
  const target = `/urun/${product.canonicalSlug}`;
  const registered = redirectBySource.get(source);
  const conflict410 = registered?.type === "410" && Number(registered.isActive) !== 0;
  const exact301 = registered?.type === "301" && registered.targetUrl === target && Number(registered.isActive) !== 0;
  const targetProduct = productBySlug.get(product.canonicalSlug);
  const targetState = !targetProduct ? "HEDEF YOK" : targetProduct.canonicalSlug ? "ZİNCİRLİ HEDEF" : "doğrudan";
  return { source, target, unit: product.unit ?? "—", exact301, conflict410, targetState };
});

const generatedAt = new Date().toISOString();
const lines = [
  "# Ürün Eski → Canonical URL Haritası",
  "",
  `Üretim zamanı: \`${generatedAt}\``,
  `Kaynak API: \`${apiBase}\``,
  "",
  "Bu dosya `hf_products.canonical_slug` alanının canlı anlık görüntüsüdür. Frontend proxy bu kayıtları istek anında 301 ile canonical ürüne yönlendirir; `hf_redirects` tablosundaki birebir kayıt yalnız ek denetim ve hit ölçümü içindir.",
  "",
  "## Özet",
  "",
  `- Aktif ürün: **${products.length}**`,
  `- Eski/varyant → canonical eşleşmesi: **${rows.length}**`,
  `- Birebir kayıtlı aktif 301: **${rows.filter((row) => row.exact301).length}**`,
  `- Aktif 410 ile çelişen eşleşme: **${rows.filter((row) => row.conflict410).length}**`,
  `- Eksik canonical hedef: **${rows.filter((row) => row.targetState === "HEDEF YOK").length}**`,
  `- Birden fazla sıçramalı canonical hedef: **${rows.filter((row) => row.targetState === "ZİNCİRLİ HEDEF").length}**`,
  `- Dinamik canonical 301'e bağlı eşleşme: **${rows.filter((row) => !row.exact301 && !row.conflict410).length}**`,
  "",
  "## Harita",
  "",
  "| Eski URL | Canonical URL | Birim | Hedef | Redirect kaydı |",
  "|---|---|---:|---|---|",
  ...rows.map((row) => `| \`${row.source}\` | \`${row.target}\` | ${row.unit} | ${row.targetState} | ${row.conflict410 ? "410 ÇAKIŞMASI" : row.exact301 ? "301 kayıtlı" : "proxy 301"} |`),
  "",
];

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${lines.join("\n")}\n`, "utf8");
console.log(JSON.stringify({
  outputPath,
  products: products.length,
  variants: rows.length,
  conflicts410: rows.filter((row) => row.conflict410).length,
  missingTargets: rows.filter((row) => row.targetState === "HEDEF YOK").length,
  chainedTargets: rows.filter((row) => row.targetState === "ZİNCİRLİ HEDEF").length,
}, null, 2));
