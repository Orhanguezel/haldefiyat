import * as cron from "node-cron";
import type { FastifyInstance } from "fastify";
import { runDailyEtl, runSingleSource } from "@/modules/etl";
import { runMigrosEtl } from "@/modules/etl/market-scrapers/migros";
import { checkAndNotifyEtlHealth } from "@/modules/etl/health";
import { runCompetitorCheck } from "@/modules/competitor-monitor";
import { publishDailyReport } from "@/modules/telegram-channel/publisher";
import { runAllProductionSources } from "@/modules/etl/production-fetcher";
import { getSourceByKey } from "@/config/etl-sources";
import { checkAndNotifyAlerts } from "@/modules/alerts";
import { runWeeklyDigest } from "@/modules/notifications/weekly-digest";
import { calculateWeeklyIndex } from "@/modules/index";
import { env } from "@/core/env";

/**
 * Cron zamanlaması env'den gelir:
 *   ETL_CRON_SCHEDULE     → varsayılan "15 3 * * *"
 *   ALERTS_CRON_SCHEDULE  → varsayılan "30 3 * * *"
 *   ETL_CRON_TIMEZONE     → varsayılan "UTC" (UTC+3 sabit olduğu için UTC en basit)
 */

type CronTask = { name: string; schedule: string; handler: () => Promise<void> };

export function startCron(app: FastifyInstance): void {
  const tasks: CronTask[] = [
    { name: "etl-daily",        schedule: env.ETL.cronSchedule,          handler: () => runEtlJob(app) },
    { name: "etl-health",       schedule: env.ETL.healthSchedule,        handler: () => runEtlHealthJob(app) },
    { name: "alerts-check",     schedule: env.ETL.alertsSchedule,        handler: () => runAlertsJob(app) },
    { name: "production-etl",   schedule: env.ETL.productionSchedule,    handler: () => runProductionJob(app) },
    { name: "weekly-digest",    schedule: env.ETL.weeklyDigestSchedule,  handler: () => runWeeklyDigestJob(app) },
    { name: "index-weekly",     schedule: env.ETL.indexSchedule,         handler: () => runIndexJob(app) },
    // ANTKOMDER fiyatları öğleden sonra yayınlandığı için ikinci çalıştırma
    { name: "etl-antkomder-pm",   schedule: env.ETL.antkomderSchedule,   handler: () => runAntkomderJob(app) },
    // Rakip izleme — haftalık
    { name: "competitor-monitor", schedule: env.ETL.competitorSchedule,  handler: () => runCompetitorJob(app) },
    // Telegram kanal günlük paylaşımı — 08:00 UTC = 11:00 TRT
    { name: "channel-publish",    schedule: env.ETL.channelPublishSchedule, handler: () => runChannelPublishJob(app) },
    // Migros perakende ETL — 09:00 UTC = 12:00 TRT
    { name: "migros-daily",       schedule: env.ETL.migrosSchedule,        handler: () => runMigrosJob(app) },
  ];

  for (const t of tasks) {
    if (!cron.validate(t.schedule)) {
      app.log.error({ task: t.name, schedule: t.schedule }, "[cron] gecersiz schedule");
      continue;
    }

    cron.schedule(
      t.schedule,
      () => {
        void t.handler().catch((err) => {
          app.log.error({ task: t.name, err }, "[cron] gorev hatasi");
        });
      },
      { timezone: env.ETL.cronTimezone },
    );

    app.log.info({ task: t.name, schedule: t.schedule, tz: env.ETL.cronTimezone }, "[cron] kayit edildi");
  }
}

async function runEtlJob(app: FastifyInstance): Promise<void> {
  const t0 = Date.now();
  app.log.info("[cron:etl] baslatiliyor");
  try {
    const results = await runDailyEtl();
    const inserted = results.reduce((s, r) => s + r.inserted, 0);
    const skipped  = results.reduce((s, r) => s + r.skipped, 0);
    app.log.info(
      { inserted, skipped, durationMs: Date.now() - t0, sources: results.map((r) => r.source) },
      "[cron:etl] tamamlandi",
    );

    // ETL tamamlaninca anlik alert kontrolu — sabah veri gelir gelmez kullanicilar uyarilsin
    await runAlertsJob(app);
    await runEtlHealthJob(app);
  } catch (err) {
    app.log.error({ err }, "[cron:etl] hata");
  }
}

async function runEtlHealthJob(app: FastifyInstance): Promise<void> {
  const t0 = Date.now();
  app.log.info("[cron:etl-health] kontrol baslatiliyor");
  try {
    const result = await checkAndNotifyEtlHealth();
    app.log.info({ ...result, durationMs: Date.now() - t0 }, "[cron:etl-health] tamamlandi");
  } catch (err) {
    app.log.error({ err }, "[cron:etl-health] hata");
  }
}

async function runProductionJob(app: FastifyInstance): Promise<void> {
  const t0 = Date.now();
  app.log.info("[cron:production] yillik uretim ETL baslatiliyor");
  try {
    const results = await runAllProductionSources();
    const inserted = results.reduce((s, r) => s + r.inserted, 0);
    app.log.info(
      { inserted, durationMs: Date.now() - t0, sources: results.map((r) => r.source) },
      "[cron:production] tamamlandi",
    );
  } catch (err) {
    app.log.error({ err }, "[cron:production] hata");
  }
}

async function runWeeklyDigestJob(app: FastifyInstance): Promise<void> {
  const t0 = Date.now();
  app.log.info("[cron:weekly-digest] haftalik bulten baslatiliyor");
  try {
    const result = await runWeeklyDigest();
    app.log.info({ ...result, durationMs: Date.now() - t0 }, "[cron:weekly-digest] tamamlandi");
  } catch (err) {
    app.log.error({ err }, "[cron:weekly-digest] hata");
  }
}

async function runIndexJob(app: FastifyInstance): Promise<void> {
  const t0 = Date.now();
  app.log.info("[cron:index] haftalik endeks hesaplaniyor");
  try {
    const result = await calculateWeeklyIndex();
    if (result) {
      app.log.info(
        { week: result.indexWeek, value: result.indexValue, products: result.productsCount, durationMs: Date.now() - t0 },
        "[cron:index] tamamlandi",
      );
    } else {
      app.log.warn({ durationMs: Date.now() - t0 }, "[cron:index] bu hafta icin yeterli veri yok");
    }
  } catch (err) {
    app.log.error({ err }, "[cron:index] hata");
  }
}

async function runAlertsJob(app: FastifyInstance): Promise<void> {
  const t0 = Date.now();
  app.log.info("[cron:alerts] kontrol baslatiliyor");
  try {
    const result = await checkAndNotifyAlerts();
    app.log.info(
      { ...result, durationMs: Date.now() - t0 },
      "[cron:alerts] tamamlandi",
    );
  } catch (err) {
    app.log.error({ err }, "[cron:alerts] hata");
  }
}

async function runAntkomderJob(app: FastifyInstance): Promise<void> {
  const sources = ["antalya_merkez_antkomder", "antalya_serik_antkomder", "antalya_kumluca_antkomder"];
  app.log.info({ sources }, "[cron:antkomder] ogleden sonra calistiriliyor");
  for (const key of sources) {
    const t0 = Date.now();
    const source = getSourceByKey(key);
    if (!source?.enabled) {
      app.log.info({ key }, "[cron:antkomder] kaynak devre disi, atlandi");
      continue;
    }
    try {
      const r = await runSingleSource(key);
      app.log.info({ key, inserted: r.inserted, skipped: r.skipped, durationMs: Date.now() - t0 }, "[cron:antkomder] tamamlandi");
    } catch (err) {
      app.log.error({ key, err }, "[cron:antkomder] hata");
    }
  }
  await runEtlHealthJob(app);
}

async function runChannelPublishJob(app: FastifyInstance): Promise<void> {
  app.log.info("[cron:channel-publish] Telegram kanal paylaşımı başlatılıyor");
  try {
    await publishDailyReport();
    app.log.info("[cron:channel-publish] tamamlandı");
  } catch (err) {
    app.log.error({ err }, "[cron:channel-publish] hata");
  }
}

async function runMigrosJob(app: FastifyInstance): Promise<void> {
  const t0 = Date.now();
  app.log.info("[cron:migros] perakende ETL baslatiliyor");
  try {
    const result = await runMigrosEtl();
    app.log.info(
      { ...result, durationMs: Date.now() - t0 },
      "[cron:migros] tamamlandi",
    );
  } catch (err) {
    app.log.error({ err }, "[cron:migros] hata");
  }
}

async function runCompetitorJob(app: FastifyInstance): Promise<void> {
  const t0 = Date.now();
  app.log.info("[cron:competitor] rakip izleme baslatiliyor");
  try {
    const results = await runCompetitorCheck();
    const ok = results.filter((r) => r.ok).length;
    app.log.info(
      { total: results.length, ok, durationMs: Date.now() - t0 },
      "[cron:competitor] tamamlandi",
    );
  } catch (err) {
    app.log.error({ err }, "[cron:competitor] hata");
  }
}
