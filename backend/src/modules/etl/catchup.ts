import { gte, sql } from "drizzle-orm";
import { activeSources } from "@/config/etl-sources";
import { db } from "@/db/client";
import { hfEtlRuns } from "@/db/schema";

/**
 * Kacirilan gunluk ETL kosusunun telafisi.
 *
 * NEDEN VAR (2026-09-22): gunluk ETL 07:30'da hic baslamadi. Gorev kayitliydi,
 * surec ayaktaydi, diger isler kostu — ama o dakikanin tetiklemesi komple
 * dustu: her 30 dakikada bir kosan `analytics-warm` de 07:30'u atladi
 * (07:01'den 08:01'e gecti). O sirada surec sosyal kart PNG'si uretiyordu;
 * event loop bloke olunca node-cron'un o dakikasi kayboldu. Kacan tetikleme
 * TEKRARLANMAZ: gunun verisi hic gelmedi, siteye bagli gunluk paylasimlar da
 * sessizce durdu. Saglik kontrolu bile susmustu — esigi 30 saat, aradan 24,5
 * saat gecmisti.
 *
 * Cozum tek bir tetiklemeye guvenmemek: saat basi "bugunun kosusu yapildi mi"
 * diye bakilir, yapilmadiysa ETL calistirilir. Idempotent bir istir (ayni gun
 * icin kaynak tekrar cekilir, satirlar upsert edilir), o yuzden fazladan bir
 * kosu zarar vermez; eksik kosu ise gunluk veriyi tamamen kaybettirir.
 */

export interface EtlCatchupDecision {
  run: boolean;
  reason: string;
}

/** `"30 7 * * *"` → `{ hour: 7, minute: 30 }`. Sabit gunluk saat degilse null. */
export function parseDailyCronTime(expression: string): { hour: number; minute: number } | null {
  const parts = expression.trim().split(/\s+/);
  if (parts.length < 5) return null;
  const [minute, hour] = parts;
  if (!/^\d{1,2}$/.test(minute ?? "") || !/^\d{1,2}$/.test(hour ?? "")) return null;
  const h = Number(hour);
  const m = Number(minute);
  if (h > 23 || m > 59) return null;
  return { hour: h, minute: m };
}

/** Verilen zaman diliminde gun icinde gecen dakika. */
export function minutesOfDayInZone(now: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat("en-GB", { timeZone, hour: "2-digit", minute: "2-digit", hour12: false }).formatToParts(now);
  const value = (type: string) => Number(parts.find((part) => part.type === type)?.value ?? "0");
  return value("hour") * 60 + value("minute");
}

/**
 * Telafi kosulmali mi?
 *
 * `ranSourceCount` = planlanan kosu saatinden bu yana veri yazan AYRI kaynak
 * sayisi. Ana ETL butun aktif kaynaklari dener; gun icindeki kucuk ek cronlar
 * (Antalya ogleden sonra, Istanbul aksam) yalniz bir-iki kaynak yazar. Esik bu
 * yuzden orantilidir: aktif kaynaklarin yarisindan azi kostuysa gunluk kosu
 * yapilmamis sayilir.
 */
export function decideEtlCatchup(input: {
  nowMinutes: number;
  scheduledMinutes: number;
  ranSourceCount: number;
  activeSourceCount: number;
  graceMinutes: number;
  deadlineMinutes: number;
}): EtlCatchupDecision {
  const due = input.scheduledMinutes + input.graceMinutes;
  if (input.nowMinutes < due) return { run: false, reason: "planlanan kosu saati henuz gecmedi" };
  if (input.nowMinutes > input.deadlineMinutes) return { run: false, reason: "telafi penceresi kapandi" };
  if (input.activeSourceCount > 0 && input.ranSourceCount * 2 >= input.activeSourceCount) {
    return { run: false, reason: `gunluk kosu yapilmis (${input.ranSourceCount}/${input.activeSourceCount} kaynak)` };
  }
  return { run: true, reason: `gunluk kosu eksik (${input.ranSourceCount}/${input.activeSourceCount} kaynak)` };
}

/** Verilen andan bu yana veri yazan ayri kaynak sayisi. */
export async function countSourcesRunSince(since: Date): Promise<number> {
  const rows = await db
    .select({ total: sql<number>`COUNT(DISTINCT ${hfEtlRuns.sourceApi})` })
    .from(hfEtlRuns)
    .where(gte(hfEtlRuns.createdAt, since));
  return Number(rows[0]?.total ?? 0);
}

/**
 * Bugunku planlanan kosunun uzerinden gecen sureye bakarak telafi karari verir.
 * Kosuyu kendisi CALISTIRMAZ — cagiran `run` degerine gore ETL'i tetikler.
 */
export async function evaluateEtlCatchup(input: {
  now?: Date;
  schedule: string;
  timeZone: string;
  graceMinutes: number;
  deadlineHour: number;
}): Promise<EtlCatchupDecision & { ranSourceCount: number; activeSourceCount: number }> {
  const now = input.now ?? new Date();
  const scheduled = parseDailyCronTime(input.schedule);
  const activeSourceCount = activeSources().length;
  if (!scheduled) {
    return { run: false, reason: `telafi desteklenmiyor: "${input.schedule}" sabit gunluk saat degil`, ranSourceCount: 0, activeSourceCount };
  }

  const nowMinutes = minutesOfDayInZone(now, input.timeZone);
  const scheduledMinutes = scheduled.hour * 60 + scheduled.minute;
  // Bugunku planlanan an — zaman diliminden bagimsiz: simdiki dakikadan
  // aradaki farki geri saymak, gun sinirini ve yaz saatini ayrica hesaplamaktan
  // daha guvenli.
  const since = new Date(now.getTime() - (nowMinutes - scheduledMinutes) * 60_000);
  const ranSourceCount = nowMinutes < scheduledMinutes ? activeSourceCount : await countSourcesRunSince(since);
  const decision = decideEtlCatchup({
    nowMinutes,
    scheduledMinutes,
    ranSourceCount,
    activeSourceCount,
    graceMinutes: input.graceMinutes,
    deadlineMinutes: input.deadlineHour * 60,
  });
  return { ...decision, ranSourceCount, activeSourceCount };
}
