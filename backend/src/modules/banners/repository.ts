import { and, asc, eq, like, or, sql } from "drizzle-orm";
import { db, pool } from "@/db/client";
import { hfAdAuditLogs, hfAdPackages, hfAdPackageSlots, hfAdPayments, hfAdPriceOverrides, hfAdSelfServiceRequests, hfAdSlots, hfAdWaitlist, hfBanners, hfBannerConversions, hfBannerDailyMetrics, hfBannerMetricUniques, hfBannerTargets, hfBannerVisitorFrequency, hfFirmDeals, hfFirmMembers, hfFirmSponsorships, hfFirms, hfMarkets, hfProducts } from "@/db/schema";
import { hfListings } from "@/modules/listings/schema";
import { CITY_DISTRICT_SLUGS, isValidCitySlug } from "@/data/turkey-city-slugs";
import { sendEmailAlert } from "@/modules/alerts/email";
import { createUserNotification } from "@agro/shared-backend/modules/notifications/service";
import { repoGetUserById } from "@agro/shared-backend/modules/auth/repository";

export type BannerRow = typeof hfBanners.$inferSelect;
export type BannerDevice = "all" | "desktop" | "mobile";
export type BannerLifecycleStatus = "draft" | "proposal" | "reserved" | "payment_pending" | "scheduled" | "live" | "completed" | "cancelled" | "problem" | "archived";
export type BannerScopeType = "global" | "page_type" | "city" | "district" | "product" | "category" | "market" | "firm" | "listing";
export type BannerTarget = { scopeType: BannerScopeType; scopeValue?: string | null };
export type BannerContext = Partial<Record<Exclude<BannerScopeType, "global">, string>>;

export async function recordAdAudit(input: {
  entityType: "banner" | "slot" | "package" | "payment" | "request" | "pricing";
  entityId: string | number;
  action: string;
  actorUserId?: string | null;
  beforeData?: Record<string, unknown> | null;
  afterData?: Record<string, unknown> | null;
  reason?: string | null;
  isFinancial?: boolean;
}) {
  await db.insert(hfAdAuditLogs).values({
    ...input,
    entityId: String(input.entityId),
    actorUserId: input.actorUserId ?? null,
    beforeData: input.beforeData ?? null,
    afterData: input.afterData ?? null,
    reason: input.reason ?? null,
    isFinancial: input.isFinancial ? 1 : 0,
  });
}

export async function listAdAudit(entityType: string, entityId: string) {
  return db.select().from(hfAdAuditLogs)
    .where(entityType === "banner"
      ? and(sql`${hfAdAuditLogs.entityType} IN ('banner','payment','pricing')`, eq(hfAdAuditLogs.entityId, entityId))
      : and(
        eq(hfAdAuditLogs.entityType, entityType as typeof hfAdAuditLogs.$inferSelect.entityType),
        eq(hfAdAuditLogs.entityId, entityId),
      ))
    .orderBy(sql`${hfAdAuditLogs.createdAt} DESC`)
    .limit(200);
}

export type BannerInput = {
  position: string;
  title: string;
  advertiser?: string | null;
  notes?: string | null;
  type?: "image" | "code";
  sourceType?: "custom" | "listing" | "firm" | "code";
  lifecycleStatus?: BannerLifecycleStatus;
  paymentStatus?: "unpaid" | "partial" | "paid" | "waived" | "refunded" | "cancelled";
  paymentOverride?: boolean;
  paymentOverrideReason?: string | null;
  totalAmount?: string;
  paymentDueAt?: string | Date | null;
  paymentGraceHours?: number;
  invoiceNumber?: string | null;
  invoiceUrl?: string | null;
  contractFileUrl?: string | null;
  creativeFileUrl?: string | null;
  creativeTemplate?: string;
  creativeConfig?: {
    backgroundColor?: string; textColor?: string; accentColor?: string; animation?: boolean;
    logoUrl?: string; backgroundImageUrl?: string; description?: string;
    focalX?: number; focalY?: number; imageFit?: "cover" | "contain";
    imageWidth?: number; imageHeight?: number; imageBytes?: number;
  } | null;
  qualityOverrideReason?: string | null;
  listingId?: number | null;
  firmId?: number | null;
  sponsorshipId?: number | null;
  dealId?: number | null;
  imageUrl?: string | null;
  alt?: string | null;
  linkUrl?: string | null;
  linkTarget?: string;
  rel?: string;
  code?: string | null;
  caption?: string | null;
  ctaLabel?: string | null;
  device?: BannerDevice;
  desktopRow?: number;
  desktopColumns?: number;
  weight?: number;
  impressionLimit?: number | null;
  clickLimit?: number | null;
  dailyImpressionLimit?: number | null;
  visitorDailyImpressionLimit?: number;
  visitorCampaignImpressionLimit?: number;
  experimentKey?: string | null;
  creativeVariant?: string | null;
  autoOptimize?: boolean;
  minimumOptimizationImpressions?: number;
  reportEmail?: string | null;
  weeklyReportEnabled?: boolean;
  displayOrder?: number;
  isActive?: boolean;
  startAt?: string | Date | null;
  endAt?: string | Date | null;
  reservationExpiresAt?: string | Date | null;
  salesOwner?: string | null;
  cancellationReason?: string | null;
  targets?: BannerTarget[];
};

export type BannerListFilters = {
  position?: string;
  isActive?: boolean;
  q?: string;
  limit?: number;
  offset?: number;
  firmId?: number;
};

export async function firmAdAccess(userId: string) {
  const owned = await db.select({ firm: hfFirms }).from(hfFirms).where(eq(hfFirms.ownerUserId, userId));
  const memberships = await db.select({
    firm: hfFirms,
    role: hfFirmMembers.role,
    canViewFinancials: hfFirmMembers.canViewFinancials,
  }).from(hfFirmMembers)
    .innerJoin(hfFirms, eq(hfFirms.id, hfFirmMembers.firmId))
    .where(and(eq(hfFirmMembers.userId, userId), eq(hfFirmMembers.isActive, 1)));
  const byId = new Map<number, { firm: typeof hfFirms.$inferSelect; role: string; canViewFinancials: boolean }>();
  for (const item of owned) byId.set(item.firm.id, { firm: item.firm, role: "owner", canViewFinancials: true });
  for (const item of memberships) if (!byId.has(item.firm.id)) {
    byId.set(item.firm.id, { firm: item.firm, role: item.role, canViewFinancials: Boolean(item.canViewFinancials) });
  }
  return [...byId.values()];
}

export async function listSelfServiceCampaigns(userId: string) {
  const access = await firmAdAccess(userId);
  const firmIds = access.map((item) => item.firm.id);
  if (!firmIds.length) return { firms: [], campaigns: [] };
  const campaigns = await db.select().from(hfBanners)
    .where(sql`${hfBanners.firmId} IN (${sql.join(firmIds.map((id) => sql`${id}`), sql`,`)})`)
    .orderBy(sql`${hfBanners.createdAt} DESC`);
  const financeByFirm = new Map(access.map((item) => [item.firm.id, item.canViewFinancials]));
  return {
    firms: access.map((item) => ({ id: item.firm.id, name: item.firm.name, slug: item.firm.slug, role: item.role, canViewFinancials: item.canViewFinancials })),
    campaigns: campaigns.map((banner) => ({
      id: banner.id, firmId: banner.firmId, title: banner.title, position: banner.position,
      lifecycleStatus: banner.lifecycleStatus, imageUrl: banner.imageUrl, caption: banner.caption,
      ctaLabel: banner.ctaLabel, linkUrl: banner.linkUrl, device: banner.device,
      startAt: banner.startAt, endAt: banner.endAt, impressions: banner.impressions, clicks: banner.clicks,
      performanceStatus: banner.performanceStatus,
      ...(banner.firmId && financeByFirm.get(banner.firmId) ? {
        paymentStatus: banner.paymentStatus, totalAmount: banner.totalAmount,
        invoiceNumber: banner.invoiceNumber, invoiceUrl: banner.invoiceUrl,
        contractFileUrl: banner.contractFileUrl,
      } : {}),
    })),
  };
}

export async function listSelfServiceRequests(userId: string) {
  const access = await firmAdAccess(userId);
  const firmIds = access.map((item) => item.firm.id);
  if (!firmIds.length) return [];
  return db.select().from(hfAdSelfServiceRequests)
    .where(sql`${hfAdSelfServiceRequests.firmId} IN (${sql.join(firmIds.map((id) => sql`${id}`), sql`,`)})`)
    .orderBy(sql`${hfAdSelfServiceRequests.createdAt} DESC`);
}

export async function createSelfServiceRequest(userId: string, input: {
  firmId: number;
  bannerId?: number | null;
  requestType: "creative_change" | "extension" | "new_slot" | "support";
  payload: Record<string, unknown>;
  requesterNote?: string | null;
}) {
  const access = (await firmAdAccess(userId)).find((item) => item.firm.id === input.firmId);
  if (!canManageFirmCampaign(access ? { firmId: access.firm.id, role: access.role } : null, input.firmId)) return null;
  if (input.bannerId) {
    const banner = await getBannerById(input.bannerId);
    if (!banner || !canManageFirmCampaign({ firmId: input.firmId, role: access!.role }, input.firmId, banner.firmId)) return null;
  }
  const result = await db.insert(hfAdSelfServiceRequests).values({
    ...input,
    bannerId: input.bannerId ?? null,
    requestedBy: userId,
    requesterNote: input.requesterNote ?? null,
  });
  return Number(result[0].insertId);
}

export function canManageFirmCampaign(
  access: { firmId: number; role: string } | null,
  requestedFirmId: number,
  campaignFirmId?: number | null,
): boolean {
  if (!access || access.role === "viewer" || access.firmId !== requestedFirmId) return false;
  return campaignFirmId === undefined || campaignFirmId === null || campaignFirmId === requestedFirmId;
}

export async function listAdminSelfServiceRequests(status?: string) {
  const condition = status ? eq(hfAdSelfServiceRequests.status, status as typeof hfAdSelfServiceRequests.$inferSelect.status) : undefined;
  const rows = await db.select({
    request: hfAdSelfServiceRequests,
    firmName: hfFirms.name,
    bannerTitle: hfBanners.title,
  }).from(hfAdSelfServiceRequests)
    .innerJoin(hfFirms, eq(hfFirms.id, hfAdSelfServiceRequests.firmId))
    .leftJoin(hfBanners, eq(hfBanners.id, hfAdSelfServiceRequests.bannerId))
    .where(condition)
    .orderBy(sql`${hfAdSelfServiceRequests.createdAt} DESC`);
  return rows.map((row) => ({ ...row.request, firmName: row.firmName, bannerTitle: row.bannerTitle }));
}

export async function reviewSelfServiceRequest(id: number, input: {
  status: "approved" | "rejected" | "revision_requested";
  reviewNote: string;
  reviewedBy: string;
}) {
  const [request] = await db.select().from(hfAdSelfServiceRequests).where(eq(hfAdSelfServiceRequests.id, id)).limit(1);
  if (!request || request.status !== "pending") return null;
  if (input.status === "approved") {
    if (request.requestType === "creative_change" && request.bannerId) {
      const imageUrl = typeof request.payload.requestedCreativeUrl === "string" ? request.payload.requestedCreativeUrl.trim() : "";
      if (imageUrl) await db.update(hfBanners).set({ imageUrl, qualityCheckedAt: null }).where(and(eq(hfBanners.id, request.bannerId), eq(hfBanners.firmId, request.firmId)));
    }
    if (request.requestType === "extension" && request.bannerId) {
      const endAt = typeof request.payload.requestedEndAt === "string" ? toDate(request.payload.requestedEndAt) : null;
      if (endAt) await db.update(hfBanners).set({ endAt }).where(and(eq(hfBanners.id, request.bannerId), eq(hfBanners.firmId, request.firmId)));
      await db.insert(hfFirmDeals).values({
        firmId: request.firmId, status: "lead", dealType: "reklam",
        notes: `Self-servis kampanya uzatma talebi #${request.id}${request.requesterNote ? `: ${request.requesterNote}` : ""}`,
        nextActionAt: new Date(),
      });
    }
    if (request.requestType === "new_slot") {
      await db.insert(hfFirmDeals).values({
        firmId: request.firmId, status: "lead", dealType: "reklam",
        notes: `Self-servis yeni slot talebi #${request.id}${request.requesterNote ? `: ${request.requesterNote}` : ""}`,
        nextActionAt: new Date(),
      });
    }
  }
  await db.update(hfAdSelfServiceRequests).set({
    status: input.status,
    reviewNote: input.reviewNote,
    reviewedBy: input.reviewedBy,
    reviewedAt: new Date(),
  }).where(eq(hfAdSelfServiceRequests.id, id));
  const decisionLabel = input.status === "approved" ? "onaylandı" : input.status === "rejected" ? "reddedildi" : "revizyon istendi";
  const notificationTitle = `Reklam talebiniz ${decisionLabel}`;
  const notificationMessage = `${request.requestType} talebiniz için karar: ${decisionLabel}. Not: ${input.reviewNote}`;
  try {
    await createUserNotification({
      userId: request.requestedBy,
      title: notificationTitle,
      message: notificationMessage,
      type: "ad_request",
    });
  } catch {
    // Uygulama içi bildirim hatası admin kararını geri almamalı.
  }
  try {
    const user = await repoGetUserById(request.requestedBy);
    if (user?.email) {
      await sendEmailAlert(
        user.email,
        notificationTitle,
        `<h1>${notificationTitle}</h1><p>${notificationMessage.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;")}</p><p><a href="https://haldefiyat.com/tr/hesabim/reklamlarim">Reklam hesabını aç</a></p>`,
      );
    }
  } catch {
    // SMTP sorunu karar kaydını başarısız göstermemeli; portal bildirimi kalır.
  }
  return { ...request, status: input.status, reviewNote: input.reviewNote };
}

export type AdSlotPatch = {
  desktopCapacity?: number;
  mobileCapacity?: number;
  mobileBehavior?: "stack" | "hide" | "single" | "scroll";
  deliveryMode?: "fixed" | "rotation";
  baseDailyPrice?: string;
  trafficMultiplier?: string;
  visibilityMultiplier?: string;
  desktopMultiplier?: string;
  mobileMultiplier?: string;
  isActive?: boolean;
};

export type AdPriceQuoteInput = {
  slotKey: string;
  device: BannerDevice;
  durationDays: number;
  startAt?: string | null;
  targetTypes?: BannerScopeType[];
  manualPrice?: number;
  manualDiscountPercent?: number;
  overrideReason?: string;
  bannerId?: number;
};

export type AdPackageInput = {
  slug: string;
  name: string;
  billingPeriod: "daily" | "weekly" | "monthly" | "custom";
  durationDays: number;
  price: string;
  currency?: string;
  devices?: BannerDevice[];
  impressionLimit?: number | null;
  clickLimit?: number | null;
  includesFirmProfile?: boolean;
  discountPercent?: string;
  customPriceAllowed?: boolean;
  isActive?: boolean;
  slotKeys?: string[];
};

function toDate(value: string | Date | null | undefined): Date | null {
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
    sourceType: input.sourceType ?? (input.type === "code" ? "code" : "custom"),
    lifecycleStatus: input.lifecycleStatus ?? (input.isActive ? (toDate(input.startAt) && toDate(input.startAt)!.getTime() > Date.now() ? "scheduled" : "live") : "draft"),
    paymentStatus: input.paymentStatus ?? "unpaid",
    paymentOverride: input.paymentOverride ? 1 : 0,
    paymentOverrideReason: input.paymentOverrideReason ?? null,
    totalAmount: input.totalAmount ?? "0",
    paymentDueAt: toDate(input.paymentDueAt),
    paymentGraceHours: input.paymentGraceHours ?? 72,
    invoiceNumber: input.invoiceNumber ?? null,
    invoiceUrl: input.invoiceUrl ?? null,
    contractFileUrl: input.contractFileUrl ?? null,
    creativeFileUrl: input.creativeFileUrl ?? null,
    creativeTemplate: input.creativeTemplate ?? "image",
    creativeConfig: input.creativeConfig ?? null,
    qualityOverrideReason: input.qualityOverrideReason ?? null,
    listingId: input.listingId ?? null,
    firmId: input.firmId ?? null,
    sponsorshipId: input.sponsorshipId ?? null,
    dealId: input.dealId ?? null,
    imageUrl: input.imageUrl ?? null,
    alt: input.alt ?? null,
    linkUrl: input.linkUrl ?? null,
    linkTarget: input.linkTarget ?? "_blank",
    rel: input.rel ?? "sponsored nofollow noopener",
    code: input.code ?? null,
    caption: input.caption ?? null,
    ctaLabel: input.ctaLabel ?? null,
    device: input.device ?? "all",
    desktopRow: input.desktopRow ?? 1,
    desktopColumns: input.desktopColumns ?? 1,
    weight: input.weight ?? 1,
    impressionLimit: input.impressionLimit ?? null,
    clickLimit: input.clickLimit ?? null,
    dailyImpressionLimit: input.dailyImpressionLimit ?? null,
    visitorDailyImpressionLimit: input.visitorDailyImpressionLimit ?? 3,
    visitorCampaignImpressionLimit: input.visitorCampaignImpressionLimit ?? 20,
    experimentKey: input.experimentKey ?? null,
    creativeVariant: input.creativeVariant ?? null,
    autoOptimize: input.autoOptimize ? 1 : 0,
    minimumOptimizationImpressions: input.minimumOptimizationImpressions ?? 1000,
    reportEmail: input.reportEmail ?? null,
    weeklyReportEnabled: input.weeklyReportEnabled ? 1 : 0,
    displayOrder: input.displayOrder ?? 0,
    isActive: input.isActive ? 1 : 0,
    startAt: toDate(input.startAt),
    endAt: toDate(input.endAt),
    reservationExpiresAt: toDate(input.reservationExpiresAt),
    salesOwner: input.salesOwner ?? null,
    cancellationReason: input.cancellationReason ?? null,
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
  if (filters.firmId) where.push(eq(hfBanners.firmId, filters.firmId));
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
  if (patch.sourceType !== undefined) set.sourceType = patch.sourceType;
  if (patch.lifecycleStatus !== undefined) set.lifecycleStatus = patch.lifecycleStatus;
  if (patch.paymentStatus !== undefined) set.paymentStatus = patch.paymentStatus;
  if (patch.paymentOverride !== undefined) set.paymentOverride = patch.paymentOverride ? 1 : 0;
  if (patch.paymentOverrideReason !== undefined) set.paymentOverrideReason = patch.paymentOverrideReason || null;
  if (patch.totalAmount !== undefined) set.totalAmount = patch.totalAmount;
  if (patch.paymentDueAt !== undefined) set.paymentDueAt = toDate(patch.paymentDueAt);
  if (patch.paymentGraceHours !== undefined) set.paymentGraceHours = patch.paymentGraceHours;
  for (const key of ["invoiceNumber", "invoiceUrl", "contractFileUrl", "creativeFileUrl"] as const) {
    if (patch[key] !== undefined) set[key] = patch[key] || null;
  }
  if (patch.creativeTemplate !== undefined) set.creativeTemplate = patch.creativeTemplate;
  if (patch.creativeConfig !== undefined) set.creativeConfig = patch.creativeConfig;
  if (patch.qualityOverrideReason !== undefined) set.qualityOverrideReason = patch.qualityOverrideReason || null;
  if (patch.listingId !== undefined) set.listingId = patch.listingId;
  if (patch.firmId !== undefined) set.firmId = patch.firmId;
  if (patch.sponsorshipId !== undefined) set.sponsorshipId = patch.sponsorshipId;
  if (patch.dealId !== undefined) set.dealId = patch.dealId;
  if (patch.imageUrl !== undefined) set.imageUrl = patch.imageUrl || null;
  if (patch.alt !== undefined) set.alt = patch.alt || null;
  if (patch.linkUrl !== undefined) set.linkUrl = patch.linkUrl || null;
  if (patch.linkTarget !== undefined) set.linkTarget = patch.linkTarget;
  if (patch.rel !== undefined) set.rel = patch.rel;
  if (patch.code !== undefined) set.code = patch.code || null;
  if (patch.caption !== undefined) set.caption = patch.caption || null;
  if (patch.ctaLabel !== undefined) set.ctaLabel = patch.ctaLabel || null;
  if (patch.device !== undefined) set.device = patch.device;
  if (patch.desktopRow !== undefined) set.desktopRow = patch.desktopRow;
  if (patch.desktopColumns !== undefined) set.desktopColumns = patch.desktopColumns;
  if (patch.weight !== undefined) set.weight = patch.weight;
  if (patch.impressionLimit !== undefined) set.impressionLimit = patch.impressionLimit;
  if (patch.clickLimit !== undefined) set.clickLimit = patch.clickLimit;
  if (patch.dailyImpressionLimit !== undefined) set.dailyImpressionLimit = patch.dailyImpressionLimit;
  if (patch.visitorDailyImpressionLimit !== undefined) set.visitorDailyImpressionLimit = patch.visitorDailyImpressionLimit;
  if (patch.visitorCampaignImpressionLimit !== undefined) set.visitorCampaignImpressionLimit = patch.visitorCampaignImpressionLimit;
  if (patch.experimentKey !== undefined) set.experimentKey = patch.experimentKey || null;
  if (patch.creativeVariant !== undefined) set.creativeVariant = patch.creativeVariant || null;
  if (patch.autoOptimize !== undefined) set.autoOptimize = patch.autoOptimize ? 1 : 0;
  if (patch.minimumOptimizationImpressions !== undefined) set.minimumOptimizationImpressions = patch.minimumOptimizationImpressions;
  if (patch.reportEmail !== undefined) set.reportEmail = patch.reportEmail || null;
  if (patch.weeklyReportEnabled !== undefined) set.weeklyReportEnabled = patch.weeklyReportEnabled ? 1 : 0;
  if (patch.displayOrder !== undefined) set.displayOrder = patch.displayOrder;
  if (patch.isActive !== undefined) set.isActive = patch.isActive ? 1 : 0;
  if (patch.startAt !== undefined) set.startAt = toDate(patch.startAt);
  if (patch.endAt !== undefined) set.endAt = toDate(patch.endAt);
  if (patch.reservationExpiresAt !== undefined) set.reservationExpiresAt = toDate(patch.reservationExpiresAt);
  if (patch.salesOwner !== undefined) set.salesOwner = patch.salesOwner || null;
  if (patch.cancellationReason !== undefined) set.cancellationReason = patch.cancellationReason || null;
  if (Object.keys(set).length === 0) return false;
  await db.update(hfBanners).set(set).where(eq(hfBanners.id, id));
  return true;
}

export async function deleteBanner(id: number): Promise<void> {
  await db.delete(hfBanners).where(eq(hfBanners.id, id));
}

export async function replaceBannerTargets(bannerId: number, targets: BannerTarget[]): Promise<void> {
  await db.delete(hfBannerTargets).where(eq(hfBannerTargets.bannerId, bannerId));
  if (!targets.length) return;
  await db.insert(hfBannerTargets).values(targets.map((target) => ({
    bannerId,
    scopeType: target.scopeType,
    scopeValue: target.scopeType === "global" ? null : target.scopeValue ?? null,
  })));
}

const validPageTypes = new Set(["global", "home", "prices", "analysis", "product_detail", "market_detail", "firm_detail", "listing_detail"]);

export async function validateBannerTargets(targets: BannerTarget[]): Promise<string[]> {
  const invalid: string[] = [];
  for (const target of targets) {
    const value = target.scopeValue?.trim();
    if (target.scopeType === "global") continue;
    if (!value) {
      invalid.push(`${target.scopeType}:bos`);
      continue;
    }
    if (target.scopeType === "page_type" && !validPageTypes.has(value)) invalid.push(`page_type:${value}`);
    if (target.scopeType === "city" && !isValidCitySlug(value)) invalid.push(`city:${value}`);
    if (target.scopeType === "district" && !Object.values(CITY_DISTRICT_SLUGS).some((districts) => districts.has(value))) invalid.push(`district:${value}`);
    if (target.scopeType === "product") {
      const [row] = await db.select({ id: hfProducts.id }).from(hfProducts).where(and(
        or(eq(hfProducts.slug, value), eq(hfProducts.canonicalSlug, value)),
        eq(hfProducts.isActive, 1),
      )).limit(1);
      if (!row) invalid.push(`product:${value}`);
    }
    if (target.scopeType === "category") {
      const [row] = await db.select({ id: hfProducts.id }).from(hfProducts).where(and(eq(hfProducts.categorySlug, value), eq(hfProducts.isActive, 1))).limit(1);
      if (!row) invalid.push(`category:${value}`);
    }
    if (target.scopeType === "market") {
      const [row] = await db.select({ id: hfMarkets.id }).from(hfMarkets).where(and(eq(hfMarkets.slug, value), eq(hfMarkets.isActive, 1))).limit(1);
      if (!row) invalid.push(`market:${value}`);
    }
    if (target.scopeType === "firm") {
      const id = Number(value);
      const [row] = Number.isInteger(id) ? await db.select({ id: hfFirms.id }).from(hfFirms).where(and(eq(hfFirms.id, id), eq(hfFirms.isActive, 1), eq(hfFirms.status, "approved"))).limit(1) : [];
      if (!row) invalid.push(`firm:${value}`);
    }
    if (target.scopeType === "listing") {
      const id = Number(value);
      const [row] = Number.isInteger(id) ? await db.select({ id: hfListings.id }).from(hfListings).where(and(eq(hfListings.id, id), eq(hfListings.status, "approved"))).limit(1) : [];
      if (!row) invalid.push(`listing:${value}`);
    }
  }
  return invalid;
}

export type BannerTargetOption = { value: string; label: string; reach: number; exampleUrl: string | null };

export async function searchBannerTargetOptions(type: BannerScopeType, query = ""): Promise<BannerTargetOption[]> {
  const q = query.trim().toLowerCase();
  const matches = (value: string) => !q || value.toLowerCase().includes(q);
  if (type === "global") return [{ value: "global", label: "Tüm uygun sayfalar", reach: 100000, exampleUrl: "/" }];
  if (type === "page_type") {
    return [...validPageTypes].filter(matches).map((value) => ({ value, label: value, reach: value === "global" ? 100000 : 10000, exampleUrl: value === "home" ? "/" : null }));
  }
  if (type === "city") {
    return Object.keys(CITY_DISTRICT_SLUGS).filter(matches).slice(0, 30).map((value) => ({ value, label: value, reach: 5000, exampleUrl: `/firmalar/${value}` }));
  }
  if (type === "district") {
    return [...new Set(Object.values(CITY_DISTRICT_SLUGS).flatMap((items) => [...items]))].filter(matches).slice(0, 30).map((value) => ({ value, label: value, reach: 1000, exampleUrl: null }));
  }
  if (type === "product") {
    const rows = await db.select({ value: hfProducts.slug, label: hfProducts.nameTr, reach: hfProducts.searchVolume }).from(hfProducts)
      .where(and(eq(hfProducts.isActive, 1), q ? or(like(hfProducts.slug, `%${q}%`), like(hfProducts.nameTr, `%${q}%`)) : sql`1=1`)).limit(30);
    return rows.map((row) => ({ ...row, reach: Number(row.reach ?? 0), exampleUrl: `/urun/${row.value}` }));
  }
  if (type === "category") {
    const rows = await db.select({ value: hfProducts.categorySlug, reach: sql<number>`COUNT(*)` }).from(hfProducts)
      .where(and(eq(hfProducts.isActive, 1), q ? like(hfProducts.categorySlug, `%${q}%`) : sql`1=1`)).groupBy(hfProducts.categorySlug).limit(30);
    return rows.map((row) => ({ value: row.value, label: row.value, reach: Number(row.reach) * 1000, exampleUrl: `/fiyatlar?category=${encodeURIComponent(row.value)}` }));
  }
  if (type === "market") {
    const rows = await db.select({ value: hfMarkets.slug, label: hfMarkets.name }).from(hfMarkets)
      .where(and(eq(hfMarkets.isActive, 1), q ? or(like(hfMarkets.slug, `%${q}%`), like(hfMarkets.name, `%${q}%`)) : sql`1=1`)).limit(30);
    return rows.map((row) => ({ ...row, reach: 2000, exampleUrl: `/hal/${row.value}` }));
  }
  if (type === "firm") {
    const rows = await db.select({ id: hfFirms.id, label: hfFirms.name, slug: hfFirms.slug }).from(hfFirms)
      .where(and(eq(hfFirms.isActive, 1), eq(hfFirms.status, "approved"), q ? or(like(hfFirms.name, `%${q}%`), like(hfFirms.slug, `%${q}%`)) : sql`1=1`)).limit(30);
    return rows.map((row) => ({ value: String(row.id), label: row.label, reach: 500, exampleUrl: `/firma/${row.slug}` }));
  }
  const rows = await db.select({ id: hfListings.id, label: hfListings.title, slug: hfListings.slug }).from(hfListings)
    .where(and(eq(hfListings.status, "approved"), q ? like(hfListings.title, `%${q}%`) : sql`1=1`)).limit(30);
  return rows.map((row) => ({ value: String(row.id), label: row.label, reach: 300, exampleUrl: `/ilan/${row.slug}` }));
}

export async function auditBannerTargets(): Promise<{ checked: number; problem: number }> {
  const targets = await db.select().from(hfBannerTargets);
  const grouped = new Map<number, BannerTarget[]>();
  for (const target of targets) grouped.set(target.bannerId, [...(grouped.get(target.bannerId) ?? []), target]);
  let problem = 0;
  for (const [bannerId, bannerTargets] of grouped) {
    const invalid = await validateBannerTargets(bannerTargets);
    if (!invalid.length) continue;
    const result = await db.update(hfBanners).set({
      lifecycleStatus: "problem",
      isActive: 0,
      notes: sql`LEFT(CONCAT(COALESCE(${hfBanners.notes}, ''), ${`\nHedefleme sorunu: ${invalid.join(", ")}`}), 500)`,
    }).where(and(eq(hfBanners.id, bannerId), sql`${hfBanners.lifecycleStatus} <> 'problem'`));
    problem += Number(result[0]?.affectedRows ?? 0);
  }
  return { checked: grouped.size, problem };
}

export async function listBannerTargets(bannerIds: number[]): Promise<Map<number, BannerTarget[]>> {
  const result = new Map<number, BannerTarget[]>();
  if (!bannerIds.length) return result;
  const rows = await db.select().from(hfBannerTargets).where(sql`${hfBannerTargets.bannerId} IN (${sql.join(bannerIds.map((id) => sql`${id}`), sql`,`)})`);
  for (const row of rows) {
    const current = result.get(row.bannerId) ?? [];
    current.push({ scopeType: row.scopeType, scopeValue: row.scopeValue });
    result.set(row.bannerId, current);
  }
  return result;
}

export async function pickTargetedActiveRows(position: string, context: BannerContext, excludedIds: number[] = []): Promise<BannerRow[]> {
  const rows = await pickActiveRowsForPosition(position);
  const targetsByBanner = await listBannerTargets(rows.map((row) => row.id));
  const matched = rows
    .filter((row) => !excludedIds.includes(row.id))
    .filter((row) => bannerTargetsMatchContext(targetsByBanner.get(row.id) ?? [], context))
    .sort((a, b) => {
      const aScore = bannerTargetSpecificity(targetsByBanner.get(a.id) ?? []);
      const bScore = bannerTargetSpecificity(targetsByBanner.get(b.id) ?? []);
      return bScore - aScore || a.displayOrder - b.displayOrder || a.id - b.id;
    });
  const slot = await getAdSlot(position);
  if (slot?.deliveryMode !== "rotation") return matched;

  const byRow = new Map<number, BannerRow[]>();
  for (const row of matched) byRow.set(row.desktopRow, [...(byRow.get(row.desktopRow) ?? []), row]);
  return [...byRow.entries()]
    .sort(([left], [right]) => left - right)
    .flatMap(([, candidates]) => {
      const bestSpecificity = Math.max(...candidates.map((candidate) =>
        bannerTargetSpecificity(targetsByBanner.get(candidate.id) ?? []),
      ));
      const equallyTargeted = candidates.filter((candidate) =>
        bannerTargetSpecificity(targetsByBanner.get(candidate.id) ?? []) === bestSpecificity,
      );
      const selected = pickWeightedBanner(equallyTargeted, Math.random, deliveryWeight);
      return selected ? [selected] : [];
    });
}

export async function frequencyBlockedBannerIds(
  rows: BannerRow[],
  visitorHash: string,
  pageHash: string,
): Promise<number[]> {
  if (!rows.length) return [];
  const ids = rows.map((row) => row.id);
  const stats = await db.select().from(hfBannerVisitorFrequency).where(and(
    eq(hfBannerVisitorFrequency.visitorHash, visitorHash),
    sql`${hfBannerVisitorFrequency.bannerId} IN (${sql.join(ids.map((id) => sql`${id}`), sql`,`)})`,
  ));
  const byBanner = new Map(stats.map((row) => [row.bannerId, row]));
  const today = new Date().toISOString().slice(0, 10);
  return rows.filter((row) => {
    const stat = byBanner.get(row.id);
    if (!stat) return false;
    return isVisitorFrequencyBlocked(row, stat, pageHash, today);
  }).map((row) => row.id);
}

const SAME_PAGE_COOLDOWN_MS = 30 * 60 * 1000;

export function isVisitorFrequencyBlocked(
  banner: Pick<BannerRow, "visitorDailyImpressionLimit" | "visitorCampaignImpressionLimit">,
  stat: Pick<typeof hfBannerVisitorFrequency.$inferSelect, "totalImpressions" | "dailyImpressions" | "dailyDate" | "lastPageHash" | "lastImpressionAt">,
  pageHash: string,
  today: string,
  now = Date.now(),
): boolean {
  const daily = stat.dailyDate === today ? stat.dailyImpressions : 0;
  // Aynı sayfayı kısa sürede tekrar yüklemeyi (reload/prefetch) sayma; süresiz blok değil.
  const samePageRecently = stat.lastPageHash === pageHash
    && stat.lastImpressionAt != null
    && now - stat.lastImpressionAt.getTime() < SAME_PAGE_COOLDOWN_MS;
  return stat.totalImpressions >= banner.visitorCampaignImpressionLimit
    || daily >= banner.visitorDailyImpressionLimit
    || samePageRecently;
}

export async function recordVisitorImpression(id: number, visitorHash: string, pageHash: string): Promise<void> {
  await db.insert(hfBannerVisitorFrequency).values({
    bannerId: id,
    visitorHash,
    totalImpressions: 1,
    dailyImpressions: 1,
    dailyDate: sql`CURRENT_DATE`,
    lastPageHash: pageHash,
    lastImpressionAt: sql`CURRENT_TIMESTAMP(3)`,
  }).onDuplicateKeyUpdate({ set: {
    totalImpressions: sql`${hfBannerVisitorFrequency.totalImpressions} + 1`,
    dailyImpressions: sql`CASE WHEN ${hfBannerVisitorFrequency.dailyDate} = CURRENT_DATE THEN ${hfBannerVisitorFrequency.dailyImpressions} + 1 ELSE 1 END`,
    dailyDate: sql`CURRENT_DATE`,
    lastPageHash: pageHash,
    lastImpressionAt: sql`CURRENT_TIMESTAMP(3)`,
  } });
}

export async function acceptVisitorClick(id: number, visitorHash: string, cooldownSeconds = 30): Promise<boolean> {
  const [stat] = await db.select({ lastClickAt: hfBannerVisitorFrequency.lastClickAt })
    .from(hfBannerVisitorFrequency)
    .where(and(eq(hfBannerVisitorFrequency.bannerId, id), eq(hfBannerVisitorFrequency.visitorHash, visitorHash)))
    .limit(1);
  if (!adClickCooldownAllows(stat?.lastClickAt ?? null, Date.now(), cooldownSeconds)) return false;
  await db.insert(hfBannerVisitorFrequency).values({
    bannerId: id,
    visitorHash,
    lastClickAt: sql`CURRENT_TIMESTAMP(3)`,
  }).onDuplicateKeyUpdate({ set: { lastClickAt: sql`CURRENT_TIMESTAMP(3)` } });
  return true;
}

export function adClickCooldownAllows(lastClickAt: Date | null, now = Date.now(), cooldownSeconds = 30): boolean {
  return !lastClickAt || now - lastClickAt.getTime() >= cooldownSeconds * 1000;
}

export function pickWeightedBanner<T extends { weight: number }>(
  rows: T[],
  random: () => number = Math.random,
  weightOf: (row: T) => number = (row) => row.weight,
): T | null {
  if (!rows.length) return null;
  const total = rows.reduce((sum, row) => sum + Math.max(1, weightOf(row)), 0);
  let cursor = Math.min(Math.max(random(), 0), 0.999999999999) * total;
  for (const row of rows) {
    cursor -= Math.max(1, weightOf(row));
    if (cursor < 0) return row;
  }
  return rows.at(-1) ?? null;
}

export function deliveryWeight(
  row: Pick<BannerRow, "weight" | "impressionLimit" | "impressions" | "startAt" | "endAt">,
  now = Date.now(),
): number {
  if (!row.impressionLimit || !row.startAt || !row.endAt || row.endAt.getTime() <= row.startAt.getTime()) return row.weight;
  const elapsed = Math.min(1, Math.max(0, (now - row.startAt.getTime()) / (row.endAt.getTime() - row.startAt.getTime())));
  const delivered = row.impressions / row.impressionLimit;
  if (elapsed <= 0) return row.weight;
  const pace = delivered / elapsed;
  const factor = Math.min(3, Math.max(0.5, pace > 0 ? 1 / pace : 3));
  return row.weight * factor;
}

export async function optimizeBannerPerformance(): Promise<{ checked: number; low: number; winners: number; reweighted: number }> {
  const rows = await db.select().from(hfBanners).where(sql`${hfBanners.isActive} = 1`);
  const groups = new Map<string, BannerRow[]>();
  for (const row of rows) {
    if (!row.experimentKey) continue;
    const key = `${row.position}:${row.experimentKey}`;
    groups.set(key, [...(groups.get(key) ?? []), row]);
  }
  let low = 0;
  let winners = 0;
  let reweighted = 0;
  for (const variants of groups.values()) {
    const eligible = variants.filter((row) => row.impressions >= row.minimumOptimizationImpressions);
    if (eligible.length < 2) continue;
    const winner = eligible.reduce((best, row) =>
      row.clicks / Math.max(1, row.impressions) > best.clicks / Math.max(1, best.impressions) ? row : best,
    );
    const winnerCtr = winner.clicks / Math.max(1, winner.impressions);
    for (const row of eligible) {
      const status = row.id === winner.id ? "winner" : (row.clicks / Math.max(1, row.impressions) < winnerCtr * 0.6 ? "low" : "normal");
      await db.update(hfBanners).set({
        performanceStatus: status,
        ...(row.autoOptimize ? { weight: row.id === winner.id ? 70 : 30 } : {}),
      }).where(eq(hfBanners.id, row.id));
      if (status === "winner") winners += 1;
      if (status === "low") low += 1;
      if (row.autoOptimize) reweighted += 1;
    }
  }
  for (const row of rows.filter((item) => !item.experimentKey && item.impressions >= item.minimumOptimizationImpressions)) {
    const status = row.clicks / Math.max(1, row.impressions) < 0.002 ? "low" : "normal";
    await db.update(hfBanners).set({ performanceStatus: status }).where(eq(hfBanners.id, row.id));
    if (status === "low") low += 1;
  }
  return { checked: rows.length, low, winners, reweighted };
}

export async function bannerDistributionReport() {
  const rows = await db.select().from(hfBanners).where(sql`${hfBanners.lifecycleStatus} IN ('scheduled','live','completed')`);
  const totals = new Map<string, { weight: number; impressions: number }>();
  for (const row of rows) {
    const key = `${row.position}:${row.desktopRow}`;
    const total = totals.get(key) ?? { weight: 0, impressions: 0 };
    total.weight += row.weight;
    total.impressions += row.impressions;
    totals.set(key, total);
  }
  return rows.map((row) => {
    const total = totals.get(`${row.position}:${row.desktopRow}`) ?? { weight: 1, impressions: 0 };
    const expectedShare = row.weight / Math.max(1, total.weight);
    const actualShare = row.impressions / Math.max(1, total.impressions);
    return {
      id: row.id, title: row.title, advertiser: row.advertiser, position: row.position,
      expectedShare, actualShare, variance: actualShare - expectedShare,
      performanceStatus: row.performanceStatus, experimentKey: row.experimentKey, creativeVariant: row.creativeVariant,
      impressions: row.impressions, clicks: row.clicks,
      guaranteeProgress: row.impressionLimit ? Math.min(1, row.impressions / row.impressionLimit) : null,
    };
  });
}

export function bannerTargetsMatchContext(targets: BannerTarget[], context: BannerContext): boolean {
  if (!targets.length || targets.some((target) => target.scopeType === "global")) return true;
  const grouped = new Map<BannerScopeType, BannerTarget[]>();
  for (const target of targets) grouped.set(target.scopeType, [...(grouped.get(target.scopeType) ?? []), target]);
  return [...grouped.entries()].every(([type, entries]) =>
    type === "global" || Boolean(context[type] && entries.some((target) => target.scopeValue === context[type])),
  );
}

export function bannerTargetSpecificity(targets: BannerTarget[]): number {
  return new Set(targets.filter((target) => target.scopeType !== "global").map((target) => target.scopeType)).size;
}

export async function syncBannersForSponsorship(
  sponsorshipId: number,
  patch: { startsAt?: Date; endsAt?: Date; isActive?: boolean },
): Promise<void> {
  const set: Record<string, unknown> = {};
  if (patch.startsAt !== undefined) set.startAt = patch.startsAt;
  if (patch.endsAt !== undefined) set.endAt = patch.endsAt;
  if (patch.isActive === false) {
    set.isActive = 0;
    set.lifecycleStatus = "cancelled";
  } else if (patch.isActive === true) {
    set.isActive = 1;
    set.lifecycleStatus = patch.startsAt && patch.startsAt.getTime() > Date.now() ? "scheduled" : "live";
  }
  if (Object.keys(set).length) {
    await db.update(hfBanners).set(set).where(eq(hfBanners.sponsorshipId, sponsorshipId));
  }
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

export async function pickActiveRowsForPosition(position: string): Promise<BannerRow[]> {
  return db
    .select()
    .from(hfBanners)
    .where(
      and(
        eq(hfBanners.position, position),
        eq(hfBanners.isActive, 1),
        sql`${hfBanners.archivedAt} IS NULL`,
        sql`(${hfBanners.startAt} IS NULL OR ${hfBanners.startAt} <= CURRENT_TIMESTAMP(3))`,
        sql`(${hfBanners.endAt} IS NULL OR ${hfBanners.endAt} >= CURRENT_TIMESTAMP(3))`,
        sql`(${hfBanners.impressionLimit} IS NULL OR ${hfBanners.impressions} < ${hfBanners.impressionLimit})`,
        sql`(${hfBanners.clickLimit} IS NULL OR ${hfBanners.clicks} < ${hfBanners.clickLimit})`,
        sql`(${hfBanners.dailyImpressionLimit} IS NULL OR ${hfBanners.dailyImpressionsDate} IS NULL OR ${hfBanners.dailyImpressionsDate} <> CURRENT_DATE OR ${hfBanners.dailyImpressions} < ${hfBanners.dailyImpressionLimit})`,
      ),
    )
    .orderBy(asc(hfBanners.desktopRow), asc(hfBanners.displayOrder), asc(hfBanners.id));
}

export async function findLayoutConflicts(input: BannerInput, excludeId?: number): Promise<Array<{ id: number; title: string }>> {
  const occupying = ["reserved", "payment_pending", "scheduled", "live"];
  const lifecycleStatus = input.lifecycleStatus ?? (input.isActive ? "live" : "draft");
  if (!occupying.includes(lifecycleStatus)) return [];
  const start = toDate(input.startAt);
  const end = toDate(input.endAt);
  const rows = await db
    .select({ id: hfBanners.id, title: hfBanners.title, desktopColumns: hfBanners.desktopColumns })
    .from(hfBanners)
    .where(and(
      eq(hfBanners.position, input.position),
      eq(hfBanners.desktopRow, input.desktopRow ?? 1),
      sql`${hfBanners.lifecycleStatus} IN ('reserved','payment_pending','scheduled','live')`,
      sql`(${hfBanners.lifecycleStatus} <> 'reserved' OR ${hfBanners.reservationExpiresAt} IS NULL OR ${hfBanners.reservationExpiresAt} >= CURRENT_TIMESTAMP(3))`,
      sql`${hfBanners.archivedAt} IS NULL`,
      excludeId ? sql`${hfBanners.id} <> ${excludeId}` : sql`1=1`,
      sql`(${hfBanners.startAt} IS NULL OR ${end} IS NULL OR ${hfBanners.startAt} <= ${end})`,
      sql`(${hfBanners.endAt} IS NULL OR ${start} IS NULL OR ${hfBanners.endAt} >= ${start})`,
      input.device === "desktop"
        ? sql`${hfBanners.device} IN ('all','desktop')`
        : input.device === "mobile"
          ? sql`${hfBanners.device} IN ('all','mobile')`
          : sql`1=1`,
  ));
  const targetsByBanner = await listBannerTargets(rows.map((row) => row.id));
  return layoutCapacityConflicts(
    input.desktopColumns ?? 1,
    input.targets ?? [],
    rows.map((row) => ({ ...row, targets: targetsByBanner.get(row.id) ?? [] })),
  );
}

export function layoutCapacityConflicts<T extends {
  id: number;
  title: string;
  desktopColumns: number;
  targets: BannerTarget[];
}>(
  requestedCapacity: number,
  requestedTargets: BannerTarget[],
  occupyingRows: T[],
): Array<{ id: number; title: string }> {
  const overlappingRows = occupyingRows.filter((row) => bannerTargetsCanOverlap(requestedTargets, row.targets));
  if (overlappingRows.some((row) => row.desktopColumns !== requestedCapacity)) {
    return overlappingRows.map(({ id, title }) => ({ id, title }));
  }
  return overlappingRows.length >= requestedCapacity
    ? overlappingRows.map(({ id, title }) => ({ id, title }))
    : [];
}

export function bannerTargetsCanOverlap(left: BannerTarget[], right: BannerTarget[]): boolean {
  if (!left.length || !right.length) return true;
  if (left.some((target) => target.scopeType === "global") || right.some((target) => target.scopeType === "global")) return true;
  const types = new Set(left.map((target) => target.scopeType).filter((type) => type !== "global"));
  for (const type of types) {
    const leftValues = new Set(left.filter((target) => target.scopeType === type).map((target) => target.scopeValue).filter(Boolean));
    const rightValues = new Set(right.filter((target) => target.scopeType === type).map((target) => target.scopeValue).filter(Boolean));
    if (rightValues.size > 0 && ![...leftValues].some((value) => rightValues.has(value))) return false;
  }
  return true;
}

export async function layoutInventory(position?: string) {
  const rows = await listBanners({ position, limit: 500 });
  const grouped = new Map<string, { position: string; row: number; columns: number; active: number; items: BannerRow[] }>();
  for (const banner of rows) {
    const key = `${banner.position}:${banner.desktopRow}`;
    const group = grouped.get(key) ?? { position: banner.position, row: banner.desktopRow, columns: banner.desktopColumns, active: 0, items: [] };
    group.columns = banner.desktopColumns;
    group.items.push(banner);
    if (banner.isActive) group.active += 1;
    grouped.set(key, group);
  }
  return [...grouped.values()].map((group) => ({ ...group, available: Math.max(0, group.columns - group.active) }));
}

export async function listAdSlots() {
  return db.select().from(hfAdSlots).orderBy(asc(hfAdSlots.displayOrder), asc(hfAdSlots.id));
}

export async function getAdSlot(slotKey: string) {
  const [slot] = await db.select().from(hfAdSlots).where(eq(hfAdSlots.slotKey, slotKey)).limit(1);
  return slot ?? null;
}

export async function updateAdSlot(slotKey: string, patch: AdSlotPatch) {
  const set: Record<string, unknown> = {};
  if (patch.desktopCapacity !== undefined) set.desktopCapacity = patch.desktopCapacity;
  if (patch.mobileCapacity !== undefined) set.mobileCapacity = patch.mobileCapacity;
  if (patch.mobileBehavior !== undefined) set.mobileBehavior = patch.mobileBehavior;
  if (patch.deliveryMode !== undefined) set.deliveryMode = patch.deliveryMode;
  for (const key of ["baseDailyPrice", "trafficMultiplier", "visibilityMultiplier", "desktopMultiplier", "mobileMultiplier"] as const) {
    if (patch[key] !== undefined) set[key] = patch[key];
  }
  if (patch.isActive !== undefined) set.isActive = patch.isActive ? 1 : 0;
  if (!Object.keys(set).length) return false;
  const result = await db.update(hfAdSlots).set(set).where(eq(hfAdSlots.slotKey, slotKey));
  return Number(result[0]?.affectedRows ?? 0) > 0;
}

export async function calculateAdPrice(input: AdPriceQuoteInput) {
  const slot = await getAdSlot(input.slotKey);
  if (!slot) return null;
  const baseDailyPrice = Number(slot.baseDailyPrice);
  const traffic = Number(slot.trafficMultiplier);
  const visibility = Number(slot.visibilityMultiplier);
  const device = input.device === "mobile"
    ? Number(slot.mobileMultiplier)
    : input.device === "desktop"
      ? Number(slot.desktopMultiplier)
      : (Number(slot.mobileMultiplier) + Number(slot.desktopMultiplier)) / 2;
  const narrowTargets = new Set(["district", "product", "market", "firm", "listing"]);
  const targetTypes = [...new Set(input.targetTypes ?? [])].filter((type) => type !== "global");
  const targeting = targetTypes.length
    ? 1 + targetTypes.reduce((sum, type) => sum + (narrowTargets.has(type) ? 0.12 : 0.06), 0)
    : 1;
  const month = input.startAt ? new Date(input.startAt).getUTCMonth() + 1 : new Date().getUTCMonth() + 1;
  const season = month >= 6 && month <= 9 ? 1.15 : 1;
  const capacity = input.device === "mobile" ? slot.mobileCapacity : slot.desktopCapacity;
  const capacityFactor = 1 / Math.max(1, capacity);
  const durationDiscount = input.durationDays >= 90 ? 0.75 : input.durationDays >= 30 ? 0.85 : input.durationDays >= 7 ? 0.95 : 1;
  const raw = baseDailyPrice * input.durationDays * traffic * visibility * device * targeting * season * capacityFactor * durationDiscount;
  const suggestedPrice = Math.round(raw * 100) / 100;
  const manualDiscount = Math.min(100, Math.max(0, input.manualDiscountPercent ?? 0));
  const appliedPrice = input.manualPrice ?? Math.round(suggestedPrice * (1 - manualDiscount / 100) * 100) / 100;
  return {
    currency: "TRY",
    suggestedPrice,
    appliedPrice,
    discountPercent: suggestedPrice > 0 ? Math.round((1 - appliedPrice / suggestedPrice) * 10000) / 100 : 0,
    factors: {
      baseDailyPrice,
      durationDays: input.durationDays,
      traffic,
      visibility,
      device,
      targeting,
      season,
      capacity: capacityFactor,
      durationDiscount,
    },
  };
}

export async function recordAdPriceOverride(input: AdPriceQuoteInput, quote: NonNullable<Awaited<ReturnType<typeof calculateAdPrice>>>) {
  const result = await db.insert(hfAdPriceOverrides).values({
    bannerId: input.bannerId ?? null,
    slotKey: input.slotKey,
    suggestedPrice: quote.suggestedPrice.toFixed(2),
    appliedPrice: quote.appliedPrice.toFixed(2),
    discountPercent: quote.discountPercent.toFixed(2),
    reason: input.overrideReason!.trim(),
    calculation: quote.factors,
  });
  return Number(result[0]?.insertId ?? 0);
}

export async function getAdPaymentSummary(bannerId: number) {
  const [banner, transactions] = await Promise.all([
    getBannerById(bannerId),
    db.select().from(hfAdPayments).where(eq(hfAdPayments.bannerId, bannerId)).orderBy(asc(hfAdPayments.paidAt), asc(hfAdPayments.id)),
  ]);
  if (!banner) return null;
  const collected = transactions.reduce(
    (sum, item) => sum + (item.transactionType === "refund" ? -Number(item.amount) : Number(item.amount)),
    0,
  );
  const total = Number(banner.totalAmount);
  return {
    totalAmount: total,
    collectedAmount: Math.round(collected * 100) / 100,
    remainingAmount: Math.max(0, Math.round((total - collected) * 100) / 100),
    paymentStatus: banner.paymentStatus,
    paymentDueAt: banner.paymentDueAt,
    transactions,
  };
}

export async function createAdPayment(input: {
  bannerId: number;
  transactionType: "payment" | "refund";
  amount: string;
  currency?: string;
  paymentMethod: "cash" | "bank_transfer" | "card" | "other";
  paidAt: string | Date;
  referenceNumber?: string | null;
  notes?: string | null;
}) {
  const result = await db.insert(hfAdPayments).values({
    bannerId: input.bannerId,
    transactionType: input.transactionType,
    amount: input.amount,
    currency: input.currency ?? "TRY",
    paymentMethod: input.paymentMethod,
    paidAt: toDate(input.paidAt)!,
    referenceNumber: input.referenceNumber ?? null,
    notes: input.notes ?? null,
  });
  const summary = await getAdPaymentSummary(input.bannerId);
  if (summary && !["waived", "cancelled"].includes(summary.paymentStatus)) {
    const hasRefund = summary.transactions.some((item) => item.transactionType === "refund");
    const paymentStatus = summary.collectedAmount <= 0
      ? (hasRefund ? "refunded" : "unpaid")
      : summary.remainingAmount > 0
        ? "partial"
        : "paid";
    await db.update(hfBanners).set({ paymentStatus }).where(eq(hfBanners.id, input.bannerId));
  }
  return Number(result[0]?.insertId ?? 0);
}

export async function listOverdueAdPayments() {
  return db.select({
    id: hfBanners.id,
    title: hfBanners.title,
    advertiser: hfBanners.advertiser,
    salesOwner: hfBanners.salesOwner,
    totalAmount: hfBanners.totalAmount,
    paymentStatus: hfBanners.paymentStatus,
    paymentDueAt: hfBanners.paymentDueAt,
    paymentReminderSentAt: hfBanners.paymentReminderSentAt,
  }).from(hfBanners).where(and(
    sql`${hfBanners.paymentStatus} IN ('unpaid','partial')`,
    sql`${hfBanners.lifecycleStatus} IN ('proposal','reserved','payment_pending','scheduled')`,
    sql`${hfBanners.paymentDueAt} IS NOT NULL AND ${hfBanners.paymentDueAt} < CURRENT_TIMESTAMP(3)`,
    sql`${hfBanners.archivedAt} IS NULL`,
  )).orderBy(asc(hfBanners.paymentDueAt), asc(hfBanners.id));
}

export async function processAdPaymentReminders() {
  const overdue = await listOverdueAdPayments();
  let reminded = 0;
  for (const item of overdue) {
    if (item.paymentReminderSentAt && Date.now() - new Date(item.paymentReminderSentAt).getTime() < 86400000) continue;
    await db.update(hfBanners).set({ paymentReminderSentAt: new Date() }).where(eq(hfBanners.id, item.id));
    reminded += 1;
  }
  return { overdue: overdue.length, reminded };
}

type BannerSourceValidationInput = {
  sourceType?: string;
  endAt?: Date | string | null;
};

type BannerSourceValidationState = {
  listing?: {
    status: string;
    isSuspicious: number | boolean;
    validUntil: string;
    contactPhone: string | null;
  } | null;
  firm?: {
    status: string;
    isActive: number | boolean;
    phone: string | null;
    contactPerson: string | null;
  } | null;
  sponsorship?: {
    isActive: number | boolean;
    startsAt: Date;
    endsAt: Date;
  } | null;
};

export function validateBannerSourceState(
  input: BannerSourceValidationInput,
  state: BannerSourceValidationState,
  now = new Date(),
) {
  const issues: Array<{ code: string; message: string; severity: "error" | "warning" }> = [];
  if (input.sourceType === "listing") {
    const listing = state.listing;
    if (!listing || listing.status !== "approved" || listing.isSuspicious) issues.push({ code: "listing_invalid", message: "İlan onaylı ve güvenli değil.", severity: "error" });
    else {
      const bannerEnd = input.endAt ? new Date(input.endAt).toISOString().slice(0, 10) : null;
      if (bannerEnd && listing.validUntil < bannerEnd) issues.push({ code: "listing_duration", message: "İlan süresi reklam bitiş tarihini karşılamıyor.", severity: "error" });
      if (!listing.contactPhone) issues.push({ code: "listing_contact", message: "İlanda iletişim telefonu bulunmuyor.", severity: "warning" });
    }
  }
  if (input.sourceType === "firm") {
    const firm = state.firm;
    if (!firm || !firm.isActive || firm.status !== "approved") issues.push({ code: "firm_invalid", message: "Firma aktif ve onaylı değil.", severity: "error" });
    else if (!firm.phone && !firm.contactPerson) issues.push({ code: "firm_contact", message: "Firmada iletişim bilgisi bulunmuyor.", severity: "warning" });
  }
  if (state.sponsorship !== undefined) {
    const sponsorship = state.sponsorship;
    if (!sponsorship || !sponsorship.isActive || sponsorship.endsAt < now || sponsorship.startsAt > now) {
      issues.push({ code: "sponsorship_invalid", message: "Bağlı sponsorluk aktif tarih aralığında değil.", severity: "error" });
    }
  }
  return issues;
}

export async function validateBannerSource(input: {
  sourceType?: string; listingId?: number | null; firmId?: number | null; sponsorshipId?: number | null; endAt?: Date | string | null;
}) {
  const [listing] = input.sourceType === "listing" && input.listingId ? await db.select({
    status: hfListings.status,
    isSuspicious: hfListings.isSuspicious,
    validUntil: hfListings.validUntil,
    contactPhone: hfListings.contactPhone,
  }).from(hfListings).where(eq(hfListings.id, input.listingId)).limit(1) : [];
  const [firm] = input.sourceType === "firm" && input.firmId ? await db.select({
    status: hfFirms.status,
    isActive: hfFirms.isActive,
    phone: hfFirms.phone,
    contactPerson: hfFirms.contactPerson,
  }).from(hfFirms).where(eq(hfFirms.id, input.firmId)).limit(1) : [];
  const [sponsorship] = input.sponsorshipId
    ? await db.select({
      isActive: hfFirmSponsorships.isActive,
      startsAt: hfFirmSponsorships.startsAt,
      endsAt: hfFirmSponsorships.endsAt,
    }).from(hfFirmSponsorships).where(eq(hfFirmSponsorships.id, input.sponsorshipId)).limit(1)
    : [];
  return validateBannerSourceState(input, {
    listing: input.sourceType === "listing" ? listing ?? null : undefined,
    firm: input.sourceType === "firm" ? firm ?? null : undefined,
    sponsorship: input.sponsorshipId ? sponsorship ?? null : undefined,
  });
}

async function linkReachable(url: string) {
  try {
    const response = await fetch(url, { method: "HEAD", redirect: "follow", signal: AbortSignal.timeout(6000) });
    return response.status < 400;
  } catch {
    return false;
  }
}

export async function auditLiveBannerSources() {
  const rows = await db.select().from(hfBanners).where(and(
    sql`${hfBanners.lifecycleStatus} IN ('scheduled','live')`,
    eq(hfBanners.isActive, 1),
  ));
  let problem = 0;
  for (const banner of rows) {
    const sourceIssues = await validateBannerSource(banner);
    const brokenLink = banner.linkUrl?.startsWith("https://") ? !(await linkReachable(banner.linkUrl)) : false;
    if (!sourceIssues.some((item) => item.severity === "error") && !brokenLink) continue;
    const reason = brokenLink ? "Hedef URL erişilemiyor" : sourceIssues.map((item) => item.message).join(" ");
    await db.update(hfBanners).set({
      lifecycleStatus: "problem",
      isActive: 0,
      notes: sql`LEFT(CONCAT(COALESCE(${hfBanners.notes}, ''), ${`\nOtomatik kalite denetimi: ${reason}`}), 500)`,
      qualityCheckedAt: new Date(),
    }).where(eq(hfBanners.id, banner.id));
    problem += 1;
  }
  return { checked: rows.length, problem };
}

export async function listAdPackages() {
  const [packages, slots] = await Promise.all([
    db.select().from(hfAdPackages).orderBy(asc(hfAdPackages.durationDays), asc(hfAdPackages.id)),
    db.select().from(hfAdPackageSlots).orderBy(asc(hfAdPackageSlots.packageId), asc(hfAdPackageSlots.id)),
  ]);
  return packages.map((item) => ({
    ...item,
    slotKeys: slots.filter((slot) => slot.packageId === item.id).map((slot) => slot.slotKey),
  }));
}

export async function createAdPackage(input: AdPackageInput): Promise<number> {
  const result = await db.insert(hfAdPackages).values({
    slug: input.slug,
    name: input.name,
    billingPeriod: input.billingPeriod,
    durationDays: input.durationDays,
    price: input.price,
    currency: input.currency ?? "TRY",
    devices: input.devices ?? ["all"],
    impressionLimit: input.impressionLimit ?? null,
    clickLimit: input.clickLimit ?? null,
    includesFirmProfile: input.includesFirmProfile ? 1 : 0,
    discountPercent: input.discountPercent ?? "0",
    customPriceAllowed: input.customPriceAllowed ? 1 : 0,
    isActive: input.isActive === false ? 0 : 1,
  });
  const id = Number(result[0]?.insertId ?? 0);
  if (id && input.slotKeys?.length) await db.insert(hfAdPackageSlots).values(input.slotKeys.map((slotKey) => ({ packageId: id, slotKey })));
  return id;
}

export async function updateAdPackage(id: number, input: Partial<AdPackageInput>): Promise<boolean> {
  const set: Record<string, unknown> = {};
  for (const key of ["slug", "name", "billingPeriod", "durationDays", "price", "currency", "devices", "impressionLimit", "clickLimit"] as const) {
    if (input[key] !== undefined) set[key] = input[key];
  }
  if (input.includesFirmProfile !== undefined) set.includesFirmProfile = input.includesFirmProfile ? 1 : 0;
  if (input.discountPercent !== undefined) set.discountPercent = input.discountPercent;
  if (input.customPriceAllowed !== undefined) set.customPriceAllowed = input.customPriceAllowed ? 1 : 0;
  if (input.isActive !== undefined) set.isActive = input.isActive ? 1 : 0;
  if (Object.keys(set).length) await db.update(hfAdPackages).set(set).where(eq(hfAdPackages.id, id));
  if (input.slotKeys !== undefined) {
    await db.delete(hfAdPackageSlots).where(eq(hfAdPackageSlots.packageId, id));
    if (input.slotKeys.length) await db.insert(hfAdPackageSlots).values(input.slotKeys.map((slotKey) => ({ packageId: id, slotKey })));
  }
  return Object.keys(set).length > 0 || input.slotKeys !== undefined;
}

export async function calendarInventory(from: Date, to: Date) {
  const [slots, bookings] = await Promise.all([
    listAdSlots(),
    db.select().from(hfBanners).where(and(
      sql`${hfBanners.lifecycleStatus} IN ('reserved','payment_pending','scheduled','live')`,
      sql`(${hfBanners.lifecycleStatus} <> 'reserved' OR ${hfBanners.reservationExpiresAt} IS NULL OR ${hfBanners.reservationExpiresAt} >= CURRENT_TIMESTAMP(3))`,
      sql`${hfBanners.archivedAt} IS NULL`,
      sql`(${hfBanners.startAt} IS NULL OR ${hfBanners.startAt} <= ${to})`,
      sql`(${hfBanners.endAt} IS NULL OR ${hfBanners.endAt} >= ${from})`,
    )).orderBy(asc(hfBanners.position), asc(hfBanners.desktopRow), asc(hfBanners.startAt), asc(hfBanners.id)),
  ]);
  const targetsByBanner = await listBannerTargets(bookings.map((banner) => banner.id));
  return {
    from,
    to,
    slots,
    bookings: bookings.map((banner) => ({
      id: banner.id,
      position: banner.position,
      title: banner.title,
      advertiser: banner.advertiser,
      sourceType: banner.sourceType,
      device: banner.device,
      desktopRow: banner.desktopRow,
      desktopColumns: banner.desktopColumns,
      startAt: banner.startAt,
      endAt: banner.endAt,
      lifecycleStatus: banner.lifecycleStatus,
      reservationExpiresAt: banner.reservationExpiresAt,
      targets: targetsByBanner.get(banner.id) ?? [],
    })),
  };
}

export async function syncBannerLifecycle() {
  const [expiredReservations] = await pool.query<any>(
    "UPDATE hf_banners SET lifecycle_status='cancelled', is_active=0, cancellation_reason=COALESCE(cancellation_reason,'Rezervasyon suresi doldu') WHERE lifecycle_status='reserved' AND reservation_expires_at IS NOT NULL AND reservation_expires_at < CURRENT_TIMESTAMP(3)",
  );
  const [started] = await pool.query<any>(
    "UPDATE hf_banners SET lifecycle_status='live', is_active=1 WHERE lifecycle_status='scheduled' AND (start_at IS NULL OR start_at <= CURRENT_TIMESTAMP(3)) AND (end_at IS NULL OR end_at >= CURRENT_TIMESTAMP(3))",
  );
  const [completed] = await pool.query<any>(
    "UPDATE hf_banners SET lifecycle_status='completed', is_active=0 WHERE lifecycle_status IN ('scheduled','live') AND end_at IS NOT NULL AND end_at < CURRENT_TIMESTAMP(3)",
  );
  return {
    cancelledReservations: Number(expiredReservations?.affectedRows ?? 0),
    started: Number(started?.affectedRows ?? 0),
    completed: Number(completed?.affectedRows ?? 0),
  };
}

export async function archiveExpiredBanners(retentionDays = 90) {
  const safeRetentionDays = Math.max(1, Math.trunc(retentionDays));
  const cutoff = new Date(Date.now() - safeRetentionDays * 24 * 60 * 60 * 1000);
  const candidates = await db.select().from(hfBanners).where(and(
    sql`${hfBanners.lifecycleStatus} IN ('completed','cancelled')`,
    sql`COALESCE(${hfBanners.endAt}, ${hfBanners.updatedAt}) < ${cutoff}`,
    sql`${hfBanners.archivedAt} IS NULL`,
  ));
  if (!candidates.length) return { archived: 0, retentionDays: safeRetentionDays };

  const now = new Date();
  await db.update(hfBanners).set({
    lifecycleStatus: "archived",
    isActive: 0,
    archivedAt: now,
  }).where(sql`${hfBanners.id} IN (${sql.join(candidates.map((item) => sql`${item.id}`), sql`, `)})`);

  await Promise.all(candidates.map((banner) => recordAdAudit({
    entityType: "banner",
    entityId: banner.id,
    action: "auto_archived",
    actorUserId: null,
    beforeData: {
      lifecycleStatus: banner.lifecycleStatus,
      isActive: banner.isActive,
      archivedAt: banner.archivedAt,
    },
    afterData: {
      lifecycleStatus: "archived",
      isActive: 0,
      archivedAt: now,
    },
    reason: `${safeRetentionDays} günlük saklama süresi doldu.`,
  })));

  return { archived: candidates.length, retentionDays: safeRetentionDays };
}

export async function duplicateBanner(id: number) {
  const source = await getBannerById(id);
  if (!source) return null;
  const duplicateId = await createBanner({
    ...source,
    title: `${source.title} (Kopya)`,
    lifecycleStatus: "draft",
    paymentStatus: "unpaid",
    paymentOverride: false,
    autoOptimize: Boolean(source.autoOptimize),
    weeklyReportEnabled: Boolean(source.weeklyReportEnabled),
    paymentOverrideReason: null,
    isActive: false,
    startAt: null,
    endAt: null,
    reservationExpiresAt: null,
    cancellationReason: null,
  });
  return getBannerById(duplicateId);
}

export type WaitlistInput = {
  position: string;
  title: string;
  advertiser?: string | null;
  sourceType?: "custom" | "listing" | "firm" | "code";
  listingId?: number | null;
  firmId?: number | null;
  device?: BannerDevice;
  preferredStartAt?: string | Date | null;
  preferredEndAt?: string | Date | null;
  priority?: number;
  status?: "waiting" | "offered" | "converted" | "cancelled";
  notes?: string | null;
};

export async function listWaitlist() {
  return db.select().from(hfAdWaitlist).orderBy(sql`${hfAdWaitlist.priority} DESC`, asc(hfAdWaitlist.createdAt));
}

export async function createWaitlistItem(input: WaitlistInput) {
  const result = await db.insert(hfAdWaitlist).values({
    position: input.position,
    title: input.title,
    advertiser: input.advertiser ?? null,
    sourceType: input.sourceType ?? "custom",
    listingId: input.listingId ?? null,
    firmId: input.firmId ?? null,
    device: input.device ?? "all",
    preferredStartAt: toDate(input.preferredStartAt),
    preferredEndAt: toDate(input.preferredEndAt),
    priority: input.priority ?? 0,
    status: input.status ?? "waiting",
    notes: input.notes ?? null,
  });
  return Number(result[0]?.insertId ?? 0);
}

export async function updateWaitlistItem(id: number, patch: Partial<WaitlistInput>) {
  const set: Record<string, unknown> = {};
  if (patch.status !== undefined) set.status = patch.status;
  if (patch.priority !== undefined) set.priority = patch.priority;
  if (patch.notes !== undefined) set.notes = patch.notes || null;
  if (patch.preferredStartAt !== undefined) set.preferredStartAt = toDate(patch.preferredStartAt);
  if (patch.preferredEndAt !== undefined) set.preferredEndAt = toDate(patch.preferredEndAt);
  if (!Object.keys(set).length) return false;
  const result = await db.update(hfAdWaitlist).set(set).where(eq(hfAdWaitlist.id, id));
  return Number(result[0]?.affectedRows ?? 0) > 0;
}

export async function slotAvailability(at: Date, device: BannerDevice = "all", horizonDays = 180) {
  const horizon = new Date(at);
  horizon.setUTCDate(horizon.getUTCDate() + horizonDays);
  horizon.setUTCHours(23, 59, 59, 999);
  const { slots, bookings } = await calendarInventory(at, horizon);
  const compatible = (bookingDevice: BannerDevice) =>
    device === "all" || bookingDevice === "all" || bookingDevice === device;
  const overlapsDay = (booking: (typeof bookings)[number], day: Date) => {
    const dayStart = new Date(day); dayStart.setUTCHours(0, 0, 0, 0);
    const dayEnd = new Date(day); dayEnd.setUTCHours(23, 59, 59, 999);
    const start = booking.startAt ?? new Date(0);
    const end = booking.endAt ?? new Date("2999-12-31T23:59:59.999Z");
    return start <= dayEnd && end >= dayStart;
  };
  return slots.map((slot) => {
    const capacity = device === "mobile" ? slot.mobileCapacity : slot.desktopCapacity;
    let nextAvailableAt: string | null = null;
    let occupiedAt = 0;
    for (let offset = 0; offset <= horizonDays; offset += 1) {
      const day = new Date(at);
      day.setUTCDate(day.getUTCDate() + offset);
      const occupied = bookings.filter((booking) =>
        booking.position === slot.slotKey && compatible(booking.device) && overlapsDay(booking, day)
      ).length;
      if (offset === 0) occupiedAt = occupied;
      if (occupied < capacity) {
        nextAvailableAt = day.toISOString().slice(0, 10);
        break;
      }
    }
    return {
      slotKey: slot.slotKey,
      pageType: slot.pageType,
      capacity,
      occupied: occupiedAt,
      available: Math.max(0, capacity - occupiedAt),
      nextAvailableAt,
    };
  });
}

export async function incImpression(id: number): Promise<void> {
  await db.update(hfBanners).set({
    impressions: sql`${hfBanners.impressions} + 1`,
    dailyImpressions: sql`CASE WHEN ${hfBanners.dailyImpressionsDate} = CURRENT_DATE THEN ${hfBanners.dailyImpressions} + 1 ELSE 1 END`,
    dailyImpressionsDate: sql`CURRENT_DATE`,
  }).where(eq(hfBanners.id, id));
  await completeBannerAtTotalQuota(id);
}

export async function incClick(id: number): Promise<void> {
  await db.update(hfBanners).set({ clicks: sql`${hfBanners.clicks} + 1` }).where(eq(hfBanners.id, id));
  await completeBannerAtTotalQuota(id);
}

export async function recordBannerMetric(
  bannerId: number,
  eventType: "impression" | "click",
  visitorHash: string,
  device: "desktop" | "mobile",
  scopeKey: string,
): Promise<void> {
  const normalizedScope = scopeKey.slice(0, 190) || "global";
  const uniqueResult = await db.insert(hfBannerMetricUniques).values({
    bannerId,
    metricDate: sql`CURRENT_DATE`,
    visitorHash,
    eventType,
    device,
    scopeKey: normalizedScope,
  }).onDuplicateKeyUpdate({ set: { id: sql`${hfBannerMetricUniques.id}` } });
  const isUnique = Number(uniqueResult[0]?.affectedRows ?? 0) === 1;
  await db.insert(hfBannerDailyMetrics).values({
    bannerId,
    metricDate: sql`CURRENT_DATE`,
    device,
    scopeKey: normalizedScope,
    impressions: eventType === "impression" ? 1 : 0,
    uniqueImpressions: eventType === "impression" && isUnique ? 1 : 0,
    clicks: eventType === "click" ? 1 : 0,
    uniqueClicks: eventType === "click" && isUnique ? 1 : 0,
  }).onDuplicateKeyUpdate({ set: {
    impressions: eventType === "impression" ? sql`${hfBannerDailyMetrics.impressions} + 1` : sql`${hfBannerDailyMetrics.impressions}`,
    uniqueImpressions: eventType === "impression" && isUnique ? sql`${hfBannerDailyMetrics.uniqueImpressions} + 1` : sql`${hfBannerDailyMetrics.uniqueImpressions}`,
    clicks: eventType === "click" ? sql`${hfBannerDailyMetrics.clicks} + 1` : sql`${hfBannerDailyMetrics.clicks}`,
    uniqueClicks: eventType === "click" && isUnique ? sql`${hfBannerDailyMetrics.uniqueClicks} + 1` : sql`${hfBannerDailyMetrics.uniqueClicks}`,
  } });
}

export async function bannerMetricsReport(from: string, to: string, bannerId?: number) {
  const where = [
    sql`${hfBannerDailyMetrics.metricDate} >= ${from}`,
    sql`${hfBannerDailyMetrics.metricDate} <= ${to}`,
  ];
  if (bannerId) where.push(eq(hfBannerDailyMetrics.bannerId, bannerId));
  const metrics = await db.select().from(hfBannerDailyMetrics).where(and(...where))
    .orderBy(asc(hfBannerDailyMetrics.metricDate), asc(hfBannerDailyMetrics.bannerId));
  const bannerIds = [...new Set(metrics.map((item) => item.bannerId))];
  const banners = bannerIds.length
    ? await db.select().from(hfBanners).where(sql`${hfBanners.id} IN (${sql.join(bannerIds.map((id) => sql`${id}`), sql`,`)})`)
    : [];
  const byId = new Map(banners.map((banner) => [banner.id, banner]));
  return metrics.map((metric) => {
    const banner = byId.get(metric.bannerId);
    const now = Date.now();
    const start = banner?.startAt?.getTime() ?? now;
    const end = banner?.endAt?.getTime() ?? now;
    return {
      ...metric,
      title: banner?.title ?? `#${metric.bannerId}`,
      advertiser: banner?.advertiser ?? null,
      position: banner?.position ?? null,
      ctr: metric.impressions ? metric.clicks / metric.impressions : 0,
      liveDays: Math.max(0, Math.ceil((Math.min(now, end || now) - start) / 86_400_000)),
      remainingDays: banner?.endAt ? Math.max(0, Math.ceil((end - now) / 86_400_000)) : null,
    };
  });
}

export async function recordBannerConversion(input: {
  bannerId: number;
  eventType: "listing_view" | "offer_submit" | "phone_click" | "whatsapp_click" | "firm_contact" | "directions_click" | "favorite_add";
  entityType: "listing" | "firm" | "product";
  entityId: string;
  visitorHash: string;
  sourcePosition: string;
}): Promise<boolean> {
  const result = await db.insert(hfBannerConversions).values(input)
    .onDuplicateKeyUpdate({ set: { id: sql`${hfBannerConversions.id}` } });
  return Number(result[0]?.affectedRows ?? 0) === 1;
}

export async function bannerConversionReport(from: string, to: string, bannerId?: number) {
  const conditions = [
    sql`${hfBannerConversions.createdAt} >= ${`${from} 00:00:00`}`,
    sql`${hfBannerConversions.createdAt} <= ${`${to} 23:59:59`}`,
  ];
  if (bannerId) conditions.push(eq(hfBannerConversions.bannerId, bannerId));
  return db.select({
    bannerId: hfBannerConversions.bannerId,
    eventType: hfBannerConversions.eventType,
    entityType: hfBannerConversions.entityType,
    conversions: sql<number>`COUNT(*)`,
  }).from(hfBannerConversions).where(and(...conditions))
    .groupBy(hfBannerConversions.bannerId, hfBannerConversions.eventType, hfBannerConversions.entityType);
}

export async function bannerRevenueReport(from: string, to: string) {
  const fromDate = new Date(`${from}T00:00:00.000Z`);
  const toDate = new Date(`${to}T23:59:59.999Z`);
  const banners = await db.select().from(hfBanners).where(and(
    sql`${hfBanners.lifecycleStatus} NOT IN ('draft','cancelled','archived')`,
    sql`(${hfBanners.startAt} IS NULL OR ${hfBanners.startAt} <= ${toDate})`,
    sql`(${hfBanners.endAt} IS NULL OR ${hfBanners.endAt} >= ${fromDate})`,
  ));
  const ids = banners.map((banner) => banner.id);
  const [payments, metrics, conversions, slots] = await Promise.all([
    ids.length ? db.select().from(hfAdPayments).where(sql`${hfAdPayments.bannerId} IN (${sql.join(ids.map((id) => sql`${id}`), sql`,`)})`) : [],
    ids.length ? db.select().from(hfBannerDailyMetrics).where(and(
      sql`${hfBannerDailyMetrics.bannerId} IN (${sql.join(ids.map((id) => sql`${id}`), sql`,`)})`,
      sql`${hfBannerDailyMetrics.metricDate} >= ${from}`,
      sql`${hfBannerDailyMetrics.metricDate} <= ${to}`,
    )) : [],
    ids.length ? db.select().from(hfBannerConversions).where(and(
      sql`${hfBannerConversions.bannerId} IN (${sql.join(ids.map((id) => sql`${id}`), sql`,`)})`,
      sql`${hfBannerConversions.createdAt} >= ${`${from} 00:00:00`}`,
      sql`${hfBannerConversions.createdAt} <= ${`${to} 23:59:59`}`,
    )) : [],
    listAdSlots(),
  ]);
  const campaignRows = banners.map((banner) => {
    const campaignMetrics = metrics.filter((item) => item.bannerId === banner.id);
    const impressions = campaignMetrics.reduce((sum, item) => sum + item.impressions, 0);
    const clicks = campaignMetrics.reduce((sum, item) => sum + item.clicks, 0);
    const conversionCount = conversions.filter((item) => item.bannerId === banner.id).length;
    const campaignPayments = payments.filter((item) => item.bannerId === banner.id);
    const collected = campaignPayments.reduce((sum, item) =>
      sum + (item.transactionType === "refund" ? -Number(item.amount) : Number(item.amount)), 0);
    const revenue = Number(banner.totalAmount);
    return {
      bannerId: banner.id, title: banner.title, advertiser: banner.advertiser,
      position: banner.position, firmId: banner.firmId, revenue, collected,
      outstanding: Math.max(0, revenue - collected), impressions, clicks, conversions: conversionCount,
      cpm: impressions ? revenue / impressions * 1000 : null,
      cpc: clicks ? revenue / clicks : null,
      cpa: conversionCount ? revenue / conversionCount : null,
    };
  });
  const group = <K extends string | number>(keyOf: (row: typeof campaignRows[number]) => K | null) => {
    const result = new Map<K, { revenue: number; collected: number; outstanding: number; impressions: number; clicks: number; conversions: number }>();
    for (const row of campaignRows) {
      const key = keyOf(row);
      if (key === null) continue;
      const item = result.get(key) ?? { revenue: 0, collected: 0, outstanding: 0, impressions: 0, clicks: 0, conversions: 0 };
      item.revenue += row.revenue; item.collected += row.collected; item.outstanding += row.outstanding;
      item.impressions += row.impressions; item.clicks += row.clicks; item.conversions += row.conversions;
      result.set(key, item);
    }
    return [...result.entries()].map(([key, totals]) => ({ key, ...totals }));
  };
  const dayCount = Math.max(1, Math.ceil((toDate.getTime() - fromDate.getTime()) / 86_400_000));
  const slotRevenue = group((row) => row.position).map((item) => {
    const slot = slots.find((candidate) => candidate.slotKey === item.key);
    const occupiedDays = banners.filter((banner) => banner.position === item.key).reduce((sum, banner) => {
      const start = Math.max(fromDate.getTime(), banner.startAt?.getTime() ?? fromDate.getTime());
      const end = Math.min(toDate.getTime(), banner.endAt?.getTime() ?? toDate.getTime());
      return sum + Math.max(0, Math.ceil((end - start) / 86_400_000));
    }, 0);
    const capacityDays = Math.max(1, (slot?.desktopCapacity ?? 1) * dayCount);
    return { ...item, occupancyRate: Math.min(1, occupiedDays / capacityDays) };
  });
  const totals = campaignRows.reduce((sum, row) => ({
    revenue: sum.revenue + row.revenue, collected: sum.collected + row.collected,
    outstanding: sum.outstanding + row.outstanding, impressions: sum.impressions + row.impressions,
    clicks: sum.clicks + row.clicks, conversions: sum.conversions + row.conversions,
  }), { revenue: 0, collected: 0, outstanding: 0, impressions: 0, clicks: 0, conversions: 0 });
  return {
    from, to, totals: {
      ...totals,
      cpm: totals.impressions ? totals.revenue / totals.impressions * 1000 : null,
      cpc: totals.clicks ? totals.revenue / totals.clicks : null,
      cpa: totals.conversions ? totals.revenue / totals.conversions : null,
      occupancyRate: slotRevenue.length ? slotRevenue.reduce((sum, item) => sum + item.occupancyRate, 0) / slotRevenue.length : 0,
    },
    campaigns: campaignRows,
    slots: slotRevenue,
    firms: group((row) => row.firmId),
  };
}

export async function campaignPerformanceReport(bannerId: number, from?: string, to?: string) {
  const banner = await getBannerById(bannerId);
  if (!banner) return null;
  const reportFrom = from ?? banner.startAt?.toISOString().slice(0, 10) ?? new Date(Date.now() - 29 * 86_400_000).toISOString().slice(0, 10);
  const reportTo = to ?? new Date().toISOString().slice(0, 10);
  const [metrics, conversions, revenue] = await Promise.all([
    bannerMetricsReport(reportFrom, reportTo, bannerId),
    bannerConversionReport(reportFrom, reportTo, bannerId),
    bannerRevenueReport(reportFrom, reportTo),
  ]);
  const totals = summarizeCampaignMetrics(metrics);
  const conversionCount = conversions.reduce((sum, item) => sum + Number(item.conversions), 0);
  const campaignRevenue = revenue.campaigns.find((item) => item.bannerId === bannerId);
  return {
    from: reportFrom, to: reportTo,
    banner: { id: banner.id, title: banner.title, advertiser: banner.advertiser, position: banner.position, startAt: banner.startAt, endAt: banner.endAt },
    totals: {
      ...totals,
      ctr: totals.impressions ? totals.clicks / totals.impressions : 0,
      conversions: conversionCount,
      revenue: campaignRevenue?.revenue ?? Number(banner.totalAmount),
      collected: campaignRevenue?.collected ?? 0,
      cpm: campaignRevenue?.cpm ?? null,
      cpc: campaignRevenue?.cpc ?? null,
      cpa: campaignRevenue?.cpa ?? null,
    },
    devices: Object.fromEntries(["desktop", "mobile"].map((device) => {
      const rows = metrics.filter((item) => item.device === device);
      return [device, summarizeCampaignMetrics(rows)];
    })),
    scopes: metrics.map((item) => ({
      date: item.metricDate, device: item.device, scopeKey: item.scopeKey,
      impressions: item.impressions, uniqueImpressions: item.uniqueImpressions,
      clicks: item.clicks, uniqueClicks: item.uniqueClicks, ctr: item.ctr,
    })),
    conversions,
  };
}

export function summarizeCampaignMetrics(metrics: Array<{
  impressions: number;
  uniqueImpressions: number;
  clicks: number;
  uniqueClicks: number;
}>) {
  return metrics.reduce((sum, item) => ({
    impressions: sum.impressions + item.impressions,
    uniqueImpressions: sum.uniqueImpressions + item.uniqueImpressions,
    clicks: sum.clicks + item.clicks,
    uniqueClicks: sum.uniqueClicks + item.uniqueClicks,
  }), { impressions: 0, uniqueImpressions: 0, clicks: 0, uniqueClicks: 0 });
}

function campaignReportHtml(report: NonNullable<Awaited<ReturnType<typeof campaignPerformanceReport>>>, heading: string) {
  const t = report.totals;
  return `<h1>${heading}</h1><h2>${report.banner.title}</h2><p>${report.from} – ${report.to}</p>
  <table cellpadding="8" cellspacing="0" border="1"><tr><th>Gösterim</th><th>Tekil</th><th>Tıklama</th><th>CTR</th><th>Dönüşüm</th></tr>
  <tr><td>${t.impressions}</td><td>${t.uniqueImpressions}</td><td>${t.clicks}</td><td>%${(t.ctr * 100).toFixed(2)}</td><td>${t.conversions}</td></tr></table>
  <p>Kampanya bedeli: ${t.revenue.toLocaleString("tr-TR")} TL · Tahsilat: ${t.collected.toLocaleString("tr-TR")} TL</p>`;
}

export async function sendScheduledCampaignReports() {
  const now = new Date();
  const weekly = await db.select().from(hfBanners).where(and(
    eq(hfBanners.weeklyReportEnabled, 1), sql`${hfBanners.reportEmail} IS NOT NULL`,
    sql`${hfBanners.lifecycleStatus} = 'live'`,
    sql`(${hfBanners.weeklyReportSentAt} IS NULL OR ${hfBanners.weeklyReportSentAt} < DATE_SUB(CURRENT_TIMESTAMP(3), INTERVAL 6 DAY))`,
  ));
  const closing = await db.select().from(hfBanners).where(and(
    sql`${hfBanners.reportEmail} IS NOT NULL`, sql`${hfBanners.lifecycleStatus} = 'completed'`,
    sql`${hfBanners.closingReportSentAt} IS NULL`,
  ));
  let weeklySent = 0;
  let closingSent = 0;
  for (const banner of weekly) {
    const report = await campaignPerformanceReport(banner.id, new Date(now.getTime() - 7 * 86_400_000).toISOString().slice(0, 10));
    if (!report || !banner.reportEmail) continue;
    await sendEmailAlert(banner.reportEmail, `${banner.title} haftalık reklam performansı`, campaignReportHtml(report, "Haftalık Reklam Performansı"));
    await db.update(hfBanners).set({ weeklyReportSentAt: now }).where(eq(hfBanners.id, banner.id));
    weeklySent += 1;
  }
  for (const banner of closing) {
    const report = await campaignPerformanceReport(banner.id);
    if (!report || !banner.reportEmail) continue;
    await sendEmailAlert(banner.reportEmail, `${banner.title} kampanya kapanış raporu`, campaignReportHtml(report, "Kampanya Kapanış Raporu"));
    await db.update(hfBanners).set({ closingReportSentAt: now }).where(eq(hfBanners.id, banner.id));
    closingSent += 1;
  }
  return { weeklySent, closingSent };
}

async function completeBannerAtTotalQuota(id: number): Promise<void> {
  await db.update(hfBanners).set({
    isActive: 0,
    lifecycleStatus: "completed",
  }).where(and(
    eq(hfBanners.id, id),
    or(
      sql`(${hfBanners.impressionLimit} IS NOT NULL AND ${hfBanners.impressions} >= ${hfBanners.impressionLimit})`,
      sql`(${hfBanners.clickLimit} IS NOT NULL AND ${hfBanners.clicks} >= ${hfBanners.clickLimit})`,
    ),
  ));
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
