import type { FastifyInstance } from "fastify";
import { and, asc, desc, eq, like, sql } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/db/client";
import {
  hfAlerts,
  hfAnnualEtlRuns,
  hfAnnualProduction,
  hfEtlRuns,
  hfMarkets,
  hfPriceHistory,
  hfProducts,
} from "@/db/schema";
import { loadEtlSources } from "@/config/etl-sources";
import { loadProductionSources } from "@/config/production-sources";
import { runDailyEtl, runSingleSource } from "@/modules/etl";
import { runMigrosEtl } from "@/modules/etl/market-scrapers/migros";
import { checkWaybackAndNotify } from "@/modules/wayback-monitor";
import { runWeeklyMailDigest } from "@/modules/notifications/weekly-mail-digest";
import {
  runAllProductionSources,
  runSingleProductionSource,
} from "@/modules/etl/production-fetcher";
import { publishDailyReport } from "@/modules/telegram-channel/publisher";
import {
  latestRecordedDate,
  listPriceRows,
  parseRangeToDays,
  upsertPriceRow,
} from "@/modules/prices/repository";
import { listProduction } from "@/modules/production/repository";
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
  city: z.string().optional(),
  market: z.string().optional(),
  category: z.string().optional(),
  range: z.string().optional(),
  limit: z.coerce.number().optional(),
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

const productBody = z.object({
  slug: z.string().min(1).max(128),
  nameTr: z.string().min(1).max(255),
  categorySlug: z.string().min(1).max(64).default("diger"),
  unit: z.string().min(1).max(32).default("kg"),
  aliases: z.array(z.string().min(1)).optional().default([]),
  displayOrder: z.coerce.number().int().optional().default(0),
  isActive: boolish.default(true),
});

const marketBody = z.object({
  slug: z.string().min(1).max(128),
  name: z.string().min(1).max(255),
  cityName: z.string().min(1).max(128),
  regionSlug: z.string().max(64).optional().nullable(),
  sourceKey: z.string().max(64).optional().nullable(),
  displayOrder: z.coerce.number().int().optional().default(0),
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
    const [items, latestDate] = await Promise.all([
      listPriceRows({
        product: p.product,
        city: p.city,
        market: p.market,
        category: p.category,
        range: p.range,
        limit: p.limit,
        latestOnly: p.latestOnly,
      }),
      latestRecordedDate(),
    ]);

    return reply.send({
      items,
      meta: {
        latestRecordedDate: latestDate,
        rangeDays: parseRangeToDays(p.range),
      },
    });
  });

  app.get<{ Params: { id: string } }>("/hal/prices/:id", async (req, reply) => {
    const id = Number(req.params.id);
    if (!Number.isFinite(id) || id <= 0) return reply.status(400).send({ error: "Gecersiz id" });
    const item = await getPriceDetail(id);
    if (!item) return reply.status(404).send({ error: "Kayit bulunamadi" });
    return reply.send(item);
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
      })
      .safeParse(req.query);
    if (!query.success) return reply.status(400).send({ error: "Gecersiz sorgu" });

    const conds = [];
    if (query.data.category) conds.push(eq(hfProducts.categorySlug, query.data.category));
    if (query.data.isActive != null) conds.push(eq(hfProducts.isActive, query.data.isActive ? 1 : 0));
    const q = likeSafe(query.data.q);
    if (q) conds.push(like(hfProducts.nameTr, `%${q}%`));

    const items = await db
      .select()
      .from(hfProducts)
      .where(conds.length ? and(...conds) : undefined)
      .orderBy(asc(hfProducts.displayOrder), asc(hfProducts.nameTr));

    return reply.send({ items });
  });

  app.get<{ Params: { id: string } }>("/hal/products/:id", async (req, reply) => {
    const id = Number(req.params.id);
    const rows = await db.select().from(hfProducts).where(eq(hfProducts.id, id)).limit(1);
    if (!rows[0]) return reply.status(404).send({ error: "Kayit bulunamadi" });
    return reply.send(rows[0]);
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
    await db
      .update(hfProducts)
      .set({
        slug: parsed.data.slug,
        nameTr: parsed.data.nameTr,
        categorySlug: parsed.data.categorySlug,
        unit: parsed.data.unit,
        aliases: parsed.data.aliases,
        displayOrder: parsed.data.displayOrder,
        isActive: parsed.data.isActive ? 1 : 0,
      })
      .where(eq(hfProducts.id, id));
    return reply.send({ ok: true });
  });

  app.delete<{ Params: { id: string } }>("/hal/products/:id", async (req, reply) => {
    const id = Number(req.params.id);
    await db.delete(hfProducts).where(eq(hfProducts.id, id));
    return reply.send({ ok: true });
  });

  app.get("/hal/markets", async (req, reply) => {
    const query = z
      .object({
        q: z.string().optional(),
        city: z.string().optional(),
        isActive: boolish,
      })
      .safeParse(req.query);
    if (!query.success) return reply.status(400).send({ error: "Gecersiz sorgu" });

    const conds = [];
    const q = likeSafe(query.data.q);
    const city = likeSafe(query.data.city);
    if (q) conds.push(like(hfMarkets.name, `%${q}%`));
    if (city) conds.push(like(hfMarkets.cityName, `%${city}%`));
    if (query.data.isActive != null) conds.push(eq(hfMarkets.isActive, query.data.isActive ? 1 : 0));

    const items = await db
      .select()
      .from(hfMarkets)
      .where(conds.length ? and(...conds) : undefined)
      .orderBy(asc(hfMarkets.displayOrder), asc(hfMarkets.name));

    return reply.send({ items });
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
      isActive: parsed.data.isActive ? 1 : 0,
    });
    const id = Number((result as unknown as Array<{ insertId?: number }>)[0]?.insertId ?? 0);
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
        isActive: parsed.data.isActive ? 1 : 0,
      })
      .where(eq(hfMarkets.id, id));
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
