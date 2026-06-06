import { and, asc, desc, eq, like, or, sql } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { db } from "@/db/client";
import { hfFirmClaims, hfFirmDeals, hfFirmPrices, hfFirmProducts, hfFirms, hfFirmSponsorships } from "@/db/schema";
import { slugifyTr, TURKEY_CITIES } from "@/data/turkey-city-slugs";
import type { FetchedFirm, FirmListFilters } from "./types";

type FirmType = "komisyoncu" | "soguk_hava" | "nakliye" | "zirai_ilac";

let firmSeoIndexColumnExists: boolean | null = null;

async function hasFirmSeoIndexColumn(): Promise<boolean> {
  if (firmSeoIndexColumnExists !== null) return firmSeoIndexColumnExists;
  const result = await db.execute(sql`
    SELECT COUNT(*) AS count
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'hf_firms'
      AND COLUMN_NAME = 'seo_index'
  `);
  const rows = (Array.isArray(result) ? result[0] : result) as unknown as Array<{ count: number | string }>;
  firmSeoIndexColumnExists = Number(rows[0]?.count ?? 0) > 0;
  return firmSeoIndexColumnExists;
}

function firmSelectColumns(includeSeoIndex: boolean) {
  return {
    id: hfFirms.id,
    externalId: hfFirms.externalId,
    slug: hfFirms.slug,
    name: hfFirms.name,
    contactPerson: hfFirms.contactPerson,
    phone: hfFirms.phone,
    address: hfFirms.address,
    citySlug: hfFirms.citySlug,
    districtSlug: hfFirms.districtSlug,
    photoUrl: hfFirms.photoUrl,
    sourceUrl: hfFirms.sourceUrl,
    firmType: hfFirms.firmType,
    categories: hfFirms.categories,
    ownerUserId: hfFirms.ownerUserId,
    source: hfFirms.source,
    status: hfFirms.status,
    description: hfFirms.description,
    claimStatus: hfFirms.claimStatus,
    isActive: hfFirms.isActive,
    seoIndex: includeSeoIndex ? hfFirms.seoIndex : sql<number>`0`,
    firstSeenAt: hfFirms.firstSeenAt,
    lastSeenAt: hfFirms.lastSeenAt,
    raw: hfFirms.raw,
    createdAt: hfFirms.createdAt,
    updatedAt: hfFirms.updatedAt,
  };
}

function cityNameForSlug(citySlug: string): string {
  const city = TURKEY_CITIES.find((item) => slugifyTr(item.label) === citySlug);
  if (city) return city.label;
  return titleCaseSlug(citySlug);
}

function titleCaseSlug(value: string): string {
  return value
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toLocaleUpperCase("tr") + part.slice(1))
    .join(" ");
}

export async function upsertFirm(firm: FetchedFirm): Promise<"inserted" | "updated"> {
  const existing = await db
    .select({ id: hfFirms.id })
    .from(hfFirms)
    .where(eq(hfFirms.externalId, firm.externalId))
    .limit(1);

  const values = {
    externalId: firm.externalId,
    slug: firm.slug,
    name: firm.name,
    contactPerson: firm.contactPerson || null,
    phone: firm.phone || null,
    address: firm.address || null,
    citySlug: firm.citySlug || null,
    districtSlug: firm.districtSlug || null,
    photoUrl: firm.photoUrl || null,
    sourceUrl: firm.sourceUrl,
    firmType: firm.firmType,
    categories: firm.categories ?? [],
    isActive: 1,
    lastSeenAt: sql`CURRENT_TIMESTAMP(3)`,
    raw: firm.raw,
  };

  await db
    .insert(hfFirms)
    .values(values)
    .onDuplicateKeyUpdate({
      set: {
        slug: values.slug,
        name: values.name,
        // OCR ile doldurulmus iletisim/isim re-scrape'te EZILMEZ: mevcut deger varsa korunur.
        contactPerson: sql`COALESCE(${hfFirms.contactPerson}, ${values.contactPerson})`,
        phone: sql`COALESCE(${hfFirms.phone}, ${values.phone})`,
        address: values.address,
        citySlug: values.citySlug,
        districtSlug: values.districtSlug,
        photoUrl: values.photoUrl,
        sourceUrl: values.sourceUrl,
        firmType: values.firmType,
        categories: values.categories,
        isActive: 1,
        lastSeenAt: sql`CURRENT_TIMESTAMP(3)`,
        // raw MERGE: mevcut ocr_contacts/ocr_phones korunur, scrape alanlari (breadcrumb/detailFields) guncellenir.
        raw: sql`JSON_MERGE_PATCH(COALESCE(${hfFirms.raw}, JSON_OBJECT()), CAST(${JSON.stringify(firm.raw ?? {})} AS JSON))`,
      },
    });

  return existing[0] ? "updated" : "inserted";
}

export async function listFirms(filters: FirmListFilters = {}) {
  const where = buildFirmWhere(filters);
  const includeSeoIndex = await hasFirmSeoIndexColumn();
  return db
    .select({
      ...firmSelectColumns(includeSeoIndex),
      sponsorshipTier: hfFirmSponsorships.tier,
      sponsorshipPlacement: hfFirmSponsorships.placement,
    })
    .from(hfFirms)
    .leftJoin(hfFirmSponsorships, and(
      eq(hfFirmSponsorships.firmId, hfFirms.id),
      eq(hfFirmSponsorships.isActive, 1),
      sql`${hfFirmSponsorships.startsAt} <= CURRENT_TIMESTAMP(3)`,
      sql`${hfFirmSponsorships.endsAt} >= CURRENT_TIMESTAMP(3)`,
    ))
    .where(where)
    .orderBy(desc(hfFirmSponsorships.isActive), asc(hfFirms.citySlug), asc(hfFirms.name))
    .limit(Math.min(filters.limit ?? 50, 200))
    .offset(filters.offset ?? 0);
}

export async function countFirms(filters: FirmListFilters = {}) {
  const [row] = await db
    .select({ count: sql<number>`count(*)` })
    .from(hfFirms)
    .where(buildFirmWhere(filters));
  return Number(row?.count ?? 0);
}

export async function listFirmCityAggregates() {
  const rows = await db
    .select({
      citySlug: hfFirms.citySlug,
      firmType: hfFirms.firmType,
      total: sql<number>`count(*)`,
    })
    .from(hfFirms)
    .where(and(
      eq(hfFirms.isActive, 1),
      eq(hfFirms.status, "approved"),
      sql`${hfFirms.citySlug} IS NOT NULL`,
      sql`${hfFirms.citySlug} <> ''`,
    ))
    .groupBy(hfFirms.citySlug, hfFirms.firmType)
    .orderBy(asc(hfFirms.citySlug));

  const byCity = new Map<string, {
    citySlug: string;
    cityName: string;
    total: number;
    byType: Record<FirmType, number>;
  }>();

  for (const row of rows) {
    if (!row.citySlug) continue;
    const city = byCity.get(row.citySlug) ?? {
      citySlug: row.citySlug,
      cityName: cityNameForSlug(row.citySlug),
      total: 0,
      byType: { komisyoncu: 0, soguk_hava: 0, nakliye: 0, zirai_ilac: 0 },
    };
    const count = Number(row.total ?? 0);
    city.total += count;
    city.byType[row.firmType as FirmType] = count;
    byCity.set(row.citySlug, city);
  }

  return [...byCity.values()].sort((a, b) => b.total - a.total || a.cityName.localeCompare(b.cityName, "tr"));
}

export async function listFirmTypeAggregates() {
  return db
    .select({
      firmType: hfFirms.firmType,
      total: sql<number>`count(*)`,
    })
    .from(hfFirms)
    .where(and(eq(hfFirms.isActive, 1), eq(hfFirms.status, "approved")))
    .groupBy(hfFirms.firmType)
    .orderBy(desc(sql<number>`count(*)`));
}

export async function listFirmSeoCandidates(limit = 500) {
  return db
    .select({
      id: hfFirms.id,
      slug: hfFirms.slug,
      name: hfFirms.name,
      citySlug: hfFirms.citySlug,
      productCount: sql<number>`COUNT(${hfFirmProducts.id})`,
      hasLongDescription: sql<number>`CASE WHEN CHAR_LENGTH(COALESCE(${hfFirms.description}, '')) >= 120 THEN 1 ELSE 0 END`,
      isClaimVerified: sql<number>`CASE WHEN ${hfFirms.claimStatus} = 'verified' THEN 1 ELSE 0 END`,
    })
    .from(hfFirms)
    .leftJoin(hfFirmProducts, eq(hfFirmProducts.firmId, hfFirms.id))
    .where(and(
      eq(hfFirms.isActive, 1),
      eq(hfFirms.status, "approved"),
      sql`${hfFirms.citySlug} IS NOT NULL`,
      sql`${hfFirms.citySlug} <> ''`,
    ))
    .groupBy(hfFirms.id)
    .having(sql`COUNT(${hfFirmProducts.id}) >= 3 OR CHAR_LENGTH(COALESCE(${hfFirms.description}, '')) >= 120 OR ${hfFirms.claimStatus} = 'verified'`)
    .orderBy(desc(sql`COUNT(${hfFirmProducts.id})`), asc(hfFirms.name))
    .limit(Math.min(limit, 1000));
}

export async function getFirmBySlug(slug: string) {
  const includeSeoIndex = await hasFirmSeoIndexColumn();
  const rows = await db
    .select(firmSelectColumns(includeSeoIndex))
    .from(hfFirms)
    .where(and(eq(hfFirms.slug, slug), eq(hfFirms.isActive, 1), eq(hfFirms.status, "approved")))
    .limit(1);
  const firm = rows[0] ?? null;
  if (!firm) return null;
  const products = await listFirmProducts(firm.id);
  const latest = await getLatestFirmPrices(firm.id);
  return { ...firm, products, ocrContacts: extractOcrContacts(firm.raw), latestPrices: latest.items, latestPriceDate: latest.date };
}

export async function getFirmById(id: number) {
  const includeSeoIndex = await hasFirmSeoIndexColumn();
  const rows = await db
    .select(firmSelectColumns(includeSeoIndex))
    .from(hfFirms)
    .where(eq(hfFirms.id, id))
    .limit(1);
  return rows[0] ?? null;
}

export async function getMyFirm(userId: string) {
  const includeSeoIndex = await hasFirmSeoIndexColumn();
  const [firm] = await db
    .select(firmSelectColumns(includeSeoIndex))
    .from(hfFirms)
    .where(eq(hfFirms.ownerUserId, userId))
    .orderBy(desc(hfFirms.updatedAt))
    .limit(1);
  if (!firm) return null;
  return { ...firm, products: await listFirmProducts(firm.id), prices: await getFirmPricesByDate(firm.id, todayDateString()), ocrContacts: extractOcrContacts(firm.raw) };
}

export async function createUserFirm(input: {
  ownerUserId: string;
  name: string;
  contactPerson?: string | null;
  phone?: string | null;
  address?: string | null;
  citySlug?: string | null;
  districtSlug?: string | null;
  description?: string | null;
  categories?: string[];
}) {
  const slug = await ensureUniqueFirmSlug(input.name);
  const result = await db.insert(hfFirms).values({
    externalId: `user-${randomUUID().slice(0, 24)}`,
    slug,
    name: input.name,
    contactPerson: input.contactPerson ?? null,
    phone: input.phone ?? null,
    address: input.address ?? null,
    citySlug: input.citySlug ?? null,
    districtSlug: input.districtSlug ?? null,
    sourceUrl: `/firma/${slug}`,
    firmType: "komisyoncu",
    categories: input.categories ?? [],
    ownerUserId: input.ownerUserId,
    source: "user",
    status: "pending",
    description: input.description ?? null,
    claimStatus: "verified",
    isActive: 1,
    raw: { source: "user" },
  });
  const id = Number(result[0]?.insertId ?? 0);
  return id ? await getFirmById(id) : null;
}

export async function updateFirmByOwner(id: number, userId: string, input: FirmPatchInput) {
  const firm = await getFirmById(id);
  if (!firm || firm.ownerUserId !== userId) return null;
  await updateFirmFields(id, input);
  return getFirmById(id);
}

export async function adminUpdateFirm(id: number, input: FirmPatchInput & {
  status?: "pending" | "approved" | "rejected";
  claimStatus?: "unclaimed" | "pending" | "verified";
  ownerUserId?: string | null;
}) {
  await updateFirmFields(id, input);
  return getFirmById(id);
}

type FirmPatchInput = {
  name?: string;
  contactPerson?: string | null;
  phone?: string | null;
  address?: string | null;
  citySlug?: string | null;
  districtSlug?: string | null;
  description?: string | null;
  categories?: string[];
};

async function updateFirmFields(id: number, input: FirmPatchInput & {
  status?: "pending" | "approved" | "rejected";
  claimStatus?: "unclaimed" | "pending" | "verified";
  ownerUserId?: string | null;
}) {
  await db.update(hfFirms).set({
    ...(input.name !== undefined ? { name: input.name } : {}),
    ...(input.contactPerson !== undefined ? { contactPerson: input.contactPerson } : {}),
    ...(input.phone !== undefined ? { phone: input.phone } : {}),
    ...(input.address !== undefined ? { address: input.address } : {}),
    ...(input.citySlug !== undefined ? { citySlug: input.citySlug } : {}),
    ...(input.districtSlug !== undefined ? { districtSlug: input.districtSlug } : {}),
    ...(input.description !== undefined ? { description: input.description } : {}),
    ...(input.categories !== undefined ? { categories: input.categories } : {}),
    ...(input.status !== undefined ? { status: input.status } : {}),
    ...(input.claimStatus !== undefined ? { claimStatus: input.claimStatus } : {}),
    ...(input.ownerUserId !== undefined ? { ownerUserId: input.ownerUserId } : {}),
  }).where(eq(hfFirms.id, id));
}

export async function listFirmProducts(firmId: number) {
  return db
    .select()
    .from(hfFirmProducts)
    .where(eq(hfFirmProducts.firmId, firmId))
    .orderBy(asc(hfFirmProducts.displayOrder), asc(hfFirmProducts.productName));
}

export async function createFirmProduct(input: {
  firmId: number;
  productSlug?: string | null;
  productName: string;
  note?: string | null;
  price?: string | null;
  displayOrder?: number;
}) {
  const result = await db.insert(hfFirmProducts).values({
    firmId: input.firmId,
    productSlug: input.productSlug ?? null,
    productName: input.productName,
    note: input.note ?? null,
    price: input.price ?? null,
    displayOrder: input.displayOrder ?? 100,
  });
  return Number(result[0]?.insertId ?? 0);
}

export async function createFirmProductsBulk(firmId: number, products: Array<{
  productSlug?: string | null;
  productName: string;
  note?: string | null;
  price?: string | null;
  displayOrder?: number;
}>) {
  if (products.length === 0) return 0;
  return db.transaction(async (tx) => {
    const result = await tx.insert(hfFirmProducts).values(products.map((product, index) => ({
      firmId,
      productSlug: product.productSlug ?? null,
      productName: product.productName,
      note: product.note ?? null,
      price: product.price ?? null,
      displayOrder: product.displayOrder ?? 100 + index,
    })));
    return Number(result[0]?.affectedRows ?? products.length);
  });
}

export async function updateFirmProduct(id: number, input: {
  firmId?: number;
  productSlug?: string | null;
  productName?: string;
  note?: string | null;
  price?: string | null;
  displayOrder?: number;
}) {
  const result = await db.update(hfFirmProducts).set({
    ...(input.productSlug !== undefined ? { productSlug: input.productSlug } : {}),
    ...(input.productName !== undefined ? { productName: input.productName } : {}),
    ...(input.note !== undefined ? { note: input.note } : {}),
    ...(input.price !== undefined ? { price: input.price } : {}),
    ...(input.displayOrder !== undefined ? { displayOrder: input.displayOrder } : {}),
  }).where(input.firmId ? and(eq(hfFirmProducts.id, id), eq(hfFirmProducts.firmId, input.firmId)) : eq(hfFirmProducts.id, id));
  return Number(result[0]?.affectedRows ?? 0);
}

export async function deleteFirmProduct(id: number, firmId?: number) {
  const result = await db.delete(hfFirmProducts).where(firmId ? and(eq(hfFirmProducts.id, id), eq(hfFirmProducts.firmId, firmId)) : eq(hfFirmProducts.id, id));
  return Number(result[0]?.affectedRows ?? 0);
}

export type FirmPriceInput = {
  firmId: number;
  productSlug?: string | null;
  productName: string;
  unit: "kg" | "kasa" | "adet" | "demet" | "bağ" | "çuval" | "kg/kasa";
  minPrice?: string | null;
  maxPrice?: string | null;
  avgPrice: string;
  recordedDate: string;
  createdBy?: string | null;
};

export async function upsertFirmPrice(input: FirmPriceInput) {
  const isSuspicious = await detectSuspiciousFirmPrice(input);
  const result = await db.insert(hfFirmPrices).values({
    firmId: input.firmId,
    productSlug: input.productSlug ?? null,
    productName: input.productName,
    unit: input.unit,
    minPrice: input.minPrice ?? null,
    maxPrice: input.maxPrice ?? null,
    avgPrice: input.avgPrice,
    recordedDate: input.recordedDate,
    isSuspicious,
    createdBy: input.createdBy ?? null,
  }).onDuplicateKeyUpdate({
    set: {
      productSlug: input.productSlug ?? null,
      unit: input.unit,
      minPrice: input.minPrice ?? null,
      maxPrice: input.maxPrice ?? null,
      avgPrice: input.avgPrice,
      isSuspicious,
      createdBy: input.createdBy ?? null,
      updatedAt: sql`CURRENT_TIMESTAMP(3)`,
    },
  });
  return Number(result[0]?.insertId ?? 0);
}

export async function bulkUpsertFirmPrices(firmId: number, prices: Omit<FirmPriceInput, "firmId">[]) {
  if (prices.length === 0) return 0;
  const enriched = await Promise.all(prices.map(async (price) => ({
    ...price,
    isSuspicious: await detectSuspiciousFirmPrice(price),
  })));
  return db.transaction(async (tx) => {
    let affected = 0;
    for (const price of enriched) {
      const result = await tx.insert(hfFirmPrices).values({
        ...price,
        firmId,
        productSlug: price.productSlug ?? null,
        minPrice: price.minPrice ?? null,
        maxPrice: price.maxPrice ?? null,
        createdBy: price.createdBy ?? null,
      }).onDuplicateKeyUpdate({
        set: {
          productSlug: price.productSlug ?? null,
          unit: price.unit,
          minPrice: price.minPrice ?? null,
          maxPrice: price.maxPrice ?? null,
          avgPrice: price.avgPrice,
          isSuspicious: price.isSuspicious,
          createdBy: price.createdBy ?? null,
          updatedAt: sql`CURRENT_TIMESTAMP(3)`,
        },
      });
      affected += Number(result[0]?.affectedRows ?? 1);
    }
    return affected;
  });
}

export async function updateFirmPrice(id: number, firmId: number, input: Partial<Omit<FirmPriceInput, "firmId">>) {
  const [current] = await db
    .select()
    .from(hfFirmPrices)
    .where(and(eq(hfFirmPrices.id, id), eq(hfFirmPrices.firmId, firmId)))
    .limit(1);
  if (!current) return 0;
  const next = {
    firmId,
    productSlug: input.productSlug !== undefined ? input.productSlug : current.productSlug,
    productName: input.productName ?? current.productName,
    unit: input.unit ?? current.unit,
    minPrice: input.minPrice !== undefined ? input.minPrice : current.minPrice,
    maxPrice: input.maxPrice !== undefined ? input.maxPrice : current.maxPrice,
    avgPrice: input.avgPrice ?? current.avgPrice,
    recordedDate: input.recordedDate ?? current.recordedDate,
    createdBy: input.createdBy !== undefined ? input.createdBy : current.createdBy,
  } as FirmPriceInput;
  const isSuspicious = await detectSuspiciousFirmPrice(next);
  const result = await db.update(hfFirmPrices).set({
    ...(input.productSlug !== undefined ? { productSlug: input.productSlug } : {}),
    ...(input.productName !== undefined ? { productName: input.productName } : {}),
    ...(input.unit !== undefined ? { unit: input.unit } : {}),
    ...(input.minPrice !== undefined ? { minPrice: input.minPrice } : {}),
    ...(input.maxPrice !== undefined ? { maxPrice: input.maxPrice } : {}),
    ...(input.avgPrice !== undefined ? { avgPrice: input.avgPrice } : {}),
    ...(input.recordedDate !== undefined ? { recordedDate: input.recordedDate } : {}),
    isSuspicious,
    updatedAt: sql`CURRENT_TIMESTAMP(3)`,
  }).where(and(eq(hfFirmPrices.id, id), eq(hfFirmPrices.firmId, firmId)));
  return Number(result[0]?.affectedRows ?? 0);
}

export async function deleteFirmPrice(id: number, firmId: number) {
  const result = await db.delete(hfFirmPrices).where(and(eq(hfFirmPrices.id, id), eq(hfFirmPrices.firmId, firmId)));
  return Number(result[0]?.affectedRows ?? 0);
}

export async function getFirmPricesByDate(firmId: number, recordedDate = todayDateString()) {
  return db.select().from(hfFirmPrices)
    .where(and(eq(hfFirmPrices.firmId, firmId), eq(hfFirmPrices.recordedDate, recordedDate)))
    .orderBy(asc(hfFirmPrices.productName));
}

export async function getLatestFirmPrices(firmId: number) {
  const [latest] = await db
    .select({ recordedDate: hfFirmPrices.recordedDate })
    .from(hfFirmPrices)
    .where(eq(hfFirmPrices.firmId, firmId))
    .orderBy(desc(hfFirmPrices.recordedDate))
    .limit(1);
  if (!latest?.recordedDate) return { date: null, items: [] };
  const date = String(latest.recordedDate);
  return { date, items: await getFirmPricesByDate(firmId, date) };
}

async function detectSuspiciousFirmPrice(input: Pick<FirmPriceInput, "productSlug" | "avgPrice" | "recordedDate">): Promise<number> {
  if (!input.productSlug) return 0;
  const avg = Number(input.avgPrice);
  if (!Number.isFinite(avg) || avg <= 0) return 0;
  const thresholdPct = Number(process.env.FIRM_PRICE_DEVIATION_PCT ?? "60");
  const threshold = Number.isFinite(thresholdPct) && thresholdPct > 0 ? thresholdPct / 100 : 0.6;
  const result = await db.execute(sql`
    SELECT AVG(ph.avg_price) AS referenceAvg
    FROM hf_price_history ph
    INNER JOIN hf_products p ON p.id = ph.product_id
    WHERE p.slug = ${input.productSlug}
      AND ph.recorded_date BETWEEN DATE_SUB(${input.recordedDate}, INTERVAL 7 DAY) AND ${input.recordedDate}
  `);
  const rows = (Array.isArray(result) ? result[0] : result) as unknown as Array<{ referenceAvg: string | number | null }>;
  const reference = Number(rows[0]?.referenceAvg ?? 0);
  if (!Number.isFinite(reference) || reference <= 0) return 0;
  return avg < reference * (1 - threshold) || avg > reference * (1 + threshold) ? 1 : 0;
}

export async function createFirmClaim(input: { firmId: number; userId: string; evidence?: string | null }) {
  const firm = await getFirmById(input.firmId);
  if (!firm) return null;
  await db.update(hfFirms).set({ claimStatus: "pending" }).where(eq(hfFirms.id, input.firmId));
  const result = await db.insert(hfFirmClaims).values({
    firmId: input.firmId,
    userId: input.userId,
    evidence: input.evidence ?? null,
    status: "pending",
  });
  return Number(result[0]?.insertId ?? 0);
}

export async function listFirmClaims(status?: "pending" | "approved" | "rejected" | "all") {
  return db
    .select({
      id: hfFirmClaims.id,
      firmId: hfFirmClaims.firmId,
      userId: hfFirmClaims.userId,
      evidence: hfFirmClaims.evidence,
      status: hfFirmClaims.status,
      reviewedBy: hfFirmClaims.reviewedBy,
      reviewedAt: hfFirmClaims.reviewedAt,
      createdAt: hfFirmClaims.createdAt,
      firmName: hfFirms.name,
      firmSlug: hfFirms.slug,
    })
    .from(hfFirmClaims)
    .leftJoin(hfFirms, eq(hfFirms.id, hfFirmClaims.firmId))
    .where(status && status !== "all" ? eq(hfFirmClaims.status, status) : undefined)
    .orderBy(desc(hfFirmClaims.createdAt))
    .limit(500);
}

export async function moderateFirmClaim(id: number, status: "approved" | "rejected", reviewedBy?: string | null) {
  const [claim] = await db.select().from(hfFirmClaims).where(eq(hfFirmClaims.id, id)).limit(1);
  if (!claim) return null;
  await db.update(hfFirmClaims).set({ status, reviewedBy: reviewedBy ?? null, reviewedAt: new Date() }).where(eq(hfFirmClaims.id, id));
  if (status === "approved") {
    await db.update(hfFirms).set({
      ownerUserId: claim.userId,
      claimStatus: "verified",
      status: "approved",
    }).where(eq(hfFirms.id, claim.firmId));
  } else {
    await db.update(hfFirms).set({ claimStatus: "unclaimed" }).where(eq(hfFirms.id, claim.firmId));
  }
  return { ...claim, status };
}

export async function markStaleFirms(cutoff: Date): Promise<number> {
  const result = await db
    .update(hfFirms)
    .set({ isActive: 0 })
    .where(sql`${hfFirms.lastSeenAt} < ${cutoff}`);
  return Number(result[0]?.affectedRows ?? 0);
}

export async function listStaleFirms(days = 45) {
  return db
    .select({
      id: hfFirms.id,
      slug: hfFirms.slug,
      name: hfFirms.name,
      citySlug: hfFirms.citySlug,
      districtSlug: hfFirms.districtSlug,
      lastSeenAt: hfFirms.lastSeenAt,
      isActive: hfFirms.isActive,
    })
    .from(hfFirms)
    .where(sql`${hfFirms.lastSeenAt} < DATE_SUB(CURRENT_TIMESTAMP(3), INTERVAL ${days} DAY)`)
    .orderBy(asc(hfFirms.lastSeenAt))
    .limit(500);
}

export async function listFirmDeals(firmId: number) {
  return db
    .select()
    .from(hfFirmDeals)
    .where(eq(hfFirmDeals.firmId, firmId))
    .orderBy(desc(hfFirmDeals.updatedAt));
}

export async function createFirmDeal(input: {
  firmId: number;
  status?: "lead" | "contacted" | "negotiating" | "won" | "lost";
  dealType?: "reklam" | "sponsorluk" | "premium" | "diger";
  value?: string | null;
  currency?: string;
  owner?: string | null;
  notes?: string | null;
  contactedAt?: Date | null;
  nextActionAt?: Date | null;
}) {
  const result = await db.insert(hfFirmDeals).values({
    firmId: input.firmId,
    status: input.status ?? "lead",
    dealType: input.dealType ?? "reklam",
    value: input.value ?? null,
    currency: input.currency ?? "TRY",
    owner: input.owner ?? null,
    notes: input.notes ?? null,
    contactedAt: input.contactedAt ?? null,
    nextActionAt: input.nextActionAt ?? null,
  });
  return result[0]?.insertId ?? null;
}

export async function updateFirmDeal(id: number, input: {
  status?: "lead" | "contacted" | "negotiating" | "won" | "lost";
  dealType?: "reklam" | "sponsorluk" | "premium" | "diger";
  value?: string | null;
  currency?: string;
  owner?: string | null;
  notes?: string | null;
  contactedAt?: Date | null;
  nextActionAt?: Date | null;
}) {
  const result = await db
    .update(hfFirmDeals)
    .set({
      ...(input.status !== undefined ? { status: input.status } : {}),
      ...(input.dealType !== undefined ? { dealType: input.dealType } : {}),
      ...(input.value !== undefined ? { value: input.value } : {}),
      ...(input.currency !== undefined ? { currency: input.currency } : {}),
      ...(input.owner !== undefined ? { owner: input.owner } : {}),
      ...(input.notes !== undefined ? { notes: input.notes } : {}),
      ...(input.contactedAt !== undefined ? { contactedAt: input.contactedAt } : {}),
      ...(input.nextActionAt !== undefined ? { nextActionAt: input.nextActionAt } : {}),
    })
    .where(eq(hfFirmDeals.id, id));
  return Number(result[0]?.affectedRows ?? 0);
}

export async function deleteFirmDeal(id: number) {
  const result = await db.delete(hfFirmDeals).where(eq(hfFirmDeals.id, id));
  return Number(result[0]?.affectedRows ?? 0);
}

export async function listFirmSponsorships(firmId?: number) {
  return db
    .select()
    .from(hfFirmSponsorships)
    .where(firmId ? eq(hfFirmSponsorships.firmId, firmId) : undefined)
    .orderBy(desc(hfFirmSponsorships.isActive), desc(hfFirmSponsorships.endsAt));
}

export async function createFirmSponsorship(input: {
  firmId: number;
  tier?: string;
  placement?: "il" | "kategori" | "global";
  placementSlug?: string | null;
  startsAt: Date;
  endsAt: Date;
  isActive?: boolean;
}) {
  const result = await db.insert(hfFirmSponsorships).values({
    firmId: input.firmId,
    tier: input.tier ?? "standard",
    placement: input.placement ?? "il",
    placementSlug: input.placementSlug ?? null,
    startsAt: input.startsAt,
    endsAt: input.endsAt,
    isActive: input.isActive === false ? 0 : 1,
  });
  return result[0]?.insertId ?? null;
}

export async function updateFirmSponsorship(id: number, input: {
  tier?: string;
  placement?: "il" | "kategori" | "global";
  placementSlug?: string | null;
  startsAt?: Date;
  endsAt?: Date;
  isActive?: boolean;
}) {
  const result = await db
    .update(hfFirmSponsorships)
    .set({
      ...(input.tier !== undefined ? { tier: input.tier } : {}),
      ...(input.placement !== undefined ? { placement: input.placement } : {}),
      ...(input.placementSlug !== undefined ? { placementSlug: input.placementSlug } : {}),
      ...(input.startsAt !== undefined ? { startsAt: input.startsAt } : {}),
      ...(input.endsAt !== undefined ? { endsAt: input.endsAt } : {}),
      ...(input.isActive !== undefined ? { isActive: input.isActive ? 1 : 0 } : {}),
    })
    .where(eq(hfFirmSponsorships.id, id));
  return Number(result[0]?.affectedRows ?? 0);
}

export async function deleteFirmSponsorship(id: number) {
  const result = await db.delete(hfFirmSponsorships).where(eq(hfFirmSponsorships.id, id));
  return Number(result[0]?.affectedRows ?? 0);
}

export async function firmDashboardSummary() {
  const [total, active, stale, deals, sponsorships, dealValue] = await Promise.all([
    db.select({ count: sql<number>`count(*)` }).from(hfFirms),
    db.select({ count: sql<number>`count(*)` }).from(hfFirms).where(eq(hfFirms.isActive, 1)),
    db.select({ count: sql<number>`count(*)` }).from(hfFirms).where(sql`${hfFirms.lastSeenAt} < DATE_SUB(CURRENT_TIMESTAMP(3), INTERVAL 45 DAY)`),
    db.select({ status: hfFirmDeals.status, count: sql<number>`count(*)` }).from(hfFirmDeals).groupBy(hfFirmDeals.status),
    db.select({ count: sql<number>`count(*)` }).from(hfFirmSponsorships).where(and(
      eq(hfFirmSponsorships.isActive, 1),
      sql`${hfFirmSponsorships.startsAt} <= CURRENT_TIMESTAMP(3)`,
      sql`${hfFirmSponsorships.endsAt} >= CURRENT_TIMESTAMP(3)`,
    )),
    db
      .select({
        won: sql<string>`COALESCE(SUM(CASE WHEN ${hfFirmDeals.status} = 'won' THEN ${hfFirmDeals.value} ELSE 0 END), 0)`,
        pipeline: sql<string>`COALESCE(SUM(CASE WHEN ${hfFirmDeals.status} IN ('lead','contacted','negotiating') THEN ${hfFirmDeals.value} ELSE 0 END), 0)`,
      })
      .from(hfFirmDeals),
  ]);

  return {
    total: Number(total[0]?.count ?? 0),
    active: Number(active[0]?.count ?? 0),
    stale: Number(stale[0]?.count ?? 0),
    activeSponsorships: Number(sponsorships[0]?.count ?? 0),
    wonValue: Number(dealValue[0]?.won ?? 0),
    pipelineValue: Number(dealValue[0]?.pipeline ?? 0),
    dealsByStatus: Object.fromEntries(deals.map((row) => [row.status, Number(row.count ?? 0)])),
  };
}

function buildFirmWhere(filters: FirmListFilters) {
  const clauses = [];
  if (filters.activeOnly !== false) clauses.push(eq(hfFirms.isActive, 1));
  if (filters.status && filters.status !== "all") clauses.push(eq(hfFirms.status, filters.status));
  if (!filters.status && filters.activeOnly !== false) clauses.push(eq(hfFirms.status, "approved"));
  if (filters.city) clauses.push(eq(hfFirms.citySlug, filters.city));
  if (filters.district) clauses.push(eq(hfFirms.districtSlug, filters.district));
  if (filters.type) clauses.push(eq(hfFirms.firmType, filters.type));
  if (filters.q) {
    const q = `%${filters.q.replace(/[%_\\]/g, "")}%`;
    clauses.push(or(like(hfFirms.name, q), like(hfFirms.address, q), like(hfFirms.phone, q)));
  }
  return clauses.length ? and(...clauses) : undefined;
}

async function ensureUniqueFirmSlug(name: string) {
  const base = slugifyFirm(name) || `firma-${Date.now()}`;
  let candidate = base;
  for (let index = 2; index < 100; index += 1) {
    const [existing] = await db.select({ id: hfFirms.id }).from(hfFirms).where(eq(hfFirms.slug, candidate)).limit(1);
    if (!existing) return candidate;
    candidate = `${base}-${index}`;
  }
  return `${base}-${Date.now()}`;
}

function slugifyFirm(value: string): string {
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

function todayDateString(): string {
  return new Date().toISOString().slice(0, 10);
}

function extractOcrContacts(raw: unknown): unknown[] {
  if (!raw || typeof raw !== "object") return [];
  const contacts = (raw as { ocr_contacts?: unknown }).ocr_contacts;
  return Array.isArray(contacts) ? contacts : [];
}
