import type { FastifyInstance } from "fastify";
import { db } from "@/db/client";
import { hfCompetitorSites, hfCompetitorSnapshots } from "@/db/schema";
import { desc, eq, sql } from "drizzle-orm";
import { runCompetitorCheck } from "./checker";
import { isDiscoveryRunning, startDiscoveryBackground } from "./discovery";
import { discoveryDelta, discoveryDomainResults, discoveryDomains, discoveryQueries, discoveryQueryResults, getLatestRun, listRuns } from "./discovery-read";

export async function registerCompetitorMonitor(app: FastifyInstance) {
  /**
   * GET /api/v1/admin/competitor-monitor/sites
   * Tüm rakip site tanımları + son snapshot özeti
   */
  app.get("/competitor-monitor/sites", async (_req, reply) => {
    const sites = await db
      .select()
      .from(hfCompetitorSites)
      .orderBy(hfCompetitorSites.siteKey);

    // Her site için son snapshot'ı getir
    const result = await Promise.all(
      sites.map(async (site) => {
        const [lastSnap] = await db
          .select({
            productCount: hfCompetitorSnapshots.productCount,
            marketCount: hfCompetitorSnapshots.marketCount,
            detectedFeatures: hfCompetitorSnapshots.detectedFeatures,
            diffSummary: hfCompetitorSnapshots.diffSummary,
            checkedAt: hfCompetitorSnapshots.checkedAt,
            scrapeOk: hfCompetitorSnapshots.scrapeOk,
          })
          .from(hfCompetitorSnapshots)
          .where(eq(hfCompetitorSnapshots.siteKey, site.siteKey))
          .orderBy(desc(hfCompetitorSnapshots.checkedAt))
          .limit(1);

        return { ...site, lastSnapshot: lastSnap ?? null };
      }),
    );

    return reply.send({ items: result });
  });

  /**
   * GET /api/v1/admin/competitor-monitor/history/:siteKey
   * Bir sitenin son N snapshot'ı
   */
  app.get<{ Params: { siteKey: string }; Querystring: { limit?: string } }>(
    "/competitor-monitor/history/:siteKey",
    async (req, reply) => {
      const { siteKey } = req.params;
      const limit = Math.min(parseInt(req.query.limit ?? "20", 10), 100);

      const rows = await db
        .select()
        .from(hfCompetitorSnapshots)
        .where(eq(hfCompetitorSnapshots.siteKey, siteKey))
        .orderBy(desc(hfCompetitorSnapshots.checkedAt))
        .limit(limit);

      return reply.send({ siteKey, items: rows });
    },
  );

  /**
   * POST /api/v1/admin/competitor-monitor/run
   * Manuel kontrol tetikle. Body: { siteKey?: string }
   */
  app.post<{ Body: { siteKey?: string } }>(
    "/competitor-monitor/run",
    async (req, reply) => {
      const { siteKey } = (req.body ?? {}) as { siteKey?: string };
      const results = await runCompetitorCheck(siteKey);
      return reply.send({ ok: true, results });
    },
  );

  /**
   * PATCH /api/v1/admin/competitor-monitor/sites/:siteKey
   * Aktif/pasif geçiş
   */
  app.patch<{ Params: { siteKey: string }; Body: { isActive: 0 | 1 } }>(
    "/competitor-monitor/sites/:siteKey",
    async (req, reply) => {
      const { siteKey } = req.params;
      const { isActive } = req.body ?? {};
      if (isActive !== 0 && isActive !== 1) {
        return reply.status(400).send({ error: "isActive 0 veya 1 olmalı" });
      }
      await db
        .update(hfCompetitorSites)
        .set({ isActive })
        .where(eq(hfCompetitorSites.siteKey, siteKey));
      return reply.send({ ok: true });
    },
  );

  // ─── Rakip kesfi (arama sonucu taramasi) ────────────────────────────────

  /** POST /competitor-monitor/discover — arka planda kosu baslatir. Body: { queries?, limit?, pages? } */
  app.post<{ Body: { queries?: string[]; limit?: number; pages?: 1 | 2 } }>("/competitor-monitor/discover", async (req, reply) => {
    const body = req.body ?? {};
    const queries = Array.isArray(body.queries) ? body.queries.filter((q) => typeof q === "string" && q.trim()).slice(0, 100) : undefined;
    const started = startDiscoveryBackground({ queries, limit: body.limit, pages: body.pages });
    if (!started) return reply.status(409).send({ error: "Kesif zaten calisiyor" });
    return reply.send({ ok: true, started: true });
  });

  /** GET /competitor-monitor/discovery — son kosu + alan adi toplamlari + sorgular */
  app.get<{ Querystring: { runId?: string } }>("/competitor-monitor/discovery", async (req, reply) => {
    const latest = await getLatestRun();
    const runId = req.query.runId ? Number(req.query.runId) : latest ? Number(latest.id) : null;
    if (!runId) return reply.send({ run: null, running: isDiscoveryRunning(), domains: [], queries: [], runs: [], delta: null });
    const [runs, domains, queries, delta] = await Promise.all([listRuns(), discoveryDomains(runId), discoveryQueries(runId), discoveryDelta(runId)]);
    const run = runs.find((r) => Number(r.id) === runId) ?? latest;
    return reply.send({ run, running: isDiscoveryRunning(), domains, queries, runs, delta });
  });

  app.get<{ Querystring: { runId: string; domain?: string; query?: string } }>("/competitor-monitor/discovery/results", async (req, reply) => {
    const runId = Number(req.query.runId);
    if (!Number.isFinite(runId)) return reply.status(400).send({ error: "runId gerekli" });
    if (req.query.domain) return reply.send({ items: await discoveryDomainResults(runId, req.query.domain) });
    if (req.query.query) return reply.send({ items: await discoveryQueryResults(runId, req.query.query) });
    return reply.status(400).send({ error: "domain veya query gerekli" });
  });

  /** POST /competitor-monitor/sites — kesiften izlemeye al. Body: { domain, name? } */
  app.post<{ Body: { domain?: string; name?: string; url?: string } }>("/competitor-monitor/sites", async (req, reply) => {
    const domain = String(req.body?.domain ?? "").trim().toLowerCase().replace(/^www\./, "");
    if (!/^[a-z0-9.-]+\.[a-z]{2,}$/.test(domain)) return reply.status(400).send({ error: "Gecersiz alan adi" });
    const siteKey = domain.replace(/[^a-z0-9]+/g, "_").slice(0, 64);
    const url = String(req.body?.url ?? `https://${domain}`).slice(0, 512);
    await db.insert(hfCompetitorSites).values({ siteKey, name: String(req.body?.name ?? domain).slice(0, 255), url }).onDuplicateKeyUpdate({ set: { isActive: 1 } });
    return reply.status(201).send({ ok: true, siteKey });
  });
}
