import type { FastifyInstance } from "fastify";
import { z } from "zod";
import {
  listProduction,
  listSpecies,
  productionSeries,
  productionSummary,
} from "./repository";

const qList = z.object({
  species:  z.string().optional(),
  region:   z.string().optional(),
  category: z.string().optional(),
  yearFrom: z.coerce.number().int().optional(),
  yearTo:   z.coerce.number().int().optional(),
  limit:    z.coerce.number().int().optional(),
});

const qSeries = z.object({
  species: z.string().min(1),
  region:  z.string().optional(),
});

const qSpecies = z.object({
  region: z.string().optional(),
});

export async function registerProduction(app: FastifyInstance) {
  /**
   * GET /api/v1/production — Yıllık üretim kayıtları (filtrelenebilir)
   */
  app.get("/production", async (req, reply) => {
    const p = qList.safeParse(req.query);
    if (!p.success) return reply.status(400).send({ error: "Gecersiz sorgu parametreleri" });
    const [items, summary] = await Promise.all([listProduction(p.data), productionSummary()]);
    return reply.send({ items, meta: { summary } });
  });

  /**
   * GET /api/v1/production/series?species=<slug>&region=<slug>
   * Tek tür için yıllık zaman serisi (grafik için)
   */
  app.get("/production/series", async (req, reply) => {
    const p = qSeries.safeParse(req.query);
    if (!p.success) return reply.status(400).send({ error: "species parametresi zorunlu" });
    const items = await productionSeries(p.data.species, p.data.region);
    return reply.send({ items, meta: { species: p.data.species, region: p.data.region ?? null } });
  });

  /**
   * GET /api/v1/production/species — tür kataloğu (frontend dropdown için)
   */
  app.get("/production/species", async (req, reply) => {
    const p = qSpecies.safeParse(req.query);
    const items = await listSpecies(p.success ? p.data.region : undefined);
    return reply.send({ items });
  });
}
