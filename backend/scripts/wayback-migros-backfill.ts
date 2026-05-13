/**
 * Wayback Machine'den Migros sebze-meyve sayfasının geçmiş snapshot'larını
 * çekip hf_retail_prices tablosuna backfill yapar.
 *
 * Kullanım:
 *   bun scripts/wayback-migros-backfill.ts                       # son 12 ay
 *   bun scripts/wayback-migros-backfill.ts --from 2024-01-01     # özel başlangıç
 *   bun scripts/wayback-migros-backfill.ts --from 2024-01-01 --to 2025-06-01
 *   bun scripts/wayback-migros-backfill.ts --dry-run             # sadece listele
 *
 * Yöntem:
 *   1. CDX API → snapshot tarih listesi
 *   2. Her snapshot için web.archive.org/web/{ts}id_/{url} (id_ raw mode, archive banner yok)
 *   3. parseMigrosJsonLd → JSON-LD ItemList parse
 *   4. resolveMigrosProductId → hf_products eşleştirmesi
 *   5. hf_retail_prices upsert (recorded_date = snapshot tarihi)
 *
 * Idempotent: aynı tarih için tekrar çalıştırılabilir (ON DUPLICATE KEY UPDATE).
 *
 * NOT (2026-05-13): Wayback Machine cyberattack sonrası offline durumda.
 * Geri geldiğinde bu script tek komutla çalışır.
 */

import { db } from "@/db/client";
import { hfRetailPrices } from "@/db/schema";
import {
  parseMigrosJsonLd,
  resolveMigrosProductId,
} from "@/modules/etl/market-scrapers/migros";

const MIGROS_URL = "https://www.migros.com.tr/sebze-meyve-c-2";
const CHAIN_SLUG = "migros";
const CDX_API = "https://web.archive.org/cdx/search/cdx";
const SNAPSHOT_BASE = "https://web.archive.org/web";
const REQUEST_DELAY_MS = 1500; // Wayback rate limit dostu
const COLLAPSE_DAYS = "timestamp:6"; // YYYYMM aynı olanları tek snapshot say (ayda 1)

interface Args {
  from?: string;
  to?: string;
  dryRun: boolean;
}

function parseArgs(argv: string[]): Args {
  const out: Args = { dryRun: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]!;
    if (a === "--from") out.from = argv[++i];
    else if (a === "--to") out.to = argv[++i];
    else if (a === "--dry-run") out.dryRun = true;
  }
  return out;
}

function defaultFromDate(): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() - 1);
  return d.toISOString().slice(0, 10);
}

function isoToCdxDate(iso: string): string {
  return iso.replace(/-/g, "");
}

function cdxTimestampToIso(ts: string): string {
  return `${ts.slice(0, 4)}-${ts.slice(4, 6)}-${ts.slice(6, 8)}`;
}

interface Snapshot {
  timestamp: string;
  originalUrl: string;
}

async function listSnapshots(from: string, to: string): Promise<Snapshot[]> {
  const params = new URLSearchParams({
    url: MIGROS_URL,
    output: "json",
    from: isoToCdxDate(from),
    to: isoToCdxDate(to),
    filter: "statuscode:200",
    collapse: COLLAPSE_DAYS,
  });
  const url = `${CDX_API}?${params.toString()}`;
  console.log(`[wayback] CDX query: ${url}`);

  const res = await fetch(url, { signal: AbortSignal.timeout(60_000) });
  if (!res.ok) throw new Error(`CDX HTTP ${res.status}`);

  const rows = (await res.json()) as string[][];
  if (rows.length < 2) return [];
  // İlk satır header — atla
  return rows.slice(1).map((r) => ({ timestamp: r[1]!, originalUrl: r[2]! }));
}

async function fetchSnapshotHtml(timestamp: string, originalUrl: string): Promise<string | null> {
  // "id_" = identity, archive banner inject edilmez
  const url = `${SNAPSHOT_BASE}/${timestamp}id_/${originalUrl}`;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(60_000) });
    if (!res.ok) {
      console.warn(`[wayback] ${timestamp} HTTP ${res.status}`);
      return null;
    }
    return await res.text();
  } catch (err) {
    console.warn(`[wayback] ${timestamp} fetch error: ${err instanceof Error ? err.message : err}`);
    return null;
  }
}

async function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

async function processSnapshot(snap: Snapshot, dryRun: boolean): Promise<{
  inserted: number;
  unmatched: number;
  skipped: number;
}> {
  const recordedDate = cdxTimestampToIso(snap.timestamp);
  const result = { inserted: 0, unmatched: 0, skipped: 0 };

  const html = await fetchSnapshotHtml(snap.timestamp, snap.originalUrl);
  if (!html) {
    result.skipped++;
    return result;
  }

  const products = parseMigrosJsonLd(html);
  if (products.length === 0) {
    console.log(`[${recordedDate}] JSON-LD ItemList bulunamadı (sayfa yapısı eski olabilir)`);
    return result;
  }

  for (const p of products) {
    const productId = await resolveMigrosProductId(p.nameRaw);
    if (productId === null) {
      result.unmatched++;
      continue;
    }

    if (dryRun) {
      result.inserted++;
      continue;
    }

    try {
      await db
        .insert(hfRetailPrices)
        .values({
          productId,
          chainSlug: CHAIN_SLUG,
          price: p.price.toFixed(2),
          currency: "TRY",
          unit: "kg",
          productNameRaw: p.nameRaw,
          productUrl: p.url || null,
          recordedDate: new Date(`${recordedDate}T12:00:00`),
        })
        .onDuplicateKeyUpdate({
          set: {
            price: p.price.toFixed(2),
            productNameRaw: p.nameRaw,
            productUrl: p.url || null,
          },
        });
      result.inserted++;
    } catch {
      result.skipped++;
    }
  }

  return result;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const from = args.from ?? defaultFromDate();
  const to = args.to ?? new Date().toISOString().slice(0, 10);

  console.log(`[wayback-migros-backfill] aralık: ${from} → ${to}`);
  console.log(`[wayback-migros-backfill] dry-run: ${args.dryRun}`);

  let snapshots: Snapshot[];
  try {
    snapshots = await listSnapshots(from, to);
  } catch (err) {
    console.error(`[wayback] CDX query başarısız: ${err instanceof Error ? err.message : err}`);
    console.error("Wayback Machine offline olabilir. Sonra tekrar deneyin.");
    process.exit(1);
  }

  console.log(`[wayback] ${snapshots.length} snapshot bulundu`);
  if (snapshots.length === 0) return;

  let totalInserted = 0;
  let totalUnmatched = 0;
  let totalSkipped = 0;

  for (const snap of snapshots) {
    const recordedDate = cdxTimestampToIso(snap.timestamp);
    const r = await processSnapshot(snap, args.dryRun);
    totalInserted += r.inserted;
    totalUnmatched += r.unmatched;
    totalSkipped += r.skipped;
    console.log(
      `[${recordedDate}] inserted=${r.inserted} unmatched=${r.unmatched} skipped=${r.skipped}`,
    );
    await sleep(REQUEST_DELAY_MS);
  }

  console.log(
    `[özet] snapshot=${snapshots.length} inserted=${totalInserted} unmatched=${totalUnmatched} skipped=${totalSkipped}`,
  );
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
