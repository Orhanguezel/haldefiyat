/**
 * Geriye dönük fiyat çekici (CLI).
 *
 * Kullanım örnekleri:
 *   bun scripts/backfill.ts konya_resmi 2020-01-01 2026-04-20
 *   bun scripts/backfill.ts izmir_sebzemeyve 2024-01-01 2026-04-21
 *   bun scripts/backfill.ts konya_resmi --from-options   # Konya sayfasındaki
 *                                                         # tüm option tarihleri
 *
 * Her tarih için `runSourceFetch(source, date, { backfill: true })` çağırır.
 * DB'ye `hf_price_history` tablosuna yazılır. Aynı (product, market, date)
 * için upsert (ON DUPLICATE KEY UPDATE) olduğu için idempotent — tekrar
 * çalıştırmak güvenli.
 *
 * Rate limit: varsayılan 500ms gecikme, --delay ile değiştirilebilir.
 */

import { getSourceByKey } from "@/config/etl-sources";
import { runSourceFetch } from "@/modules/etl/fetcher";

interface Args {
  source:   string;
  from?:    string;
  to?:      string;
  fromOptions: boolean;
  delayMs:  number;
  skipExisting: boolean;
}

function parseArgs(argv: string[]): Args {
  const out: Args = { source: "", fromOptions: false, delayMs: 500, skipExisting: false };
  const pos: string[] = [];
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]!;
    if (a === "--from-options") out.fromOptions = true;
    else if (a === "--skip-existing") out.skipExisting = true;
    else if (a === "--delay") out.delayMs = parseInt(argv[++i] ?? "500", 10);
    else if (a.startsWith("--")) { /* ignore unknown */ }
    else pos.push(a);
  }
  out.source = pos[0] ?? "";
  out.from   = pos[1];
  out.to     = pos[2];
  return out;
}

function iso(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function* dateRange(fromIso: string, toIso: string): Generator<string> {
  const cur = new Date(`${fromIso}T12:00:00Z`);
  const end = new Date(`${toIso}T12:00:00Z`);
  while (cur.getTime() <= end.getTime()) {
    yield iso(cur);
    cur.setUTCDate(cur.getUTCDate() + 1);
  }
}

/**
 * Konya sayfasındaki <option value="YYYY-MM-DD"> listesini çek — 2020'e yakın
 * gün. Sadece Konya SSR için işe yarıyor (diğer kaynaklarda option yok).
 */
async function fetchKonyaOptionDates(baseUrl: string, endpoint: string): Promise<string[]> {
  const res = await fetch(baseUrl + endpoint, {
    headers: {
      "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0",
      "Accept-Language": "tr-TR,tr;q=0.9",
    },
  });
  const html = await res.text();
  const re = /<option[^>]*value="(\d{4}-\d{2}-\d{2})"/g;
  const set = new Set<string>();
  for (const m of html.matchAll(re)) set.add(m[1]!);
  return [...set].sort();
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.source) {
    console.error("Kullanım: bun scripts/backfill.ts <source> <fromDate> <toDate>");
    console.error("        : bun scripts/backfill.ts konya_resmi --from-options");
    process.exit(1);
  }

  const source = getSourceByKey(args.source);
  if (!source) {
    console.error(`Bilinmeyen kaynak: ${args.source}`);
    process.exit(1);
  }

  let dates: string[];
  if (args.fromOptions) {
    console.log(`[backfill] ${source.key}: option listesi çekiliyor...`);
    dates = await fetchKonyaOptionDates(source.baseUrl, source.endpointTemplate);
    console.log(`[backfill] ${dates.length} tarih bulundu (${dates[0]} → ${dates[dates.length - 1]})`);
  } else {
    if (!args.from || !args.to) {
      console.error("<fromDate> ve <toDate> zorunlu (YYYY-MM-DD)");
      process.exit(1);
    }
    dates = [...dateRange(args.from, args.to)];
    console.log(`[backfill] ${source.key}: ${dates.length} gün taranacak (${args.from} → ${args.to})`);
  }

  let success = 0;
  let empty = 0;
  let failed = 0;
  let totalInserted = 0;
  const t0 = Date.now();

  for (let i = 0; i < dates.length; i++) {
    const date = dates[i]!;
    try {
      const r = await runSourceFetch(source, date, { backfill: true });
      totalInserted += r.inserted;
      if (r.inserted > 0) success++;
      else empty++;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      // 404/500/204 — kaynak o gün yayınlamamış, fail değil empty say
      if (/HTTP (404|500|503|204)/.test(msg)) {
        empty++;
      } else {
        failed++;
        console.error(`[${i + 1}/${dates.length}] ${date}: HATA ${msg}`);
      }
    }

    if (i % 10 === 0 || i === dates.length - 1) {
      const elapsed = ((Date.now() - t0) / 1000).toFixed(0);
      const rate = (success + empty + failed) / Math.max(1, Date.now() - t0) * 1000;
      const remaining = ((dates.length - i - 1) / Math.max(rate, 0.01)).toFixed(0);
      console.log(
        `[${i + 1}/${dates.length}] ${date}  ` +
        `ok=${success} empty=${empty} fail=${failed}  ` +
        `toplam=${totalInserted}  ${elapsed}s geçti, ~${remaining}s kaldı`,
      );
    }

    if (args.delayMs > 0 && i < dates.length - 1) {
      await new Promise((r) => setTimeout(r, args.delayMs));
    }
  }

  const durationS = ((Date.now() - t0) / 1000).toFixed(0);
  console.log(`\n[backfill] TAMAMLANDI (${durationS}s):`);
  console.log(`  başarılı: ${success}, boş: ${empty}, hata: ${failed}`);
  console.log(`  toplam yazılan satır: ${totalInserted}`);
  process.exit(0);
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
