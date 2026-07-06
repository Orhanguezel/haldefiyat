import type { FastifyInstance } from "fastify";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db/client";
import { hfAnalysisReports, hfAuthors } from "@/db/schema";
import { repoGetSnapshotHistory } from "@/modules/index/repository";
import { resolveWeekRange } from "@/modules/prices/iso-week";
import { weeklyPriceSummary, type WeeklySummary } from "@/modules/prices/weekly";
import { registerAnalysisQuality } from "./quality";
import { submitToIndexNow } from "@/modules/indexnow";

// Rapor yayina alininca IndexNow'a (Bing/Yandex) aninda bildir — fire-and-forget,
// yaniti bloklamaz. Google icin API yok; GSC "Request Indexing" manuel kalir.
function pingReportIndexNow(slug: string | null | undefined): void {
  if (!slug) return;
  void submitToIndexNow([`/analiz/${slug}`]).catch(() => {});
}

export type AutoWeeklyReport = {
  slug: string;
  baslik: string;
  ozet: string;
  icerik: string;
  yazar: string;
  tarih: string;
  etiketler: string[];
  hafta: string;
  weekStart: string;
  weekEnd: string;
  totalRecords: number;
  metaTitle?: string | null;
  metaDescription?: string | null;
  ogImage?: string | null;
  imageAlt?: string | null;
  authorId?: number | null;
  authorProfile?: PublicAuthorProfile | null;
};

type PublicAuthorProfile = {
  id: number;
  slug: string;
  fullName: string;
  title: string | null;
  bio: string | null;
  expertise: string[];
  avatarUrl: string | null;
  credentials: string | null;
};

type AnalysisReportStatus = "draft" | "published" | "archived";

const qList = z.object({
  limit: z.coerce.number().optional(),
});

const qAdminList = z.object({
  status: z.enum(["draft", "published", "archived", "all"]).optional(),
  limit: z.coerce.number().optional(),
});

const bodyGenerate = z.object({
  week: z.string().regex(/^\d{4}-\d{2}$/).optional(),
});

const bodyCreate = z.object({
  title: z.string().trim().min(3).max(500),
  slug: z.string().trim().max(180).optional(),
  summary: z.string().trim().min(10),
  content: z.string().trim().min(20),
  tags: z.array(z.string().trim().min(1).max(80)).max(12).optional(),
  metaTitle: z.string().trim().max(255).nullable().optional(),
  metaDescription: z.string().trim().nullable().optional(),
  ogImage: z.string().trim().max(500).nullable().optional(),
  imageAlt: z.string().trim().max(255).nullable().optional(),
  authorId: z.coerce.number().int().positive().nullable().optional(),
  status: z.enum(["draft", "published", "archived"]).optional(),
});

const bodyPatch = z.object({
  title: z.string().trim().min(3).max(500).optional(),
  slug: z.string().trim().max(180).optional(),
  summary: z.string().trim().min(10).optional(),
  content: z.string().trim().min(20).optional(),
  tags: z.array(z.string().trim().min(1).max(80)).max(12).optional(),
  metaTitle: z.string().trim().max(255).nullable().optional(),
  metaDescription: z.string().trim().nullable().optional(),
  ogImage: z.string().trim().max(500).nullable().optional(),
  imageAlt: z.string().trim().max(255).nullable().optional(),
  authorId: z.coerce.number().int().positive().nullable().optional(),
  status: z.enum(["draft", "published", "archived"]).optional(),
});

const MONTH_SLUGS = [
  "ocak",
  "subat",
  "mart",
  "nisan",
  "mayis",
  "haziran",
  "temmuz",
  "agustos",
  "eylul",
  "ekim",
  "kasim",
  "aralik",
];

const MONTH_LABELS = [
  "Ocak",
  "Şubat",
  "Mart",
  "Nisan",
  "Mayıs",
  "Haziran",
  "Temmuz",
  "Ağustos",
  "Eylül",
  "Ekim",
  "Kasım",
  "Aralık",
];

export async function registerAnalysis(app: FastifyInstance) {
  app.get("/analysis/weekly-reports", async (req, reply) => {
    const parsed = qList.safeParse(req.query);
    const limit = Math.min(12, Math.max(1, parsed.success ? (parsed.data.limit ?? 8) : 8));
    const items = await listPublishedWeeklyReports(limit);
    reply.header("Cache-Control", "public, max-age=300, s-maxage=300");
    return reply.send({ items });
  });

  app.get<{ Params: { slug: string } }>("/analysis/weekly-reports/:slug", async (req, reply) => {
    const report = await getPublishedWeeklyReport(req.params.slug);
    if (!report) return reply.status(404).send({ error: "Rapor bulunamadi" });
    reply.header("Cache-Control", "public, max-age=300, s-maxage=300");
    return reply.send({ data: report });
  });
}

export async function registerAnalysisAdmin(app: FastifyInstance) {
  app.get("/analysis/reports", async (req, reply) => {
    const parsed = qAdminList.safeParse(req.query);
    const status = parsed.success ? parsed.data.status : undefined;
    const limit = Math.min(500, Math.max(1, parsed.success ? (parsed.data.limit ?? 100) : 100));
    const rows = await listAdminReports(status, limit);
    return reply.send({ items: rows.map(reportRowToAdmin) });
  });

  app.post("/analysis/reports/generate", async (req, reply) => {
    const parsed = bodyGenerate.safeParse(req.body ?? {});
    if (!parsed.success) return reply.status(400).send({ error: "Gecersiz hafta formati" });
    const report = await persistWeeklyReport(parsed.data.week);
    if (!report) return reply.status(422).send({ error: "Bu hafta icin yeterli fiyat kaydi yok" });
    return reply.send({ data: reportRowToAdmin(report) });
  });

  app.post("/analysis/reports", async (req, reply) => {
    const parsed = bodyCreate.safeParse(req.body ?? {});
    if (!parsed.success) return reply.status(400).send({ error: "Gecersiz rapor alani" });

    const next = parsed.data;
    const now = new Date();
    const slug = await ensureUniqueReportSlug(next.slug || next.title);
    const status = next.status ?? "draft";
    const author = await resolveAuthorForWrite(next.authorId);
    const reportDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 12));
    const isoWeek = isoWeekForDate(reportDate);

    await db.insert(hfAnalysisReports).values({
      slug,
      title: next.title,
      summary: next.summary,
      metaTitle: next.metaTitle || buildMetaTitle(next.title),
      metaDescription: next.metaDescription || buildMetaDescription(next.summary),
      ogImage: next.ogImage || "/og-default.png",
      imageAlt: next.imageAlt || next.title,
      content: next.content,
      author: author?.fullName ?? "HaldeFiyat Veri Ekibi",
      authorId: author?.id ?? null,
      tags: next.tags ?? [],
      isoWeek,
      weekStart: reportDate,
      weekEnd: reportDate,
      reportDate,
      source: "manual",
      status,
      totalRecords: 0,
      publishedAt: status === "published" ? new Date() : null,
    });

    const [row] = await db.select().from(hfAnalysisReports).where(eq(hfAnalysisReports.slug, slug)).limit(1);
    if (status === "published") pingReportIndexNow(slug);
    return reply.status(201).send({ data: row ? reportRowToAdmin(row) : null });
  });

  app.get<{ Params: { id: string } }>("/analysis/reports/:id", async (req, reply) => {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return reply.status(400).send({ error: "Gecersiz id" });
    const [row] = await db.select().from(hfAnalysisReports).where(eq(hfAnalysisReports.id, id)).limit(1);
    if (!row) return reply.status(404).send({ error: "Rapor bulunamadi" });
    return reply.send({ data: reportRowToAdmin(row) });
  });

  app.patch<{ Params: { id: string } }>("/analysis/reports/:id", async (req, reply) => {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return reply.status(400).send({ error: "Gecersiz id" });
    const parsed = bodyPatch.safeParse(req.body ?? {});
    if (!parsed.success) return reply.status(400).send({ error: "Gecersiz rapor alani" });

    const next = parsed.data;
    const patch: Partial<typeof hfAnalysisReports.$inferInsert> = {};
    if (next.title !== undefined) patch.title = next.title;
    if (next.slug !== undefined) {
      const slug = slugifyReport(next.slug || next.title || "");
      const [existing] = await db.select().from(hfAnalysisReports).where(eq(hfAnalysisReports.slug, slug)).limit(1);
      if (existing && existing.id !== id) return reply.status(409).send({ error: "Bu slug baska bir analizde kullaniliyor" });
      patch.slug = slug;
    }
    if (next.summary !== undefined) patch.summary = next.summary;
    if (next.content !== undefined) patch.content = next.content;
    if (next.tags !== undefined) patch.tags = next.tags;
    if (next.metaTitle !== undefined) patch.metaTitle = next.metaTitle || null;
    if (next.metaDescription !== undefined) patch.metaDescription = next.metaDescription || null;
    if (next.ogImage !== undefined) patch.ogImage = next.ogImage || null;
    if (next.imageAlt !== undefined) patch.imageAlt = next.imageAlt || null;
    if (next.authorId !== undefined) {
      const author = await resolveAuthorForWrite(next.authorId);
      patch.authorId = author?.id ?? null;
      patch.author = author?.fullName ?? "HaldeFiyat Veri Ekibi";
    }
    if (next.status !== undefined) {
      patch.status = next.status;
      patch.publishedAt = next.status === "published" ? new Date() : null;
    }

    if (Object.keys(patch).length === 0) return reply.status(400).send({ error: "Guncellenecek alan yok" });
    await db.update(hfAnalysisReports).set(patch).where(eq(hfAnalysisReports.id, id));

    const [row] = await db.select().from(hfAnalysisReports).where(eq(hfAnalysisReports.id, id)).limit(1);
    if (!row) return reply.status(404).send({ error: "Rapor bulunamadi" });
    if (next.status === "published") pingReportIndexNow(row.slug);
    return reply.send({ data: reportRowToAdmin(row) });
  });

  app.post<{ Params: { id: string } }>("/analysis/reports/:id/publish", async (req, reply) => {
    const row = await setReportStatus(req.params.id, "published");
    if (!row) return reply.status(404).send({ error: "Rapor bulunamadi" });
    pingReportIndexNow(row.slug);
    return reply.send({ data: reportRowToAdmin(row) });
  });

  app.post<{ Params: { id: string } }>("/analysis/reports/:id/archive", async (req, reply) => {
    const row = await setReportStatus(req.params.id, "archived");
    if (!row) return reply.status(404).send({ error: "Rapor bulunamadi" });
    return reply.send({ data: reportRowToAdmin(row) });
  });

  app.post<{ Params: { id: string } }>("/analysis/reports/:id/draft", async (req, reply) => {
    const row = await setReportStatus(req.params.id, "draft");
    if (!row) return reply.status(404).send({ error: "Rapor bulunamadi" });
    return reply.send({ data: reportRowToAdmin(row) });
  });

  await registerAnalysisQuality(app);
}

export async function generateLatestWeeklyAnalysisReport(): Promise<AutoWeeklyReport | null> {
  const row = await persistWeeklyReport();
  return row ? reportRowToPublic(row) : null;
}

async function listPublishedWeeklyReports(limit: number): Promise<AutoWeeklyReport[]> {
  const rows = await db
    .select({ report: hfAnalysisReports, author: hfAuthors })
    .from(hfAnalysisReports)
    .leftJoin(hfAuthors, eq(hfAuthors.id, hfAnalysisReports.authorId))
    .where(eq(hfAnalysisReports.status, "published"))
    .orderBy(desc(hfAnalysisReports.reportDate))
    .limit(limit);
  return rows.map(({ report, author }) => reportRowToPublic(report, author));
}

async function getPublishedWeeklyReport(slug: string): Promise<AutoWeeklyReport | null> {
  const [row] = await db
    .select({ report: hfAnalysisReports, author: hfAuthors })
    .from(hfAnalysisReports)
    .leftJoin(hfAuthors, eq(hfAuthors.id, hfAnalysisReports.authorId))
    .where(and(eq(hfAnalysisReports.slug, slug), eq(hfAnalysisReports.status, "published")))
    .limit(1);
  return row ? reportRowToPublic(row.report, row.author) : null;
}

async function listAdminReports(status: "draft" | "published" | "archived" | "all" | undefined, limit: number) {
  const query = db.select().from(hfAnalysisReports);
  if (status && status !== "all") {
    return query.where(eq(hfAnalysisReports.status, status)).orderBy(desc(hfAnalysisReports.reportDate)).limit(limit);
  }
  return query.orderBy(desc(hfAnalysisReports.reportDate)).limit(limit);
}

export async function persistWeeklyReport(week?: string) {
  const { isoWeek } = resolveWeekRange(week);
  const generated = await generateWeeklyReport(isoWeek);
  if (!generated) return null;

  const [existing] = await db
    .select()
    .from(hfAnalysisReports)
    .where(eq(hfAnalysisReports.slug, generated.slug))
    .limit(1);

  if (existing?.status === "published") return existing;

  const values = {
    slug: generated.slug,
    title: generated.baslik,
    summary: generated.ozet,
    metaTitle: buildMetaTitle(generated.baslik),
    metaDescription: buildMetaDescription(generated.ozet),
    ogImage: "/og-default.png",
    imageAlt: generated.baslik,
    content: generated.icerik,
    author: generated.yazar,
    tags: generated.etiketler,
    isoWeek: generated.hafta,
    weekStart: dateFromIso(generated.weekStart),
    weekEnd: dateFromIso(generated.weekEnd),
    reportDate: dateFromIso(generated.tarih),
    source: "auto" as const,
    status: "draft" as const,
    totalRecords: generated.totalRecords,
    publishedAt: null,
  };

  if (existing) {
    await db.update(hfAnalysisReports).set(values).where(eq(hfAnalysisReports.id, existing.id));
    const [updated] = await db.select().from(hfAnalysisReports).where(eq(hfAnalysisReports.id, existing.id)).limit(1);
    return updated ?? existing;
  }

  await db.insert(hfAnalysisReports).values(values);
  const [created] = await db.select().from(hfAnalysisReports).where(eq(hfAnalysisReports.slug, generated.slug)).limit(1);
  return created ?? null;
}

async function generateWeeklyReport(week: string): Promise<AutoWeeklyReport | null> {
  const { weekStart, weekEnd, isoWeek } = resolveWeekRange(week);
  const summary = await weeklyPriceSummary(weekStart, weekEnd);
  if (summary.totalRecords < 10) return null;

  const indexHistory = await repoGetSnapshotHistory(26);
  const index = indexHistory.find((row) => row.indexWeek === isoWeek);
  const prevIndex = index
    ? indexHistory.slice(0, indexHistory.findIndex((row) => row.indexWeek === isoWeek)).at(-1)
    : null;

  const date = weekEnd;
  const slug = slugForWeek(weekStart);
  const titleProduct = summary.topFallers[0]?.productName || summary.topRisers[0]?.productName || "Hal Fiyatları";
  const movement = summary.topFallers[0] ?? summary.topRisers[0] ?? null;
  const movementText = movement
    ? `${titleProduct} ${movement.changePct < 0 ? "fiyatlarında düşüş" : "fiyatlarında artış"}`
    : "hal fiyatlarında haftalık görünüm";

  return {
    slug,
    baslik: `${monthLabel(weekStart)} ${weekOfMonthLabel(weekStart)} Hafta Hal Raporu: ${capitalizeSentence(movementText)}`,
    ozet: buildSummary(summary, index, prevIndex),
    icerik: buildContent(summary, index, prevIndex),
    yazar: "HaldeFiyat Veri Ekibi",
    tarih: date,
    hafta: isoWeek,
    weekStart,
    weekEnd,
    totalRecords: summary.totalRecords,
    etiketler: buildTags(summary),
  };
}

async function setReportStatus(idRaw: string, status: AnalysisReportStatus) {
  const id = Number(idRaw);
  if (!Number.isFinite(id)) return null;
  await db
    .update(hfAnalysisReports)
    .set({ status, publishedAt: status === "published" ? new Date() : null })
    .where(eq(hfAnalysisReports.id, id));
  const [row] = await db.select().from(hfAnalysisReports).where(eq(hfAnalysisReports.id, id)).limit(1);
  return row ?? null;
}

function reportRowToPublic(row: typeof hfAnalysisReports.$inferSelect, author?: typeof hfAuthors.$inferSelect | null): AutoWeeklyReport {
  return {
    slug: row.slug,
    baslik: row.title,
    ozet: row.summary,
    icerik: row.content,
    yazar: row.author,
    tarih: toDateOnly(row.reportDate),
    etiketler: Array.isArray(row.tags) ? row.tags : [],
    hafta: row.isoWeek,
    weekStart: toDateOnly(row.weekStart),
    weekEnd: toDateOnly(row.weekEnd),
    totalRecords: row.totalRecords,
    metaTitle: row.metaTitle ?? null,
    metaDescription: row.metaDescription ?? null,
    ogImage: row.ogImage ?? null,
    imageAlt: row.imageAlt ?? null,
    authorId: row.authorId ?? null,
    authorProfile: author && author.isActive ? {
      id: author.id,
      slug: author.slug,
      fullName: author.fullName,
      title: author.title ?? null,
      bio: author.bio ?? null,
      expertise: Array.isArray(author.expertise) ? author.expertise : [],
      avatarUrl: author.avatarUrl ?? null,
      credentials: author.credentials ?? null,
    } : null,
  };
}

function reportRowToAdmin(row: typeof hfAnalysisReports.$inferSelect) {
  return {
    id: row.id,
    ...reportRowToPublic(row),
    source: row.source,
    status: row.status,
    publishedAt: row.publishedAt ? row.publishedAt.toISOString() : null,
    createdAt: row.createdAt ? row.createdAt.toISOString() : null,
    updatedAt: row.updatedAt ? row.updatedAt.toISOString() : null,
  };
}

async function ensureUniqueReportSlug(value: string): Promise<string> {
  const base = slugifyReport(value) || `analiz-${Date.now()}`;
  let candidate = base;
  for (let index = 2; index < 100; index += 1) {
    const [existing] = await db.select({ id: hfAnalysisReports.id }).from(hfAnalysisReports).where(eq(hfAnalysisReports.slug, candidate)).limit(1);
    if (!existing) return candidate;
    candidate = `${base}-${index}`;
  }
  return `${base}-${Date.now()}`;
}

async function resolveAuthorForWrite(authorId: number | null | undefined) {
  if (!authorId) return null;
  const [author] = await db
    .select()
    .from(hfAuthors)
    .where(eq(hfAuthors.id, authorId))
    .limit(1);
  return author ?? null;
}

function slugifyReport(value: string): string {
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
    .slice(0, 180);
}

function isoWeekForDate(value: Date): string {
  const date = new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()));
  const day = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const week = Math.ceil((((date.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${date.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

function dateFromIso(value: string): Date {
  return new Date(`${value}T12:00:00Z`);
}

function toDateOnly(value: Date | string): string {
  if (typeof value === "string") return value.slice(0, 10);
  return value.toISOString().slice(0, 10);
}

function buildSummary(summary: WeeklySummary, index: any, prevIndex: any): string {
  const riser = summary.topRisers[0];
  const faller = summary.topFallers[0];
  const indexText = index
    ? `HaldeFiyat Endeksi haftayı ${Number(index.indexValue).toFixed(2)} puanda kapattı.`
    : "HaldeFiyat Endeksi için bu haftaya ait hesap bekleniyor.";
  const fallerText = faller ? `${faller.productName} ${fmtPct(faller.changePct)} geriledi` : "düşüş tarafında belirgin veri oluşmadı";
  const riserText = riser ? `${riser.productName} ${fmtPct(riser.changePct)} yükseldi` : "artış tarafında belirgin veri oluşmadı";
  void prevIndex;
  return `${summary.weekStart} - ${summary.weekEnd} haftasında ${fallerText}; ${riserText}. ${indexText}`;
}

function buildContent(summary: WeeklySummary, index: any, prevIndex: any): string {
  const risers = summary.topRisers.slice(0, 3);
  const fallers = summary.topFallers.slice(0, 3);
  const categoryRows = Object.entries(summary.avgByCategory)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4);

  const indexParagraph = index
    ? `HaldeFiyat Endeksi bu haftayı ${Number(index.indexValue).toFixed(2)} puanda tamamladı.${prevIndex ? ` Bir önceki hesaplanan hafta ${Number(prevIndex.indexValue).toFixed(2)} puandaydı.` : ""} Sepet ortalaması ${Number(index.basketAvg).toFixed(2)} TL/kg olarak ölçüldü.`
    : "Bu hafta için endeks hesaplaması henüz oluşmadı; fiyat hareketleri ürün ve hal bazlı kayıtlar üzerinden yorumlandı.";

  const fallerParagraph = fallers.length
    ? fallers.map((m) => `${m.productName} (${m.marketName}) ${fmtPrice(m.previousAvg)} seviyesinden ${fmtPrice(m.latestAvg)} seviyesine indi; haftalık değişim ${fmtPct(m.changePct)}.`).join(" ")
    : "Düşüş tarafında istatistiksel olarak öne çıkan güçlü bir ürün/hal çifti oluşmadı.";

  const riserParagraph = risers.length
    ? risers.map((m) => `${m.productName} (${m.marketName}) ${fmtPrice(m.previousAvg)} seviyesinden ${fmtPrice(m.latestAvg)} seviyesine çıktı; haftalık değişim ${fmtPct(m.changePct)}.`).join(" ")
    : "Artış tarafında istatistiksel olarak öne çıkan güçlü bir ürün/hal çifti oluşmadı.";

  const categoryParagraph = categoryRows.length
    ? categoryRows.map(([cat, avg]) => `${cat}: ${fmtPrice(avg)}`).join(", ")
    : "Kategori bazlı ortalama üretmek için yeterli veri oluşmadı.";

  return `Türkiye genelindeki aktif hal kayıtlarından derlenen ${summary.weekStart} - ${summary.weekEnd} haftası verileri, ürün bazlı fiyat hareketlerinin farklı yönlere ayrıldığını gösteriyor. Bu raporda ${summary.totalRecords} fiyat kaydı üzerinden haftalık hareketler, kategori ortalamaları ve endeks görünümü özetlenmiştir.

**Haftanın Endeks Görünümü**

${indexParagraph}

**Fiyatı Düşen Ürünler**

${fallerParagraph}

**Fiyatı Yükselen Ürünler**

${riserParagraph}

**Kategori Ortalamaları**

Bu haftanın kategori bazlı ortalama fiyat görünümü şöyle: ${categoryParagraph}. Bu değerler farklı ürün ve hallerin ağırlıksız ortalamasıdır; tek bir ürün fiyatı gibi yorumlanmamalıdır.

**Önümüzdeki Hafta İçin Takip Başlıkları**

Önümüzdeki hafta özellikle hızlı değişim gösteren ürünlerde yeni arz girişleri, hava koşulları ve büyük tüketim merkezleri ile üretim bölgeleri arasındaki fiyat farkı izlenmelidir. Günlük min, max ve ortalama fiyatlar için HaldeFiyat fiyat tablosu ve ürün detay grafikleri kullanılabilir.`;
}

function buildTags(summary: WeeklySummary): string[] {
  const tags = ["haftalık rapor", "hal fiyatları", "endeks"];
  for (const item of [...summary.topFallers, ...summary.topRisers].slice(0, 4)) {
    if (item.productName) tags.push(item.productName.toLocaleLowerCase("tr-TR"));
  }
  return [...new Set(tags)].slice(0, 8);
}

function buildMetaTitle(title: string): string {
  const clean = title.replace(/\s+/g, " ").trim();
  return truncateAtWord(clean, 47);
}

function buildMetaDescription(summary: string): string {
  return truncateAtWord(summary, 155);
}

function truncateAtWord(value: string, max: number): string {
  const clean = value.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  const sliced = clean.slice(0, max - 1).trimEnd();
  const lastSpace = sliced.lastIndexOf(" ");
  return `${(lastSpace > 40 ? sliced.slice(0, lastSpace) : sliced).trimEnd()}…`;
}

function parseWeekFromSlug(slug: string): string | null {
  const match = /^([a-z]+)-(\d+)-hafta-(\d{4})-hal-raporu$/.exec(slug);
  if (!match) return null;
  const monthIdx = MONTH_SLUGS.indexOf(match[1]!);
  const weekOfMonth = Number(match[2]);
  const year = Number(match[3]);
  if (monthIdx < 0 || weekOfMonth < 1 || weekOfMonth > 6 || !Number.isFinite(year)) return null;

  const first = new Date(Date.UTC(year, monthIdx, 1, 12));
  const firstDow = (first.getUTCDay() + 6) % 7;
  const firstMonday = new Date(first);
  firstMonday.setUTCDate(first.getUTCDate() - firstDow);

  const monday = new Date(firstMonday);
  monday.setUTCDate(firstMonday.getUTCDate() + (weekOfMonth - 1) * 7);
  if (monday.getUTCMonth() !== monthIdx) monday.setUTCDate(monday.getUTCDate() + 7);
  return isoWeekFromMonday(monday);
}

function slugForWeek(weekStart: string): string {
  const d = new Date(`${weekStart}T12:00:00Z`);
  return `${MONTH_SLUGS[d.getUTCMonth()]}-${weekOfMonth(d)}-hafta-${d.getUTCFullYear()}-hal-raporu`;
}

function weekOfMonthLabel(weekStart: string): string {
  return `${weekOfMonth(new Date(`${weekStart}T12:00:00Z`))}.`;
}

function weekOfMonth(d: Date): number {
  const first = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1, 12));
  const firstDow = (first.getUTCDay() + 6) % 7;
  return Math.floor((d.getUTCDate() + firstDow - 1) / 7) + 1;
}

function monthLabel(weekStart: string): string {
  const d = new Date(`${weekStart}T12:00:00Z`);
  return MONTH_LABELS[d.getUTCMonth()]!;
}

function isoWeekFromMonday(monday: Date): string {
  const d = new Date(Date.UTC(monday.getUTCFullYear(), monday.getUTCMonth(), monday.getUTCDate()));
  const dayNum = (d.getUTCDay() + 6) % 7;
  d.setUTCDate(d.getUTCDate() - dayNum + 3);
  const firstThursday = new Date(Date.UTC(d.getUTCFullYear(), 0, 4));
  const week = 1 + Math.round(
    ((d.getTime() - firstThursday.getTime()) / 86400000 - 3 + ((firstThursday.getUTCDay() + 6) % 7)) / 7,
  );
  return `${d.getUTCFullYear()}-${String(week).padStart(2, "0")}`;
}

function fmtPct(value: number): string {
  return `%${Math.abs(value).toFixed(1)}`;
}

function fmtPrice(value: number): string {
  return `${value.toFixed(2)} TL/kg`;
}

function capitalizeSentence(value: string): string {
  if (!value) return value;
  return value.charAt(0).toLocaleUpperCase("tr-TR") + value.slice(1);
}
