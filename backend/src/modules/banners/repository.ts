import { and, asc, eq, like, or, sql } from "drizzle-orm";
import { db, pool } from "@/db/client";
import { hfBanners } from "@/db/schema";

export type BannerRow = typeof hfBanners.$inferSelect;
export type BannerDevice = "all" | "desktop" | "mobile";

export type BannerInput = {
  position: string;
  title: string;
  advertiser?: string | null;
  notes?: string | null;
  type?: "image" | "code";
  imageUrl?: string | null;
  alt?: string | null;
  linkUrl?: string | null;
  linkTarget?: string;
  rel?: string;
  code?: string | null;
  caption?: string | null;
  ctaLabel?: string | null;
  device?: BannerDevice;
  weight?: number;
  displayOrder?: number;
  isActive?: boolean;
  startAt?: string | null;
  endAt?: string | null;
};

export type BannerListFilters = {
  position?: string;
  isActive?: boolean;
  q?: string;
  limit?: number;
  offset?: number;
};

function toDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function mapInsert(input: BannerInput) {
  return {
    position: input.position,
    title: input.title,
    advertiser: input.advertiser ?? null,
    notes: input.notes ?? null,
    type: input.type ?? "image",
    imageUrl: input.imageUrl ?? null,
    alt: input.alt ?? null,
    linkUrl: input.linkUrl ?? null,
    linkTarget: input.linkTarget ?? "_blank",
    rel: input.rel ?? "sponsored nofollow noopener",
    code: input.code ?? null,
    caption: input.caption ?? null,
    ctaLabel: input.ctaLabel ?? null,
    device: input.device ?? "all",
    weight: input.weight ?? 1,
    displayOrder: input.displayOrder ?? 0,
    isActive: input.isActive ? 1 : 0,
    startAt: toDate(input.startAt),
    endAt: toDate(input.endAt),
  };
}

export async function listBanners(filters: BannerListFilters): Promise<BannerRow[]> {
  const where = [];
  if (filters.position) where.push(eq(hfBanners.position, filters.position));
  if (typeof filters.isActive === "boolean") where.push(eq(hfBanners.isActive, filters.isActive ? 1 : 0));
  if (filters.q) {
    const term = `%${filters.q}%`;
    where.push(or(like(hfBanners.title, term), like(hfBanners.advertiser, term)));
  }
  return db
    .select()
    .from(hfBanners)
    .where(where.length ? and(...where) : undefined)
    .orderBy(asc(hfBanners.position), asc(hfBanners.displayOrder), asc(hfBanners.id))
    .limit(filters.limit ?? 200)
    .offset(filters.offset ?? 0);
}

export async function getBannerById(id: number): Promise<BannerRow | null> {
  const [row] = await db.select().from(hfBanners).where(eq(hfBanners.id, id)).limit(1);
  return row ?? null;
}

export async function createBanner(input: BannerInput): Promise<number> {
  const result = await db.insert(hfBanners).values(mapInsert(input));
  return Number(result[0]?.insertId ?? 0);
}

export async function updateBanner(id: number, patch: Partial<BannerInput>): Promise<boolean> {
  const set: Record<string, unknown> = {};
  if (patch.position !== undefined) set.position = patch.position;
  if (patch.title !== undefined) set.title = patch.title;
  if (patch.advertiser !== undefined) set.advertiser = patch.advertiser || null;
  if (patch.notes !== undefined) set.notes = patch.notes || null;
  if (patch.type !== undefined) set.type = patch.type;
  if (patch.imageUrl !== undefined) set.imageUrl = patch.imageUrl || null;
  if (patch.alt !== undefined) set.alt = patch.alt || null;
  if (patch.linkUrl !== undefined) set.linkUrl = patch.linkUrl || null;
  if (patch.linkTarget !== undefined) set.linkTarget = patch.linkTarget;
  if (patch.rel !== undefined) set.rel = patch.rel;
  if (patch.code !== undefined) set.code = patch.code || null;
  if (patch.caption !== undefined) set.caption = patch.caption || null;
  if (patch.ctaLabel !== undefined) set.ctaLabel = patch.ctaLabel || null;
  if (patch.device !== undefined) set.device = patch.device;
  if (patch.weight !== undefined) set.weight = patch.weight;
  if (patch.displayOrder !== undefined) set.displayOrder = patch.displayOrder;
  if (patch.isActive !== undefined) set.isActive = patch.isActive ? 1 : 0;
  if (patch.startAt !== undefined) set.startAt = toDate(patch.startAt);
  if (patch.endAt !== undefined) set.endAt = toDate(patch.endAt);
  if (Object.keys(set).length === 0) return false;
  await db.update(hfBanners).set(set).where(eq(hfBanners.id, id));
  return true;
}

export async function deleteBanner(id: number): Promise<void> {
  await db.delete(hfBanners).where(eq(hfBanners.id, id));
}

// Public render seçimi: aktif + zamanlama içinde, display_order'a göre ilk banner.
// Device hedefleme frontend'de CSS ile uygulanır (device alanı döndürülür).
export async function pickActiveForPosition(position: string): Promise<BannerRow | null> {
  const [row] = await db
    .select()
    .from(hfBanners)
    .where(
      and(
        eq(hfBanners.position, position),
        eq(hfBanners.isActive, 1),
        sql`(${hfBanners.startAt} IS NULL OR ${hfBanners.startAt} <= CURRENT_TIMESTAMP(3))`,
        sql`(${hfBanners.endAt} IS NULL OR ${hfBanners.endAt} >= CURRENT_TIMESTAMP(3))`,
      ),
    )
    .orderBy(asc(hfBanners.displayOrder), asc(hfBanners.id))
    .limit(1);
  return row ?? null;
}

export async function incImpression(id: number): Promise<void> {
  await db.update(hfBanners).set({ impressions: sql`${hfBanners.impressions} + 1` }).where(eq(hfBanners.id, id));
}

export async function incClick(id: number): Promise<void> {
  await db.update(hfBanners).set({ clicks: sql`${hfBanners.clicks} + 1` }).where(eq(hfBanners.id, id));
}

export async function bannerStats(): Promise<Pick<BannerRow, "id" | "title" | "position" | "advertiser" | "impressions" | "clicks" | "isActive">[]> {
  return db
    .select({
      id: hfBanners.id,
      title: hfBanners.title,
      position: hfBanners.position,
      advertiser: hfBanners.advertiser,
      impressions: hfBanners.impressions,
      clicks: hfBanners.clicks,
      isActive: hfBanners.isActive,
    })
    .from(hfBanners)
    .orderBy(asc(hfBanners.position), asc(hfBanners.displayOrder));
}

// Global reklam anahtarı: site_settings.ads_enabled. Kayıt yoksa AÇIK varsayılır
// (ilk reklam ek kurulum gerektirmesin); yalnızca '0'/'false'/'off' kapatır.
export async function isAdsEnabled(): Promise<boolean> {
  try {
    const [rows] = await pool.query<any[]>(
      "SELECT value FROM site_settings WHERE `key` = 'ads_enabled' ORDER BY (locale = '*') DESC LIMIT 1",
    );
    const v = String(rows?.[0]?.value ?? "").trim().toLowerCase();
    if (v === "") return true;
    return !["0", "false", "off", "no"].includes(v);
  } catch {
    return true;
  }
}
