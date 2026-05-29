import type { FastifyInstance } from "fastify";
import { and, asc, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db/client";
import { hfAnalysisReports, hfAuthors } from "@/db/schema";

const qAuthors = z.object({
  active: z.enum(["1", "0", "all"]).optional(),
  limit: z.coerce.number().optional(),
});

const bodyAuthor = z.object({
  slug: z.string().trim().min(2).max(120),
  fullName: z.string().trim().min(2).max(160),
  title: z.string().trim().max(200).nullable().optional(),
  bio: z.string().trim().nullable().optional(),
  expertise: z.array(z.string().trim().min(1).max(80)).max(20).nullable().optional(),
  avatarUrl: z.string().trim().max(500).nullable().optional(),
  credentials: z.string().trim().max(300).nullable().optional(),
  socialLinks: z.record(z.string().trim().max(80), z.string().trim().max(500)).nullable().optional(),
  email: z.string().trim().email().max(255).nullable().optional(),
  isActive: z.boolean().optional(),
  displayOrder: z.coerce.number().int().optional(),
});

const bodyAuthorPatch = bodyAuthor.partial().extend({
  slug: z.string().trim().min(2).max(120).optional(),
  fullName: z.string().trim().min(2).max(160).optional(),
});

export async function registerAuthorsPublic(app: FastifyInstance) {
  app.get("/authors", async (req, reply) => {
    const parsed = qAuthors.safeParse(req.query);
    const limit = Math.min(100, Math.max(1, parsed.success ? (parsed.data.limit ?? 50) : 50));
    const rows = await db
      .select()
      .from(hfAuthors)
      .where(eq(hfAuthors.isActive, 1))
      .orderBy(asc(hfAuthors.displayOrder), asc(hfAuthors.fullName))
      .limit(limit);
    reply.header("Cache-Control", "public, max-age=300, s-maxage=300");
    return reply.send({ items: rows.map(authorRowToPublic) });
  });

  app.get<{ Params: { slug: string } }>("/authors/:slug", async (req, reply) => {
    const [author] = await db
      .select()
      .from(hfAuthors)
      .where(and(eq(hfAuthors.slug, req.params.slug), eq(hfAuthors.isActive, 1)))
      .limit(1);
    if (!author) return reply.status(404).send({ error: "Yazar bulunamadi" });

    const reports = await db
      .select()
      .from(hfAnalysisReports)
      .where(and(eq(hfAnalysisReports.authorId, author.id), eq(hfAnalysisReports.status, "published")))
      .orderBy(desc(hfAnalysisReports.reportDate))
      .limit(30);

    reply.header("Cache-Control", "public, max-age=300, s-maxage=300");
    return reply.send({
      data: {
        ...authorRowToPublic(author),
        articles: reports.map((row) => ({
          slug: row.slug,
          baslik: row.title,
          ozet: row.summary,
          tarih: toDateOnly(row.reportDate),
          etiketler: Array.isArray(row.tags) ? row.tags : [],
        })),
      },
    });
  });
}

export async function registerAuthorsAdmin(app: FastifyInstance) {
  app.get("/authors", async (req, reply) => {
    const parsed = qAuthors.safeParse(req.query);
    const active = parsed.success ? parsed.data.active : undefined;
    const limit = Math.min(500, Math.max(1, parsed.success ? (parsed.data.limit ?? 200) : 200));
    const rows = await db
      .select()
      .from(hfAuthors)
      .where(active === "1" ? eq(hfAuthors.isActive, 1) : active === "0" ? eq(hfAuthors.isActive, 0) : undefined)
      .orderBy(asc(hfAuthors.displayOrder), asc(hfAuthors.fullName))
      .limit(limit);
    return reply.send({ items: rows.map(authorRowToAdmin) });
  });

  app.get<{ Params: { id: string } }>("/authors/:id", async (req, reply) => {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return reply.status(400).send({ error: "Gecersiz id" });
    const [row] = await db.select().from(hfAuthors).where(eq(hfAuthors.id, id)).limit(1);
    if (!row) return reply.status(404).send({ error: "Yazar bulunamadi" });
    return reply.send({ data: authorRowToAdmin(row) });
  });

  app.post("/authors", async (req, reply) => {
    const parsed = bodyAuthor.safeParse(req.body ?? {});
    if (!parsed.success) return reply.status(400).send({ error: "Gecersiz yazar alani" });
    const next = parsed.data;
    const slug = slugify(next.slug);
    await db.insert(hfAuthors).values({
      slug,
      fullName: next.fullName,
      title: next.title || null,
      bio: next.bio || null,
      expertise: next.expertise ?? null,
      avatarUrl: next.avatarUrl || null,
      credentials: next.credentials || null,
      socialLinks: next.socialLinks ?? null,
      email: next.email || null,
      isActive: next.isActive === false ? 0 : 1,
      displayOrder: next.displayOrder ?? 100,
    });
    const [row] = await db.select().from(hfAuthors).where(eq(hfAuthors.slug, slug)).limit(1);
    return reply.status(201).send({ data: row ? authorRowToAdmin(row) : null });
  });

  app.patch<{ Params: { id: string } }>("/authors/:id", async (req, reply) => {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return reply.status(400).send({ error: "Gecersiz id" });
    const parsed = bodyAuthorPatch.safeParse(req.body ?? {});
    if (!parsed.success) return reply.status(400).send({ error: "Gecersiz yazar alani" });
    const next = parsed.data;
    const patch: Partial<typeof hfAuthors.$inferInsert> = {};
    if (next.slug !== undefined) patch.slug = slugify(next.slug);
    if (next.fullName !== undefined) patch.fullName = next.fullName;
    if (next.title !== undefined) patch.title = next.title || null;
    if (next.bio !== undefined) patch.bio = next.bio || null;
    if (next.expertise !== undefined) patch.expertise = next.expertise ?? null;
    if (next.avatarUrl !== undefined) patch.avatarUrl = next.avatarUrl || null;
    if (next.credentials !== undefined) patch.credentials = next.credentials || null;
    if (next.socialLinks !== undefined) patch.socialLinks = next.socialLinks ?? null;
    if (next.email !== undefined) patch.email = next.email || null;
    if (next.isActive !== undefined) patch.isActive = next.isActive ? 1 : 0;
    if (next.displayOrder !== undefined) patch.displayOrder = next.displayOrder;
    if (Object.keys(patch).length === 0) return reply.status(400).send({ error: "Guncellenecek alan yok" });
    await db.update(hfAuthors).set(patch).where(eq(hfAuthors.id, id));
    const [row] = await db.select().from(hfAuthors).where(eq(hfAuthors.id, id)).limit(1);
    if (!row) return reply.status(404).send({ error: "Yazar bulunamadi" });
    return reply.send({ data: authorRowToAdmin(row) });
  });
}

function authorRowToPublic(row: typeof hfAuthors.$inferSelect) {
  return {
    id: row.id,
    slug: row.slug,
    fullName: row.fullName,
    title: row.title,
    bio: row.bio,
    expertise: Array.isArray(row.expertise) ? row.expertise : [],
    avatarUrl: row.avatarUrl,
    credentials: row.credentials,
    socialLinks: row.socialLinks ?? {},
  };
}

function authorRowToAdmin(row: typeof hfAuthors.$inferSelect) {
  return {
    ...authorRowToPublic(row),
    email: row.email,
    isActive: Boolean(row.isActive),
    displayOrder: row.displayOrder,
    createdAt: row.createdAt ? row.createdAt.toISOString() : null,
    updatedAt: row.updatedAt ? row.updatedAt.toISOString() : null,
  };
}

function slugify(value: string): string {
  return value
    .toLocaleLowerCase("tr-TR")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ı/g, "i")
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}

function toDateOnly(value: Date | string): string {
  if (typeof value === "string") return value.slice(0, 10);
  return value.toISOString().slice(0, 10);
}
