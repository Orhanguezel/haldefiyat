/**
 * TCMB EVDS aylık enflasyon göstergeleri:
 *   - GET  /api/v1/inflation/latest       → son ayın 3 göstergesi (TUFE, TUFE-gida, Yi-UFE)
 *   - GET  /api/v1/inflation              → son 13 ay (her gösterge)
 *   - POST /api/v1/admin/inflation/sync   → EVDS'den manuel çekme tetiklemesi (cron'la aynı)
 *
 * Cron: `INFLATION_CRON_SCHEDULE` (varsayılan: ayın 5'i 10:00 UTC).
 * Auth: `EVDS_API_KEY` env (TCMB EVDS portalından ücretsiz alınır).
 */

import type { FastifyInstance } from "fastify";
import {
  latestIndicator,
  listInflation,
  syncInflation,
  upsertManualInflation,
  type ManualInflationInput,
} from "./repository";
import type { EvdsIndicator } from "./evds-client";

export async function registerInflationPublic(api: FastifyInstance) {
  api.get("/inflation/latest", async (_req, reply) => {
    const [tufe, gida, ufe] = await Promise.all([
      latestIndicator("tufe_genel"),
      latestIndicator("tufe_gida"),
      latestIndicator("ufe_genel"),
    ]);
    return reply.send({
      items: { tufe_genel: tufe, tufe_gida: gida, ufe_genel: ufe },
    });
  });

  api.get<{ Querystring: { months?: string } }>("/inflation", async (req, reply) => {
    const months = Math.min(parseInt(req.query.months ?? "13", 10) || 13, 60);
    const items = await listInflation(months);
    return reply.send({ items });
  });
}

export async function registerInflationAdmin(adminApi: FastifyInstance) {
  adminApi.post("/inflation/sync", async (_req, reply) => {
    try {
      const results = await syncInflation();
      return reply.send({ ok: true, results });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return reply.status(500).send({ ok: false, error: msg });
    }
  });

  // Manuel veri girişi — EVDS otomasyonu çalışmadığında kullanılır.
  // Body: { periodYear, periodMonth, indicator, indexValue?, yoyChangePct?, momChangePct? }
  // veya çoklu: { items: [{ ...InflationInput }] }
  adminApi.post<{ Body: ManualInflationInput | { items: ManualInflationInput[] } }>(
    "/inflation/manual",
    async (req, reply) => {
      const body = req.body;
      const items: ManualInflationInput[] = Array.isArray((body as { items?: unknown[] }).items)
        ? (body as { items: ManualInflationInput[] }).items
        : [body as ManualInflationInput];

      const validIndicators: EvdsIndicator[] = ["tufe_genel", "tufe_gida", "ufe_genel"];
      const errors: string[] = [];
      let saved = 0;

      for (const item of items) {
        if (!item || typeof item.periodYear !== "number" || typeof item.periodMonth !== "number") {
          errors.push("periodYear ve periodMonth zorunlu");
          continue;
        }
        if (item.periodMonth < 1 || item.periodMonth > 12) {
          errors.push(`Geçersiz ay: ${item.periodMonth}`);
          continue;
        }
        if (!validIndicators.includes(item.indicator)) {
          errors.push(`Geçersiz indicator: ${item.indicator} (tufe_genel|tufe_gida|ufe_genel)`);
          continue;
        }
        await upsertManualInflation(item);
        saved++;
      }

      return reply.send({ ok: errors.length === 0, saved, errors });
    },
  );
}

export { syncInflation } from "./repository";
