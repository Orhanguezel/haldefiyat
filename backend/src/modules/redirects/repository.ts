import { and, desc, eq, like, or, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { hfRedirects, hfProducts, hfProductEditorial } from "@/db/schema";

const APP_LOCALES = new Set(["tr", "en"]);

/**
 * Kaynak yolu normalize eder: query atılır, locale prefix kaldırılır,
 * sondaki slash silinir (kök hariç), boşluklar trimlenir.
 * proxy.ts ile birebir aynı kuralı uygular → lookup tutarlı olur.
 */
export function normalizePath(raw: string): string {
  let path = (raw || "").trim();
  const q = path.indexOf("?");
  if (q !== -1) path = path.slice(0, q);
  if (!path.startsWith("/")) path = `/${path}`;
  const parts = path.split("/");
  if (parts[1] && APP_LOCALES.has(parts[1])) parts.splice(1, 1);
  path = parts.join("/") || "/";
  if (path.length > 1 && path.endsWith("/")) path = path.slice(0, -1);
  return path;
}

export type RedirectType = "301" | "410";

export interface RedirectInput {
  sourcePath: string;
  type: RedirectType;
  targetUrl?: string | null;
  note?: string | null;
}

export interface RedirectRow {
  id: number;
  sourcePath: string;
  type: RedirectType;
  targetUrl: string | null;
  note: string | null;
  hits: number;
  isActive: number;
}

export async function listActiveRedirects(): Promise<RedirectRow[]> {
  return db
    .select({
      id: hfRedirects.id,
      sourcePath: hfRedirects.sourcePath,
      type: hfRedirects.type,
      targetUrl: hfRedirects.targetUrl,
      note: hfRedirects.note,
      hits: hfRedirects.hits,
      isActive: hfRedirects.isActive,
    })
    .from(hfRedirects)
    .where(eq(hfRedirects.isActive, 1)) as Promise<RedirectRow[]>;
}

export async function lookupRedirect(rawPath: string): Promise<RedirectRow | null> {
  const sourcePath = normalizePath(rawPath);
  const rows = await db
    .select()
    .from(hfRedirects)
    .where(and(eq(hfRedirects.sourcePath, sourcePath), eq(hfRedirects.isActive, 1)))
    .limit(1);
  return (rows[0] as RedirectRow | undefined) ?? null;
}

export async function adminListRedirects(opts: {
  type?: string;
  search?: string;
  page?: number;
  limit?: number;
}) {
  const conds = [];
  if (opts.type === "301" || opts.type === "410") conds.push(eq(hfRedirects.type, opts.type));
  if (opts.search) {
    const term = `%${opts.search}%`;
    conds.push(or(like(hfRedirects.sourcePath, term), like(hfRedirects.targetUrl, term), like(hfRedirects.note, term)));
  }
  const where = conds.length ? and(...conds) : undefined;
  const limit = Math.min(Math.max(opts.limit ?? 50, 1), 200);
  const page = Math.max(opts.page ?? 1, 1);

  const items = await db
    .select()
    .from(hfRedirects)
    .where(where)
    .orderBy(desc(hfRedirects.updatedAt))
    .limit(limit)
    .offset((page - 1) * limit);

  const [{ count }] = (await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(hfRedirects)
    .where(where)) as Array<{ count: number }>;

  const counts = await db
    .select({ type: hfRedirects.type, n: sql<number>`COUNT(*)` })
    .from(hfRedirects)
    .groupBy(hfRedirects.type);

  return { items, total: Number(count), page, limit, byType: counts };
}

function cleanInput(input: RedirectInput): RedirectInput | null {
  const sourcePath = normalizePath(input.sourcePath);
  if (sourcePath === "/" || sourcePath.length < 2) return null;
  const type: RedirectType = input.type === "410" ? "410" : "301";
  const targetUrl = type === "301" ? (input.targetUrl ?? "").trim() : null;
  if (type === "301" && !targetUrl) return null; // 301 hedefsiz olamaz
  return { sourcePath, type, targetUrl: targetUrl || null, note: input.note?.trim() || null };
}

export async function upsertRedirects(inputs: RedirectInput[]) {
  let created = 0;
  let skipped = 0;
  for (const raw of inputs) {
    const clean = cleanInput(raw);
    if (!clean) {
      skipped++;
      continue;
    }
    await db
      .insert(hfRedirects)
      .values({
        sourcePath: clean.sourcePath,
        type: clean.type,
        targetUrl: clean.targetUrl,
        note: clean.note,
      })
      .onDuplicateKeyUpdate({
        set: { type: clean.type, targetUrl: clean.targetUrl, note: clean.note, isActive: 1 },
      });
    created++;
  }
  return { created, skipped };
}

export async function updateRedirect(id: number, patch: Partial<RedirectInput> & { isActive?: number }) {
  const set: Record<string, unknown> = {};
  if (patch.sourcePath !== undefined) set.sourcePath = normalizePath(patch.sourcePath);
  if (patch.type !== undefined) set.type = patch.type === "410" ? "410" : "301";
  if (patch.targetUrl !== undefined) set.targetUrl = patch.targetUrl?.trim() || null;
  if (patch.note !== undefined) set.note = patch.note?.trim() || null;
  if (patch.isActive !== undefined) set.isActive = patch.isActive ? 1 : 0;
  if (Object.keys(set).length === 0) return;
  await db.update(hfRedirects).set(set).where(eq(hfRedirects.id, id));
}

export async function deleteRedirect(id: number) {
  await db.delete(hfRedirects).where(eq(hfRedirects.id, id));
}

export async function incrementHit(id: number) {
  await db
    .update(hfRedirects)
    .set({ hits: sql`${hfRedirects.hits} + 1`, lastHitAt: sql`CURRENT_TIMESTAMP(3)` })
    .where(eq(hfRedirects.id, id));
}

/**
 * Icerik/index denetimi: urun bazinda index uygunlugu + tutarsizlik tespiti.
 * Sorun tipleri:
 *  - thin_indexed : seoIndex=1 ama yayinli editoryel yok (interlock noindex tutar → temizlenmeli)
 *  - variant_indexed : seoIndex=1 ama canonicalSlug dolu (master'a 301 atmali, indexlenmemeli)
 *  - lowquality_indexed : seoIndex=1 ama dataQuality<70
 *  - ready_not_indexed : yayinli editoryel + dataQuality>=70 + master, ama seoIndex=0 (acilabilir)
 */
export async function auditProducts(filter: "all" | "issues" = "issues") {
  const rows = await db
    .select({
      slug: hfProducts.slug,
      displayName: hfProducts.displayName,
      nameTr: hfProducts.nameTr,
      seoIndex: hfProducts.seoIndex,
      dataQuality: hfProducts.dataQuality,
      canonicalSlug: hfProducts.canonicalSlug,
      hasEditorial: sql<number>`MAX(CASE WHEN ${hfProductEditorial.publishedAt} IS NOT NULL THEN 1 ELSE 0 END)`,
    })
    .from(hfProducts)
    .leftJoin(hfProductEditorial, eq(hfProductEditorial.productSlug, hfProducts.slug))
    .groupBy(hfProducts.slug);

  const annotated = rows.map((r) => {
    const indexed = r.seoIndex === 1;
    const hasEd = Number(r.hasEditorial) === 1;
    const isMaster = !r.canonicalSlug;
    let issue: string | null = null;
    if (indexed && !hasEd) issue = "thin_indexed";
    else if (indexed && !isMaster) issue = "variant_indexed";
    else if (indexed && (r.dataQuality ?? 0) < 70) issue = "lowquality_indexed";
    else if (!indexed && hasEd && isMaster && (r.dataQuality ?? 0) >= 70) issue = "ready_not_indexed";
    return { ...r, hasEditorial: hasEd, indexed, issue };
  });

  const summary = {
    total: annotated.length,
    indexed: annotated.filter((r) => r.indexed).length,
    withEditorial: annotated.filter((r) => r.hasEditorial).length,
    thin_indexed: annotated.filter((r) => r.issue === "thin_indexed").length,
    variant_indexed: annotated.filter((r) => r.issue === "variant_indexed").length,
    lowquality_indexed: annotated.filter((r) => r.issue === "lowquality_indexed").length,
    ready_not_indexed: annotated.filter((r) => r.issue === "ready_not_indexed").length,
  };

  const items = filter === "issues" ? annotated.filter((r) => r.issue) : annotated;
  return { summary, items };
}
