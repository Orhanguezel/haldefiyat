import type { FastifyInstance, FastifyReply } from "fastify";
import { z } from "zod";
import {
  listPriceRows,
  listPriceRowsPage,
  listProducts,
  listSeoEligibleProducts,
  listMarkets,
  productPriceHistory,
  parseRangeToDays,
  trendingChanges,
  latestRecordedDate,
  widgetPrices,
  retailPricesByProduct,
  cityPriceMap,
  variantPricesByMaster,
} from "./repository";
import { resolveWeekRange } from "./iso-week";
import { weeklyPriceSummary } from "./weekly";
import { toCsvPayload, csvFilename } from "./csv";

const boolish = z.preprocess((v) => {
  if (typeof v === "boolean") return v;
  if (typeof v === "string") {
    const s = v.trim().toLowerCase();
    if (s === "true" || s === "1" || s === "yes") return true;
    if (s === "false" || s === "0" || s === "no") return false;
  }
  return v;
}, z.boolean().optional());

const qList = z.object({
  product:    z.string().optional(),
  q:          z.string().optional(),
  city:       z.string().optional(),
  market:     z.string().optional(),
  category:   z.string().optional(),
  range:      z.string().optional(),
  limit:      z.coerce.number().optional(),
  page:       z.coerce.number().optional(),
  sort:       z.enum(["avg-desc", "avg-asc", "name-asc", "date-desc"]).optional(),
  latestOnly: boolish,
});

const qExport = qList.extend({
  format: z.enum(["csv"]).optional(),
});

const qProducts = z.object({
  q:        z.string().optional(),
  category: z.string().optional(),
  seoIndex: boolish,
});

const qMarkets = z.object({
  city: z.string().optional(),
  seoIndex: boolish,
});

const qSeoEligibleProducts = z.object({
  since: z.string().regex(/^\d+d$/).optional(),
});

const qHistory = z.object({
  market: z.string().optional(),
  range:  z.string().optional(),
});

const qVariants = z.object({
  range: z.string().regex(/^\d+d$/).optional(),
});

const qWeekly = z.object({
  week: z.string().regex(/^\d{4}-\d{1,2}$/).optional(),
});

const qWidget = z.object({
  limit:    z.coerce.number().optional(),
  category: z.string().optional(),
  slugs:    z.string().optional(),
});

const qCityMap = z.object({
  product:  z.string().optional(),
  category: z.string().optional(),
  range:    z.string().optional(),
});

function setPublicWidgetHeaders(reply: FastifyReply) {
  reply.header("Access-Control-Allow-Origin", "*");
  reply.header("Access-Control-Allow-Methods", "GET, OPTIONS");
  reply.header("Cache-Control", "public, max-age=300, s-maxage=300");
  reply.header("Vary", "Accept-Encoding");
}

export async function registerPrices(app: FastifyInstance) {
  /**
   * GET /api/v1/prices/trending
   * En cok degisen fiyatlar (7 gunluk % degisim)
   */
  app.get("/prices/trending", async (req, reply) => {
    const limit = Math.min(50, Math.max(1, Number((req.query as { limit?: string })?.limit) || 10));
    const items = await trendingChanges(limit);
    return reply.send({ items });
  });

  /**
   * GET /api/v1/prices/products
   * Urun listesi (arama + kategori filtresi)
   */
  app.get("/prices/products", async (req, reply) => {
    const q = qProducts.safeParse(req.query);
    if (!q.success) return reply.status(400).send({ error: "Gecersiz parametre" });
    const items = await listProducts(q.data.q, q.data.category, q.data.seoIndex);
    return reply.send({ items });
  });

  /**
   * GET /api/v1/prices/products/seo-eligible?since=30d
   * Gecici sitemap filtresi: yakin zamanda fiyat verisi olan ve ham ETL ismi
   * arama sayfasi kalitesini dusurmeyen urunler.
   */
  app.get("/prices/products/seo-eligible", async (req, reply) => {
    const q = qSeoEligibleProducts.safeParse(req.query);
    if (!q.success) return reply.status(400).send({ error: "Gecersiz parametre" });
    const days = parseRangeToDays(q.data.since ?? "30d");
    const items = await listSeoEligibleProducts(days);
    reply.header("Cache-Control", "public, max-age=3600, s-maxage=3600");
    return reply.send({ items });
  });

  /**
   * GET /api/v1/prices/variants/:masterSlug?range=7d
   * Master urune canonical olan variant'larin yakin donem fiyat ozeti.
   */
  app.get<{ Params: { masterSlug: string } }>(
    "/prices/variants/:masterSlug",
    async (req, reply) => {
      const q = qVariants.safeParse(req.query);
      if (!q.success) return reply.status(400).send({ error: "Gecersiz parametre" });
      const items = await variantPricesByMaster(req.params.masterSlug, q.data.range ?? "7d");
      reply.header("Cache-Control", "public, max-age=3600, s-maxage=3600");
      return reply.send({ items });
    },
  );

  /**
   * GET /api/v1/prices/markets
   * Hal listesi (sehir filtresi)
   */
  app.get("/prices/markets", async (req, reply) => {
    const q = qMarkets.safeParse(req.query);
    if (!q.success) return reply.status(400).send({ error: "Gecersiz parametre" });
    const items = await listMarkets(q.data.city, q.data.seoIndex);
    return reply.send({ items });
  });

  /**
   * GET /api/v1/prices/city-map
   * İl bazlı son fiyat ortalaması. Türkiye SVG fiyat haritası için kullanılır.
   * ?product=domates&category=sebze&range=7d
   */
  app.get("/prices/city-map", async (req, reply) => {
    const q = qCityMap.safeParse(req.query);
    if (!q.success) return reply.status(400).send({ error: "Gecersiz parametre" });
    const items = await cityPriceMap(q.data);
    reply.header("Cache-Control", "public, max-age=300, s-maxage=300");
    return reply.send({
      items,
      meta: {
        rangeDays: Math.min(30, parseRangeToDays(q.data.range)),
        product: q.data.product ?? null,
        category: q.data.category ?? null,
      },
    });
  });

  /**
   * GET /api/v1/prices/history/:productSlug
   * Tek urunun fiyat grafigi verisi
   * ?market=istanbul-hal&range=30d
   */
  app.get<{ Params: { productSlug: string } }>(
    "/prices/history/:productSlug",
    async (req, reply) => {
      const q = qHistory.safeParse(req.query);
      const days = parseRangeToDays(q.success ? q.data.range : undefined);
      const items = await productPriceHistory(req.params.productSlug, q.success ? q.data.market : undefined, days);
      return reply.send({ items, meta: { productSlug: req.params.productSlug, rangeDays: days } });
    },
  );

  /**
   * GET /api/v1/prices/retail/:productSlug
   * Ürünün son 3 gündeki perakende zincir fiyatları (Migros, A101, ...).
   * "Tahmini perakende ~₺XX" karşılaştırması için kullanılır.
   */
  app.get<{ Params: { productSlug: string } }>(
    "/prices/retail/:productSlug",
    async (req, reply) => {
      const items = await retailPricesByProduct(req.params.productSlug);
      reply.header("Cache-Control", "public, max-age=600");
      return reply.send({ items, meta: { productSlug: req.params.productSlug } });
    },
  );

  /**
   * GET /api/v1/prices/weekly-summary
   * Haftalik ozet — Ziraat Haber Portali bulteni icin
   * ?week=YYYY-WW (varsayilan: gecen tamamlanmis hafta)
   */
  app.get("/prices/weekly-summary", async (req, reply) => {
    const q = qWeekly.safeParse(req.query);
    const { weekStart, weekEnd } = resolveWeekRange(q.success ? q.data.week : undefined);
    const data = await weeklyPriceSummary(weekStart, weekEnd);
    reply.header("Cache-Control", "public, max-age=600");
    return reply.send(data);
  });

  /**
   * GET /api/v1/prices/widget?limit=6&category=sebze
   * Embed widget endpoint (Bereketfide / VistaSeed sidebar)
   * CORS: tum originler, 5 dk cache
   */
  app.get("/prices/widget", async (req, reply) => {
    setPublicWidgetHeaders(reply);
    const q = qWidget.safeParse(req.query);
    const limit = Math.min(24, Math.max(1, q.success ? (q.data.limit ?? 12) : 12));
    const category = q.success ? q.data.category : undefined;
    const slugsRaw = q.success ? q.data.slugs : undefined;
    const slugs = slugsRaw ? slugsRaw.split(",").map((s) => s.trim()).filter(Boolean) : undefined;

    const items = await widgetPrices(slugs, category, limit);
    return reply.send({ items, meta: { limit, category: category ?? null, slugs: slugs ?? null } });
  });

  /**
   * GET /api/v1/prices/export?format=csv&...
   * CSV export (Excel uyumlu, UTF-8 BOM'lu). Max 2000 satir.
   */
  app.get("/prices/export", async (req, reply) => {
    const parsed = qExport.safeParse(req.query);
    if (!parsed.success) return reply.status(400).send({ error: "Gecersiz sorgu parametreleri" });
    const p = parsed.data;
    const rows = await listPriceRows({
      product:  p.product,
      q:        p.q,
      city:     p.city,
      market:   p.market,
      category: p.category,
      range:    p.range,
      limit:    Math.min(2000, p.limit ?? 2000),
      latestOnly: p.latestOnly,
    });
    reply.header("Content-Type", "text/csv; charset=utf-8");
    reply.header("Content-Disposition", `attachment; filename="${csvFilename()}"`);
    reply.header("Cache-Control", "no-store");
    return reply.send(toCsvPayload(rows));
  });

  /**
   * GET /api/v1/prices
   * Ana fiyat tablosu — filtrelenebilir
   * ?product=domates&city=istanbul&market=istanbul-hal&category=sebze&range=7d&limit=100
   */
  app.get("/prices", async (req, reply) => {
    const parsed = qList.safeParse(req.query);
    if (!parsed.success) return reply.status(400).send({ error: "Gecersiz sorgu parametreleri" });
    const p = parsed.data;
    const [result, latestDate] = await Promise.all([
      listPriceRowsPage({
        product:    p.product,
        q:          p.q,
        city:       p.city,
        market:     p.market,
        category:   p.category,
        range:      p.range,
        limit:      p.limit,
        page:       p.page,
        sort:       p.sort,
        latestOnly: p.latestOnly,
      }),
      latestRecordedDate(),
    ]);
    return reply.send({
      items: result.items,
      meta: {
        rangeDays: parseRangeToDays(p.range),
        latestRecordedDate: latestDate,
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
      },
    });
  });
}
