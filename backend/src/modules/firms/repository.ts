import { and, asc, desc, eq, like, or, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { hfFirmDeals, hfFirms, hfFirmSponsorships } from "@/db/schema";
import type { FetchedFirm, FirmListFilters } from "./types";

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
        contactPerson: values.contactPerson,
        phone: values.phone,
        address: values.address,
        citySlug: values.citySlug,
        districtSlug: values.districtSlug,
        photoUrl: values.photoUrl,
        sourceUrl: values.sourceUrl,
        firmType: values.firmType,
        categories: values.categories,
        isActive: 1,
        lastSeenAt: sql`CURRENT_TIMESTAMP(3)`,
        raw: values.raw,
      },
    });

  return existing[0] ? "updated" : "inserted";
}

export async function listFirms(filters: FirmListFilters = {}) {
  const where = buildFirmWhere(filters);
  return db
    .select({
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
      isActive: hfFirms.isActive,
      lastSeenAt: hfFirms.lastSeenAt,
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

export async function getFirmBySlug(slug: string) {
  const rows = await db
    .select()
    .from(hfFirms)
    .where(and(eq(hfFirms.slug, slug), eq(hfFirms.isActive, 1)))
    .limit(1);
  return rows[0] ?? null;
}

export async function getFirmById(id: number) {
  const rows = await db
    .select()
    .from(hfFirms)
    .where(eq(hfFirms.id, id))
    .limit(1);
  return rows[0] ?? null;
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
  if (filters.city) clauses.push(eq(hfFirms.citySlug, filters.city));
  if (filters.district) clauses.push(eq(hfFirms.districtSlug, filters.district));
  if (filters.type) clauses.push(eq(hfFirms.firmType, filters.type));
  if (filters.q) {
    const q = `%${filters.q.replace(/[%_\\]/g, "")}%`;
    clauses.push(or(like(hfFirms.name, q), like(hfFirms.address, q), like(hfFirms.phone, q)));
  }
  return clauses.length ? and(...clauses) : undefined;
}
