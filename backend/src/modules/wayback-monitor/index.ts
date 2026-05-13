/**
 * Wayback Machine durum izleyici.
 *
 * Internet Archive 2026-05-13'te cyberattack sonrası offline duruma düştü.
 * Migros tarihçesi backfill scripti hazır (scripts/wayback-migros-backfill.ts)
 * ama Wayback geri gelene kadar çalışmaz.
 *
 * Bu modül her 6 saatte bir CDX API'sini probe eder, online olduğunda
 * tek seferlik Telegram bildirimi gönderir. State filesystem'da tutulur
 * (PM2 restart'a dayanıklı).
 *
 * Env:
 *   TELEGRAM_BOT_TOKEN
 *   TELEGRAM_CHAT_ID (veya ETL_HEALTH_TELEGRAM_CHAT_IDS — virgüllü)
 *   WAYBACK_STATE_FILE (default: /root/haldefiyat-src/.wayback-state)
 */

import { readFile, writeFile } from "node:fs/promises";
import { env } from "@/core/env";
import { sendTelegramAlert } from "@/modules/alerts/telegram";

const PROBE_URL = "https://web.archive.org/cdx/search/cdx?url=migros.com.tr&limit=1&output=json";
const STATE_FILE = process.env.WAYBACK_STATE_FILE || "/root/haldefiyat-src/.wayback-state";
const PROBE_TIMEOUT_MS = 15_000;

export interface WaybackProbeResult {
  online: boolean;
  statusCode: number | null;
  notified: boolean;
  alreadyNotified: boolean;
  error?: string;
}

async function probeWayback(): Promise<{ online: boolean; statusCode: number | null; error?: string }> {
  try {
    const res = await fetch(PROBE_URL, { signal: AbortSignal.timeout(PROBE_TIMEOUT_MS) });
    if (res.status !== 200) {
      return { online: false, statusCode: res.status };
    }
    const text = await res.text();
    // Offline iken HTML "Temporarily Offline" döner; online'da JSON
    if (text.trim().startsWith("[") || text.trim().startsWith("{")) {
      return { online: true, statusCode: 200 };
    }
    return { online: false, statusCode: 200, error: "non-json body (offline page)" };
  } catch (err) {
    return { online: false, statusCode: null, error: err instanceof Error ? err.message : String(err) };
  }
}

async function readState(): Promise<{ notifiedAt: string | null }> {
  try {
    const buf = await readFile(STATE_FILE, "utf8");
    return JSON.parse(buf);
  } catch {
    return { notifiedAt: null };
  }
}

async function writeState(state: { notifiedAt: string | null }): Promise<void> {
  await writeFile(STATE_FILE, JSON.stringify(state, null, 2), "utf8");
}

function chatIdsFromEnv(): string[] {
  if (env.ETL.healthTelegramChatIds.length > 0) return env.ETL.healthTelegramChatIds;
  const single = process.env.TELEGRAM_CHAT_ID;
  return single ? [single] : [];
}

function buildMessage(): string {
  return [
    "✅ <b>Wayback Machine geri geldi</b>",
    "",
    "Migros geçmiş veri backfill scripti çalışmaya hazır:",
    "",
    "<code>ssh vps-vistainsaat 'cd /root/haldefiyat-src/backend &amp;&amp; bun scripts/wayback-migros-backfill.ts --dry-run'</code>",
    "",
    "Çıktı OK ise <code>--dry-run</code> kaldır ve gerçek backfill çalıştır.",
    "",
    "Detay: <code>CLAUDE.md</code> → Aktif Hatırlatmalar",
  ].join("\n");
}

/**
 * Wayback durumunu probe eder, online olduğunu yeni gördüyse bildirim atar.
 * Idempotent — birden çok kez çalıştırılabilir.
 */
export async function checkWaybackAndNotify(): Promise<WaybackProbeResult> {
  const probe = await probeWayback();
  const state = await readState();
  const alreadyNotified = state.notifiedAt != null;

  if (!probe.online) {
    // Hala offline. Daha önce notified olduysak state'i reset edip yeniden
    // bildirim ihtimaline açık tutalım (gelecekte yine offline → online geçişi olursa)
    if (alreadyNotified) {
      await writeState({ notifiedAt: null });
    }
    return {
      online: false,
      statusCode: probe.statusCode,
      notified: false,
      alreadyNotified,
      error: probe.error,
    };
  }

  // Online. Daha önce bildirildiyse tekrar gönderme.
  if (alreadyNotified) {
    return { online: true, statusCode: probe.statusCode, notified: false, alreadyNotified: true };
  }

  const chatIds = chatIdsFromEnv();
  if (chatIds.length === 0) {
    console.warn("[wayback-monitor] TELEGRAM_CHAT_ID tanımlı değil, bildirim atılamadı");
    // State'i set etme — env düzelince tekrar dener
    return { online: true, statusCode: probe.statusCode, notified: false, alreadyNotified: false, error: "no_chat_id" };
  }

  const message = buildMessage();
  for (const chatId of chatIds) {
    await sendTelegramAlert(chatId, message);
  }

  await writeState({ notifiedAt: new Date().toISOString() });
  return { online: true, statusCode: probe.statusCode, notified: true, alreadyNotified: false };
}
