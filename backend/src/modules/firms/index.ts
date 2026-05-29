import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { discoverFirmLinks } from "./fetcher";
import {
  countFirms,
  createFirmDeal,
  createFirmSponsorship,
  deleteFirmDeal,
  deleteFirmSponsorship,
  firmDashboardSummary,
  getFirmById,
  getFirmBySlug,
  listFirmDeals,
  listFirms,
  listFirmSponsorships,
  listStaleFirms,
  updateFirmDeal,
  updateFirmSponsorship,
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

const sponsorshipBodySchema = z.object({
  firmId: z.coerce.number().int().positive(),
  tier: z.string().min(1).max(32).optional(),
  placement: z.enum(["il", "kategori", "global"]).optional(),
  placementSlug: z.string().max(128).optional().nullable(),
  startsAt: z.string().datetime(),
  endsAt: z.string().datetime(),
  isActive: z.boolean().optional(),
});

const sponsorshipPatchSchema = sponsorshipBodySchema.partial().extend({
  firmId: z.coerce.number().int().positive().optional(),
});

const publicLeadBodySchema = z.object({
  name: z.string().min(2).max(128),
  phone: z.string().min(5).max(64).optional(),
  email: z.string().email().optional(),
  message: z.string().min(5).max(1000),
});

function parseOptionalDate(value: string | null | undefined): Date | null | undefined {
  if (value === undefined || value === null) return value;
  return new Date(value);
}

function toDealInput(data: z.infer<typeof dealBodySchema>, firmId: number): {
  firmId: number;
  status?: "lead" | "contacted" | "negotiating" | "won" | "lost";
  dealType?: "reklam" | "sponsorluk" | "premium" | "diger";
  value?: string | null;
  currency?: string;
  owner?: string | null;
  notes?: string | null;
  contactedAt?: Date | null;
  nextActionAt?: Date | null;
} {
  return {
    firmId,
    status: data.status,
    dealType: data.dealType,
    value: data.value === undefined ? undefined : data.value.toFixed(2),
    currency: data.currency,
    owner: data.owner,
    notes: data.notes,
    contactedAt: parseOptionalDate(data.contactedAt),
    nextActionAt: parseOptionalDate(data.nextActionAt),
  };
}

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

  app.post<{ Params: { slug: string } }>("/firms/:slug/leads", async (req, reply) => {
    const firm = await getFirmBySlug(req.params.slug);
    if (!firm) return reply.status(404).send({ error: "Firma bulunamadi" });
    const parsed = publicLeadBodySchema.safeParse(req.body ?? {});
    if (!parsed.success) return reply.status(400).send({ error: "Gecersiz lead parametreleri", issues: parsed.error.issues });
    const data = parsed.data;
    const newId = await createFirmDeal({
      firmId: firm.id,
      status: "lead",
      dealType: "diger",
      value: null,
      currency: "TRY",
      owner: "public-form",
      notes: [
        `Public lead: ${data.name}`,
        data.phone ? `Telefon: ${data.phone}` : null,
        data.email ? `E-posta: ${data.email}` : null,
        `Mesaj: ${data.message}`,
      ].filter(Boolean).join("\n"),
    });
    return reply.status(201).send({ ok: true, id: newId });
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
    const firm = await getFirmById(id);
    if (!firm) return reply.status(404).send({ error: "Firma bulunamadi" });
    const newId = await createFirmDeal(toDealInput(parsed.data, id));
    return reply.status(201).send({ id: newId });
  });

  app.patch<{ Params: { dealId: string } }>("/firms/deals/:dealId", async (req, reply) => {
    const dealId = Number(req.params.dealId);
    if (!Number.isFinite(dealId) || dealId <= 0) return reply.status(400).send({ error: "Gecersiz deal id" });
    const parsed = dealBodySchema.safeParse(req.body ?? {});
    if (!parsed.success) return reply.status(400).send({ error: "Gecersiz deal parametreleri", issues: parsed.error.issues });
    const affected = await updateFirmDeal(dealId, toDealInput(parsed.data, 0));
    if (!affected) return reply.status(404).send({ error: "Deal bulunamadi" });
    return reply.send({ ok: true });
  });

  app.delete<{ Params: { dealId: string } }>("/firms/deals/:dealId", async (req, reply) => {
    const dealId = Number(req.params.dealId);
    if (!Number.isFinite(dealId) || dealId <= 0) return reply.status(400).send({ error: "Gecersiz deal id" });
    const affected = await deleteFirmDeal(dealId);
    if (!affected) return reply.status(404).send({ error: "Deal bulunamadi" });
    return reply.send({ ok: true });
  });

  app.get("/firms/sponsorships", async (_req, reply) => {
    return reply.send({ items: await listFirmSponsorships() });
  });

  app.get<{ Params: { id: string } }>("/firms/:id/sponsorships", async (req, reply) => {
    const id = Number(req.params.id);
    if (!Number.isFinite(id) || id <= 0) return reply.status(400).send({ error: "Gecersiz firma id" });
    return reply.send({ items: await listFirmSponsorships(id) });
  });

  app.post("/firms/sponsorships", async (req, reply) => {
    const parsed = sponsorshipBodySchema.safeParse(req.body ?? {});
    if (!parsed.success) return reply.status(400).send({ error: "Gecersiz sponsorluk parametreleri", issues: parsed.error.issues });
    const firm = await getFirmById(parsed.data.firmId);
    if (!firm) return reply.status(404).send({ error: "Firma bulunamadi" });
    const newId = await createFirmSponsorship({
      ...parsed.data,
      startsAt: new Date(parsed.data.startsAt),
      endsAt: new Date(parsed.data.endsAt),
    });
    return reply.status(201).send({ id: newId });
  });

  app.patch<{ Params: { sponsorshipId: string } }>("/firms/sponsorships/:sponsorshipId", async (req, reply) => {
    const sponsorshipId = Number(req.params.sponsorshipId);
    if (!Number.isFinite(sponsorshipId) || sponsorshipId <= 0) return reply.status(400).send({ error: "Gecersiz sponsorluk id" });
    const parsed = sponsorshipPatchSchema.safeParse(req.body ?? {});
    if (!parsed.success) return reply.status(400).send({ error: "Gecersiz sponsorluk parametreleri", issues: parsed.error.issues });
    const affected = await updateFirmSponsorship(sponsorshipId, {
      ...parsed.data,
      startsAt: parsed.data.startsAt ? new Date(parsed.data.startsAt) : undefined,
      endsAt: parsed.data.endsAt ? new Date(parsed.data.endsAt) : undefined,
    });
    if (!affected) return reply.status(404).send({ error: "Sponsorluk bulunamadi" });
    return reply.send({ ok: true });
  });

  app.delete<{ Params: { sponsorshipId: string } }>("/firms/sponsorships/:sponsorshipId", async (req, reply) => {
    const sponsorshipId = Number(req.params.sponsorshipId);
    if (!Number.isFinite(sponsorshipId) || sponsorshipId <= 0) return reply.status(400).send({ error: "Gecersiz sponsorluk id" });
    const affected = await deleteFirmSponsorship(sponsorshipId);
    if (!affected) return reply.status(404).send({ error: "Sponsorluk bulunamadi" });
    return reply.send({ ok: true });
  });
}
