import type { FastifyInstance } from "fastify";
import { createHash } from "node:crypto";
import { and, asc, desc, eq, inArray, like, or, sql } from "drizzle-orm";
import { computeBaseMap } from "@/modules/prices/family";
import { rebuildProductFamilies } from "@/modules/prices/family-service";
import { runSeoIndexMaintenance } from "@/modules/redirects/repository";
import { z } from "zod";

import { db, pool } from "@/db/client";
import {
  hfAlerts,
  hfAnnualEtlRuns,
  hfAnnualProduction,
  hfEtlRuns,
  hfMarkets,
  hfPriceHistory,
  hfProductEditorial,
  hfProducts,
} from "@/db/schema";
import { getAdminPriceDetail, listAdminPrices, listPriceSources } from "./prices-query";
import { loadEtlSources, getSourceByKey } from "@/config/etl-sources";
import { loadProductionSources } from "@/config/production-sources";
import { runDailyEtl, runSingleSource } from "@/modules/etl";
import { runWaybackBackfill } from "@/modules/etl/fetcher";
import { runMigrosEtl } from "@/modules/etl/market-scrapers/migros";
import { runMarketfiyatiEtl } from "@/modules/etl/market-scrapers/marketfiyati";
import { getScraperStatus } from "@/modules/etl/scraper-client";
import { getCronCatalog } from "@/cron";
import { revalidateFrontendTag } from "@/core/revalidate";
import { checkWaybackAndNotify } from "@/modules/wayback-monitor";
import { sendListingExpiryReminders } from "@/modules/listings";
import { sourceFreshness, detectPriceJumps } from "@/modules/etl/freshness";
import { checkEtlHealth, checkAndNotifyEtlHealth } from "@/modules/etl/health";
import {
  runWeeklyMailDigest,
  buildWeeklyMailPreview,
  sendWeeklyMailTest,
  createWeeklyDraft,
  sendStoredDraft,
} from "@/modules/notifications/weekly-mail-digest";
import {
  listSends,
  getSend,
  updateDraft,
  deleteDraft,
} from "@/modules/notifications/newsletter-archive";
import {
  runAllProductionSources,
  runSingleProductionSource,
} from "@/modules/etl/production-fetcher";
import { publishDailyReport } from "@/modules/telegram-channel/publisher";
import {
  latestRecordedDate,
  listPriceCategories,
  parseRangeToDays,
  upsertPriceRow,
} from "@/modules/prices/repository";
import { inferAvgPriceMethod } from "@/modules/prices/avg-price-method";
import { listProduction } from "@/modules/production/repository";
import { registerProductGsc } from "@/modules/products/product-gsc";
import { publicOrigin, readGscCategoriesForUrls } from "@/modules/seo/gsc-index";
import { unitClass, invalidateAliasCache } from "@/modules/etl/normalizer";
import { canonicalUnit } from "@/modules/etl/canonical-contract";
import {
  isOneSignalConfigured,
  sendBroadcast,
  sendToExternalIds,
} from "@/modules/notifications/onesignal";

const boolish = z.preprocess((v) => {
  if (typeof v === "boolean") return v;
  if (typeof v === "number") return v !== 0;
  if (typeof v === "string") {
    const s = v.trim().toLowerCase();
    if (["1", "true", "yes", "on"].includes(s)) return true;
    if (["0", "false", "no", "off"].includes(s)) return false;
  }
  return v;
}, z.boolean().optional());

const listPricesQuery = z.object({
  product: z.string().optional(),
  q: z.string().optional(),
  city: z.string().optional(),
  market: z.string().optional(),
  category: z.string().optional(),
  unit: z.string().optional(),
  source: z.string().optional(),
  issue: z.enum(["unit_mismatch", "inactive_product", "inactive_market", "quarantined", "any"]).optional(),
  days: z.coerce.number().int().min(1).max(9000).optional(),
  range: z.string().optional(),
  sort: z.enum(["date_desc", "date_asc", "price_desc", "price_asc", "product"]).optional(),
  limit: z.coerce.number().optional(),
  page: z.coerce.number().optional(),
  latestOnly: boolish,
});

const priceBody = z.object({
  productId: z.coerce.number().int().positive(),
  marketId: z.coerce.number().int().positive(),
  avgPrice: z.coerce.number().positive(),
  minPrice: z.coerce.number().positive().optional(),
  maxPrice: z.coerce.number().positive().optional(),
  recordedDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  sourceApi: z.string().max(64).optional(),
});

const bulkPriceBody = z.object({
  entries: z.array(priceBody).min(1).max(100),
});

const quarantineListQuery = z.object({
  status: z.enum(["pending", "approved", "rejected", "corrected", "rolled_back"]).optional().default("pending"),
  severity: z.enum(["warning", "critical"]).optional(),
  reason: z.string().max(64).optional(),
  source: z.string().max(64).optional(),
  unit: z.string().max(32).optional(),
  dateFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  dateTo: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  q: z.string().max(128).optional(),
  limit: z.coerce.number().int().min(1).max(200).optional().default(50),
  offset: z.coerce.number().int().min(0).optional().default(0),
});

const quarantineReviewBody = z.object({
  decision: z.enum(["approve", "reject", "correct"]),
  note: z.string().trim().min(3).max(2000),
  confirmCritical: z.boolean().optional().default(false),
  avgPrice: z.coerce.number().positive().optional(),
  minPrice: z.coerce.number().positive().nullable().optional(),
  maxPrice: z.coerce.number().positive().nullable().optional(),
}).superRefine((value, ctx) => {
  if (value.decision === "correct" && value.avgPrice == null) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["avgPrice"], message: "Düzeltme için ortalama fiyat zorunlu" });
  }
  if (value.minPrice != null && value.maxPrice != null && value.minPrice > value.maxPrice) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["minPrice"], message: "Minimum fiyat maksimumdan büyük olamaz" });
  }
});

const quarantineBulkPreviewBody = z.object({
  ids: z.array(z.coerce.number().int().positive()).min(1).max(100),
  decision: z.enum(["approve", "reject"]),
});

const quarantineBulkReviewBody = quarantineBulkPreviewBody.extend({
  note: z.string().trim().min(3).max(2000),
  previewToken: z.string().length(64),
  confirmBulk: z.literal(true),
  confirmCritical: z.boolean().optional().default(false),
});

const productReviewListQuery = z.object({
  status: z.enum(["pending", "aliased", "created", "rejected"]).optional().default("pending"),
  source: z.string().max(64).optional(),
  reason: z.enum(["UNKNOWN_PRODUCT", "UNKNOWN_UNIT"]).optional(),
  q: z.string().max(128).optional(),
  minAgeHours: z.coerce.number().int().min(0).max(8760).optional(),
  limit: z.coerce.number().int().min(1).max(200).optional().default(50),
  offset: z.coerce.number().int().min(0).optional().default(0),
});

const productReviewDecisionBody = z.object({
  decision: z.enum(["alias", "create", "reject"]),
  note: z.string().trim().min(3).max(2000),
  targetProductId: z.coerce.number().int().positive().optional(),
  slug: z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(128).optional(),
  nameTr: z.string().trim().min(1).max(255).optional(),
  categorySlug: z.string().trim().min(1).max(64).optional(),
  unit: z.string().trim().min(1).max(32).optional(),
}).superRefine((value, ctx) => {
  if (value.decision === "alias" && !value.targetProductId) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["targetProductId"], message: "Alias hedef ürünü zorunlu" });
  }
  if (value.decision === "create" && value.nameTr) {
    const issue = productNameIssue(value.nameTr);
    if (issue) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["nameTr"], message: issue });
  }
  if (value.decision === "create" && (!value.slug || !value.nameTr || !value.categorySlug || !value.unit)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["slug"], message: "Yeni ürün alanları zorunlu" });
  }
});

/**
 * Urun adi saglik kontrolu — bozuk ad SITEDE gorunur.
 *
 * 2026-09-02'de canlida bulundu: "DOMATES (...)", "SALATALIK (...)",
 * "PORTAKAL (...)", "Pazı)". Ucu de indeksli ve en cok arananlar arasindaydi;
 * urun sayfasi editoryal adi kullandigi icin temiz gorunuyordu ama urun listesi
 * ucu (/prices/products) ham adi donduruyor — otomatik tamamlama, dropdown ve
 * ilan kayitlarina bu bozuk ad giriyordu.
 *
 * Parantezli nitelendirme mesrudur ("Domates (Salkım)"); yasak olan DENGESIZ
 * parantez ve icerigi olmayan/elips parantez.
 */
export function productNameIssue(name: string): string | null {
  const open = (name.match(/\(/g) ?? []).length;
  const close = (name.match(/\)/g) ?? []).length;
  if (open !== close) return "Ürün adında parantezler dengesiz.";
  if (/\(\s*\.*\s*\)/.test(name)) return "Ürün adında içi boş veya '...' içeren parantez olamaz.";
  return null;
}

const productBody = z.object({
  slug: z.string().min(1).max(128),
  nameTr: z.string().min(1).max(255).refine((v) => productNameIssue(v) === null, {
    message: "Ürün adında dengesiz veya boş parantez var",
  }),
  categorySlug: z.string().min(1).max(64).default("diger"),
  unit: z.string().min(1).max(32).default("kg"),
  aliases: z.array(z.string().min(1)).optional().default([]),
  seoIndex: boolish.default(false),
  displayName: z.string().max(160).optional().nullable(),
  imageUrl: z.string().max(512).optional().nullable(),
  canonicalSlug: z.string().max(128).optional().nullable(),
  familySlug: z.string().max(128).optional().nullable(),
  dataQuality: z.coerce.number().int().min(0).max(100).optional().default(0),
  searchVolume: z.coerce.number().int().min(0).optional().default(0),
  displayOrder: z.coerce.number().int().optional().default(0),
  isActive: boolish.default(true),
});

const productEditorialBody = z.object({
  aboutMd: z.string().optional().default(""),
  priceFactorsMd: z.string().optional().default(""),
  seasonMd: z.string().optional().default(""),
  productionRegionMd: z.string().optional().default(""),
  qualityIndicatorsMd: z.string().optional().nullable(),
  culinaryUsesMd: z.string().optional().nullable(),
  relatedSlugs: z.array(z.string().min(1)).optional().default([]),
  source: z.enum(["manual", "ai_draft", "ai_reviewed"]).optional().default("manual"),
  reviewedBy: z.string().max(36).optional().nullable(),
  published: boolish.default(false),
});

const marketBody = z.object({
  slug: z.string().min(1).max(128),
  name: z.string().min(1).max(255),
  cityName: z.string().min(1).max(128),
  regionSlug: z.string().max(64).optional().nullable(),
  sourceKey: z.string().max(64).optional().nullable(),
  displayOrder: z.coerce.number().int().optional().default(0),
  address: z.string().max(255).optional().nullable(),
  phone: z.string().max(64).optional().nullable(),
  founded: z.string().max(32).optional().nullable(),
  hours: z.string().max(64).optional().nullable(),
  marketType: z.enum(["hal", "borsa", "resmi", "kooperatif"]).optional(),
  seoIndex: boolish.optional(),
  isActive: boolish.default(true),
});

const alertListQuery = z.object({
  productSlug: z.string().optional(),
  isActive: boolish,
  limit: z.coerce.number().optional(),
});

const alertPatchBody = z.object({
  isActive: boolish.optional(),
});

const productionListQuery = z.object({
  species: z.string().optional(),
  region: z.string().optional(),
  category: z.string().optional(),
  yearFrom: z.coerce.number().int().optional(),
  yearTo: z.coerce.number().int().optional(),
  limit: z.coerce.number().optional(),
});

const productionBody = z.object({
  year: z.coerce.number().int().min(1900).max(2100),
  species: z.string().min(1).max(255),
  speciesSlug: z.string().min(1).max(128),
  categorySlug: z.string().min(1).max(64).default("diger"),
  regionSlug: z.string().min(1).max(64).default("tr"),
  productionTon: z.coerce.number().positive(),
  sourceApi: z.string().min(1).max(64),
  note: z.string().max(255).optional().nullable(),
});

const etlBody = z.object({
  source: z.string().min(1).max(64).optional().default("all"),
  date: z.string().regex(/^(\d{4}-\d{2}-\d{2}|id:\d+)$/).optional(),
});

const pushBody = z.object({
  title: z.string().min(1).max(100),
  message: z.string().min(1).max(500),
  url: z.string().url().optional(),
  externalIds: z.array(z.string().min(1)).optional(),
});

function likeSafe(raw?: string): string | undefined {
  const value = String(raw || "").trim().replace(/[%_\\]/g, "");
  return value || undefined;
}

type QuarantineDbRow = Record<string, unknown> & {
  id: number;
  product_id: number;
  market_id: number;
  recorded_date: string | Date;
  source_api: string;
  unit: string;
  min_price: number | string | null;
  max_price: number | string | null;
  avg_price: number | string;
  severity: "warning" | "critical";
  status: string;
};

function bulkPreviewToken(rows: QuarantineDbRow[], decision: "approve" | "reject"): string {
  const stable = [...rows]
    .sort((a, b) => Number(a.id) - Number(b.id))
    .map((row) => [row.id, row.status, row.severity, String(row.avg_price), String(row.recorded_date)]);
  return createHash("sha256").update(JSON.stringify({ decision, rows: stable })).digest("hex");
}

async function selectExistingPrice(connection: Awaited<ReturnType<typeof pool.getConnection>>, row: QuarantineDbRow) {
  const [rows] = await connection.query(
    `SELECT id,product_id,market_id,min_price,max_price,avg_price,avg_price_method,currency,unit,recorded_date,source_api
     FROM hf_price_history WHERE product_id=? AND market_id=? AND recorded_date=? FOR UPDATE`,
    [row.product_id, row.market_id, row.recorded_date],
  );
  return (rows as Array<Record<string, unknown>>)[0] ?? null;
}

async function applyQuarantineDecision(
  connection: Awaited<ReturnType<typeof pool.getConnection>>,
  row: QuarantineDbRow,
  input: { decision: "approve" | "reject" | "correct"; note: string; reviewer: string; avgPrice?: number; minPrice?: number | null; maxPrice?: number | null },
) {
  const status = input.decision === "approve" ? "approved" : input.decision === "correct" ? "corrected" : "rejected";
  const before = status === "rejected" ? null : await selectExistingPrice(connection, row);
  let after: Record<string, unknown> | null = null;
  if (status !== "rejected") {
    const avg = status === "corrected" ? input.avgPrice : row.avg_price;
    const min = status === "corrected" ? (input.minPrice ?? null) : row.min_price;
    const max = status === "corrected" ? (input.maxPrice ?? null) : row.max_price;
    await connection.query(
      `INSERT INTO hf_price_history (product_id,market_id,min_price,max_price,avg_price,avg_price_method,currency,unit,recorded_date,source_api)
       VALUES (?,?,?,?,?,?,'TRY',?,?,?) ON DUPLICATE KEY UPDATE min_price=VALUES(min_price),max_price=VALUES(max_price),
       avg_price=VALUES(avg_price),avg_price_method=VALUES(avg_price_method),unit=VALUES(unit),source_api=VALUES(source_api)`,
      [row.product_id, row.market_id, min, max, avg,
       inferAvgPriceMethod({ minPrice: min, maxPrice: max, avgPrice: avg as number | string, method: status === "corrected" ? "reported" : undefined }),
       row.unit, row.recorded_date, `${String(row.source_api)}:reviewed`.slice(0, 64)],
    );
    after = await selectExistingPrice(connection, row);
  }
  await connection.query(
    "UPDATE hf_price_quarantine SET status=?,review_note=?,reviewed_by=?,reviewed_at=CURRENT_TIMESTAMP(3) WHERE id=?",
    [status, input.note, input.reviewer, row.id],
  );
  await connection.query(
    `INSERT INTO hf_price_quarantine_decisions (quarantine_id,action,before_price_json,after_price_json,note,reviewed_by)
     VALUES (?,?,?,?,?,?)`,
    [row.id, input.decision, before ? JSON.stringify(before) : null, after ? JSON.stringify(after) : null, input.note, input.reviewer],
  );
  return status;
}

async function getPriceDetail(id: number) {
  const rows = await db
    .select({
      id: hfPriceHistory.id,
      productId: hfPriceHistory.productId,
      marketId: hfPriceHistory.marketId,
      minPrice: hfPriceHistory.minPrice,
      maxPrice: hfPriceHistory.maxPrice,
      avgPrice: hfPriceHistory.avgPrice,
      currency: hfPriceHistory.currency,
      unit: hfPriceHistory.unit,
      recordedDate: hfPriceHistory.recordedDate,
      sourceApi: hfPriceHistory.sourceApi,
      productSlug: hfProducts.slug,
      productName: hfProducts.nameTr,
      marketSlug: hfMarkets.slug,
      marketName: hfMarkets.name,
      cityName: hfMarkets.cityName,
    })
    .from(hfPriceHistory)
    .innerJoin(hfProducts, eq(hfProducts.id, hfPriceHistory.productId))
    .innerJoin(hfMarkets, eq(hfMarkets.id, hfPriceHistory.marketId))
    .where(eq(hfPriceHistory.id, id))
    .limit(1);

  return rows[0] ?? null;
}

export async function registerHalAdmin(app: FastifyInstance) {
  await registerProductGsc(app);

  app.get("/hal/price-quarantine", async (req, reply) => {
    const parsed = quarantineListQuery.safeParse(req.query);
    if (!parsed.success) return reply.status(400).send({ error: "Gecersiz sorgu", details: parsed.error.flatten() });
    const { status, severity, reason, source, unit, dateFrom, dateTo, q, limit, offset } = parsed.data;
    const filters = ["pq.status = ?"];
    const values: Array<string | number> = [status];
    if (severity) { filters.push("pq.severity = ?"); values.push(severity); }
    if (reason) { filters.push("pq.reason_code = ?"); values.push(reason); }
    if (source) { filters.push("pq.source_api = ?"); values.push(source); }
    if (unit) { filters.push("pq.unit = ?"); values.push(unit); }
    if (dateFrom) { filters.push("pq.recorded_date >= ?"); values.push(dateFrom); }
    if (dateTo) { filters.push("pq.recorded_date <= ?"); values.push(dateTo); }
    if (q?.trim()) { filters.push("(p.name_tr LIKE ? OR p.slug LIKE ? OR m.name LIKE ?)"); const term = `%${likeSafe(q) ?? ""}%`; values.push(term, term, term); }
    const where = filters.join(" AND ");
    const [items] = await pool.query(
      `SELECT pq.id, pq.product_id AS productId, p.name_tr AS productName, p.slug AS productSlug,
              pq.market_id AS marketId, m.name AS marketName, pq.recorded_date AS recordedDate,
              pq.source_api AS sourceApi, pq.unit, pq.min_price AS minPrice, pq.max_price AS maxPrice,
              pq.avg_price AS avgPrice, pq.reason_code AS reasonCode, pq.severity, pq.confidence,
              pq.peer_median AS peerMedian, pq.deviation_ratio AS deviationRatio, pq.status,
              pq.review_note AS reviewNote, pq.reviewed_by AS reviewedBy, pq.reviewed_at AS reviewedAt,
              pq.created_at AS createdAt
       FROM hf_price_quarantine pq
       JOIN hf_products p ON p.id = pq.product_id
       JOIN hf_markets m ON m.id = pq.market_id
       WHERE ${where} ORDER BY FIELD(pq.severity,'critical','warning'), pq.created_at DESC LIMIT ? OFFSET ?`,
      [...values, limit, offset],
    );
    const [countRows] = await pool.query(
      `SELECT COUNT(*) AS total FROM hf_price_quarantine pq
       JOIN hf_products p ON p.id = pq.product_id JOIN hf_markets m ON m.id = pq.market_id WHERE ${where}`,
      values,
    );
    const [slaRows] = await pool.query(
      `SELECT
         SUM(first_seen <= DATE_SUB(UTC_TIMESTAMP(), INTERVAL 24 HOUR)) AS overdue,
         SUM(severity='critical' AND first_seen <= DATE_SUB(UTC_TIMESTAMP(), INTERVAL 4 HOUR)) AS criticalOverdue,
         COALESCE(MAX(TIMESTAMPDIFF(HOUR, first_seen, UTC_TIMESTAMP())),0) AS oldestHours
       FROM (SELECT severity, created_at AS first_seen FROM hf_price_quarantine WHERE status='pending') pending`,
    );
    const sla = (slaRows as Array<{ overdue: number | string | null; criticalOverdue: number | string | null; oldestHours: number | string }>)[0];
    return reply.send({
      items,
      total: Number((countRows as Array<{ total: number | string }>)[0]?.total ?? 0),
      limit,
      offset,
      sla: { queueHours: 24, criticalHours: 4, overdue: Number(sla?.overdue ?? 0), criticalOverdue: Number(sla?.criticalOverdue ?? 0), oldestHours: Number(sla?.oldestHours ?? 0) },
    });
  });

  app.patch<{ Params: { id: string } }>("/hal/price-quarantine/:id/review", async (req, reply) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) return reply.status(400).send({ error: "Gecersiz id" });
    const parsed = quarantineReviewBody.safeParse(req.body);
    if (!parsed.success) return reply.status(400).send({ error: "Gecersiz karar", details: parsed.error.flatten() });
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      const [rows] = await connection.query("SELECT * FROM hf_price_quarantine WHERE id = ? FOR UPDATE", [id]);
      const row = (rows as QuarantineDbRow[])[0];
      if (!row) { await connection.rollback(); return reply.status(404).send({ error: "Karantina kaydi bulunamadi" }); }
      if (row.status !== "pending") { await connection.rollback(); return reply.status(409).send({ error: "Kayit daha once incelenmis" }); }
      if (row.severity === "critical" && parsed.data.decision !== "reject" && !parsed.data.confirmCritical) {
        await connection.rollback();
        return reply.status(400).send({ error: "Kritik kaydi yayinlamak icin confirmCritical=true zorunlu" });
      }
      const reviewer = String((req.user as { id?: string } | undefined)?.id ?? "admin").slice(0, 36);
      const status = await applyQuarantineDecision(connection, row, {
        decision: parsed.data.decision,
        note: parsed.data.note,
        reviewer,
        avgPrice: parsed.data.avgPrice,
        minPrice: parsed.data.minPrice,
        maxPrice: parsed.data.maxPrice,
      });
      await connection.commit();
      void revalidateFrontendTag("prices");
      return reply.send({ ok: true, id, status });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  });

  app.post("/hal/price-quarantine/bulk-preview", async (req, reply) => {
    const parsed = quarantineBulkPreviewBody.safeParse(req.body);
    if (!parsed.success) return reply.status(400).send({ error: "Gecersiz on izleme", details: parsed.error.flatten() });
    const ids = [...new Set(parsed.data.ids)].sort((a, b) => a - b);
    const placeholders = ids.map(() => "?").join(",");
    const [rawRows] = await pool.query(`SELECT * FROM hf_price_quarantine WHERE id IN (${placeholders}) ORDER BY id`, ids);
    const rows = rawRows as QuarantineDbRow[];
    const actionable = rows.filter((row) => row.status === "pending");
    return reply.send({
      requested: ids.length,
      found: rows.length,
      actionable: actionable.length,
      skipped: rows.length - actionable.length,
      critical: actionable.filter((row) => row.severity === "critical").length,
      warning: actionable.filter((row) => row.severity === "warning").length,
      decision: parsed.data.decision,
      previewToken: bulkPreviewToken(actionable, parsed.data.decision),
      items: actionable.map((row) => ({ id: row.id, severity: row.severity, avgPrice: row.avg_price, recordedDate: row.recorded_date })),
    });
  });

  app.post("/hal/price-quarantine/bulk-review", async (req, reply) => {
    const parsed = quarantineBulkReviewBody.safeParse(req.body);
    if (!parsed.success) return reply.status(400).send({ error: "Gecersiz toplu karar", details: parsed.error.flatten() });
    const ids = [...new Set(parsed.data.ids)].sort((a, b) => a - b);
    const placeholders = ids.map(() => "?").join(",");
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      const [rawRows] = await connection.query(`SELECT * FROM hf_price_quarantine WHERE id IN (${placeholders}) ORDER BY id FOR UPDATE`, ids);
      const rows = rawRows as QuarantineDbRow[];
      if (rows.length !== ids.length || rows.some((row) => row.status !== "pending")) {
        await connection.rollback();
        return reply.status(409).send({ error: "Kuyruk on izlemeden sonra degisti; yeniden on izleyin" });
      }
      if (bulkPreviewToken(rows, parsed.data.decision) !== parsed.data.previewToken) {
        await connection.rollback();
        return reply.status(409).send({ error: "On izleme anahtari gecersiz veya eskimis" });
      }
      const critical = rows.filter((row) => row.severity === "critical").length;
      if (parsed.data.decision === "approve" && critical > 0 && !parsed.data.confirmCritical) {
        await connection.rollback();
        return reply.status(400).send({ error: `${critical} kritik kayit icin ikinci kritik onayi zorunlu` });
      }
      const reviewer = String((req.user as { id?: string } | undefined)?.id ?? "admin").slice(0, 36);
      for (const row of rows) {
        await applyQuarantineDecision(connection, row, { decision: parsed.data.decision, note: parsed.data.note, reviewer });
      }
      await connection.commit();
      void revalidateFrontendTag("prices");
      return reply.send({ ok: true, reviewed: rows.length, decision: parsed.data.decision });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  });

  app.post<{ Params: { id: string } }>("/hal/price-quarantine/:id/rollback", async (req, reply) => {
    const id = Number(req.params.id);
    const noteSchema = z.object({ note: z.string().trim().min(3).max(2000), confirmRollback: z.literal(true) });
    const parsed = noteSchema.safeParse(req.body);
    if (!Number.isInteger(id) || id <= 0 || !parsed.success) return reply.status(400).send({ error: "Gecersiz geri alma istegi" });
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      const [queueRows] = await connection.query("SELECT * FROM hf_price_quarantine WHERE id=? FOR UPDATE", [id]);
      const row = (queueRows as QuarantineDbRow[])[0];
      if (!row) { await connection.rollback(); return reply.status(404).send({ error: "Karantina kaydi bulunamadi" }); }
      if (!['approved','corrected'].includes(row.status)) { await connection.rollback(); return reply.status(409).send({ error: "Yalniz yayinlanmis karar geri alinabilir" }); }
      const [decisionRows] = await connection.query(
        `SELECT * FROM hf_price_quarantine_decisions WHERE quarantine_id=? AND action IN ('approve','correct') ORDER BY id DESC LIMIT 1 FOR UPDATE`, [id],
      );
      const decision = (decisionRows as Array<{ before_price_json: Record<string, unknown> | string | null; after_price_json: Record<string, unknown> | string | null }>)[0];
      if (!decision) { await connection.rollback(); return reply.status(409).send({ error: "Geri alma snapshot'i bulunamadi" }); }
      const parseJson = (value: Record<string, unknown> | string | null) => typeof value === "string" ? JSON.parse(value) as Record<string, unknown> : value;
      const before = parseJson(decision.before_price_json);
      const after = parseJson(decision.after_price_json);
      const current = await selectExistingPrice(connection, row);
      if (!after || !current || Number(current.id) !== Number(after.id) || String(current.source_api) !== String(after.source_api) || String(current.avg_price) !== String(after.avg_price)) {
        await connection.rollback();
        return reply.status(409).send({ error: "Yayinlanan fiyat daha sonra degisti; otomatik geri alma guvenli degil" });
      }
      if (before) {
        await connection.query(
          `UPDATE hf_price_history SET min_price=?,max_price=?,avg_price=?,avg_price_method=?,currency=?,unit=?,source_api=? WHERE id=?`,
          [before.min_price, before.max_price, before.avg_price, before.avg_price_method, before.currency, before.unit, before.source_api, before.id],
        );
      } else {
        await connection.query("DELETE FROM hf_price_history WHERE id=?", [current.id]);
      }
      const reviewer = String((req.user as { id?: string } | undefined)?.id ?? "admin").slice(0, 36);
      await connection.query(
        "UPDATE hf_price_quarantine SET status='rolled_back',review_note=?,reviewed_by=?,reviewed_at=CURRENT_TIMESTAMP(3) WHERE id=?",
        [parsed.data.note, reviewer, id],
      );
      await connection.query(
        `INSERT INTO hf_price_quarantine_decisions (quarantine_id,action,before_price_json,after_price_json,note,reviewed_by)
         VALUES (?,'rollback',?,?,?,?)`,
        [id, JSON.stringify(current), before ? JSON.stringify(before) : null, parsed.data.note, reviewer],
      );
      await connection.commit();
      void revalidateFrontendTag("prices");
      return reply.send({ ok: true, id, status: "rolled_back", restoredPrevious: Boolean(before) });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  });

  app.get("/hal/product-review-queue", async (req, reply) => {
    const parsed = productReviewListQuery.safeParse(req.query);
    if (!parsed.success) return reply.status(400).send({ error: "Gecersiz sorgu", details: parsed.error.flatten() });
    const { status, source, reason, q, minAgeHours, limit, offset } = parsed.data;
    const filters = ["rq.status = ?"];
    const values: Array<string | number> = [status];
    if (source) { filters.push("rq.source_api = ?"); values.push(source); }
    if (reason) { filters.push("rq.reason_code = ?"); values.push(reason); }
    if (minAgeHours != null) { filters.push("rq.first_seen_at <= DATE_SUB(UTC_TIMESTAMP(), INTERVAL ? HOUR)"); values.push(minAgeHours); }
    if (q?.trim()) {
      const term = `%${likeSafe(q) ?? ""}%`;
      filters.push("(rq.raw_name LIKE ? OR rq.normalized_name LIKE ? OR rq.match_key LIKE ?)");
      values.push(term, term, term);
    }
    const where = filters.join(" AND ");
    const [items] = await pool.query(
      `SELECT rq.id, rq.source_api AS sourceApi, rq.market_id AS marketId, m.name AS marketName,
              rq.raw_name AS rawName, rq.normalized_name AS normalizedName, rq.raw_category AS rawCategory,
              rq.suggested_category AS suggestedCategory, rq.raw_unit AS rawUnit, rq.canonical_unit AS canonicalUnit,
              rq.match_key AS matchKey, rq.recorded_date AS recordedDate, rq.min_price AS minPrice,
              rq.max_price AS maxPrice, rq.avg_price AS avgPrice, rq.reason_code AS reasonCode, rq.status,
              rq.target_product_id AS targetProductId, rq.occurrence_count AS occurrenceCount,
              rq.first_seen_at AS firstSeenAt, rq.last_seen_at AS lastSeenAt,
              rq.review_note AS reviewNote, rq.reviewed_by AS reviewedBy, rq.reviewed_at AS reviewedAt
       FROM hf_product_review_queue rq LEFT JOIN hf_markets m ON m.id=rq.market_id
       WHERE ${where} ORDER BY rq.occurrence_count DESC, rq.first_seen_at ASC LIMIT ? OFFSET ?`,
      [...values, limit, offset],
    );
    const [countRows] = await pool.query(`SELECT COUNT(*) AS total FROM hf_product_review_queue rq WHERE ${where}`, values);
    const [slaRows] = await pool.query(
      `SELECT COUNT(*) AS overdue, COALESCE(MAX(TIMESTAMPDIFF(HOUR, first_seen_at, UTC_TIMESTAMP())),0) AS oldestHours
       FROM hf_product_review_queue WHERE status='pending' AND first_seen_at <= DATE_SUB(UTC_TIMESTAMP(), INTERVAL 24 HOUR)`,
    );
    const sla = (slaRows as Array<{ overdue: number | string; oldestHours: number | string }>)[0];
    return reply.send({
      items,
      total: Number((countRows as Array<{ total: number | string }>)[0]?.total ?? 0),
      limit,
      offset,
      sla: { thresholdHours: 24, overdue: Number(sla?.overdue ?? 0), oldestHours: Number(sla?.oldestHours ?? 0) },
    });
  });

  app.patch<{ Params: { id: string } }>("/hal/product-review-queue/:id/review", async (req, reply) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) return reply.status(400).send({ error: "Gecersiz id" });
    const parsed = productReviewDecisionBody.safeParse(req.body);
    if (!parsed.success) return reply.status(400).send({ error: "Gecersiz karar", details: parsed.error.flatten() });
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      const [queueRows] = await connection.query("SELECT * FROM hf_product_review_queue WHERE id=? FOR UPDATE", [id]);
      const row = (queueRows as Array<Record<string, unknown>>)[0];
      if (!row) { await connection.rollback(); return reply.status(404).send({ error: "Inceleme kaydi bulunamadi" }); }
      if (row.status !== "pending") { await connection.rollback(); return reply.status(409).send({ error: "Kayit daha once incelenmis" }); }

      const reviewer = String((req.user as { id?: string } | undefined)?.id ?? "admin").slice(0, 36);
      let targetProductId: number | null = null;
      let status: "aliased" | "created" | "rejected" = "rejected";

      if (parsed.data.decision === "alias") {
        const [productRows] = await connection.query("SELECT id, unit, aliases FROM hf_products WHERE id=? AND is_active=1 FOR UPDATE", [parsed.data.targetProductId]);
        const product = (productRows as Array<{ id: number; unit: string; aliases: string[] | string | null }>)[0];
        if (!product) { await connection.rollback(); return reply.status(404).send({ error: "Hedef urun bulunamadi" }); }
        const sourceUnit = row.canonical_unit == null ? null : String(row.canonical_unit);
        const targetUnit = canonicalUnit(product.unit);
        if (!sourceUnit || !targetUnit || sourceUnit !== targetUnit) {
          await connection.rollback();
          return reply.status(400).send({ error: `Birim uyuşmuyor: kaynak ${sourceUnit ?? "bilinmiyor"}, hedef ${targetUnit ?? product.unit}` });
        }
        let aliases: string[] = [];
        if (Array.isArray(product.aliases)) aliases = product.aliases.map(String);
        else if (typeof product.aliases === "string") {
          try { aliases = JSON.parse(product.aliases) as string[]; } catch { aliases = []; }
        }
        const rawName = String(row.raw_name);
        if (!aliases.some((alias) => alias.toLocaleLowerCase("tr-TR") === rawName.toLocaleLowerCase("tr-TR"))) aliases.push(rawName);
        await connection.query("UPDATE hf_products SET aliases=? WHERE id=?", [JSON.stringify(aliases), product.id]);
        targetProductId = product.id;
        status = "aliased";
      } else if (parsed.data.decision === "create") {
        const unit = canonicalUnit(parsed.data.unit);
        if (!unit) { await connection.rollback(); return reply.status(400).send({ error: "Canonical birim zorunlu" }); }
        const [insertResult] = await connection.query(
          `INSERT INTO hf_products (slug,name_tr,category_slug,unit,aliases,seo_index,is_active,data_quality,search_volume,display_order)
           VALUES (?,?,?,?,?,0,0,0,0,0)`,
          [parsed.data.slug, parsed.data.nameTr, parsed.data.categorySlug, unit, JSON.stringify([String(row.raw_name)])],
        );
        targetProductId = Number((insertResult as { insertId?: number }).insertId ?? 0);
        status = "created";
      }

      await connection.query(
        `UPDATE hf_product_review_queue SET status=?,target_product_id=?,review_note=?,reviewed_by=?,reviewed_at=CURRENT_TIMESTAMP(3) WHERE id=?`,
        [status, targetProductId, parsed.data.note, reviewer, id],
      );
      await connection.commit();
      if (status !== "rejected") invalidateAliasCache();
      return reply.send({ ok: true, id, status, targetProductId });
    } catch (error) {
      await connection.rollback();
      if (error instanceof Error && /ER_DUP_ENTRY|Duplicate entry/i.test(error.message)) {
        return reply.status(409).send({ error: "Slug veya inceleme karari mevcut bir kayitla cakisiyor" });
      }
      throw error;
    } finally {
      connection.release();
    }
  });

  app.get("/dashboard/summary", async (_req, reply) => {
    const [
      [pricesCount],
      [productsCount],
      [marketsCount],
      [alertsCount],
      [productionCount],
    ] = await Promise.all([
      db.select({ count: sql<number>`count(*)` }).from(hfPriceHistory),
      db.select({ count: sql<number>`count(*)` }).from(hfProducts),
      db.select({ count: sql<number>`count(*)` }).from(hfMarkets),
      db.select({ count: sql<number>`count(*)` }).from(hfAlerts).where(eq(hfAlerts.isActive, 1)),
      db.select({ count: sql<number>`count(*)` }).from(hfAnnualProduction),
    ]);

    return reply.send({
      totals: {
        prices_total: Number(pricesCount?.count ?? 0),
        hf_products_total: Number(productsCount?.count ?? 0),
        markets_total: Number(marketsCount?.count ?? 0),
        alerts_total: Number(alertsCount?.count ?? 0),
        production_total: Number(productionCount?.count ?? 0),
        users_total: 0,
        site_settings_total: 0,
      },
    });
  });

  app.get("/hal/prices", async (req, reply) => {
    const parsed = listPricesQuery.safeParse(req.query);
    if (!parsed.success) return reply.status(400).send({ error: "Gecersiz sorgu parametreleri" });
    const p = parsed.data;
    const [page, latestDate] = await Promise.all([
      listAdminPrices({
        q: p.q ?? p.product,
        city: p.city,
        market: p.market,
        category: p.category,
        unit: p.unit,
        source: p.source,
        issue: p.issue,
        sort: p.sort,
        days: p.days ?? parseRangeToDays(p.range),
        limit: p.limit ?? 50,
        page: p.page,
        latestOnly: p.latestOnly,
      }),
      latestRecordedDate(),
    ]);

    return reply.send({
      items: page.items,
      total: page.total,
      page: page.page,
      limit: page.limit,
      totalPages: page.totalPages,
      meta: { latestRecordedDate: latestDate },
    });
  });

  app.get("/hal/price-sources", async (_req, reply) => {
    return reply.send({ items: await listPriceSources() });
  });

  app.get("/hal/price-categories", async (_req, reply) => {
    return reply.send({ items: await listPriceCategories() });
  });

  app.get<{ Params: { id: string } }>("/hal/prices/:id", async (req, reply) => {
    const id = Number(req.params.id);
    if (!Number.isFinite(id) || id <= 0) return reply.status(400).send({ error: "Gecersiz id" });
    const item = await getPriceDetail(id);
    if (!item) return reply.status(404).send({ error: "Kayit bulunamadi" });
    return reply.send(item);
  });

  /** Sag panel: kayit + ciftin gecmisi + ayni gun diger haller + karantina gecmisi. */
  app.get<{ Params: { id: string } }>("/hal/prices/:id/detail", async (req, reply) => {
    const id = Number(req.params.id);
    if (!Number.isFinite(id) || id <= 0) return reply.status(400).send({ error: "Gecersiz id" });
    const detail = await getAdminPriceDetail(id);
    if (!detail) return reply.status(404).send({ error: "Kayit bulunamadi" });
    return reply.send(detail);
  });

  app.post("/hal/prices", async (req, reply) => {
    const parsed = priceBody.safeParse(req.body);
    if (!parsed.success) return reply.status(400).send({ error: "Gecersiz govde", details: parsed.error.flatten() });
    const b = parsed.data;
    await upsertPriceRow({
      productId: b.productId,
      marketId: b.marketId,
      avgPrice: b.avgPrice.toFixed(2),
      minPrice: b.minPrice != null ? b.minPrice.toFixed(2) : null,
      maxPrice: b.maxPrice != null ? b.maxPrice.toFixed(2) : null,
      recordedDate: b.recordedDate,
      sourceApi: b.sourceApi ?? "manual",
      avgPriceMethod: "reported",
    });

    const created = await db
      .select({ id: hfPriceHistory.id })
      .from(hfPriceHistory)
      .where(
        and(
          eq(hfPriceHistory.productId, b.productId),
          eq(hfPriceHistory.marketId, b.marketId),
          eq(hfPriceHistory.recordedDate, new Date(`${b.recordedDate}T12:00:00`)),
        ),
      )
      .limit(1);

    return reply.send({ ok: true, id: created[0]?.id ?? null });
  });

  app.post("/hal/prices/bulk-entry", async (req, reply) => {
    const parsed = bulkPriceBody.safeParse(req.body);
    if (!parsed.success) return reply.status(400).send({ error: "Gecersiz govde", details: parsed.error.flatten() });

    let inserted = 0;
    let skipped = 0;
    const ids: number[] = [];

    for (const b of parsed.data.entries) {
      try {
        await upsertPriceRow({
          productId: b.productId,
          marketId: b.marketId,
          avgPrice: b.avgPrice.toFixed(2),
          minPrice: b.minPrice != null ? b.minPrice.toFixed(2) : null,
          maxPrice: b.maxPrice != null ? b.maxPrice.toFixed(2) : null,
          recordedDate: b.recordedDate,
          sourceApi: b.sourceApi ?? "manual",
          avgPriceMethod: "reported",
        });
        const row = await db
          .select({ id: hfPriceHistory.id })
          .from(hfPriceHistory)
          .where(
            and(
              eq(hfPriceHistory.productId, b.productId),
              eq(hfPriceHistory.marketId, b.marketId),
              eq(hfPriceHistory.recordedDate, new Date(`${b.recordedDate}T12:00:00`)),
            ),
          )
          .limit(1);
        if (row[0]) ids.push(row[0].id);
        inserted++;
      } catch {
        skipped++;
      }
    }

    return reply.send({ ok: true, inserted, skipped, ids });
  });

  app.get("/hal/products/autocomplete", async (req, reply) => {
    const q = likeSafe(String((req.query as Record<string, unknown>).q ?? ""));
    const conds = [eq(hfProducts.isActive, 1)];
    if (q) conds.push(like(hfProducts.nameTr, `%${q}%`));
    const items = await db
      .select({ id: hfProducts.id, slug: hfProducts.slug, nameTr: hfProducts.nameTr, unit: hfProducts.unit, categorySlug: hfProducts.categorySlug })
      .from(hfProducts)
      .where(and(...conds))
      .orderBy(asc(hfProducts.nameTr))
      .limit(20);
    return reply.send({ items });
  });

  app.get("/hal/markets/autocomplete", async (req, reply) => {
    const q = likeSafe(String((req.query as Record<string, unknown>).q ?? ""));
    const conds = [eq(hfMarkets.isActive, 1)];
    if (q) conds.push(like(hfMarkets.name, `%${q}%`));
    const items = await db
      .select({ id: hfMarkets.id, slug: hfMarkets.slug, name: hfMarkets.name, cityName: hfMarkets.cityName })
      .from(hfMarkets)
      .where(and(...conds))
      .orderBy(asc(hfMarkets.displayOrder), asc(hfMarkets.name))
      .limit(20);
    return reply.send({ items });
  });

  app.patch<{ Params: { id: string } }>("/hal/prices/:id", async (req, reply) => {
    const id = Number(req.params.id);
    if (!Number.isFinite(id) || id <= 0) return reply.status(400).send({ error: "Gecersiz id" });

    const parsed = priceBody.safeParse(req.body);
    if (!parsed.success) return reply.status(400).send({ error: "Gecersiz govde", details: parsed.error.flatten() });
    const b = parsed.data;

    await db
      .update(hfPriceHistory)
      .set({
        productId: b.productId,
        marketId: b.marketId,
        avgPrice: b.avgPrice.toFixed(2),
        avgPriceMethod: "reported",
        minPrice: b.minPrice != null ? b.minPrice.toFixed(2) : null,
        maxPrice: b.maxPrice != null ? b.maxPrice.toFixed(2) : null,
        recordedDate: new Date(`${b.recordedDate}T12:00:00`),
        sourceApi: b.sourceApi ?? "manual",
      })
      .where(eq(hfPriceHistory.id, id));

    return reply.send({ ok: true });
  });

  app.get("/hal/products", async (req, reply) => {
    const query = z
      .object({
        q: z.string().optional(),
        category: z.string().optional(),
        isActive: boolish,
        seoIndex: boolish,
      })
      .safeParse(req.query);
    if (!query.success) return reply.status(400).send({ error: "Gecersiz sorgu" });

    const conds = [];
    if (query.data.category) conds.push(eq(hfProducts.categorySlug, query.data.category));
    if (query.data.isActive != null) conds.push(eq(hfProducts.isActive, query.data.isActive ? 1 : 0));
    if (query.data.seoIndex != null) conds.push(eq(hfProducts.seoIndex, query.data.seoIndex ? 1 : 0));
    const q = likeSafe(query.data.q);
    if (q) {
      conds.push(or(
        like(hfProducts.nameTr, `%${q}%`),
        like(hfProducts.slug, `%${q}%`),
        like(hfProducts.displayName, `%${q}%`),
      ));
    }

    const items = await db
      .select()
      .from(hfProducts)
      .where(conds.length ? and(...conds) : undefined)
      .orderBy(asc(hfProducts.displayOrder), asc(hfProducts.nameTr));

    const origin = publicOrigin();
    const gscMap = await readGscCategoriesForUrls(items.map((it) => `${origin}/urun/${it.slug}`));

    // Aksiyon sınıflandırması için ürün başı sinyaller: hal/borsa market sayısı, veri günü,
    // yayınlı editöryel.
    // DISTINCT market sayımı (satır değil) — runSeoIndexMaintenance ile birebir hizalı.
    // mcTotal = tüm distinct market (hal UP kriteri mc>=3), halMarkets/borsaMarkets = tip bazlı.
    //
    // SORGU YONU FIYAT GECMISINDEN URUNE DOGRUDUR, tersi degil. Onceki hali
    // urunden baslayip `ON (v.id = p.id OR v.canonical_slug = p.slug)` ile aileyi
    // buluyordu; JOIN icindeki OR indeks kullanimini imkansiz kilar (EXPLAIN:
    // type=ALL, "Range checked for each record") ve 1.248 x 1.248 tarama uretirdi
    // — uc 22 saniye suruyordu. Aile eslesmesi artik CTE'de tek yonlu iki dala
    // ayrildi; ana sorgu 30 gunluk fiyat dilimini (recorded_date indeksi) surer.
    // Olculdu: 22,4sn -> 0,58sn, 937 satirin tamami birebir ayni (2026-09-03).
    const sigRes = await db.execute(sql`
      WITH fam AS (
        SELECT id AS pid, id AS vid, unit FROM hf_products WHERE is_active = 1
        UNION
        SELECT p.id, v.id, v.unit FROM hf_products p
          JOIN hf_products v ON v.canonical_slug = p.slug AND v.is_active = 1
      )
      SELECT f.pid AS id,
        COUNT(DISTINCT ph.market_id) AS mcTotal,
        COUNT(DISTINCT CASE WHEN m.market_type = 'hal' THEN ph.market_id END) AS halMarkets,
        COUNT(DISTINCT CASE WHEN m.market_type IN ('borsa','resmi') THEN ph.market_id END) AS borsaMarkets,
        COUNT(DISTINCT ph.recorded_date) AS days30
      FROM hf_price_history ph
      -- Birim butunlugu: sayfa da yalnizca urunun kendi birimindeki satirlari
      -- gosterir. Bu filtre olmadan bayat koli satirlari kapsam sayiliyordu.
      JOIN fam f ON f.vid = ph.product_id AND f.unit = ph.unit
      JOIN hf_markets m ON m.id = ph.market_id
      WHERE ph.recorded_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
      GROUP BY f.pid
    `);
    const sigRows = (Array.isArray(sigRes) ? sigRes[0] : sigRes) as unknown as Array<{
      id: number; mcTotal: number; halMarkets: number; borsaMarkets: number; days30: number;
    }>;
    // Fiyat satiri olmayan urun sonuc kumesinde yok; okuyucular zaten 0'a dusuyor
    // (eski LEFT JOIN'in NULL -> 0 davranisiyla ayni).
    const sigMap = new Map(sigRows.map((r) => [r.id, r]));

    // Editoryel ayri ve ucuz sorgu (456 satir, ~0,02sn) — sinyal sorgusuna
    // baglandiginda gruplamayi buyutmekten baska is yapmiyordu.
    const edRes = await db.execute(sql`
      SELECT product_slug FROM hf_product_editorial WHERE published_at IS NOT NULL
    `);
    const edRows = (Array.isArray(edRes) ? edRes[0] : edRes) as unknown as Array<{ product_slug: string }>;
    const editorialSlugs = new Set(edRows.map((r) => r.product_slug));

    const classifyAction = (it: (typeof items)[number], gsc: string | null): string => {
      if (it.canonicalSlug) return "variant";
      const s = sigMap.get(it.id);
      const mc = Number(s?.mcTotal ?? 0);
      const hal = Number(s?.halMarkets ?? 0);
      const borsa = Number(s?.borsaMarkets ?? 0);
      const days = Number(s?.days30 ?? 0);
      const ed = editorialSlugs.has(it.slug);
      const dq = Number(it.dataQuality ?? 0);
      if (it.seoIndex) return gsc === "indexed" ? "indexed" : "recrawl_pending";
      // maintenance ile aynı: hal UP = hal_rows>=1 AND mc>=3 AND dq>=70; borsa UP = hal=0 AND borsa>=1 AND days>=3 AND dq>=60
      const halOk = hal >= 1 && mc >= 3 && dq >= 70;
      const borsaOk = hal === 0 && borsa >= 1 && days >= 3 && dq >= 60;
      if (halOk || borsaOk) return ed ? "maintenance_pending" : "ready_editorial";
      if (days === 0) return "seasonal_dry";
      return "needs_coverage";
    };

    const enriched = items.map((it) => {
      const g = gscMap.get(`${origin}/urun/${it.slug}`);
      const s = sigMap.get(it.id);
      return {
        ...it,
        gscCategory: g?.category ?? null,
        gscLabel: g?.label ?? null,
        hasEditorial: editorialSlugs.has(it.slug),
        halMarkets30d: Number(s?.halMarkets ?? 0),
        borsaMarkets30d: Number(s?.borsaMarkets ?? 0),
        action: classifyAction(it, g?.category ?? null),
      };
    });

    return reply.send({ items: enriched });
  });

  app.get<{ Params: { id: string } }>("/hal/products/:id", async (req, reply) => {
    const id = Number(req.params.id);
    const rows = await db.select().from(hfProducts).where(eq(hfProducts.id, id)).limit(1);
    if (!rows[0]) return reply.status(404).send({ error: "Kayit bulunamadi" });
    // Kalite gerekçesi: data_quality formülünün bileşen sinyalleri (son 30g fiyat/hal + editöryel)
    // Aile bazli (varyant satirlari dahil, birim butunlugu ile) — liste ucu ve bakim
    // isiyle ayni sayim; aksi halde panel "10 hal" derken gerekce "1 hal" diyordu.
    const statsRes = await db.execute(sql`
      SELECT COUNT(*) AS pr, COUNT(DISTINCT ph.market_id) AS mc
      FROM hf_price_history ph
      JOIN (
        SELECT id AS vid, unit FROM hf_products WHERE id = ${id}
        UNION
        SELECT v.id, v.unit FROM hf_products v WHERE v.canonical_slug = ${rows[0].slug} AND v.is_active = 1
      ) f ON f.vid = ph.product_id AND f.unit = ph.unit
      WHERE ph.recorded_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
    `);
    const edRes = await db.execute(sql`
      SELECT 1 AS ok FROM hf_product_editorial WHERE product_slug = ${rows[0].slug} AND published_at IS NOT NULL LIMIT 1
    `);
    const statRow = (Array.isArray(statsRes) ? statsRes[0] : []) as Array<{ pr: number; mc: number }>;
    const edRow = (Array.isArray(edRes) ? edRes[0] : []) as Array<{ ok: number }>;
    return reply.send({
      ...rows[0],
      priceRows30d: Number(statRow[0]?.pr ?? 0),
      marketCount30d: Number(statRow[0]?.mc ?? 0),
      hasEditorial: edRow.length > 0,
    });
  });

  app.post("/hal/products", async (req, reply) => {
    const parsed = productBody.safeParse(req.body);
    if (!parsed.success) return reply.status(400).send({ error: "Gecersiz govde", details: parsed.error.flatten() });
    const result = await db.insert(hfProducts).values({
      slug: parsed.data.slug,
      nameTr: parsed.data.nameTr,
      categorySlug: parsed.data.categorySlug,
      unit: parsed.data.unit,
      aliases: parsed.data.aliases,
      seoIndex: parsed.data.seoIndex ? 1 : 0,
      displayName: parsed.data.displayName?.trim() || null,
      imageUrl: parsed.data.imageUrl?.trim() || null,
      canonicalSlug: parsed.data.canonicalSlug?.trim() || null,
      familySlug: parsed.data.familySlug?.trim() || null,
      dataQuality: parsed.data.dataQuality,
      searchVolume: parsed.data.searchVolume,
      displayOrder: parsed.data.displayOrder,
      isActive: parsed.data.isActive ? 1 : 0,
    });
    const id = Number((result as unknown as Array<{ insertId?: number }>)[0]?.insertId ?? 0);
    return reply.send({ ok: true, id });
  });

  app.patch<{ Params: { id: string } }>("/hal/products/:id", async (req, reply) => {
    const id = Number(req.params.id);
    const parsed = productBody.safeParse(req.body);
    if (!parsed.success) return reply.status(400).send({ error: "Gecersiz govde", details: parsed.error.flatten() });
    try {
      await db
        .update(hfProducts)
        .set({
          slug: parsed.data.slug,
          nameTr: parsed.data.nameTr,
          categorySlug: parsed.data.categorySlug,
          unit: parsed.data.unit,
          aliases: parsed.data.aliases,
          seoIndex: parsed.data.seoIndex ? 1 : 0,
          displayName: parsed.data.displayName?.trim() || null,
          imageUrl: parsed.data.imageUrl?.trim() || null,
          canonicalSlug: parsed.data.canonicalSlug?.trim() || null,
          familySlug: parsed.data.familySlug?.trim() || null,
          dataQuality: parsed.data.dataQuality,
          searchVolume: parsed.data.searchVolume,
          displayOrder: parsed.data.displayOrder,
          isActive: parsed.data.isActive ? 1 : 0,
        })
        .where(eq(hfProducts.id, id));
      // Urun sayfasi ISR ile 5 dk onbellekli. seo_index veya ad degistiginde
      // onbellek dusurulmezse degisiklik yayina gecmiyormus gibi gorunur
      // (2026-09-02: muz-ithal indekse alindi ama sayfa noindex gostermeye
      // devam etti). Fiyat uclari zaten bunu yapiyordu, urun ucu yapmiyordu.
      void revalidateFrontendTag("prices");
      return reply.send({ ok: true });
    } catch (err) {
      // Slug benzersiz — başka üründe varsa rename çakışır. Rename yerine merge önerilir.
      if (err instanceof Error && /ER_DUP_ENTRY|Duplicate entry/i.test(err.message)) {
        return reply.status(409).send({
          error: `"${parsed.data.slug}" slug'ı zaten başka bir üründe kullanılıyor. Yanlış yazımı düzeltmek için bu ürünü doğru ürünle birleştirin (Birleştirme önerileri).`,
        });
      }
      throw err;
    }
  });

  app.delete<{ Params: { id: string } }>("/hal/products/:id", async (req, reply) => {
    const id = Number(req.params.id);
    await db.delete(hfProducts).where(eq(hfProducts.id, id));
    return reply.send({ ok: true });
  });

  // Ürün birleştirme: dublike ürünleri bir master altında konsolide et.
  // Varyantlar → canonical_slug=master + noindex. Fiyat geçmişi TAŞINMAZ, alias EKLENMEZ:
  // varyant kendi satırlarını ve adını korur, master sayfası aileyi gösterimde toplar.
  // Birim uyuşmazsa (kg vs adet) merge REDDEDİLİR — fiyat bozulmasın.
  app.post<{ Body: { masterId?: number; variantIds?: number[] } }>("/hal/products/merge", async (req, reply) => {
    const masterId = Number(req.body?.masterId);
    const variantIds = (Array.isArray(req.body?.variantIds) ? req.body.variantIds : [])
      .map(Number)
      .filter((id) => Number.isFinite(id) && id > 0 && id !== masterId);
    if (!Number.isFinite(masterId) || masterId <= 0 || variantIds.length === 0) {
      return reply.status(400).send({ error: "masterId ve en az 1 variantId gerekli" });
    }
    const masterRows = await db.select().from(hfProducts).where(eq(hfProducts.id, masterId)).limit(1);
    const master = masterRows[0];
    if (!master) return reply.status(404).send({ error: "Master ürün bulunamadi" });
    if (master.canonicalSlug) return reply.status(400).send({ error: "Master kendisi varyant olamaz" });

    const variants = await db.select().from(hfProducts).where(inArray(hfProducts.id, variantIds));
    if (variants.length === 0) return reply.status(404).send({ error: "Varyant bulunamadi" });

    // Birim-guard: kg ile adet birleştirilemez (ortalama fiyat anlamsız olur).
    const masterUnit = unitClass(master.unit);
    const badUnit = variants.filter((v) => unitClass(v.unit) !== masterUnit);
    if (badUnit.length > 0) {
      return reply.status(400).send({
        error: `Birim uyuşmuyor: ${badUnit.map((v) => `${v.slug} (${v.unit})`).join(", ")} → master birimi "${master.unit}". Farklı birim ayrı ürün olarak kalmalı; birleştirmek fiyatı bozar.`,
      });
    }

    const variantIdList = variants.map((v) => v.id);
    await db.update(hfProducts).set({ canonicalSlug: master.slug, seoIndex: 0, familySlug: null }).where(inArray(hfProducts.id, variantIdList));

    // Fiyat geçmişi TAŞINMAZ ve SİLİNMEZ. Varyant kendi satırlarını tutar; master sayfası
    // aileyi gösterimde `canonical_slug` üzerinden toplar. Önceden burada geçmiş master'a
    // taşınıp varyant satırları siliniyordu — dosyanın başındaki yorumla çelişiyordu ve
    // granülariteyi (hangi hal hangi çeşidi kaç liraya sattı) geri dönülmez şekilde yok ediyordu.
    //
    // Varyant isimleri master'ın alias'ına da EKLENMEZ. Varyant ürünü aktif kaldığı için ETL
    // onu zaten kendi adıyla bulur (normalizer: kendi adı > alias). Eklemek iki ürünün aynı
    // eşleştirme anahtarını talep etmesine yol açıyordu: katalogda 1.525 anahtarın 513'ü
    // çakışmış, 653 ürün etkilenmişti. Somut sonuç, kaynakta üç ayrı domates satırı varken
    // üçünün tek ürüne düşüp son satırın diğerlerini ezmesiydi.
    invalidateAliasCache(); // canonical_slug değişikliği ETL eşleştirmesine hemen yansısın

    // Editorial koruma: master'da editorial yoksa, varyantların en zengin (en uzun about_md)
    // editorial'ını master slug'a taşı — yoksa içerik 301 arkasında görünmez kalır.
    let editorialMovedFrom: string | null = null;
    const masterEdRes = await db.execute(
      sql`SELECT id FROM hf_product_editorial WHERE product_slug = ${master.slug} LIMIT 1`,
    );
    const masterEdRows = (Array.isArray(masterEdRes) ? masterEdRes[0] : masterEdRes) as unknown as Array<{ id: number }>;
    if (masterEdRows.length === 0) {
      const inList = sql.join(
        variants.map((v) => sql`${v.slug}`),
        sql`, `,
      );
      const bestRes = await db.execute(
        sql`SELECT id, product_slug FROM hf_product_editorial WHERE product_slug IN (${inList}) ORDER BY CHAR_LENGTH(COALESCE(about_md, '')) DESC LIMIT 1`,
      );
      const bestRows = (Array.isArray(bestRes) ? bestRes[0] : bestRes) as unknown as Array<{
        id: number;
        product_slug: string;
      }>;
      if (bestRows.length > 0) {
        await db.execute(sql`UPDATE hf_product_editorial SET product_slug = ${master.slug} WHERE id = ${bestRows[0].id}`);
        editorialMovedFrom = bestRows[0].product_slug;
      }
    }

    return reply.send({ ok: true, master: master.slug, merged: variants.map((v) => v.slug), editorialMovedFrom });
  });

  // Auto-merge önerici: ürünleri KÖK İSME göre aileler halinde kümeler (dağınık varyantlar
  // — "Kırmızı Marul", "Aysberg Marul", bozuk ETL isimleri — tek ailede toplanır). Kök isim =
  // ürün isim token'ları içinden global frekansı en yüksek olan (marul/fasulye/elma her varyantta
  // tekrarlandığı için niteleyicilerden ayrışır). Niteleyiciler (taze/kırmızı/yerli...) kök adayı
  // olamaz. Aile içinde kullanıcı çoklu master seçip alt-alt birleştirir.
  app.get("/hal/products/merge-suggestions", async (_req, reply) => {
    const rowsRes = await db.execute(sql`
      SELECT p.id, p.slug, p.name_tr AS nameTr, p.display_name AS displayName, p.seo_index AS seoIndex,
        p.data_quality AS dataQuality, p.search_volume AS searchVolume, COALESCE(s.mc, 0) AS hal
      FROM hf_products p
      LEFT JOIN (SELECT product_id, COUNT(DISTINCT market_id) mc FROM hf_price_history WHERE recorded_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY) GROUP BY product_id) s ON s.product_id = p.id
      WHERE p.is_active = 1 AND p.canonical_slug IS NULL
    `);
    type P = { id: number; slug: string; nameTr: string; displayName: string | null; seoIndex: number; dataQuality: number; searchVolume: number; hal: number };
    const products = (Array.isArray(rowsRes) ? rowsRes[0] : rowsRes) as unknown as P[];

    // Kök isim (family) tespiti — ortak helper (merge önerici + family_slug aynı mantık).
    const baseMap = computeBaseMap(products.map((p) => ({ id: p.id, name: p.displayName || p.nameTr })));

    const groups = new Map<string, P[]>();
    for (const p of products) {
      const base = baseMap.get(p.id) || "";
      if (!base) continue;
      const arr = groups.get(base);
      if (arr) arr.push(p);
      else groups.set(base, [p]);
    }

    const clusters = [];
    for (const [signature, members] of groups) {
      if (members.length < 2) continue;
      // Master adayı = en çok hal; sonra benzer isimler yan yana dursun diye isme göre sırala.
      members.sort(
        (a, b) =>
          Number(b.hal) - Number(a.hal) ||
          (a.displayName || a.nameTr).localeCompare(b.displayName || b.nameTr, "tr"),
      );
      const [master, ...variants] = members;
      clusters.push({ signature, master, variants, size: members.length });
    }
    clusters.sort((a, b) => b.size - a.size);
    return reply.send({ count: clusters.length, clusters });
  });

  // family_slug'ı DETERMİNİSTİK yeniden kur: aktif+canonical-olmayan ürünleri kök isme göre
  // kümele, ≥2 üyeli kökler family_slug=kök alır (çeşit seçici o kök altında çıkar), tek üyeli
  // veya köksüzler NULL. İdempotent — istendiği kadar çalıştırılır (ETL sonrası cron da çağırır).
  app.post("/hal/products/rebuild-families", async (_req, reply) => {
    const result = await rebuildProductFamilies();
    return reply.send({ ok: true, ...result });
  });

  // SEO index bakımını elle tetikle: dataQuality recalc + seoIndex flip/demote
  // (hal ≥3 hal + borsa editoryel/süreklilik). Editoryel yayınlandıktan sonra haftalık
  // cron'u beklemeden index'e almak için kullanılır. Sonuç: {flippedUp, flippedUpBorsa, demoted}.
  app.post("/hal/products/seo-maintenance", async (_req, reply) => {
    const result = await runSeoIndexMaintenance();
    return reply.send({ ok: true, ...result });
  });

  app.get<{ Params: { id: string } }>("/hal/products/:id/editorial", async (req, reply) => {
    const id = Number(req.params.id);
    if (!Number.isFinite(id) || id <= 0) return reply.status(400).send({ error: "Gecersiz id" });

    const productRows = await db.select({ slug: hfProducts.slug }).from(hfProducts).where(eq(hfProducts.id, id)).limit(1);
    const product = productRows[0];
    if (!product) return reply.status(404).send({ error: "Urun bulunamadi" });

    const rows = await db.select().from(hfProductEditorial).where(eq(hfProductEditorial.productSlug, product.slug)).limit(1);
    const row = rows[0];
    if (!row) {
      return reply.send({
        productSlug: product.slug,
        aboutMd: "",
        priceFactorsMd: "",
        seasonMd: "",
        productionRegionMd: "",
        qualityIndicatorsMd: "",
        culinaryUsesMd: "",
        relatedSlugs: [],
        source: "manual",
        reviewedBy: null,
        reviewedAt: null,
        publishedAt: null,
      });
    }

    return reply.send({
      ...row,
      relatedSlugs: Array.isArray(row.relatedSlugs) ? row.relatedSlugs : [],
      reviewedAt: row.reviewedAt instanceof Date ? row.reviewedAt.toISOString() : row.reviewedAt,
      publishedAt: row.publishedAt instanceof Date ? row.publishedAt.toISOString() : row.publishedAt,
    });
  });

  app.put<{ Params: { id: string } }>("/hal/products/:id/editorial", async (req, reply) => {
    const id = Number(req.params.id);
    if (!Number.isFinite(id) || id <= 0) return reply.status(400).send({ error: "Gecersiz id" });

    const productRows = await db.select({ slug: hfProducts.slug }).from(hfProducts).where(eq(hfProducts.id, id)).limit(1);
    const product = productRows[0];
    if (!product) return reply.status(404).send({ error: "Urun bulunamadi" });

    const parsed = productEditorialBody.safeParse(req.body);
    if (!parsed.success) return reply.status(400).send({ error: "Gecersiz govde", details: parsed.error.flatten() });
    const b = parsed.data;
    const now = sql`CURRENT_TIMESTAMP(3)`;

    await db.insert(hfProductEditorial).values({
      productSlug: product.slug,
      aboutMd: b.aboutMd.trim(),
      priceFactorsMd: b.priceFactorsMd.trim(),
      seasonMd: b.seasonMd.trim(),
      productionRegionMd: b.productionRegionMd.trim(),
      qualityIndicatorsMd: b.qualityIndicatorsMd?.trim() || null,
      culinaryUsesMd: b.culinaryUsesMd?.trim() || null,
      relatedSlugs: b.relatedSlugs,
      source: b.source,
      reviewedBy: b.reviewedBy?.trim() || null,
      reviewedAt: b.published ? now : null,
      publishedAt: b.published ? now : null,
    }).onDuplicateKeyUpdate({
      set: {
        aboutMd: b.aboutMd.trim(),
        priceFactorsMd: b.priceFactorsMd.trim(),
        seasonMd: b.seasonMd.trim(),
        productionRegionMd: b.productionRegionMd.trim(),
        qualityIndicatorsMd: b.qualityIndicatorsMd?.trim() || null,
        culinaryUsesMd: b.culinaryUsesMd?.trim() || null,
        relatedSlugs: b.relatedSlugs,
        source: b.source,
        reviewedBy: b.reviewedBy?.trim() || null,
        reviewedAt: b.published ? now : null,
        publishedAt: b.published ? now : null,
      },
    });

    return reply.send({ ok: true });
  });

  app.get("/hal/markets", async (req, reply) => {
    const query = z
      .object({
        q: z.string().optional(),
        city: z.string().optional(),
        marketType: z.enum(["hal", "borsa", "resmi", "kooperatif"]).optional(),
        isActive: boolish,
      })
      .safeParse(req.query);
    if (!query.success) return reply.status(400).send({ error: "Gecersiz sorgu" });

    const conds = [];
    const q = likeSafe(query.data.q);
    const city = likeSafe(query.data.city);
    if (q) conds.push(like(hfMarkets.name, `%${q}%`));
    if (city) conds.push(like(hfMarkets.cityName, `%${city}%`));
    if (query.data.marketType) conds.push(eq(hfMarkets.marketType, query.data.marketType));
    if (query.data.isActive != null) conds.push(eq(hfMarkets.isActive, query.data.isActive ? 1 : 0));

    const items = await db
      .select()
      .from(hfMarkets)
      .where(conds.length ? and(...conds) : undefined)
      .orderBy(asc(hfMarkets.displayOrder), asc(hfMarkets.name));

    return reply.send({ items });
  });

  /**
   * Hal basina kapsam: son 30 gunde satir/urun/gun sayisi, tum zamanlar satir
   * ve son veri tarihi. Tek GROUP BY (market_id, recorded_date indeksli) — hal
   * listesi "hangi hal canli, hangisi kurudu" sorusunu sayfayi acar acmaz
   * cevaplasin diye.
   */
  app.get("/hal/markets/stats", async (_req, reply) => {
    const res = await db.execute(sql`
      SELECT market_id AS marketId,
        SUM(recorded_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)) AS rows30,
        COUNT(DISTINCT CASE WHEN recorded_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY) THEN product_id END) AS products30,
        COUNT(DISTINCT CASE WHEN recorded_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY) THEN recorded_date END) AS days30,
        COUNT(*) AS rowsAll,
        MAX(recorded_date) AS lastDate,
        MIN(recorded_date) AS firstDate
      FROM hf_price_history GROUP BY market_id
    `);
    const rows = (Array.isArray(res) ? res[0] : res) as unknown as Array<Record<string, unknown>>;
    const iso = (v: unknown) => (v instanceof Date ? v.toISOString().slice(0, 10) : v ? String(v).slice(0, 10) : null);
    return reply.send({
      items: rows.map((r) => ({
        marketId: Number(r.marketId),
        rows30: Number(r.rows30 ?? 0),
        products30: Number(r.products30 ?? 0),
        days30: Number(r.days30 ?? 0),
        rowsAll: Number(r.rowsAll ?? 0),
        lastDate: iso(r.lastDate),
        firstDate: iso(r.firstDate),
      })),
    });
  });

  app.get<{ Params: { id: string } }>("/hal/markets/:id", async (req, reply) => {
    const id = Number(req.params.id);
    const rows = await db.select().from(hfMarkets).where(eq(hfMarkets.id, id)).limit(1);
    if (!rows[0]) return reply.status(404).send({ error: "Kayit bulunamadi" });
    return reply.send(rows[0]);
  });

  app.post("/hal/markets", async (req, reply) => {
    const parsed = marketBody.safeParse(req.body);
    if (!parsed.success) return reply.status(400).send({ error: "Gecersiz govde", details: parsed.error.flatten() });
    const result = await db.insert(hfMarkets).values({
      slug: parsed.data.slug,
      name: parsed.data.name,
      cityName: parsed.data.cityName,
      regionSlug: parsed.data.regionSlug ?? null,
      sourceKey: parsed.data.sourceKey ?? null,
      displayOrder: parsed.data.displayOrder,
      address: parsed.data.address ?? null,
      phone: parsed.data.phone ?? null,
      founded: parsed.data.founded ?? null,
      hours: parsed.data.hours ?? null,
      marketType: parsed.data.marketType ?? "hal",
      seoIndex: parsed.data.seoIndex == null ? 1 : parsed.data.seoIndex ? 1 : 0,
      isActive: parsed.data.isActive ? 1 : 0,
    });
    const id = Number((result as unknown as Array<{ insertId?: number }>)[0]?.insertId ?? 0);
    void revalidateFrontendTag("markets");
    return reply.send({ ok: true, id });
  });

  app.patch<{ Params: { id: string } }>("/hal/markets/:id", async (req, reply) => {
    const id = Number(req.params.id);
    const parsed = marketBody.safeParse(req.body);
    if (!parsed.success) return reply.status(400).send({ error: "Gecersiz govde", details: parsed.error.flatten() });
    await db
      .update(hfMarkets)
      .set({
        slug: parsed.data.slug,
        name: parsed.data.name,
        cityName: parsed.data.cityName,
        regionSlug: parsed.data.regionSlug ?? null,
        sourceKey: parsed.data.sourceKey ?? null,
        displayOrder: parsed.data.displayOrder,
        address: parsed.data.address ?? null,
        phone: parsed.data.phone ?? null,
        founded: parsed.data.founded ?? null,
        hours: parsed.data.hours ?? null,
        ...(parsed.data.marketType ? { marketType: parsed.data.marketType } : {}),
        ...(parsed.data.seoIndex == null ? {} : { seoIndex: parsed.data.seoIndex ? 1 : 0 }),
        isActive: parsed.data.isActive ? 1 : 0,
      })
      .where(eq(hfMarkets.id, id));
    void revalidateFrontendTag("markets");
    return reply.send({ ok: true });
  });

  app.delete<{ Params: { id: string } }>("/hal/markets/:id", async (req, reply) => {
    const id = Number(req.params.id);
    await db.delete(hfMarkets).where(eq(hfMarkets.id, id));
    return reply.send({ ok: true });
  });

  app.get("/hal/alerts", async (req, reply) => {
    const parsed = alertListQuery.safeParse(req.query);
    if (!parsed.success) return reply.status(400).send({ error: "Gecersiz sorgu" });
    const conds = [];
    if (parsed.data.productSlug) conds.push(eq(hfProducts.slug, parsed.data.productSlug));
    if (parsed.data.isActive != null) conds.push(eq(hfAlerts.isActive, parsed.data.isActive ? 1 : 0));

    const items = await db
      .select({
        id: hfAlerts.id,
        productId: hfAlerts.productId,
        marketId: hfAlerts.marketId,
        thresholdPrice: hfAlerts.thresholdPrice,
        direction: hfAlerts.direction,
        contactEmail: hfAlerts.contactEmail,
        contactTelegram: hfAlerts.contactTelegram,
        isActive: hfAlerts.isActive,
        lastTriggered: hfAlerts.lastTriggered,
        createdAt: hfAlerts.createdAt,
        productSlug: hfProducts.slug,
        productName: hfProducts.nameTr,
        marketSlug: hfMarkets.slug,
        marketName: hfMarkets.name,
      })
      .from(hfAlerts)
      .innerJoin(hfProducts, eq(hfProducts.id, hfAlerts.productId))
      .leftJoin(hfMarkets, eq(hfMarkets.id, hfAlerts.marketId))
      .where(conds.length ? and(...conds) : undefined)
      .orderBy(desc(hfAlerts.createdAt))
      .limit(Math.min(500, Math.max(1, parsed.data.limit ?? 200)));

    return reply.send({ items });
  });

  app.patch<{ Params: { id: string } }>("/hal/alerts/:id", async (req, reply) => {
    const id = Number(req.params.id);
    const parsed = alertPatchBody.safeParse(req.body);
    if (!parsed.success) return reply.status(400).send({ error: "Gecersiz govde", details: parsed.error.flatten() });

    const patch: Record<string, unknown> = {};
    if (parsed.data.isActive != null) patch.isActive = parsed.data.isActive ? 1 : 0;
    await db.update(hfAlerts).set(patch).where(eq(hfAlerts.id, id));
    return reply.send({ ok: true });
  });

  app.delete<{ Params: { id: string } }>("/hal/alerts/:id", async (req, reply) => {
    const id = Number(req.params.id);
    await db.update(hfAlerts).set({ isActive: 0 }).where(eq(hfAlerts.id, id));
    return reply.send({ ok: true });
  });

  app.get("/hal/etl/sources", async (_req, reply) => {
    return reply.send({ sources: loadEtlSources() });
  });

  app.post("/hal/etl/run", async (req, reply) => {
    const parsed = etlBody.safeParse(req.body);
    if (!parsed.success) return reply.status(400).send({ error: "Gecersiz govde" });
    const { source, date } = parsed.data;

    if (source === "all") {
      const results = await runDailyEtl(date);
      return reply.send({ ok: true, results });
    }

    if (source === "migros") {
      const isoDate = date && /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : undefined;
      try {
        const result = await runMigrosEtl(isoDate);
        return reply.send({ ok: true, source, result });
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        return reply.status(400).send({ ok: false, source, error: msg });
      }
    }

    if (source === "marketfiyati") {
      const isoDate = date && /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : undefined;
      try {
        const result = await runMarketfiyatiEtl(isoDate);
        return reply.send({ ok: true, source, result });
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        return reply.status(400).send({ ok: false, source, error: msg });
      }
    }

    try {
      const result = await runSingleSource(source, date);
      return reply.send({ ok: true, source, result });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return reply.status(400).send({ ok: false, source, error: msg });
    }
  });

  app.post("/hal/newsletter/weekly-mail", async (_req, reply) => {
    try {
      const result = await runWeeklyMailDigest();
      return reply.send({ ok: true, ...result });
    } catch (err) {
      return reply.status(500).send({ ok: false, error: err instanceof Error ? err.message : String(err) });
    }
  });

  app.get("/hal/newsletter/weekly-mail/preview", async (_req, reply) => {
    const preview = await buildWeeklyMailPreview();
    if (!preview) return reply.status(404).send({ ok: false, reason: "no-movers" });
    reply.header("Content-Type", "text/html; charset=utf-8");
    return reply.send(preview.html);
  });

  app.post("/hal/newsletter/weekly-mail/test", async (req, reply) => {
    const body = z.object({ to: z.string().email() }).safeParse(req.body);
    if (!body.success) return reply.status(400).send({ ok: false, error: "to (email) gerekli" });
    const result = await sendWeeklyMailTest(body.data.to);
    return reply.send({ ok: result.sent, ...result });
  });

  // --- Bulten arsivi: gonderilen her bulten saklanir, taslak once incelenir ---

  app.get("/hal/newsletter/sends", async (req, reply) => {
    const q = z.object({ limit: z.coerce.number().int().min(1).max(200).default(50) }).safeParse(req.query);
    const items = await listSends(q.success ? q.data.limit : 50);
    return reply.send({ ok: true, items });
  });

  app.get("/hal/newsletter/sends/:id", async (req, reply) => {
    const { id } = req.params as { id: string };
    const row = await getSend(id);
    if (!row) return reply.status(404).send({ ok: false, error: "not-found" });
    return reply.send({ ok: true, item: row });
  });

  /** Arsivlenmis bulteni tarayicida oldugu gibi goster (gonderilen birebir kopya). */
  app.get("/hal/newsletter/sends/:id/html", async (req, reply) => {
    const { id } = req.params as { id: string };
    const row = await getSend(id);
    if (!row) return reply.status(404).send({ ok: false, error: "not-found" });
    reply.header("Content-Type", "text/html; charset=utf-8");
    return reply.send(row.html.replace(/\{\{UNSUB_URL\}\}/g, "#"));
  });

  app.post("/hal/newsletter/sends/draft", async (_req, reply) => {
    const result = await createWeeklyDraft();
    if (!result.ok) return reply.status(400).send({ ok: false, error: result.reason });
    return reply.send(result);
  });

  app.put("/hal/newsletter/sends/:id", async (req, reply) => {
    const { id } = req.params as { id: string };
    const body = z.object({ subject: z.string().min(1).max(255).optional(), html: z.string().min(1).optional() }).safeParse(req.body);
    if (!body.success) return reply.status(400).send({ ok: false, error: "subject veya html gerekli" });
    const result = await updateDraft(id, body.data);
    if (!result.ok) return reply.status(result.reason === "not-found" ? 404 : 409).send({ ok: false, error: result.reason });
    return reply.send({ ok: true });
  });

  app.post("/hal/newsletter/sends/:id/send", async (req, reply) => {
    const { id } = req.params as { id: string };
    const result = await sendStoredDraft(id);
    return reply.send({ ok: result.sent, ...result });
  });

  app.delete("/hal/newsletter/sends/:id", async (req, reply) => {
    const { id } = req.params as { id: string };
    const result = await deleteDraft(id);
    if (!result.ok) return reply.status(result.reason === "not-found" ? 404 : 409).send({ ok: false, error: result.reason });
    return reply.send({ ok: true });
  });

  /**
   * ETL tazelik denetimi — "basarili calisti" ile "yeni veri geldi" ayrimi.
   * hf_etl_runs bu ayrimi tutmuyor; donmus/yanlis eslesmis seriler sessizce yayinlaniyordu.
   */
  app.get("/hal/etl/freshness", async (_req, reply) => {
    const [sources, jumps] = await Promise.all([sourceFreshness(), detectPriceJumps()]);
    return reply.send({
      ok: true,
      sources,
      staleSources: sources.filter((s) => s.isStale),
      priceJumps: jumps,
    });
  });

  /** WhatsApp kanal taslagini istege bagli yeniden uret — admin Telegram sohbetine duser. */
  app.post("/hal/whatsapp/draft", async (_req, reply) => {
    const { publishWhatsappDraft } = await import("@/modules/whatsapp-channel/publisher");
    const result = await publishWhatsappDraft();
    return reply.send({ ok: result.sent, ...result });
  });

  /** Saglik denetimini elle calistir. ?notify=1 ise Telegram/e-posta uyarisi da gonderir. */
  app.post<{ Querystring: { notify?: string } }>("/hal/etl/health-check", async (req, reply) => {
    if (req.query?.notify === "1") {
      const result = await checkAndNotifyEtlHealth();
      return reply.send({ ok: true, ...result });
    }
    const issues = await checkEtlHealth();
    return reply.send({
      ok: true,
      critical: issues.filter((i) => i.severity === "critical").length,
      warning: issues.filter((i) => i.severity === "warning").length,
      issues,
    });
  });

  /**
   * Arsivden backfill — donmus donemin gercek verisini web.archive.org'dan kurtarir.
   * ?dryRun=1 ile yalnizca olcum yapar, DB'ye yazmaz.
   */
  app.post<{ Body: { source?: string; from?: string; to?: string; dryRun?: boolean; limit?: number } }>(
    "/hal/etl/wayback-backfill",
    async (req, reply) => {
      const key = String(req.body?.source ?? "");
      const source = getSourceByKey(key);
      if (!source) return reply.status(400).send({ ok: false, error: `Bilinmeyen kaynak: ${key}` });
      try {
        const result = await runWaybackBackfill(source, {
          from: req.body?.from, to: req.body?.to,
          dryRun: req.body?.dryRun === true,
          limit: req.body?.limit,
        });
        return reply.send({ ok: true, source: key, ...result });
      } catch (err) {
        return reply.status(500).send({ ok: false, error: err instanceof Error ? err.message : String(err) });
      }
    },
  );

  /** Ilan uzatma hatirlatmalarini elle tetikle (cron ETL sonrasi zaten calisir). */
  app.post<{ Querystring: { days?: string } }>("/hal/listings/expiry-reminders", async (req, reply) => {
    try {
      const days = req.query?.days !== undefined ? Number(req.query.days) : undefined;
      if (days !== undefined && (!Number.isInteger(days) || days < 0 || days > 30)) {
        return reply.status(400).send({ ok: false, error: "days 0-30 arasi tam sayi olmali" });
      }
      const result = await sendListingExpiryReminders(days);
      return reply.send({ ok: true, ...result });
    } catch (err) {
      return reply.status(500).send({ ok: false, error: err instanceof Error ? err.message : String(err) });
    }
  });

  app.post("/hal/wayback/check", async (_req, reply) => {
    try {
      const result = await checkWaybackAndNotify();
      return reply.send({ ok: true, ...result });
    } catch (err) {
      return reply.status(500).send({ ok: false, error: err instanceof Error ? err.message : String(err) });
    }
  });

  app.get("/hal/etl/logs", async (_req, reply) => {
    const logs = await db
      .select()
      .from(hfEtlRuns)
      .orderBy(desc(hfEtlRuns.createdAt))
      .limit(100);
    return reply.send({ logs });
  });

  // Scraper mikroservis (hal-scraper 8201) canli durum + source konfigurasyonu
  app.get("/hal/etl/scraper", async (_req, reply) => {
    const status = await getScraperStatus();
    return reply.send(status);
  });

  // Cron gorev katalogu — schedule + aciklama (salt-okunur metadata)
  app.get("/hal/etl/cron", async (_req, reply) => {
    return reply.send(getCronCatalog());
  });

  app.get("/hal/production", async (req, reply) => {
    const parsed = productionListQuery.safeParse(req.query);
    if (!parsed.success) return reply.status(400).send({ error: "Gecersiz sorgu" });
    const items = await listProduction(parsed.data);
    return reply.send({ items });
  });

  app.get<{ Params: { id: string } }>("/hal/production/:id", async (req, reply) => {
    const id = Number(req.params.id);
    const rows = await db.select().from(hfAnnualProduction).where(eq(hfAnnualProduction.id, id)).limit(1);
    if (!rows[0]) return reply.status(404).send({ error: "Kayit bulunamadi" });
    return reply.send(rows[0]);
  });

  app.post("/hal/production", async (req, reply) => {
    const parsed = productionBody.safeParse(req.body);
    if (!parsed.success) return reply.status(400).send({ error: "Gecersiz govde", details: parsed.error.flatten() });
    const result = await db.insert(hfAnnualProduction).values({
      year: parsed.data.year,
      species: parsed.data.species,
      speciesSlug: parsed.data.speciesSlug,
      categorySlug: parsed.data.categorySlug,
      regionSlug: parsed.data.regionSlug,
      productionTon: parsed.data.productionTon.toFixed(2),
      sourceApi: parsed.data.sourceApi,
      note: parsed.data.note ?? null,
    });
    const id = Number((result as unknown as Array<{ insertId?: number }>)[0]?.insertId ?? 0);
    return reply.send({ ok: true, id });
  });

  app.patch<{ Params: { id: string } }>("/hal/production/:id", async (req, reply) => {
    const id = Number(req.params.id);
    const parsed = productionBody.safeParse(req.body);
    if (!parsed.success) return reply.status(400).send({ error: "Gecersiz govde", details: parsed.error.flatten() });
    await db
      .update(hfAnnualProduction)
      .set({
        year: parsed.data.year,
        species: parsed.data.species,
        speciesSlug: parsed.data.speciesSlug,
        categorySlug: parsed.data.categorySlug,
        regionSlug: parsed.data.regionSlug,
        productionTon: parsed.data.productionTon.toFixed(2),
        sourceApi: parsed.data.sourceApi,
        note: parsed.data.note ?? null,
      })
      .where(eq(hfAnnualProduction.id, id));
    return reply.send({ ok: true });
  });

  app.delete<{ Params: { id: string } }>("/hal/production/:id", async (req, reply) => {
    const id = Number(req.params.id);
    await db.delete(hfAnnualProduction).where(eq(hfAnnualProduction.id, id));
    return reply.send({ ok: true });
  });

  app.get("/hal/production/sources", async (_req, reply) => {
    return reply.send({ sources: loadProductionSources() });
  });

  app.post("/hal/production/run", async (req, reply) => {
    const body = z
      .object({ source: z.string().min(1).max(64).optional().default("all") })
      .safeParse(req.body);
    if (!body.success) return reply.status(400).send({ error: "Gecersiz govde" });
    const { source } = body.data;
    if (source === "all") {
      const results = await runAllProductionSources();
      return reply.send({ ok: true, results });
    }
    try {
      const result = await runSingleProductionSource(source);
      return reply.send({ ok: true, source, result });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return reply.status(400).send({ ok: false, source, error: msg });
    }
  });

  app.get("/hal/production/logs", async (_req, reply) => {
    const logs = await db
      .select()
      .from(hfAnnualEtlRuns)
      .orderBy(desc(hfAnnualEtlRuns.runAt))
      .limit(50);
    return reply.send({ logs });
  });

  app.post("/hal/channel/publish", async (_req, reply) => {
    try {
      await publishDailyReport();
      return reply.send({ ok: true });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return reply.status(500).send({ ok: false, error: msg });
    }
  });

  app.post("/hal/notifications/test", async (req, reply) => {
    if (!isOneSignalConfigured()) {
      return reply.status(503).send({ error: "OneSignal yapilandirilmamis (env eksik)" });
    }
    const parsed = pushBody.safeParse(req.body);
    if (!parsed.success) return reply.status(400).send({ error: "Gecersiz govde", details: parsed.error.flatten() });
    const { title, message, url, externalIds } = parsed.data;
    const response =
      externalIds && externalIds.length > 0
        ? await sendToExternalIds(externalIds, { title, message, url })
        : await sendBroadcast({ title, message, url });
    return reply.send({
      ok: true,
      mode: externalIds?.length ? "targeted" : "broadcast",
      response,
    });
  });
}
