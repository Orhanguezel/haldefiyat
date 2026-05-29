import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { discoverFirmLinks } from "./fetcher";
import {
  countFirms,
  createFirmDeal,
  firmDashboardSummary,
  getFirmBySlug,
  listFirmDeals,
  listFirms,
  listStaleFirms,
} from "./repository";
import { runFirmDirectoryEtl } from "./service";

const firmTypeSchema = z.enum(["komisyoncu", "soguk_hava", "nakliye", "zirai_ilac"]);

const listQuerySchema = z.object({
  city: z.string().min(1).max(96).optional(),
  district: z.string().min(1).max(128).optional(),
  type: firmTypeSchema.optional(),
  q: z.string().min(1).max(128).optional(),
  limit: z.coerce.number().int().min(1).max(200).optional(),
  offset: z.coerce.number().int().min(0).optional(),
});

const etlBodySchema = z.object({
  city: z.string().min(1).max(96).optional(),
  type: z.enum(["komisyoncu", "soguk_hava", "nakliye", "zirai_ilac", "all"]).optional(),
  all: z.boolean().optional(),
  dryRun: z.boolean().optional(),
  limit: z.coerce.number().int().min(1).max(5000).optional(),
  delayMs: z.coerce.number().int().min(0).max(10_000).optional(),
  includeDetails: z.boolean().optional(),
});

const dealBodySchema = z.object({
  status: z.enum(["lead", "contacted", "negotiating", "won", "lost"]).optional(),
  dealType: z.enum(["reklam", "sponsorluk", "premium", "diger"]).optional(),
  value: z.coerce.number().nonnegative().optional(),
  currency: z.string().max(8).optional(),
  owner: z.string().max(128).optional().nullable(),
  notes: z.string().max(5000).optional().nullable(),
  contactedAt: z.string().datetime().optional().nullable(),
  nextActionAt: z.string().datetime().optional().nullable(),
});

export async function registerFirmsPublic(app: FastifyInstance) {
  app.get("/firms", async (req, reply) => {
    const parsed = listQuerySchema.safeParse(req.query);
    if (!parsed.success) return reply.status(400).send({ error: "Gecersiz sorgu parametreleri" });
    const [items, total] = await Promise.all([
      listFirms(parsed.data),
      countFirms(parsed.data),
    ]);
    return reply.send({ items, meta: { total, limit: parsed.data.limit ?? 50, offset: parsed.data.offset ?? 0 } });
  });

  app.get<{ Params: { slug: string } }>("/firms/:slug", async (req, reply) => {
    const firm = await getFirmBySlug(req.params.slug);
    if (!firm) return reply.status(404).send({ error: "Firma bulunamadi" });
    return reply.send({ item: firm });
  });
}

export async function registerFirmsAdmin(app: FastifyInstance) {
  app.get("/firms", async (req, reply) => {
    const parsed = listQuerySchema.safeParse(req.query);
    if (!parsed.success) return reply.status(400).send({ error: "Gecersiz sorgu parametreleri" });
    const [items, total, summary] = await Promise.all([
      listFirms({ ...parsed.data, activeOnly: false }),
      countFirms({ ...parsed.data, activeOnly: false }),
      firmDashboardSummary(),
    ]);
    return reply.send({ items, meta: { total, limit: parsed.data.limit ?? 50, offset: parsed.data.offset ?? 0 }, summary });
  });

  app.get("/firms/stale", async (req, reply) => {
    const days = Number((req.query as Record<string, unknown>).days ?? 45);
    return reply.send({ items: await listStaleFirms(Number.isFinite(days) ? days : 45) });
  });

  app.post("/firms/etl/run", async (req, reply) => {
    const parsed = etlBodySchema.safeParse(req.body ?? {});
    if (!parsed.success) return reply.status(400).send({ error: "Gecersiz ETL parametreleri", issues: parsed.error.issues });

    if (parsed.data.dryRun) {
      const items = await discoverFirmLinks(parsed.data);
      return reply.send({
        dryRun: true,
        discovered: items.length,
        first: items.slice(0, 20),
      });
    }

    const result = await runFirmDirectoryEtl(parsed.data);
    return reply.send(result);
  });

  app.get<{ Params: { id: string } }>("/firms/:id/deals", async (req, reply) => {
    const id = Number(req.params.id);
    if (!Number.isFinite(id) || id <= 0) return reply.status(400).send({ error: "Gecersiz firma id" });
    return reply.send({ items: await listFirmDeals(id) });
  });

  app.post<{ Params: { id: string } }>("/firms/:id/deals", async (req, reply) => {
    const id = Number(req.params.id);
    if (!Number.isFinite(id) || id <= 0) return reply.status(400).send({ error: "Gecersiz firma id" });
    const parsed = dealBodySchema.safeParse(req.body ?? {});
    if (!parsed.success) return reply.status(400).send({ error: "Gecersiz deal parametreleri", issues: parsed.error.issues });
    const newId = await createFirmDeal({
      firmId: id,
      status: parsed.data.status,
      dealType: parsed.data.dealType,
      value: parsed.data.value === undefined ? null : parsed.data.value.toFixed(2),
      currency: parsed.data.currency,
      owner: parsed.data.owner,
      notes: parsed.data.notes,
      contactedAt: parsed.data.contactedAt ? new Date(parsed.data.contactedAt) : null,
      nextActionAt: parsed.data.nextActionAt ? new Date(parsed.data.nextActionAt) : null,
    });
    return reply.status(201).send({ id: newId });
  });
}
