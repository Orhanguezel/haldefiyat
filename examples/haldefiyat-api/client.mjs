#!/usr/bin/env node

const baseUrl = process.env.HALDEFIYAT_API_URL || "https://haldefiyat.com/api/v1";
const product = process.argv[2] || "domates";

async function get(path, params = {}) {
  const url = new URL(`${baseUrl}${path}`);
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) url.searchParams.set(key, String(value));
  }
  const response = await fetch(url, {
    headers: { accept: "application/json", "user-agent": "HalDeFiyat-API-Example/1.0" },
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) throw new Error(`${response.status} ${url}`);
  return response.json();
}

const prices = await get("/prices", { product, range: "7d", limit: 5 });
console.log(`Ürün: ${product}`);
console.log(`Son veri tarihi: ${prices.meta.latestRecordedDate ?? "yok"}`);
console.log(`Toplam kayıt: ${prices.meta.total}`);

for (const row of prices.items) {
  console.log(
    `${row.recordedDate} | ${row.marketName} | ${row.avgPrice} ${row.currency}/${row.unit}` +
      `${row.isStale ? " | ESKİ VERİ" : ""}`,
  );
}
