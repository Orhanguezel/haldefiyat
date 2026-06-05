import { randomUUID } from "node:crypto";
import { and, desc, eq, gte, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { hfPriceHistory, hfProducts } from "@/db/schema";
import { buildListingSlug } from "./slug";
import { hfListingInquiries, hfListings } from "./schema";
import type { ListingCreateInput, ListingPatchInput } from "./validation";

type Status = "pending" | "approved" | "rejected" | "expired" | "closed";

export type ListingFilters = {
  type?: "satis" | "alim";
  product?: string;
  city?: string;
  district?: string;
  status?: Status | "all";
  userId?: string;
  publicOnly?: boolean;
  limit?: number;
  offset?: number;
};

async function resolveProduct(slug?: string | null, fallback?: string) {
  if (!slug) return { productId: null, productSlug: null, productName: fallback ?? "", categorySlug: "diger" };
  const [product] = await db.select().from(hfProducts).where(eq(hfProducts.slug, slug)).limit(1);
  if (!product) return { productId: null, productSlug: slug, productName: fallback ?? slug, categorySlug: "diger" };
  return { productId: product.id, productSlug: product.slug, productName: product.nameTr, categorySlug: product.categorySlug };
}

async function isSuspiciousPrice(productId: number | null, priceType?: string | null, priceMin?: number | null) {
  if (!productId || priceType !== "sabit" || priceMin == null) return 0;
  const [row] = await db
    .select({ avgPrice: hfPriceHistory.avgPrice })
    .from(hfPriceHistory)
    .where(eq(hfPriceHistory.productId, productId))
    .orderBy(desc(hfPriceHistory.recordedDate))
    .limit(1);
  const avg = Number(row?.avgPrice ?? 0);
  return avg > 0 && Math.abs(priceMin - avg) / avg > 0.6 ? 1 : 0;
}

function toMoney(value: number | null | undefined) {
  return value == null ? null : value.toFixed(2);
}

async function toListingValues(input: ListingCreateInput | ListingPatchInput, existing?: typeof hfListings.$inferSelect) {
  const touchesProduct = input.productSlug !== undefined || input.productName !== undefined;
  const product = touchesProduct ? await resolveProduct(input.productSlug, input.productName) : null;
  const touchesPriceSignal = input.priceType !== undefined || input.priceMin !== undefined || touchesProduct;
  const suspiciousProductId = product?.productId ?? existing?.productId ?? null;
  const suspiciousPriceType = input.priceType ?? existing?.priceType;
  const suspiciousPriceMin = input.priceMin ?? (existing?.priceMin == null ? null : Number(existing.priceMin));
  return {
    ...("listingType" in input && input.listingType ? { listingType: input.listingType } : {}),
    ...("partyRole" in input && input.partyRole ? { partyRole: input.partyRole } : {}),
    ...(product ? {
      productId: product.productId,
      productSlug: product.productSlug,
      productName: product.productName || input.productName,
      categorySlug: product.categorySlug,
    } : {}),
    ...(input.title !== undefined ? { title: input.title } : {}),
    ...(input.description !== undefined ? { description: input.description } : {}),
    ...(input.quality !== undefined ? { quality: input.quality } : {}),
    ...(input.packaging !== undefined ? { packaging: input.packaging } : {}),
    ...(input.quantity !== undefined ? { quantity: toMoney(input.quantity) } : {}),
    ...(input.quantityUnit !== undefined ? { quantityUnit: input.quantityUnit } : {}),
    ...(input.priceType !== undefined ? { priceType: input.priceType } : {}),
    ...(input.priceMin !== undefined ? { priceMin: toMoney(input.priceMin) } : {}),
    ...(input.priceMax !== undefined ? { priceMax: toMoney(input.priceMax) } : {}),
    ...(input.priceUnit !== undefined ? { priceUnit: input.priceUnit } : {}),
    ...(input.halIndexPct !== undefined ? { halIndexPct: toMoney(input.halIndexPct) } : {}),
    ...(input.currency !== undefined ? { currency: input.currency } : {}),
    ...(input.citySlug !== undefined ? { citySlug: input.citySlug } : {}),
    ...(input.districtSlug !== undefined ? { districtSlug: input.districtSlug } : {}),
    ...(input.firmId !== undefined ? { firmId: input.firmId } : {}),
    ...(input.contactName !== undefined ? { contactName: input.contactName } : {}),
    ...(input.contactPhone !== undefined ? { contactPhone: input.contactPhone } : {}),
    ...(input.hidePhone !== undefined ? { hidePhone: input.hidePhone ? 1 : 0 } : {}),
    ...(input.validUntil !== undefined ? { validUntil: input.validUntil } : {}),
    ...(touchesPriceSignal ? { isSuspicious: await isSuspiciousPrice(suspiciousProductId, suspiciousPriceType, suspiciousPriceMin) } : {}),
  };
}

function whereFor(filters: ListingFilters) {
  const clauses = [];
  if (filters.publicOnly) {
    clauses.push(eq(hfListings.status, "approved"), gte(hfListings.validUntil, sql`CURRENT_DATE()`));
  } else if (filters.status && filters.status !== "all") clauses.push(eq(hfListings.status, filters.status));
  if (filters.type) clauses.push(eq(hfListings.listingType, filters.type));
  if (filters.product) clauses.push(eq(hfListings.productSlug, filters.product));
  if (filters.city) clauses.push(eq(hfListings.citySlug, filters.city));
  if (filters.district) clauses.push(eq(hfListings.districtSlug, filters.district));
  if (filters.userId) clauses.push(eq(hfListings.userId, filters.userId));
  return clauses.length ? and(...clauses) : undefined;
}

export async function listListings(filters: ListingFilters) {
  const where = whereFor(filters);
  return db.select().from(hfListings).where(where).orderBy(
    desc(sql`${hfListings.isFeatured} = 1 AND ${hfListings.featuredUntil} > CURRENT_TIMESTAMP(3)`),
    desc(hfListings.createdAt),
  ).limit(Math.min(filters.limit ?? 20, 100)).offset(filters.offset ?? 0);
}

export async function countListings(filters: ListingFilters) {
  const [row] = await db.select({ count: sql<number>`count(*)` }).from(hfListings).where(whereFor(filters));
  return Number(row?.count ?? 0);
}

export async function getListingBySlug(slug: string, publicOnly = true) {
  const clauses = [eq(hfListings.slug, slug)];
  if (publicOnly) clauses.push(eq(hfListings.status, "approved"), gte(hfListings.validUntil, sql`CURRENT_DATE()`));
  const [row] = await db.select().from(hfListings).where(and(...clauses)).limit(1);
  return row ?? null;
}

export async function createListing(input: ListingCreateInput, userId: string | null, opts: { source: "user" | "assisted" | "telegram"; createdBy?: string | null; status?: Status; phoneVerified?: number; raw?: Record<string, unknown> }) {
  const values = await toListingValues(input);
  const result = await db.insert(hfListings).values({
    ...values,
    title: input.title,
    validUntil: input.validUntil,
    slug: `draft-${randomUUID().slice(0, 24)}`,
    userId,
    source: opts.source,
    createdBy: opts.createdBy ?? null,
    status: opts.status ?? "pending",
    phoneVerified: opts.phoneVerified ?? 0,
    raw: opts.raw ?? null,
  } as typeof hfListings.$inferInsert);
  const id = Number(result[0]?.insertId ?? 0);
  if (!id) return null;
  await db.update(hfListings).set({ slug: buildListingSlug({ id, productSlug: values.productSlug, title: input.title, citySlug: input.citySlug }) }).where(eq(hfListings.id, id));
  return getListingById(id);
}

export async function getListingById(id: number) {
  const [row] = await db.select().from(hfListings).where(eq(hfListings.id, id)).limit(1);
  return row ?? null;
}

export async function updateOwnerListing(id: number, userId: string, input: ListingPatchInput) {
  const row = await getListingById(id);
  if (!row || row.userId !== userId) return null;
  await db.update(hfListings).set({ ...(await toListingValues(input, row)), status: "pending" }).where(eq(hfListings.id, id));
  return getListingById(id);
}

export async function closeOwnerListing(id: number, userId: string) {
  const result = await db.update(hfListings).set({ status: "closed" }).where(and(eq(hfListings.id, id), eq(hfListings.userId, userId)));
  return Number(result[0]?.affectedRows ?? 0);
}

export async function incrementListingView(id: number) {
  await db.update(hfListings).set({ viewCount: sql`${hfListings.viewCount} + 1` }).where(eq(hfListings.id, id));
}

export async function createInquiry(input: { listingId: number; userId?: string | null; name: string; phone: string; message: string; offerPrice?: number | null }) {
  const result = await db.insert(hfListingInquiries).values({ ...input, offerPrice: toMoney(input.offerPrice) });
  return Number(result[0]?.insertId ?? 0);
}

export async function listInquiries() {
  return db.select().from(hfListingInquiries).orderBy(desc(hfListingInquiries.createdAt)).limit(200);
}

export async function listingSummary() {
  const [row] = await db.select({
    active: sql<number>`SUM(status='approved')`,
    pending: sql<number>`SUM(status='pending')`,
    rejected: sql<number>`SUM(status='rejected')`,
  }).from(hfListings);
  return { active: Number(row?.active ?? 0), pending: Number(row?.pending ?? 0), rejected: Number(row?.rejected ?? 0) };
}

export async function moderateListing(id: number, status: "approved" | "rejected", moderationNote?: string | null) {
  await db.update(hfListings).set({ status, moderationNote: moderationNote ?? null }).where(eq(hfListings.id, id));
  return getListingById(id);
}

export async function featureListing(id: number, days: number) {
  await db.update(hfListings).set({ isFeatured: 1, featuredUntil: sql`DATE_ADD(CURRENT_TIMESTAMP(3), INTERVAL ${days} DAY)` }).where(eq(hfListings.id, id));
  return getListingById(id);
}

export async function deleteListing(id: number) {
  const result = await db.delete(hfListings).where(eq(hfListings.id, id));
  return Number(result[0]?.affectedRows ?? 0);
}

export async function expireListings() {
  const result = await db.update(hfListings).set({ status: "expired" }).where(and(eq(hfListings.status, "approved"), sql`${hfListings.validUntil} < CURRENT_DATE()`));
  return Number(result[0]?.affectedRows ?? 0);
}
