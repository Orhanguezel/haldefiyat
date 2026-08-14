import * as cron from "node-cron";
import type { FastifyInstance } from "fastify";
import { runDailyEtl, runSingleSource } from "@/modules/etl";
import { rebuildProductFamilies } from "@/modules/prices/family-service";
import { runMigrosEtl } from "@/modules/etl/market-scrapers/migros";
import { runMarketfiyatiEtl } from "@/modules/etl/market-scrapers/marketfiyati";
import { checkAndNotifyEtlHealth } from "@/modules/etl/health";
import { runCompetitorCheck } from "@/modules/competitor-monitor";
import { publishDailyReport } from "@/modules/telegram-channel/publisher";
import { runAllProductionSources } from "@/modules/etl/production-fetcher";
import { getSourceByKey } from "@/config/etl-sources";
import { checkAndNotifyAlerts } from "@/modules/alerts";
import { runWeeklyDigest } from "@/modules/notifications/weekly-digest";
import { runWeeklyMailDigest } from "@/modules/notifications/weekly-mail-digest";
import { calculateWeeklyIndex } from "@/modules/index";
import { generateLatestWeeklyAnalysisReport, publishScheduledReports } from "@/modules/analysis";
import { syncInflation } from "@/modules/inflation";
import { env } from "@/core/env";
import { runFirmDirectoryEtl } from "@/modules/firms/service";
import { runFirmDailyPriceReminders } from "@/modules/firms/reminders";
import { expireListings, purgeListingPersonalData, sendListingExpiryReminders } from "@/modules/listings";
import { runSeoIndexMaintenance } from "@/modules/redirects/repository";
import { submitToIndexNow } from "@/modules/indexnow";
import { cleanupOldEtlRuns } from "@/modules/etl/maintenance";
import { cleanupOldAuditLogs } from "@/modules/audit-consumers/retention";
import { checkAndNotifyEarlyWarning } from "@/modules/etl/early-warning";
import { runGscBulkRefresh } from "@/modules/seo/gsc-bulk";
import { syncSearchVolumeFromGsc } from "@/modules/seo-volume";
import { listEnabledQueuePlatforms, processSocialQueueOnce } from "@agro/shared-backend/modules/twitter";
import { runDailyMoversJob, runStaplesJob, createWeeklyAnalysisDraft } from "@/modules/social/daily-content";
import { archiveExpiredBanners, auditBannerTargets, auditLiveBannerSources, optimizeBannerPerformance, processAdPaymentReminders, sendScheduledCampaignReports, syncBannerLifecycle } from "@/modules/banners/repository";

/**
 * Cron zamanlaması env'den gelir:
 *   ETL_CRON_SCHEDULE     → varsayılan "15 3 * * *"
 *   ALERTS_CRON_SCHEDULE  → varsayılan "30 3 * * *"
 *   ETL_CRON_TIMEZONE     → varsayılan "UTC" (UTC+3 sabit olduğu için UTC en basit)
 */

type CronTask = { name: string; schedule: string; handler: () => Promise<void> };

export type CronCatalogItem = {
  name: string;
  schedule: string;
  category: "etl" | "seo" | "icerik" | "sosyal" | "bakim" | "bildirim" | "reklam";
  description: string;
};

/**
 * Admin ETL panel icin cron gorev katalogu — schedule env'den okunur, aciklama sabit.
 * Handler'lar startCron icinde register edilir; burasi salt-okunur metadata.
 */
export function getCronCatalog(): { timezone: string; tasks: CronCatalogItem[] } {
  const E = env.ETL;
  const S = env.SOCIAL;
  const tasks: CronCatalogItem[] = [
    { name: "etl-daily",          schedule: E.cronSchedule,             category: "etl",      description: "Gunluk hal fiyati ETL — tum resmi belediye + antkomder kaynaklari" },
    { name: "etl-antkomder-pm",   schedule: E.antkomderSchedule,        category: "etl",      description: "ANTKOMDER ogleden sonra ikinci cekim (fiyatlar gec yayinlaniyor)" },
    { name: "etl-health",         schedule: E.healthSchedule,           category: "bildirim", description: "ETL saglik kontrolu — sorunlu/durmus kaynaklari Telegram'a bildirir" },
    { name: "production-etl",     schedule: E.productionSchedule,       category: "etl",      description: "Uretim/borsa kaynaklari (aylik)" },
    { name: "migros-daily",       schedule: E.migrosSchedule,           category: "etl",      description: "Migros perakende fiyat ETL" },
    { name: "marketfiyati-daily", schedule: E.marketfiyatiSchedule,     category: "etl",      description: "marketfiyati.org.tr coklu zincir perakende ETL (a101/bim/carrefour...)" },
    { name: "firms-weekly",       schedule: E.firmsWeeklySchedule,      category: "etl",      description: "Halkatalogu firma rehberi — haftalik delta tarama" },
    { name: "firms-monthly",      schedule: E.firmsMonthlySchedule,     category: "etl",      description: "Halkatalogu firma rehberi — aylik tam tarama" },
    { name: "inflation-monthly",  schedule: E.inflationSchedule,        category: "etl",      description: "TCMB EVDS aylik enflasyon senkronu" },
    { name: "alerts-check",       schedule: E.alertsSchedule,           category: "bildirim", description: "Kullanici fiyat alarmlarini kontrol et + bildir" },
    { name: "early-warning",      schedule: E.earlyWarningSchedule,     category: "bildirim", description: "Firlayan temel gida erken uyarisi (sogan imzasi)" },
    { name: "competitor-monitor", schedule: E.competitorSchedule,       category: "bildirim", description: "Rakip site izleme (haftalik)" },
    { name: "index-weekly",       schedule: E.indexSchedule,            category: "icerik",   description: "Haftalik fiyat endeksi hesaplama" },
    { name: "weekly-analysis",    schedule: E.weeklyAnalysisSchedule,   category: "icerik",   description: "Haftalik analiz raporu taslagi olustur" },
    { name: "weekly-digest",      schedule: E.weeklyDigestSchedule,     category: "bildirim", description: "Haftalik ozet bildirim" },
    { name: "weekly-mail",        schedule: E.weeklyMailSchedule,       category: "bildirim", description: "Haftalik e-posta bulteni (Pazartesi)" },
    { name: "channel-publish",    schedule: E.channelPublishSchedule,   category: "sosyal",   description: "Telegram kanal gunluk fiyat paylasimi" },
    { name: "scheduled-publish",  schedule: E.scheduledPublishSchedule, category: "icerik",   description: "Zamanlanmis taslaklari yayinla + IndexNow ping" },
    { name: "seo-maintenance",    schedule: E.seoMaintenanceSchedule,   category: "seo",      description: "SEO index auto-recovery — sezonsal urun verisi donunce index/cikis" },
    { name: "gsc-index-refresh",  schedule: E.gscIndexSchedule,         category: "seo",      description: "GSC URL Inspection gunluk batch — index durumu tazeleme" },
    { name: "search-volume-sync", schedule: E.searchVolumeSchedule,     category: "seo",      description: "GSC gosterimlerinden arama hacmi doldur (haftalik)" },
    { name: "etl-retention",      schedule: E.runRetentionSchedule,     category: "bakim",    description: "Eski ETL run loglarini buda (aylik, son 90 gun tutulur)" },
    { name: "audit-retention",    schedule: E.auditRetentionSchedule,   category: "bakim",    description: "Eski audit loglarini buda (gunluk)" },
    { name: "listing-privacy-retention", schedule: E.auditRetentionSchedule, category: "bakim", description: "Cozulmus arama talebi ve suresi gecmis OTP verisini buda" },
    { name: "social-queue",       schedule: S.queueSchedule,            category: "sosyal",   description: "Sosyal medya yayin kuyrugunu isle" },
    { name: "social-daily-movers", schedule: S.dailyMoversSchedule,     category: "sosyal",   description: "Gunun en cok degisen fiyatlarini tweet et" },
    { name: "banner-lifecycle",   schedule: "*/5 * * * *",              category: "reklam",   description: "Reklam kampanya durumlari + hedef denetimi + odeme hatirlatma" },
    { name: "banner-source-audit", schedule: "15 4 * * *",              category: "reklam",   description: "Bozulan reklam kaynaklarini problem durumuna al (gunluk)" },
    { name: "banner-performance", schedule: "45 4 * * *",               category: "reklam",   description: "Reklam kreatif performansi + agirlik optimizasyonu" },
    { name: "banner-reports",     schedule: "15 5 * * *",               category: "reklam",   description: "Sponsor kampanya raporlarini gonder" },
    { name: "banner-archive",     schedule: "30 5 * * *",               category: "reklam",   description: "90 gundur tamamlanmis reklam kampanyalarini arsivle" },
  ];
  if (E.firmPriceReminderSchedule) {
    tasks.push({ name: "firm-price-reminder", schedule: E.firmPriceReminderSchedule, category: "bildirim", description: "Firma gunluk fiyat girisi hatirlatmasi" });
  }
  return { timezone: env.ETL.cronTimezone, tasks };
}

export function startCron(app: FastifyInstance): void {
  const tasks: CronTask[] = [
    { name: "etl-daily",        schedule: env.ETL.cronSchedule,          handler: () => runEtlJob(app) },
    { name: "etl-health",       schedule: env.ETL.healthSchedule,        handler: () => runEtlHealthJob(app) },
    { name: "alerts-check",     schedule: env.ETL.alertsSchedule,        handler: () => runAlertsJob(app) },
    { name: "production-etl",   schedule: env.ETL.productionSchedule,    handler: () => runProductionJob(app) },
    { name: "weekly-digest",    schedule: env.ETL.weeklyDigestSchedule,  handler: () => runWeeklyDigestJob(app) },
    { name: "index-weekly",     schedule: env.ETL.indexSchedule,         handler: () => runIndexJob(app) },
    { name: "weekly-analysis",  schedule: env.ETL.weeklyAnalysisSchedule, handler: () => runWeeklyAnalysisJob(app) },
    // Haftalık SEO auto-recovery — sezonsal ürünler verisi dönünce otomatik index/çıkış
    { name: "seo-maintenance",  schedule: env.ETL.seoMaintenanceSchedule, handler: () => runSeoMaintenanceJob(app) },
    // Aylık ETL run log retention — dashboard için son 90 gün yeterli
    { name: "etl-retention",    schedule: env.ETL.runRetentionSchedule,    handler: () => runEtlRetentionJob(app) },
    // Günlük audit log retention — tablo ~67K satir/gun büyüyor, pencere dışını buda
    { name: "audit-retention",  schedule: env.ETL.auditRetentionSchedule,   handler: () => runAuditRetentionJob(app) },
    { name: "listing-privacy-retention", schedule: env.ETL.auditRetentionSchedule, handler: () => runListingPrivacyRetentionJob(app) },
    // Haftalık erken uyarı — fırlayan temel gıdaları (soğan imzası) proaktif bildir
    { name: "early-warning",    schedule: env.ETL.earlyWarningSchedule,     handler: () => runEarlyWarningJob(app) },
    // ANTKOMDER fiyatları öğleden sonra yayınlandığı için ikinci çalıştırma
    { name: "etl-antkomder-pm",   schedule: env.ETL.antkomderSchedule,   handler: () => runAntkomderJob(app) },
    // Rakip izleme — haftalık
    { name: "competitor-monitor", schedule: env.ETL.competitorSchedule,  handler: () => runCompetitorJob(app) },
    // Telegram kanal günlük paylaşımı — 08:00 UTC = 11:00 TRT
    { name: "channel-publish",    schedule: env.ETL.channelPublishSchedule, handler: () => runChannelPublishJob(app) },
    // Migros perakende ETL — 09:00 UTC = 12:00 TRT
    { name: "migros-daily",       schedule: env.ETL.migrosSchedule,        handler: () => runMigrosJob(app) },
    // marketfiyati.org.tr çoklu zincir ETL — 09:30 UTC = 12:30 TRT
    { name: "marketfiyati-daily", schedule: env.ETL.marketfiyatiSchedule,  handler: () => runMarketfiyatiJob(app) },
    // wayback-monitor KALDIRILDI (2026-06-09): Migros ürün sayfaları Wayback'te arşivli değil,
    // backfill imkansız. İleriye-dönük retail veri toplama (marketfiyati-daily) devam ediyor.
    // Haftalik mail bulten — pazartesi 06:00 UTC = 09:00 TRT
    { name: "weekly-mail",        schedule: env.ETL.weeklyMailSchedule,    handler: () => runWeeklyMailJob(app) },
    // Aylik enflasyon (TCMB EVDS) — ayin 5'i 10:00 UTC
    { name: "inflation-monthly",  schedule: env.ETL.inflationSchedule,     handler: () => runInflationJob(app) },
    // Halkatalogu firma rehberi — haftalik delta + aylik tam tarama
    { name: "firms-weekly",       schedule: env.ETL.firmsWeeklySchedule,    handler: () => runFirmsJob(app, false) },
    { name: "firms-monthly",      schedule: env.ETL.firmsMonthlySchedule,   handler: () => runFirmsJob(app, true) },
    // GSC URL Inspection incremental — günlük batch, sitemap'i kota-dostu kapsar + taze tutar
    { name: "gsc-index-refresh",  schedule: env.ETL.gscIndexSchedule,       handler: () => runGscIndexJob(app) },
    // search_volume'u GSC gösterimlerinden doldur — haftalık (talep yavaş değişir)
    { name: "search-volume-sync", schedule: env.ETL.searchVolumeSchedule,   handler: () => runSearchVolumeJob(app) },
    { name: "social-queue",       schedule: env.SOCIAL.queueSchedule,        handler: () => runSocialQueueJob(app) },
    { name: "social-daily-movers", schedule: env.SOCIAL.dailyMoversSchedule,  handler: () => runDailyMoversTweetJob(app) },
    // Zamanlanmış yayın — publish_at zamanı gelen taslakları yayınlar + IndexNow ping
    { name: "scheduled-publish",  schedule: env.ETL.scheduledPublishSchedule, handler: () => runScheduledPublishJob(app) },
    { name: "banner-lifecycle", schedule: "*/5 * * * *", handler: async () => {
      const result = await syncBannerLifecycle();
      if (result.started || result.completed || result.cancelledReservations) app.log.info(result, "[cron:banner-lifecycle] durumlar guncellendi");
      const targetAudit = await auditBannerTargets();
      if (targetAudit.problem) app.log.warn(targetAudit, "[cron:banner-targets] gecersiz hedefler pasiflestirildi");
      const paymentReminders = await processAdPaymentReminders();
      if (paymentReminders.reminded) app.log.warn(paymentReminders, "[cron:banner-payments] geciken odemeler icin personel uyarisi olusturuldu");
    } },
    { name: "banner-source-audit", schedule: "15 4 * * *", handler: async () => {
      const result = await auditLiveBannerSources();
      if (result.problem) app.log.warn(result, "[cron:banner-quality] bozulan reklamlar problem durumuna alindi");
      else app.log.info(result, "[cron:banner-quality] gunluk kaynak denetimi tamamlandi");
    } },
    { name: "banner-performance", schedule: "45 4 * * *", handler: async () => {
      const result = await optimizeBannerPerformance();
      app.log.info(result, "[cron:banner-performance] kreatif performansi ve agirliklar guncellendi");
    } },
    { name: "banner-reports", schedule: "15 5 * * *", handler: async () => {
      const result = await sendScheduledCampaignReports();
      app.log.info(result, "[cron:banner-reports] sponsor raporlari gonderildi");
    } },
    { name: "banner-archive", schedule: "30 5 * * *", handler: async () => {
      const result = await archiveExpiredBanners();
      app.log.info(result, "[cron:banner-archive] suresi dolan kampanyalar arsivlendi");
    } },
  ];
  if (env.ETL.firmPriceReminderSchedule) {
    tasks.push({
      name: "firm-price-reminder",
      schedule: env.ETL.firmPriceReminderSchedule,
      handler: () => runFirmPriceReminderJob(app),
    });
  }
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

    // Yeni ürünler geldiyse çeşit ailelerini deterministik yeniden kur (çeşit seçici güncel kalsın)
    try {
      const fam = await rebuildProductFamilies();
      app.log.info(fam, "[cron:etl] family_slug yeniden kuruldu");
    } catch (err) {
      app.log.error({ err }, "[cron:etl] family rebuild hata");
    }

    // ETL tamamlaninca anlik alert kontrolu — sabah veri gelir gelmez kullanicilar uyarilsin
    await runAlertsJob(app);
    await runEtlHealthJob(app);
    await runListingsExpireJob(app);
    await runListingReminderJob(app);
  } catch (err) {
    app.log.error({ err }, "[cron:etl] hata");
  }
}

// Planli/zamanlanmis sosyal gönderileri yayinlar. Yayin kapisi site_settings'teki
// twitter_enabled (env TWITTER_ENABLED DEGIL); kapaliysa processSocialQueueOnce
// 'disabled' döner ve sessizce atlar.
async function runSocialQueueJob(app: FastifyInstance): Promise<void> {
  try {
    for (let i = 0; i < 10; i++) {
      const r = await processSocialQueueOnce();
      if (!r.processed) break;
      app.log.info({ id: r.id, platform: r.platform, status: r.status }, "[cron:social-queue] gönderildi");
    }
  } catch (err) {
    app.log.error({ err }, "[cron:social-queue] hata");
  }
}

// Günlük tweetleri hazırlar: movers (09:00 TR) + popüler ürün fiyatları (13:00 TR).
// İkisi de ileri tarihli kuyruğa eklenir; dispatcher vakti gelince yayınlar.
//
// Hazirlik, yayin kapisina bagli: hicbir platform aktif degilse tweet URETILMEZ.
// Aksi halde dispatcher kapaliyken kuyruk her gun buyur ve platform tekrar
// acildiginda haftalarca eski fiyat verisi topluca yayinlanir.
async function runDailyMoversTweetJob(app: FastifyInstance): Promise<void> {
  try {
    const platforms = await listEnabledQueuePlatforms();
    if (!platforms.length) {
      app.log.info("[cron:social-daily-prepare] aktif platform yok — hazirlik atlandi");
      return;
    }
    const movers = await runDailyMoversJob();
    const staples = await runStaplesJob();
    app.log.info({ movers, staples }, "[cron:social-daily-prepare] tamamlandi");
  } catch (err) {
    app.log.error({ err }, "[cron:social-daily-prepare] hata");
  }
}

/**
 * Suresi dolmak uzere olan ilanlarin sahibine uzatma hatirlatmasi.
 * Expire job'undan SONRA calisir: once bugun dolanlar kapanir, sonra 3 gun sonra
 * dolacaklara mail gider — ayni kosuda ikisi karismaz.
 */
async function runListingReminderJob(app: FastifyInstance): Promise<void> {
  const t0 = Date.now();
  try {
    const result = await sendListingExpiryReminders();
    if (result.candidates > 0) {
      app.log.info({ ...result, durationMs: Date.now() - t0 }, "[cron:listing-reminder] tamamlandi");
    }
  } catch (err) {
    app.log.error({ err }, "[cron:listing-reminder] hata");
  }
}

async function runListingsExpireJob(app: FastifyInstance): Promise<void> {
  const t0 = Date.now();
  app.log.info("[cron:listings-expire] suresi gecen ilanlar kapatiliyor");
  try {
    const expired = await expireListings();
    app.log.info({ expired, durationMs: Date.now() - t0 }, "[cron:listings-expire] tamamlandi");
  } catch (err) {
    app.log.error({ err }, "[cron:listings-expire] hata");
  }
}

async function runListingPrivacyRetentionJob(app: FastifyInstance): Promise<void> {
  try {
    const result = await purgeListingPersonalData();
    if (result.callRequestsDeleted || result.otpDeleted) {
      app.log.info(result, "[cron:listing-privacy-retention] tamamlandi");
    }
  } catch (err) {
    app.log.error({ err }, "[cron:listing-privacy-retention] hata");
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

async function runWeeklyAnalysisJob(app: FastifyInstance): Promise<void> {
  const t0 = Date.now();
  app.log.info("[cron:weekly-analysis] haftalik analiz yazisi uretiliyor");
  try {
    const report = await generateLatestWeeklyAnalysisReport();
    if (!report) {
      app.log.warn({ durationMs: Date.now() - t0 }, "[cron:weekly-analysis] yeterli veri yok");
      return;
    }
    // Haftalık analiz yayınlanınca özet tweet'i TASLAK olarak hazırla (otomatik atılmaz).
    try {
      await createWeeklyAnalysisDraft(report.baslik, report.slug);
    } catch (e) {
      app.log.warn({ err: e }, "[cron:weekly-analysis] tweet taslagi olusturulamadi");
    }
    app.log.info(
      {
        slug: report.slug,
        week: report.hafta,
        records: report.totalRecords,
        durationMs: Date.now() - t0,
      },
      "[cron:weekly-analysis] tamamlandi",
    );
  } catch (err) {
    app.log.error({ err }, "[cron:weekly-analysis] hata");
  }
}

async function runSeoMaintenanceJob(app: FastifyInstance): Promise<void> {
  const t0 = Date.now();
  app.log.info("[cron:seo-maintenance] dataQuality recalc + seoIndex flip/demote");
  try {
    const r = await runSeoIndexMaintenance();
    app.log.info(
      { flippedUp: r.flippedUp, flippedUpBorsa: r.flippedUpBorsa, flippedUpRetail: r.flippedUpRetail, flippedUpNiche: r.flippedUpNiche, demoted: r.demoted, durationMs: Date.now() - t0 },
      "[cron:seo-maintenance] tamamlandi",
    );

    // IndexNow — gunluk guncellenen hub sayfalarini Bing/Copilot'a bildir (env-gated)
    try {
      const idx = await submitToIndexNow();
      if (idx) app.log.info(idx, "[cron:seo-maintenance] indexnow ping");
    } catch (err) {
      app.log.warn({ err }, "[cron:seo-maintenance] indexnow ping hata");
    }
  } catch (err) {
    app.log.error({ err }, "[cron:seo-maintenance] hata");
  }
}

// GSC URL Inspection kotası düşük + Google hesabındaki tüm siteler paylaşır → günlük
// batch ile TUM hal URL'lerini (urun incl. noindex + hal + analiz) kademeli kapat +
// taze tut. Tek indirici burasi; sosyal platform sonuclari /gsc/export'tan okur.
async function runGscIndexJob(app: FastifyInstance): Promise<void> {
  const t0 = Date.now();
  app.log.info("[cron:gsc-index] incremental refresh basliyor");
  try {
    const r = await runGscBulkRefresh({ limit: env.ETL.gscIndexBatch });
    app.log.info({ ...r, durationMs: Date.now() - t0 }, "[cron:gsc-index] tamamlandi");
  } catch (err) {
    app.log.error({ err }, "[cron:gsc-index] hata");
  }
}

async function runScheduledPublishJob(app: FastifyInstance): Promise<void> {
  try {
    const n = await publishScheduledReports();
    if (n > 0) app.log.info({ published: n }, "[cron:scheduled-publish] rapor yayinlandi");
  } catch (err) {
    app.log.error({ err }, "[cron:scheduled-publish] hata");
  }
}

async function runSearchVolumeJob(app: FastifyInstance): Promise<void> {
  const t0 = Date.now();
  app.log.info("[cron:search-volume] GSC gösterim → search_volume senkronu");
  try {
    const r = await syncSearchVolumeFromGsc(90);
    app.log.info({ updated: r.updated, products: r.products, durationMs: Date.now() - t0 }, "[cron:search-volume] tamamlandi");
  } catch (err) {
    app.log.error({ err }, "[cron:search-volume] hata");
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

async function runEtlRetentionJob(app: FastifyInstance): Promise<void> {
  const t0 = Date.now();
  app.log.info({ retentionDays: env.ETL.runRetentionDays }, "[cron:etl-retention] eski ETL run kayitlari temizleniyor");
  try {
    const result = await cleanupOldEtlRuns(env.ETL.runRetentionDays);
    app.log.info(
      {
        deleted: result.deleted,
        cutoff: result.cutoff.toISOString(),
        durationMs: Date.now() - t0,
      },
      "[cron:etl-retention] tamamlandi",
    );
  } catch (err) {
    app.log.error({ err }, "[cron:etl-retention] hata");
  }
}

async function runEarlyWarningJob(app: FastifyInstance): Promise<void> {
  const t0 = Date.now();
  app.log.info("[cron:early-warning] firlaan temel gida taramasi");
  try {
    const result = await checkAndNotifyEarlyWarning();
    app.log.info({ ...result, durationMs: Date.now() - t0 }, "[cron:early-warning] tamamlandi");
  } catch (err) {
    app.log.error({ err }, "[cron:early-warning] hata");
  }
}

async function runAuditRetentionJob(app: FastifyInstance): Promise<void> {
  const t0 = Date.now();
  app.log.info({ retentionDays: env.ETL.auditRetentionDays }, "[cron:audit-retention] eski audit kayitlari temizleniyor");
  try {
    const result = await cleanupOldAuditLogs(env.ETL.auditRetentionDays);
    app.log.info(
      {
        deleted: result.deleted,
        cutoff: result.cutoff.toISOString(),
        durationMs: Date.now() - t0,
      },
      "[cron:audit-retention] tamamlandi",
    );
  } catch (err) {
    app.log.error({ err }, "[cron:audit-retention] hata");
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

async function runMarketfiyatiJob(app: FastifyInstance): Promise<void> {
  const t0 = Date.now();
  app.log.info("[cron:marketfiyati] coklu zincir ETL baslatiliyor");
  try {
    const result = await runMarketfiyatiEtl();
    app.log.info(
      { ...result, durationMs: Date.now() - t0 },
      "[cron:marketfiyati] tamamlandi",
    );
  } catch (err) {
    app.log.error({ err }, "[cron:marketfiyati] hata");
  }
}

async function runWeeklyMailJob(app: FastifyInstance): Promise<void> {
  const t0 = Date.now();
  app.log.info("[cron:weekly-mail] haftalik mail bulten baslatiliyor");
  try {
    const result = await runWeeklyMailDigest();
    app.log.info(
      { ...result, durationMs: Date.now() - t0 },
      "[cron:weekly-mail] tamamlandi",
    );
  } catch (err) {
    app.log.error({ err }, "[cron:weekly-mail] hata");
  }
}

async function runInflationJob(app: FastifyInstance): Promise<void> {
  const t0 = Date.now();
  app.log.info("[cron:inflation] TCMB EVDS aylik enflasyon sync baslatiliyor");
  try {
    const results = await syncInflation();
    app.log.info({ results, durationMs: Date.now() - t0 }, "[cron:inflation] tamamlandi");
  } catch (err) {
    app.log.error({ err }, "[cron:inflation] hata");
  }
}

async function runFirmPriceReminderJob(app: FastifyInstance): Promise<void> {
  const t0 = Date.now();
  app.log.info("[cron:firm-price-reminder] komisyoncu fiyat hatirlatma baslatiliyor");
  try {
    const result = await runFirmDailyPriceReminders();
    app.log.info({ ...result, durationMs: Date.now() - t0 }, "[cron:firm-price-reminder] tamamlandi");
  } catch (err) {
    app.log.error({ err }, "[cron:firm-price-reminder] hata");
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

async function runFirmsJob(app: FastifyInstance, full: boolean): Promise<void> {
  const t0 = Date.now();
  app.log.info({ full }, "[cron:firms] firma rehberi ETL baslatiliyor");
  try {
    const result = await runFirmDirectoryEtl({
      type: full ? "all" : "komisyoncu",
      all: full,
      delayMs: 750,
    });
    app.log.info({ ...result, durationMs: Date.now() - t0 }, "[cron:firms] tamamlandi");
  } catch (err) {
    app.log.error({ err }, "[cron:firms] hata");
  }
}
