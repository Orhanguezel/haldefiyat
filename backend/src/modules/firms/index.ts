import type { FastifyInstance } from "fastify";
import { requireAuth } from "@agro/shared-backend/middleware/auth";
import { getAuthUserId } from "@agro/shared-backend/modules/_shared";
import { z } from "zod";
import { discoverFirmLinks } from "./fetcher";
import {
  countFirms,
  createFirmDeal,
  createFirmClaim,
  createFirmProduct,
  createFirmProductsBulk,
  createUserFirm,
  createFirmSponsorship,
  deleteFirmDeal,
  deleteFirmProduct,
  deleteFirmSponsorship,
  firmDashboardSummary,
  getFirmById,
  getMyFirm,
  adminUpdateFirm,
  getFirmBySlug,
  listFirmClaims,
  listFirmDeals,
  listFirms,
  listFirmSponsorships,
  listStaleFirms,
  moderateFirmClaim,
  updateFirmByOwner,
  updateFirmDeal,
  updateFirmProduct,
  updateFirmSponsorship,
} from "./repository";
import { runFirmDirectoryEtl } from "./service";
import { isValidCitySlug, isValidDistrictSlug } from "@/data/turkey-city-slugs";

const firmTypeSchema = z.enum(["komisyoncu", "soguk_hava", "nakliye", "zirai_ilac"]);

const listQuerySchema = z.object({
  city: z.string().min(1).max(96).optional(),
  district: z.string().min(1).max(128).optional(),
  type: firmTypeSchema.optional(),
  q: z.string().min(1).max(128).optional(),
  limit: z.coerce.number().int().min(1).max(200).optional(),
  offset: z.coerce.number().int().min(0).optional(),
  status: z.enum(["pending", "approved", "rejected", "all"]).optional(),
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

const firmWriteFieldsSchema = z.object({
  name: z.string().trim().min(2).max(255),
  contactPerson: z.string().trim().max(255).nullable().optional(),
  phone: z.string().trim().max(128).nullable().optional(),
  address: z.string().trim().max(5000).nullable().optional(),
  citySlug: z.string().trim().max(96).nullable().optional(),
  districtSlug: z.string().trim().max(128).nullable().optional(),
  description: z.string().trim().max(5000).nullable().optional(),
  categories: z.array(z.string().trim().min(1).max(80)).max(30).optional(),
});

function refineFirmLocation(data: { citySlug?: string | null; districtSlug?: string | null }, ctx: z.RefinementCtx) {
  if (data.citySlug && !isValidCitySlug(data.citySlug)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["citySlug"], message: "invalid_city" });
  }
  if (data.districtSlug && !isValidDistrictSlug(data.citySlug, data.districtSlug)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["districtSlug"], message: "invalid_district" });
  }
}

const firmWriteBodySchema = firmWriteFieldsSchema.superRefine(refineFirmLocation);
const firmPatchBodySchema = firmWriteFieldsSchema.partial().superRefine(refineFirmLocation);

const firmProductBodySchema = z.object({
  productSlug: z.string().trim().max(128).nullable().optional(),
  productName: z.string().trim().min(1).max(255),
  note: z.string().trim().max(500).nullable().optional(),
  price: z.string().trim().max(128).nullable().optional(),
  displayOrder: z.coerce.number().int().optional(),
});

const firmProductPatchBodySchema = firmProductBodySchema.partial();

const firmProductsBulkBodySchema = z.object({
  products: z.array(firmProductBodySchema).max(500),
});

const claimBodySchema = z.object({
  evidence: z.string().trim().max(2000).nullable().optional(),
});

const moderateFirmBodySchema = z.object({
  status: z.enum(["pending", "approved", "rejected"]).optional(),
  claimStatus: z.enum(["unclaimed", "pending", "verified"]).optional(),
  ownerUserId: z.string().trim().max(36).nullable().optional(),
  description: z.string().trim().max(5000).nullable().optional(),
});

const moderateClaimBodySchema = z.object({
  status: z.enum(["approved", "rejected"]),
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

  app.get("/firms/me", { onRequest: [requireAuth] }, async (req, reply) => {
    const userId = getAuthUserId(req);
    const firm = await getMyFirm(userId);
    return reply.send({ item: firm });
  });

  app.get<{ Params: { slug: string } }>("/firms/:slug", async (req, reply) => {
    const firm = await getFirmBySlug(req.params.slug);
    if (!firm) return reply.status(404).send({ error: "Firma bulunamadi" });
    return reply.send({ item: firm });
  });

  app.post("/firms", { onRequest: [requireAuth] }, async (req, reply) => {
    const userId = getAuthUserId(req);
    const parsed = firmWriteBodySchema.safeParse(req.body ?? {});
    if (!parsed.success) return reply.status(400).send({ error: "Gecersiz firma bilgileri", issues: parsed.error.issues });
    if (!parsed.data.citySlug) {
      return reply.status(400).send({ error: "Gecersiz firma bilgileri", issues: [{ path: ["citySlug"], message: "required_city" }] });
    }
    const firm = await createUserFirm({ ...parsed.data, ownerUserId: userId });
    return reply.status(201).send({ item: firm });
  });

  app.patch<{ Params: { id: string } }>("/firms/:id", { onRequest: [requireAuth] }, async (req, reply) => {
    const userId = getAuthUserId(req);
    const id = Number(req.params.id);
    if (!Number.isFinite(id) || id <= 0) return reply.status(400).send({ error: "Gecersiz firma id" });
    const parsed = firmPatchBodySchema.safeParse(req.body ?? {});
    if (!parsed.success) return reply.status(400).send({ error: "Gecersiz firma bilgileri", issues: parsed.error.issues });
    const firm = await updateFirmByOwner(id, userId, parsed.data);
    if (!firm) return reply.status(404).send({ error: "Firma bulunamadi veya yetki yok" });
    return reply.send({ item: firm });
  });

  app.post<{ Params: { id: string } }>("/firms/:id/products", { onRequest: [requireAuth] }, async (req, reply) => {
    const userId = getAuthUserId(req);
    const firmId = Number(req.params.id);
    if (!Number.isFinite(firmId) || firmId <= 0) return reply.status(400).send({ error: "Gecersiz firma id" });
    const firm = await getFirmById(firmId);
    if (!firm || firm.ownerUserId !== userId) return reply.status(404).send({ error: "Firma bulunamadi veya yetki yok" });
    const parsed = firmProductBodySchema.safeParse(req.body ?? {});
    if (!parsed.success) return reply.status(400).send({ error: "Gecersiz urun bilgileri", issues: parsed.error.issues });
    const id = await createFirmProduct({ ...parsed.data, firmId });
    return reply.status(201).send({ id });
  });

  app.post<{ Params: { id: string } }>("/firms/:id/products/bulk", {
    onRequest: [requireAuth],
    config: { rateLimit: { max: 5, timeWindow: "1 minute" } },
  }, async (req, reply) => {
    const userId = getAuthUserId(req);
    const firmId = Number(req.params.id);
    if (!Number.isFinite(firmId) || firmId <= 0) return reply.status(400).send({ error: "Gecersiz firma id" });
    const firm = await getFirmById(firmId);
    if (!firm || firm.ownerUserId !== userId) return reply.status(404).send({ error: "Firma bulunamadi veya yetki yok" });
    const bulkParsed = firmProductsBulkBodySchema.safeParse(req.body ?? {});
    const incoming = Array.isArray((req.body as { products?: unknown[] } | undefined)?.products)
      ? ((req.body as { products?: unknown[] }).products ?? []).slice(0, 500)
      : [];
    if (!bulkParsed.success && incoming.length === 0) {
      return reply.status(400).send({ error: "Gecersiz toplu urun bilgileri", issues: bulkParsed.error.issues });
    }
    const valid = [];
    let skipped = 0;
    for (const product of incoming) {
      const parsed = firmProductBodySchema.safeParse(product);
      if (parsed.success) valid.push(parsed.data);
      else skipped += 1;
    }
    const inserted = await createFirmProductsBulk(firmId, valid);
    return reply.status(201).send({ inserted, skipped });
  });

  app.patch<{ Params: { id: string; productId: string } }>("/firms/:id/products/:productId", { onRequest: [requireAuth] }, async (req, reply) => {
    const userId = getAuthUserId(req);
    const firmId = Number(req.params.id);
    const productId = Number(req.params.productId);
    if (!Number.isFinite(firmId) || !Number.isFinite(productId)) return reply.status(400).send({ error: "Gecersiz id" });
    const firm = await getFirmById(firmId);
    if (!firm || firm.ownerUserId !== userId) return reply.status(404).send({ error: "Firma bulunamadi veya yetki yok" });
    const parsed = firmProductPatchBodySchema.safeParse(req.body ?? {});
    if (!parsed.success) return reply.status(400).send({ error: "Gecersiz urun bilgileri", issues: parsed.error.issues });
    const affected = await updateFirmProduct(productId, { ...parsed.data, firmId });
    if (!affected) return reply.status(404).send({ error: "Urun bulunamadi" });
    return reply.send({ ok: true });
  });

  app.delete<{ Params: { id: string; productId: string } }>("/firms/:id/products/:productId", { onRequest: [requireAuth] }, async (req, reply) => {
    const userId = getAuthUserId(req);
    const firmId = Number(req.params.id);
    const productId = Number(req.params.productId);
    if (!Number.isFinite(firmId) || !Number.isFinite(productId)) return reply.status(400).send({ error: "Gecersiz id" });
    const firm = await getFirmById(firmId);
    if (!firm || firm.ownerUserId !== userId) return reply.status(404).send({ error: "Firma bulunamadi veya yetki yok" });
    const affected = await deleteFirmProduct(productId, firmId);
    if (!affected) return reply.status(404).send({ error: "Urun bulunamadi" });
    return reply.send({ ok: true });
  });

  app.post<{ Params: { id: string } }>("/firms/:id/claim", { onRequest: [requireAuth] }, async (req, reply) => {
    const userId = getAuthUserId(req);
    const firmId = Number(req.params.id);
    if (!Number.isFinite(firmId) || firmId <= 0) return reply.status(400).send({ error: "Gecersiz firma id" });
    const parsed = claimBodySchema.safeParse(req.body ?? {});
    if (!parsed.success) return reply.status(400).send({ error: "Gecersiz claim bilgisi", issues: parsed.error.issues });
    const id = await createFirmClaim({ firmId, userId, evidence: parsed.data.evidence });
    if (!id) return reply.status(404).send({ error: "Firma bulunamadi" });
    return reply.status(201).send({ id });
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

  app.patch<{ Params: { id: string } }>("/firms/:id", async (req, reply) => {
    const id = Number(req.params.id);
    if (!Number.isFinite(id) || id <= 0) return reply.status(400).send({ error: "Gecersiz firma id" });
    const parsed = moderateFirmBodySchema.safeParse(req.body ?? {});
    if (!parsed.success) return reply.status(400).send({ error: "Gecersiz firma alanlari", issues: parsed.error.issues });
    const firm = await adminUpdateFirm(id, parsed.data);
    if (!firm) return reply.status(404).send({ error: "Firma bulunamadi" });
    return reply.send({ item: firm });
  });

  app.get("/firms/claims", async (req, reply) => {
    const status = ((req.query as Record<string, string | undefined>).status ?? "pending") as "pending" | "approved" | "rejected" | "all";
    return reply.send({ items: await listFirmClaims(status) });
  });

  app.post<{ Params: { id: string } }>("/firms/claims/:id/moderate", async (req, reply) => {
    const id = Number(req.params.id);
    if (!Number.isFinite(id) || id <= 0) return reply.status(400).send({ error: "Gecersiz claim id" });
    const parsed = moderateClaimBodySchema.safeParse(req.body ?? {});
    if (!parsed.success) return reply.status(400).send({ error: "Gecersiz moderasyon karari", issues: parsed.error.issues });
    const reviewedBy = getAuthUserId(req);
    const row = await moderateFirmClaim(id, parsed.data.status, reviewedBy);
    if (!row) return reply.status(404).send({ error: "Claim bulunamadi" });
    return reply.send({ item: row });
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
