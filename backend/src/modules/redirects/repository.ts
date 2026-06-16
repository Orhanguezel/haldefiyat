import { and, desc, eq, inArray, like, or, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { hfProducts, hfRedirects } from "@/db/schema";
import { STATIC_EDITORIAL_SLUGS } from "@/config/static-editorial-slugs";

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
type AuditRawRow = {
  slug: string;
  displayName: string | null;
  nameTr: string;
  seoIndex: number;
  dataQuality: number;
  canonicalSlug: string | null;
  hasEditorial: number;
  priceRows30d: number | string;
  marketCount30d: number | string;
  nameClean: number;
  aliasCount: number | string;
  gscState: string | null;
  gscVerdict: string | null;
};

export async function auditProducts(filter: "all" | "issues" = "issues") {
  const result = await db.execute(sql`
    SELECT
      p.slug AS slug,
      p.display_name AS displayName,
      p.name_tr AS nameTr,
      p.seo_index AS seoIndex,
      p.data_quality AS dataQuality,
      p.canonical_slug AS canonicalSlug,
      CASE WHEN ed.published_at IS NOT NULL THEN 1 ELSE 0 END AS hasEditorial,
      COALESCE(s.price_rows_30d, 0) AS priceRows30d,
      COALESCE(s.market_count_30d, 0) AS marketCount30d,
      CASE
        WHEN COALESCE(NULLIF(p.display_name, ''), p.name_tr) NOT LIKE '%.%'
         AND COALESCE(NULLIF(p.display_name, ''), p.name_tr) NOT REGEXP '^[[:alpha:]]([.]|[[:space:]])'
        THEN 1 ELSE 0
      END AS nameClean,
      COALESCE(JSON_LENGTH(p.aliases), 0) AS aliasCount,
      g.coverage_state AS gscState,
      g.verdict AS gscVerdict
    FROM hf_products p
    LEFT JOIN hf_product_editorial ed ON ed.product_slug = p.slug
    LEFT JOIN (
      SELECT product_id, COUNT(*) AS price_rows_30d, COUNT(DISTINCT market_id) AS market_count_30d
      FROM hf_price_history
      WHERE recorded_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
      GROUP BY product_id
    ) s ON s.product_id = p.id
    LEFT JOIN gsc_url_index g ON g.url LIKE '%/urun/%' AND SUBSTRING_INDEX(g.url, '/urun/', -1) = p.slug
    WHERE p.is_active = 1
  `);
  const rows = (Array.isArray(result) ? result[0] : result) as unknown as AuditRawRow[];

  const annotated = rows.map((r) => {
    const seoIndex = Number(r.seoIndex);
    const indexed = seoIndex === 1;
    // DB yayınlı editoryel YA DA frontend statik içerik → editoryeli var sayılır.
    const hasEd = Number(r.hasEditorial) === 1 || STATIC_EDITORIAL_SLUGS.has(r.slug);
    const isMaster = !r.canonicalSlug;
    const dataQuality = Number(r.dataQuality ?? 0);
    const priceRows30d = Number(r.priceRows30d);
    const marketCount30d = Number(r.marketCount30d);
    const nameClean = Number(r.nameClean) === 1;
    const aliasCount = Number(r.aliasCount);

    // Eksik bileşenler (dataQuality formülüyle birebir) — kullanıcı bunları tamamlar.
    const missing: string[] = [];
    if (priceRows30d === 0) missing.push("no_price_data");
    if (marketCount30d < 3) missing.push("few_markets");
    if (!nameClean) missing.push("messy_name");
    if (aliasCount === 0) missing.push("no_alias");
    if (!hasEd) missing.push("no_editorial");

    let issue: string | null = null;
    if (indexed && !hasEd) issue = "thin_indexed";
    else if (indexed && !isMaster) issue = "variant_indexed";
    else if (indexed && dataQuality < 70) issue = "lowquality_indexed";
    else if (!indexed && hasEd && isMaster && dataQuality >= 70) issue = "ready_not_indexed";

    // GSC coverage_state → kategori (wiribude mapCoverageToStatus pattern)
    const cov = String(r.gscState ?? "").toLowerCase();
    let gscStatus: string = "not_checked";
    if (!cov) gscStatus = "not_checked";
    else if (cov.includes("submitted and indexed") || cov.includes("indexed, not submitted")) gscStatus = "indexed";
    else if (cov.includes("crawled - currently not indexed")) gscStatus = "crawled_not_indexed";
    else if (cov.includes("discovered - currently not indexed")) gscStatus = "discovered_not_indexed";
    else if (cov.includes("noindex")) gscStatus = "noindex";
    else if (cov.includes("redirect")) gscStatus = "redirect";
    else if (cov.includes("unknown")) gscStatus = "unknown";
    else gscStatus = "other";

    // Aksiyon önerisi: kalite sinyali + Google sonucu birleşik triyaj
    let recommendation = "ok";
    if (isMaster && indexed && gscStatus === "indexed") recommendation = "ok";
    else if (issue === "ready_not_indexed") recommendation = "index_ac";
    else if (issue === "lowquality_indexed" || issue === "thin_indexed") recommendation = "noindex_veya_duzelt";
    else if (!isMaster) recommendation = "variant_canonical_ok";
    else if ((gscStatus === "discovered_not_indexed" || gscStatus === "crawled_not_indexed") && marketCount30d < 3) recommendation = "thin_market_ekle_veya_noindex";
    else if ((gscStatus === "discovered_not_indexed" || gscStatus === "crawled_not_indexed") && marketCount30d >= 3) recommendation = "zenginlestir_ic_link";
    else if (indexed && (gscStatus === "not_checked" || gscStatus === "unknown")) recommendation = "tarama_bekliyor";

    return {
      slug: r.slug,
      displayName: r.displayName,
      nameTr: r.nameTr,
      seoIndex,
      dataQuality,
      canonicalSlug: r.canonicalSlug,
      hasEditorial: hasEd,
      indexed,
      issue,
      gscStatus,
      gscState: r.gscState ?? null,
      recommendation,
      priceRows30d,
      marketCount30d,
      nameClean,
      aliasCount,
      missing,
    };
  });

  const gscCount = (st: string) => annotated.filter((r) => r.gscStatus === st).length;
  const summary = {
    total: annotated.length,
    indexed: annotated.filter((r) => r.indexed).length,
    withEditorial: annotated.filter((r) => r.hasEditorial).length,
    thin_indexed: annotated.filter((r) => r.issue === "thin_indexed").length,
    variant_indexed: annotated.filter((r) => r.issue === "variant_indexed").length,
    lowquality_indexed: annotated.filter((r) => r.issue === "lowquality_indexed").length,
    ready_not_indexed: annotated.filter((r) => r.issue === "ready_not_indexed").length,
    gsc: {
      indexed: gscCount("indexed"),
      discovered_not_indexed: gscCount("discovered_not_indexed"),
      crawled_not_indexed: gscCount("crawled_not_indexed"),
      noindex: gscCount("noindex"),
      unknown: gscCount("unknown"),
      not_checked: gscCount("not_checked"),
    },
  };

  const items = filter === "issues" ? annotated.filter((r) => r.issue) : annotated;
  return { summary, items };
}

export async function applySeoAuditAction(opts: {
  action: "set-index" | "set-noindex";
  slugs?: string[];
  issue?: "thin_indexed" | "variant_indexed" | "lowquality_indexed" | "ready_not_indexed";
}) {
  const audit = await auditProducts("all");
  const requested = new Set((opts.slugs ?? []).filter(Boolean));
  const candidates = audit.items.filter((item) => {
    if (requested.size > 0 && !requested.has(item.slug)) return false;
    if (opts.issue && item.issue !== opts.issue) return false;
    if (opts.action === "set-index") {
      // Güvenli index açma: yalnızca içerikli, master ve kalite >=70 ürünler.
      return !item.indexed && item.hasEditorial && !item.canonicalSlug && item.dataQuality >= 70;
    }
    return item.indexed;
  });
  const slugs = candidates.map((item) => item.slug);
  if (slugs.length === 0) return { updated: 0, skipped: 0, slugs: [] };

  const result = await db
    .update(hfProducts)
    .set({ seoIndex: opts.action === "set-index" ? 1 : 0 })
    .where(inArray(hfProducts.slug, slugs));

  return {
    updated: Number(result[0]?.affectedRows ?? 0),
    skipped: Math.max(0, (requested.size || (opts.issue ? audit.items.filter((i) => i.issue === opts.issue).length : slugs.length)) - slugs.length),
    slugs,
  };
}

/**
 * Haftalik SEO auto-recovery: dataQuality'yi yeniden hesapla, sonra sezonsal
 * ürünleri otomatik index'e al / çıkar. Verisi dönen (örn. Eylül'de av yasağı
 * biten balık, yaz meyveleri) ürünler editoryeli + veri≥70 ise indexlenir;
 * verisi 30g kuruyan indexli ürünler noindex'e çekilir (fiyatsız sayfa thin).
 * dataQuality formülü calculate-product-data-quality.ts ile birebir aynı.
 */
export async function runSeoIndexMaintenance() {
  await db.execute(sql`
    UPDATE hf_products p
    LEFT JOIN (
      SELECT product_id, COUNT(*) pr, COUNT(DISTINCT market_id) mc
      FROM hf_price_history WHERE recorded_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY) GROUP BY product_id
    ) s ON s.product_id = p.id
    LEFT JOIN hf_product_editorial ed ON ed.product_slug = p.slug
    SET p.data_quality = LEAST(100,
      (COALESCE(s.pr,0) >= 1) * 40 +
      (COALESCE(s.mc,0) >= 3) * 25 +
      (COALESCE(NULLIF(p.display_name,''), p.name_tr) NOT LIKE '%.%'
        AND COALESCE(NULLIF(p.display_name,''), p.name_tr) NOT REGEXP '^[[:alpha:]]([.]|[[:space:]])') * 15 +
      (COALESCE(JSON_LENGTH(p.aliases),0) >= 1) * 10 +
      (ed.published_at IS NOT NULL) * 10)
    WHERE p.is_active = 1
  `);

  // Kalite > nicelik: index için ≥3 market şartı. Tek/iki marketli "thin" sayfaları
  // Google zaten "Discovered - not indexed" yapıyor (sıfır trafik) → indexlemeye zorlamak
  // crawl bütçesi israfı. ≥3 market = anlamlı fiyat karşılaştırması. Self-healing: market
  // kazanan ürün (örn. sezonu açılan balık) sonraki çalıştırmada geri index'lenir.
  const up = await db.execute(sql`
    UPDATE hf_products p
    JOIN hf_product_editorial e ON e.product_slug = p.slug AND e.published_at IS NOT NULL
    JOIN (SELECT product_id, COUNT(*) pr, COUNT(DISTINCT market_id) mc FROM hf_price_history WHERE recorded_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY) GROUP BY product_id) s ON s.product_id = p.id
    SET p.seo_index = 1
    WHERE p.canonical_slug IS NULL AND p.data_quality >= 70 AND s.pr > 0 AND s.mc >= 3 AND p.seo_index = 0
  `);

  const down = await db.execute(sql`
    UPDATE hf_products p
    LEFT JOIN (SELECT product_id, COUNT(*) pr, COUNT(DISTINCT market_id) mc FROM hf_price_history WHERE recorded_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY) GROUP BY product_id) s ON s.product_id = p.id
    SET p.seo_index = 0
    WHERE p.seo_index = 1 AND p.canonical_slug IS NULL AND (COALESCE(s.pr,0) = 0 OR COALESCE(s.mc,0) < 3)
  `);

  const affected = (r: unknown) => Number((Array.isArray(r) ? (r[0] as { affectedRows?: number }) : null)?.affectedRows ?? 0);
  return { flippedUp: affected(up), demoted: affected(down) };
}
