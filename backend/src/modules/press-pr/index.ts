import type { FastifyInstance } from "fastify";
import { and, desc, eq, like, sql } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/db/client";
import { hfPressCampaigns, hfPressContacts, hfPressOutreachLogs } from "@/db/schema";

const qContacts = z.object({
  q: z.string().optional(),
  status: z.enum(["target", "contacted", "replied", "published", "blocked"]).optional(),
  publicationType: z.enum(["newspaper", "website", "association", "chamber", "agency", "other"]).optional(),
  limit: z.coerce.number().optional(),
});

const importContactsBody = z.object({
  csv: z.string().min(1),
});

const contactBody = z.object({
  organization: z.string().trim().min(1).max(255),
  publicationType: z.enum(["newspaper", "website", "association", "chamber", "agency", "other"]).default("website"),
  contactName: z.string().trim().max(255).optional().nullable(),
  email: z.string().trim().email().max(255),
  phone: z.string().trim().max(64).optional().nullable(),
  city: z.string().trim().max(128).optional().nullable(),
  tags: z.array(z.string().trim().min(1).max(80)).max(20).optional().default([]),
  status: z.enum(["target", "contacted", "replied", "published", "blocked"]).default("target"),
  notes: z.string().trim().max(5000).optional().nullable(),
});

const contactPatch = contactBody.partial();

const qCampaigns = z.object({
  status: z.enum(["draft", "active", "completed", "archived"]).optional(),
  limit: z.coerce.number().optional(),
});

const campaignBody = z.object({
  name: z.string().trim().min(1).max(255),
  slug: z.string().trim().min(1).max(160).optional(),
  subject: z.string().trim().min(1).max(255),
  pitch: z.string().trim().min(1).max(10000),
  templateKey: z.string().trim().max(128).optional().nullable(),
  segmentTags: z.array(z.string().trim().min(1).max(80)).max(20).optional().default([]),
  status: z.enum(["draft", "active", "completed", "archived"]).default("draft"),
  scheduledAt: z.string().datetime().optional().nullable(),
  sentAt: z.string().datetime().optional().nullable(),
});

const campaignPatch = campaignBody.partial();

const logBody = z.object({
  campaignId: z.coerce.number().int().positive(),
  contactId: z.coerce.number().int().positive(),
  channel: z.enum(["email", "phone", "social", "other"]).default("email"),
  status: z.enum(["planned", "sent", "replied", "published", "bounced", "rejected"]).default("planned"),
  note: z.string().trim().max(5000).optional().nullable(),
  publishedUrl: z.string().trim().url().max(512).optional().nullable(),
  contactedAt: z.string().datetime().optional().nullable(),
});

const logPatch = logBody.partial().omit({ campaignId: true, contactId: true });

export async function registerPressPrAdmin(app: FastifyInstance) {
  app.get("/press/contacts", async (req, reply) => {
    const parsed = qContacts.safeParse(req.query);
    if (!parsed.success) return reply.status(400).send({ error: "Gecersiz sorgu" });
    const { q, status, publicationType } = parsed.data;
    const limit = Math.min(200, Math.max(1, parsed.data.limit ?? 80));
    const conditions = [
      status ? eq(hfPressContacts.status, status) : undefined,
      publicationType ? eq(hfPressContacts.publicationType, publicationType) : undefined,
      q ? like(hfPressContacts.organization, `%${q.replace(/[%_\\]/g, "")}%`) : undefined,
    ].filter(Boolean);

    const query = db.select().from(hfPressContacts);
    const rows = conditions.length
      ? await query.where(and(...conditions)).orderBy(desc(hfPressContacts.updatedAt)).limit(limit)
      : await query.orderBy(desc(hfPressContacts.updatedAt)).limit(limit);
    return reply.send({ items: rows.map(contactRow) });
  });

  app.post("/press/contacts", async (req, reply) => {
    const parsed = contactBody.safeParse(req.body);
    if (!parsed.success) return reply.status(400).send({ error: "Gecersiz medya kisisi", details: parsed.error.flatten() });
    await db.insert(hfPressContacts).values(normalizeContact(parsed.data));
    const [row] = await db.select().from(hfPressContacts).where(eq(hfPressContacts.email, parsed.data.email)).limit(1);
    return reply.status(201).send({ data: contactRow(row!) });
  });

  app.get("/press/contacts/export.csv", async (_req, reply) => {
    const rows = await db.select().from(hfPressContacts).orderBy(desc(hfPressContacts.updatedAt)).limit(1000);
    reply.header("Content-Type", "text/csv; charset=utf-8");
    reply.header("Content-Disposition", `attachment; filename="haldefiyat-press-contacts-${new Date().toISOString().slice(0, 10)}.csv"`);
    return reply.send(toCsv(rows.map(contactRow)));
  });

  app.post("/press/contacts/import", async (req, reply) => {
    const parsed = importContactsBody.safeParse(req.body ?? {});
    if (!parsed.success) return reply.status(400).send({ error: "CSV metni gerekli" });

    const rows = parseCsv(parsed.data.csv);
    let insertedOrUpdated = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const [idx, row] of rows.entries()) {
      const candidate = contactBody.safeParse({
        organization: row.organization || row.kurum || row.yayin || row.publication,
        publicationType: normalizePublicationType(row.publicationType || row.publication_type || row.tip),
        contactName: row.contactName || row.contact_name || row.isim || row.name || null,
        email: row.email || row.eposta || row.mail,
        phone: row.phone || row.telefon || null,
        city: row.city || row.sehir || row.il || null,
        tags: splitCsvTags(row.tags || row.etiketler || row.konu),
        status: normalizeContactStatus(row.status || row.durum),
        notes: row.notes || row.notlar || row.note || null,
      });
      if (!candidate.success) {
        skipped += 1;
        errors.push(`${idx + 2}. satir atlandi`);
        continue;
      }
      const values = normalizeContact(candidate.data);
      await db.insert(hfPressContacts).values(values).onDuplicateKeyUpdate({
        set: {
          organization: values.organization,
          publicationType: values.publicationType,
          contactName: values.contactName,
          phone: values.phone,
          city: values.city,
          tags: values.tags,
          status: values.status,
          notes: values.notes,
          updatedAt: sql`CURRENT_TIMESTAMP(3)`,
        },
      });
      insertedOrUpdated += 1;
    }

    return reply.send({ ok: true, imported: insertedOrUpdated, skipped, errors: errors.slice(0, 20) });
  });

  app.patch<{ Params: { id: string } }>("/press/contacts/:id", async (req, reply) => {
    const id = Number(req.params.id);
    const parsed = contactPatch.safeParse(req.body ?? {});
    if (!Number.isFinite(id) || !parsed.success) return reply.status(400).send({ error: "Gecersiz medya kisisi" });
    await db.update(hfPressContacts).set(normalizeContactPatch(parsed.data)).where(eq(hfPressContacts.id, id));
    const [row] = await db.select().from(hfPressContacts).where(eq(hfPressContacts.id, id)).limit(1);
    if (!row) return reply.status(404).send({ error: "Medya kisisi bulunamadi" });
    return reply.send({ data: contactRow(row) });
  });

  app.get("/press/campaigns", async (req, reply) => {
    const parsed = qCampaigns.safeParse(req.query);
    if (!parsed.success) return reply.status(400).send({ error: "Gecersiz sorgu" });
    const limit = Math.min(100, Math.max(1, parsed.data.limit ?? 50));
    const query = db.select().from(hfPressCampaigns);
    const rows = parsed.data.status
      ? await query.where(eq(hfPressCampaigns.status, parsed.data.status)).orderBy(desc(hfPressCampaigns.updatedAt)).limit(limit)
      : await query.orderBy(desc(hfPressCampaigns.updatedAt)).limit(limit);
    return reply.send({ items: rows.map(campaignRow) });
  });

  app.post("/press/campaigns", async (req, reply) => {
    const parsed = campaignBody.safeParse(req.body);
    if (!parsed.success) return reply.status(400).send({ error: "Gecersiz kampanya", details: parsed.error.flatten() });
    const values = normalizeCampaign(parsed.data);
    await db.insert(hfPressCampaigns).values(values);
    const [row] = await db.select().from(hfPressCampaigns).where(eq(hfPressCampaigns.slug, values.slug)).limit(1);
    return reply.status(201).send({ data: campaignRow(row!) });
  });

  app.patch<{ Params: { id: string } }>("/press/campaigns/:id", async (req, reply) => {
    const id = Number(req.params.id);
    const parsed = campaignPatch.safeParse(req.body ?? {});
    if (!Number.isFinite(id) || !parsed.success) return reply.status(400).send({ error: "Gecersiz kampanya" });
    await db.update(hfPressCampaigns).set(normalizeCampaignPatch(parsed.data)).where(eq(hfPressCampaigns.id, id));
    const [row] = await db.select().from(hfPressCampaigns).where(eq(hfPressCampaigns.id, id)).limit(1);
    if (!row) return reply.status(404).send({ error: "Kampanya bulunamadi" });
    return reply.send({ data: campaignRow(row) });
  });

  app.get<{ Params: { campaignId: string } }>("/press/campaigns/:campaignId/logs", async (req, reply) => {
    const campaignId = Number(req.params.campaignId);
    if (!Number.isFinite(campaignId)) return reply.status(400).send({ error: "Gecersiz kampanya" });
    const rows = await db
      .select({
        id: hfPressOutreachLogs.id,
        campaignId: hfPressOutreachLogs.campaignId,
        contactId: hfPressOutreachLogs.contactId,
        channel: hfPressOutreachLogs.channel,
        status: hfPressOutreachLogs.status,
        note: hfPressOutreachLogs.note,
        publishedUrl: hfPressOutreachLogs.publishedUrl,
        contactedAt: hfPressOutreachLogs.contactedAt,
        createdAt: hfPressOutreachLogs.createdAt,
        organization: hfPressContacts.organization,
        email: hfPressContacts.email,
      })
      .from(hfPressOutreachLogs)
      .innerJoin(hfPressContacts, eq(hfPressContacts.id, hfPressOutreachLogs.contactId))
      .where(eq(hfPressOutreachLogs.campaignId, campaignId))
      .orderBy(desc(hfPressOutreachLogs.contactedAt));
    return reply.send({ items: rows.map(logRow) });
  });

  app.post("/press/logs", async (req, reply) => {
    const parsed = logBody.safeParse(req.body);
    if (!parsed.success) return reply.status(400).send({ error: "Gecersiz temas kaydi", details: parsed.error.flatten() });
    await db.insert(hfPressOutreachLogs).values(normalizeLog(parsed.data));
    await touchContact(parsed.data.contactId, parsed.data.status);
    return reply.status(201).send({ ok: true });
  });

  app.patch<{ Params: { id: string } }>("/press/logs/:id", async (req, reply) => {
    const id = Number(req.params.id);
    const parsed = logPatch.safeParse(req.body ?? {});
    if (!Number.isFinite(id) || !parsed.success) return reply.status(400).send({ error: "Gecersiz temas kaydi" });
    await db.update(hfPressOutreachLogs).set(normalizeLogPatch(parsed.data)).where(eq(hfPressOutreachLogs.id, id));
    return reply.send({ ok: true });
  });

  app.get("/press/summary", async (_req, reply) => {
    const [[contacts], [campaigns], [published]] = await Promise.all([
      db.select({ count: sql<number>`count(*)` }).from(hfPressContacts),
      db.select({ count: sql<number>`count(*)` }).from(hfPressCampaigns),
      db.select({ count: sql<number>`count(*)` }).from(hfPressOutreachLogs).where(eq(hfPressOutreachLogs.status, "published")),
    ]);
    return reply.send({
      totals: {
        contacts: Number(contacts?.count ?? 0),
        campaigns: Number(campaigns?.count ?? 0),
        publishedLinks: Number(published?.count ?? 0),
      },
    });
  });
}

function normalizeContact(input: z.infer<typeof contactBody>) {
  return {
    ...input,
    contactName: input.contactName || null,
    phone: input.phone || null,
    city: input.city || null,
    notes: input.notes || null,
  };
}

function normalizeContactPatch(input: z.infer<typeof contactPatch>) {
  const patch: Partial<typeof hfPressContacts.$inferInsert> = {};
  if (input.organization !== undefined) patch.organization = input.organization;
  if (input.publicationType !== undefined) patch.publicationType = input.publicationType;
  if (input.contactName !== undefined) patch.contactName = input.contactName || null;
  if (input.email !== undefined) patch.email = input.email;
  if (input.phone !== undefined) patch.phone = input.phone || null;
  if (input.city !== undefined) patch.city = input.city || null;
  if (input.tags !== undefined) patch.tags = input.tags;
  if (input.status !== undefined) patch.status = input.status;
  if (input.notes !== undefined) patch.notes = input.notes || null;
  return patch;
}

function normalizeCampaign(input: z.infer<typeof campaignBody>) {
  return {
    slug: input.slug || slugify(input.name),
    name: input.name,
    subject: input.subject,
    pitch: input.pitch,
    templateKey: input.templateKey || null,
    segmentTags: input.segmentTags,
    status: input.status,
    scheduledAt: input.scheduledAt ? new Date(input.scheduledAt) : null,
    sentAt: input.sentAt ? new Date(input.sentAt) : null,
  };
}

function normalizeCampaignPatch(input: z.infer<typeof campaignPatch>) {
  const patch: Partial<typeof hfPressCampaigns.$inferInsert> = {};
  if (input.name !== undefined) patch.name = input.name;
  if (input.slug !== undefined) patch.slug = input.slug || slugify(input.name || "kampanya");
  if (input.subject !== undefined) patch.subject = input.subject;
  if (input.pitch !== undefined) patch.pitch = input.pitch;
  if (input.templateKey !== undefined) patch.templateKey = input.templateKey || null;
  if (input.segmentTags !== undefined) patch.segmentTags = input.segmentTags;
  if (input.status !== undefined) patch.status = input.status;
  if (input.scheduledAt !== undefined) patch.scheduledAt = input.scheduledAt ? new Date(input.scheduledAt) : null;
  if (input.sentAt !== undefined) patch.sentAt = input.sentAt ? new Date(input.sentAt) : null;
  return patch;
}

function normalizeLog(input: z.infer<typeof logBody>) {
  return {
    campaignId: input.campaignId,
    contactId: input.contactId,
    channel: input.channel,
    status: input.status,
    note: input.note || null,
    publishedUrl: input.publishedUrl || null,
    contactedAt: input.contactedAt ? new Date(input.contactedAt) : new Date(),
  };
}

function normalizeLogPatch(input: z.infer<typeof logPatch>) {
  const patch: Partial<typeof hfPressOutreachLogs.$inferInsert> = {};
  if (input.channel !== undefined) patch.channel = input.channel;
  if (input.status !== undefined) patch.status = input.status;
  if (input.note !== undefined) patch.note = input.note || null;
  if (input.publishedUrl !== undefined) patch.publishedUrl = input.publishedUrl || null;
  if (input.contactedAt !== undefined) patch.contactedAt = input.contactedAt ? new Date(input.contactedAt) : null;
  return patch;
}

async function touchContact(contactId: number, logStatus: z.infer<typeof logBody>["status"]) {
  const status = logStatus === "published" ? "published" : logStatus === "replied" ? "replied" : "contacted";
  await db.update(hfPressContacts).set({ status, lastContactedAt: new Date() }).where(eq(hfPressContacts.id, contactId));
}

function contactRow(row: typeof hfPressContacts.$inferSelect) {
  return {
    ...row,
    tags: Array.isArray(row.tags) ? row.tags : [],
    lastContactedAt: row.lastContactedAt?.toISOString() ?? null,
    createdAt: row.createdAt?.toISOString() ?? null,
    updatedAt: row.updatedAt?.toISOString() ?? null,
  };
}

function toCsv(rows: ReturnType<typeof contactRow>[]): string {
  const headers = ["organization", "publicationType", "contactName", "email", "phone", "city", "tags", "status", "notes", "lastContactedAt"];
  const lines = [headers.join(",")];
  for (const row of rows) {
    lines.push(headers.map((header) => csvCell(header === "tags" ? row.tags.join("; ") : String((row as any)[header] ?? ""))).join(","));
  }
  return `\uFEFF${lines.join("\r\n")}\r\n`;
}

function csvCell(value: string): string {
  if (/[",\n\r]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

function parseCsv(input: string): Array<Record<string, string>> {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  const text = input.replace(/^\uFEFF/, "");

  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i]!;
    const next = text[i + 1];
    if (quoted) {
      if (ch === '"' && next === '"') {
        cell += '"';
        i += 1;
      } else if (ch === '"') {
        quoted = false;
      } else {
        cell += ch;
      }
      continue;
    }
    if (ch === '"') {
      quoted = true;
    } else if (ch === ",") {
      row.push(cell.trim());
      cell = "";
    } else if (ch === "\n") {
      row.push(cell.trim());
      rows.push(row);
      row = [];
      cell = "";
    } else if (ch !== "\r") {
      cell += ch;
    }
  }
  if (cell || row.length) {
    row.push(cell.trim());
    rows.push(row);
  }

  const headers = (rows.shift() ?? []).map((header) => header.trim());
  return rows
    .filter((values) => values.some(Boolean))
    .map((values) => Object.fromEntries(headers.map((header, idx) => [header, values[idx] ?? ""])));
}

function splitCsvTags(value?: string): string[] {
  return String(value || "")
    .split(/[;,]/)
    .map((tag) => tag.trim())
    .filter(Boolean)
    .slice(0, 20);
}

function normalizePublicationType(value?: string) {
  const raw = String(value || "website").trim().toLowerCase();
  if (["newspaper", "website", "association", "chamber", "agency", "other"].includes(raw)) return raw;
  if (["gazete", "gazetesi"].includes(raw)) return "newspaper";
  if (["oda", "ziraat odasi", "ziraat_odasi"].includes(raw)) return "chamber";
  if (["dernek", "birlik"].includes(raw)) return "association";
  if (["ajans"].includes(raw)) return "agency";
  return "website";
}

function normalizeContactStatus(value?: string) {
  const raw = String(value || "target").trim().toLowerCase();
  if (["target", "contacted", "replied", "published", "blocked"].includes(raw)) return raw;
  if (["hedef"].includes(raw)) return "target";
  if (["gonderildi", "gönderildi", "ulasildi"].includes(raw)) return "contacted";
  if (["cevap", "cevap geldi"].includes(raw)) return "replied";
  if (["yayinlandi", "yayınlandı"].includes(raw)) return "published";
  return "target";
}

function campaignRow(row: typeof hfPressCampaigns.$inferSelect) {
  return {
    ...row,
    segmentTags: Array.isArray(row.segmentTags) ? row.segmentTags : [],
    scheduledAt: row.scheduledAt?.toISOString() ?? null,
    sentAt: row.sentAt?.toISOString() ?? null,
    createdAt: row.createdAt?.toISOString() ?? null,
    updatedAt: row.updatedAt?.toISOString() ?? null,
  };
}

function logRow(row: {
  id: number;
  campaignId: number;
  contactId: number;
  channel: string;
  status: string;
  note: string | null;
  publishedUrl: string | null;
  contactedAt: Date | null;
  createdAt: Date | null;
  organization: string;
  email: string;
}) {
  return {
    ...row,
    contactedAt: row.contactedAt?.toISOString() ?? null,
    createdAt: row.createdAt?.toISOString() ?? null,
  };
}

function slugify(value: string): string {
  return value
    .toLocaleLowerCase("tr-TR")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ı/g, "i")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 150) || `kampanya-${Date.now()}`;
}
