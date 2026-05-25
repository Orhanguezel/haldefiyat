/**
 * Generate a weekly hal report draft from ETL price data.
 *
 * Usage:
 *   bun scripts/seo/generate-weekly-report.ts --dry-run
 *   bun scripts/seo/generate-weekly-report.ts --apply --week=2026-22 --notify
 */
import "dotenv/config";
import { env } from "../../src/core/env";
import { pool } from "../../src/db/client";
import { persistWeeklyReport } from "../../src/modules/analysis/weekly-report";

const rawArgs = process.argv.slice(2);
const shouldApply = rawArgs.includes("--apply");
const shouldNotify = rawArgs.includes("--notify");
const week = readArg("--week=");

if (rawArgs.includes("--help") || rawArgs.includes("-h")) {
  console.log(`Usage:
  bun scripts/seo/generate-weekly-report.ts [--dry-run] [--apply]
    --week=YYYY-WW
    --notify

Default mode is dry-run. --apply writes a draft into hf_analysis_reports.
`);
  process.exit(0);
}

function readArg(prefix: string): string | undefined {
  return rawArgs.find((arg) => arg.startsWith(prefix))?.slice(prefix.length);
}

async function notifyTelegram(text: string) {
  const token = env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_REVIEW_CHAT_ID || env.TELEGRAM_CHANNEL_ID;
  if (!token || !chatId) {
    console.warn("[weekly-report] Telegram env eksik, bildirim atlandi");
    return;
  }
  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: "HTML",
      disable_web_page_preview: false,
    }),
    signal: AbortSignal.timeout(30_000),
  });
  if (!res.ok) {
    console.warn(`[weekly-report] Telegram HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`);
  }
}

async function main() {
  console.log(`[weekly-report] week=${week ?? "latest"} apply=${shouldApply} notify=${shouldNotify}`);
  if (!shouldApply) {
    console.log("[weekly-report] DB'ye draft yazmak icin --apply kullan.");
    return;
  }

  const report = await persistWeeklyReport(week);
  if (!report) {
    console.log("[weekly-report] Yeterli veri yok, draft olusmadi.");
    return;
  }

  const url = `https://haldefiyat.com/analiz/${report.slug}`;
  console.log(`[weekly-report] draft=${report.slug}`);
  console.log(`[weekly-report] title=${report.title}`);
  if (shouldNotify) {
    await notifyTelegram(
      [
        "<b>Haftalik hal raporu taslagi hazir</b>",
        report.title,
        `Hafta: <code>${report.isoWeek}</code>`,
        `Kayit: ${url}`,
        "Admin panelden kontrol edip yayinlayabilirsin.",
      ].join("\n"),
    );
  }
}

main()
  .catch((err) => {
    console.error("[weekly-report] Fatal:", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
