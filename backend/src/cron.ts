import * as cron from "node-cron";
import type { FastifyInstance } from "fastify";
import { runDailyEtl } from "@/modules/etl";
import { checkAndNotifyAlerts } from "@/modules/alerts";
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
    { name: "etl-daily",    schedule: env.ETL.cronSchedule,    handler: () => runEtlJob(app) },
    { name: "alerts-check", schedule: env.ETL.alertsSchedule,  handler: () => runAlertsJob(app) },
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
  } catch (err) {
    app.log.error({ err }, "[cron:etl] hata");
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
