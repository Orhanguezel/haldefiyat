import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const PRODUCTS_URL = "https://haldefiyat.com/api/v1/prices/products";
const manifestPath = fileURLToPath(new URL("../public/images/urunler/manifest.json", import.meta.url));

function resolveImage(images, slug, canonicalSlug) {
  if (images[slug]) return { source: "exact", key: slug, path: images[slug] };
  if (canonicalSlug && images[canonicalSlug]) {
    return { source: "canonical_exact", key: canonicalSlug, path: images[canonicalSlug] };
  }

  if (canonicalSlug) {
    const parts = canonicalSlug.split("-");
    for (let i = parts.length - 1; i >= 1; i -= 1) {
      const key = parts.slice(0, i).join("-");
      if (images[key]) return { source: "canonical_prefix", key, path: images[key] };
    }
  }

  const parts = slug.split("-");
  for (let i = parts.length - 1; i >= 1; i -= 1) {
    const key = parts.slice(0, i).join("-");
    if (images[key]) return { source: "prefix", key, path: images[key] };
  }
  return { source: "missing", key: null, path: null };
}

const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
const response = await fetch(PRODUCTS_URL, { headers: { accept: "application/json" } });
if (!response.ok) throw new Error(`Ürün API isteği başarısız: HTTP ${response.status}`);
const payload = await response.json();
const products = Array.isArray(payload) ? payload : payload.items ?? [];

const rows = products.map((product) => ({
  id: product.id,
  slug: product.slug,
  name: product.displayName || product.nameTr,
  category: product.categorySlug,
  canonicalSlug: product.canonicalSlug || null,
  ...resolveImage(manifest, product.slug, product.canonicalSlug),
}));

const sources = ["exact", "canonical_exact", "canonical_prefix", "prefix", "missing"];
const sourceCounts = Object.fromEntries(sources.map((source) => [source, rows.filter((row) => row.source === source).length]));
const missing = rows.filter((row) => row.source === "missing");
const missingFamilies = new Map();
for (const row of missing) {
  const key = row.canonicalSlug || row.slug;
  const current = missingFamilies.get(key) ?? { key, category: row.category, rows: 0, products: [] };
  current.rows += 1;
  current.products.push(row.slug);
  missingFamilies.set(key, current);
}

const result = {
  generatedAt: new Date().toISOString(),
  productsUrl: PRODUCTS_URL,
  productCount: rows.length,
  manifestEntries: Object.keys(manifest).length,
  uniqueImageFiles: new Set(Object.values(manifest)).size,
  sourceCounts,
  missingProductCount: missing.length,
  missingFamilyCount: missingFamilies.size,
  missingFamilies: [...missingFamilies.values()].sort((a, b) => b.rows - a.rows || a.key.localeCompare(b.key, "tr")),
  unsafePrefixMatches: rows.filter((row) => row.source === "prefix" || row.source === "canonical_prefix"),
};

console.log(JSON.stringify(result, null, 2));
