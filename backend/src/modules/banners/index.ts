import type { FastifyInstance } from "fastify";
import type { FastifyRequest } from "fastify";
import { createHash } from "node:crypto";
import { z } from "zod";
import sanitizeHtml from "sanitize-html";
import { isBotUserAgent } from "@agro/shared-backend/modules/audit/helpers";
import { env } from "@/core/env";
import { requireAuth } from "@agro/shared-backend/middleware/auth";
import { getAuthUserId } from "@agro/shared-backend/modules/_shared";
import {
  type BannerContext,
  bannerStats,
  calendarInventory,
  createWaitlistItem,
  createBanner,
  deleteBanner,
  duplicateBanner,
  getBannerById,
  getAdSlot,
  incClick,
  incImpression,
  isAdsEnabled,
  findLayoutConflicts,
  layoutInventory,
  listAdSlots,
  listWaitlist,
  slotAvailability,
  listBanners,
  pickActiveForPosition,
  pickActiveRowsForPosition,
  pickTargetedActiveRows,
  replaceBannerTargets,
  listBannerTargets,
  updateBanner,
  updateAdSlot,
  updateWaitlistItem,
  validateBannerTargets,
  searchBannerTargetOptions,
  createAdPackage,
  createAdPayment,
  calculateAdPrice,
  getAdPaymentSummary,
  listOverdueAdPayments,
  listAdPackages,
  recordAdPriceOverride,
  updateAdPackage,
  validateBannerSource,
  frequencyBlockedBannerIds,
  recordVisitorImpression,
  acceptVisitorClick,
  bannerDistributionReport,
  bannerMetricsReport,
  recordBannerMetric,
  recordBannerConversion,
  bannerConversionReport,
  bannerRevenueReport,
  campaignPerformanceReport,
  createSelfServiceRequest,
  listSelfServiceCampaigns,
  listSelfServiceRequests,
  listAdminSelfServiceRequests,
  reviewSelfServiceRequest,
  firmAdAccess,
  listAdAudit,
  recordAdAudit,
} from "./repository";
import { getListingCreative } from "@/modules/listings/repo";

// Kanonik reklam pozisyonları (frontend slot key'leri ile birebir).
export const BANNER_POSITIONS = [
  "global_top",
  "global_footer",
  "home_ticker_below",
  "home_mid",
  "home_footer_top",
  "prices_top",
  "prices_sidebar",
  "analiz_inline",
  "analiz_sidebar",
  "urun_sidebar",
  "hal_sidebar",
  "listing_detail_sidebar",
  "firm_detail_sidebar",
  "firm_detail_footer",
] as const;

const positionSchema = z.enum(BANNER_POSITIONS);
const deviceSchema = z.enum(["all", "desktop", "mobile"]);
const typeSchema = z.enum(["image", "code"]);
const sourceTypeSchema = z.enum(["custom", "listing", "firm", "code"]);
const lifecycleSchema = z.enum(["draft", "proposal", "reserved", "payment_pending", "scheduled", "live", "completed", "cancelled", "problem", "archived"]);
const scopeTypeSchema = z.enum(["global", "page_type", "city", "district", "product", "category", "market", "firm", "listing"]);
const targetSchema = z.object({
  scopeType: scopeTypeSchema,
  scopeValue: z.string().trim().min(1).max(190).nullable().optional(),
}).superRefine((target, ctx) => {
  if (target.scopeType !== "global" && !target.scopeValue) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["scopeValue"], message: "Hedef degeri zorunlu" });
  }
});
const bannerContextSchema = z.object({
  position: positionSchema,
  page_type: z.string().trim().max(64).optional(),
  city: z.string().trim().max(96).optional(),
  district: z.string().trim().max(128).optional(),
  product: z.string().trim().max(128).optional(),
  category: z.string().trim().max(128).optional(),
  market: z.string().trim().max(128).optional(),
  firm: z.string().trim().max(32).optional(),
  listing: z.string().trim().max(32).optional(),
});
const conversionSchema = z.object({
  eventType: z.enum(["listing_view", "offer_submit", "phone_click", "whatsapp_click", "firm_contact", "directions_click", "favorite_add"]),
  entityType: z.enum(["listing", "firm", "product"]),
  entityId: z.union([z.string(), z.number()]).transform(String).pipe(z.string().min(1).max(128)),
});
const selfServiceRequestSchema = z.object({
  firmId: z.coerce.number().int().positive(),
  bannerId: z.coerce.number().int().positive().nullable().optional(),
  requestType: z.enum(["creative_change", "extension", "new_slot", "support"]),
  payload: z.record(z.unknown()).default({}),
  requesterNote: z.string().trim().max(2000).nullable().optional(),
});
function sanitizeAdHtml(value: string): string {
  return sanitizeHtml(value, {
    allowedTags: ["div", "span", "p", "strong", "small", "br", "a", "img"],
    allowedAttributes: {
      "*": ["class", "aria-label", "role"],
      a: ["href", "target", "rel", "title"],
      img: ["src", "alt", "width", "height", "loading"],
    },
    allowedSchemes: ["http", "https"],
    allowProtocolRelative: false,
    disallowedTagsMode: "discard",
    enforceHtmlBoundary: true,
    transformTags: {
      a: (_tagName, attribs) => ({
        tagName: "a",
        attribs: { ...attribs, rel: "sponsored nofollow noopener", target: "_blank" },
      }),
    },
  }).trim();
}
const adPackageSchema = z.object({
  slug: z.string().trim().min(2).max(96).regex(/^[a-z0-9-]+$/),
  name: z.string().trim().min(2).max(160),
  billingPeriod: z.enum(["daily", "weekly", "monthly", "custom"]),
  durationDays: z.coerce.number().int().min(1).max(3650),
  price: z.coerce.number().nonnegative(),
  currency: z.string().trim().min(3).max(8).default("TRY"),
  devices: z.array(deviceSchema).min(1).max(3).default(["all"]),
  impressionLimit: z.coerce.number().int().positive().nullable().optional(),
  clickLimit: z.coerce.number().int().positive().nullable().optional(),
  includesFirmProfile: z.boolean().default(false),
  discountPercent: z.coerce.number().min(0).max(100).default(0),
  customPriceAllowed: z.boolean().default(false),
  isActive: z.boolean().default(true),
  slotKeys: z.array(positionSchema).max(BANNER_POSITIONS.length).default([]),
});

export const bannerUpsertSchema = z.object({
  position: positionSchema,
  title: z.string().trim().min(2).max(190),
  advertiser: z.string().trim().max(160).nullable().optional(),
  notes: z.string().trim().max(500).nullable().optional(),
  type: typeSchema.optional(),
  sourceType: sourceTypeSchema.optional(),
  lifecycleStatus: lifecycleSchema.optional(),
  paymentStatus: z.enum(["unpaid", "partial", "paid", "waived", "refunded", "cancelled"]).optional(),
  paymentOverride: z.boolean().optional(),
  paymentOverrideReason: z.string().trim().max(500).nullable().optional(),
  totalAmount: z.coerce.number().nonnegative().transform((value) => value.toFixed(2)).optional(),
  paymentDueAt: z.string().datetime().nullable().optional(),
  paymentGraceHours: z.coerce.number().int().min(1).max(720).optional(),
  invoiceNumber: z.string().trim().max(120).nullable().optional(),
  invoiceUrl: z.string().trim().max(512).nullable().optional(),
  contractFileUrl: z.string().trim().max(512).nullable().optional(),
  creativeFileUrl: z.string().trim().max(512).nullable().optional(),
  creativeTemplate: z.enum(["image", "firm", "listing", "sponsorship", "leaderboard", "split", "mpu", "mobile"]).optional(),
  creativeConfig: z.object({
    backgroundColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
    textColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
    accentColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
    animation: z.boolean().optional(),
    logoUrl: z.string().trim().max(512).optional(),
    backgroundImageUrl: z.string().trim().max(512).optional(),
    description: z.string().trim().max(240).optional(),
    focalX: z.coerce.number().min(0).max(100).optional(),
    focalY: z.coerce.number().min(0).max(100).optional(),
    imageFit: z.enum(["cover", "contain"]).optional(),
    imageWidth: z.coerce.number().int().positive().optional(),
    imageHeight: z.coerce.number().int().positive().optional(),
    imageBytes: z.coerce.number().int().nonnegative().optional(),
  }).nullable().optional(),
  qualityOverrideReason: z.string().trim().max(500).nullable().optional(),
  listingId: z.coerce.number().int().positive().nullable().optional(),
  firmId: z.coerce.number().int().positive().nullable().optional(),
  sponsorshipId: z.coerce.number().int().positive().nullable().optional(),
  imageUrl: z.string().trim().max(512).nullable().optional(),
  alt: z.string().trim().max(255).nullable().optional(),
  linkUrl: z.string().trim().max(500).nullable().optional(),
  linkTarget: z.string().trim().max(20).optional(),
  rel: z.string().trim().max(64).optional(),
  code: z.string().max(20000).transform(sanitizeAdHtml)
    .refine((value) => value.length > 0, "Guvenli HTML etiketi bulunamadi")
    .nullable().optional(),
  caption: z.string().trim().max(300).nullable().optional(),
  ctaLabel: z.string().trim().max(60).nullable().optional(),
  device: deviceSchema.optional(),
  desktopRow: z.coerce.number().int().min(1).max(20).optional(),
  desktopColumns: z.coerce.number().int().min(1).max(3).optional(),
  weight: z.coerce.number().int().min(1).max(1000).optional(),
  impressionLimit: z.coerce.number().int().positive().nullable().optional(),
  clickLimit: z.coerce.number().int().positive().nullable().optional(),
  dailyImpressionLimit: z.coerce.number().int().positive().nullable().optional(),
  visitorDailyImpressionLimit: z.coerce.number().int().min(1).max(1000).optional(),
  visitorCampaignImpressionLimit: z.coerce.number().int().min(1).max(100000).optional(),
  experimentKey: z.string().trim().max(96).nullable().optional(),
  creativeVariant: z.string().trim().max(32).nullable().optional(),
  autoOptimize: z.boolean().optional(),
  minimumOptimizationImpressions: z.coerce.number().int().min(100).max(1000000).optional(),
  displayOrder: z.coerce.number().int().min(0).max(100000).optional(),
  isActive: z.boolean().optional(),
  startAt: z.string().datetime().nullable().optional(),
  endAt: z.string().datetime().nullable().optional(),
  reservationExpiresAt: z.string().datetime().nullable().optional(),
  salesOwner: z.string().trim().max(160).nullable().optional(),
  cancellationReason: z.string().trim().max(500).nullable().optional(),
  reportEmail: z.string().trim().email().max(255).nullable().optional(),
  weeklyReportEnabled: z.boolean().optional(),
  targets: z.array(targetSchema).max(30).optional(),
});

const patchSchema = bannerUpsertSchema.partial();
const liveStatuses = new Set(["scheduled", "live"]);
const transitionMap: Record<string, string[]> = {
  draft: ["proposal", "reserved", "payment_pending", "scheduled", "live", "cancelled", "archived"],
  proposal: ["draft", "reserved", "payment_pending", "cancelled", "archived"],
  reserved: ["draft", "proposal", "payment_pending", "scheduled", "live", "cancelled", "archived"],
  payment_pending: ["draft", "reserved", "scheduled", "live", "cancelled", "problem", "archived"],
  scheduled: ["draft", "live", "completed", "cancelled", "problem", "archived"],
  live: ["draft", "completed", "cancelled", "problem", "archived"],
  completed: ["scheduled", "live", "archived"],
  cancelled: ["draft", "proposal", "reserved", "archived"],
  problem: ["draft", "scheduled", "live", "cancelled", "archived"],
  archived: [],
};

export function normalizeBannerLifecycle<T extends { lifecycleStatus?: string; isActive?: boolean; startAt?: string | Date | null }>(input: T) {
  let lifecycleStatus = input.lifecycleStatus;
  if (!lifecycleStatus && input.isActive !== undefined) {
    const start = input.startAt ? new Date(input.startAt) : null;
    lifecycleStatus = input.isActive ? (start && start.getTime() > Date.now() ? "scheduled" : "live") : "draft";
  }
  return lifecycleStatus ? { ...input, lifecycleStatus, isActive: liveStatuses.has(lifecycleStatus) } : input;
}

export function applyReservationPaymentWindow<T extends {
  lifecycleStatus?: string;
  reservationExpiresAt?: string | Date | null;
  paymentDueAt?: string | Date | null;
  paymentGraceHours?: number;
}>(input: T): T {
  if (input.lifecycleStatus !== "reserved" || input.reservationExpiresAt) return input;
  const expiresAt = new Date(Date.now() + (input.paymentGraceHours ?? 72) * 3600000).toISOString();
  return { ...input, reservationExpiresAt: expiresAt, paymentDueAt: input.paymentDueAt ?? expiresAt };
}

export function bannerPaymentValidationError(input: { lifecycleStatus?: string; paymentStatus?: string; paymentOverride?: boolean; paymentOverrideReason?: string | null }) {
  if (!input.lifecycleStatus || !liveStatuses.has(input.lifecycleStatus)) return null;
  if (input.paymentStatus === "paid" || input.paymentStatus === "waived") return null;
  if (input.paymentOverride && input.paymentOverrideReason?.trim()) return null;
  return "Planlama veya yayin icin odeme tamamlanmali; istisna kullaniliyorsa gerekce zorunludur";
}

export function canTransitionBannerLifecycle(from: string, to: string): boolean {
  return transitionMap[from]?.includes(to) ?? false;
}

function asciiPdf(lines: string[]): Buffer {
  const clean = (value: string) => value
    .replace(/[çÇ]/g, (v) => v === "ç" ? "c" : "C").replace(/[ğĞ]/g, (v) => v === "ğ" ? "g" : "G")
    .replace(/[ıİ]/g, (v) => v === "ı" ? "i" : "I").replace(/[öÖ]/g, (v) => v === "ö" ? "o" : "O")
    .replace(/[şŞ]/g, (v) => v === "ş" ? "s" : "S").replace(/[üÜ]/g, (v) => v === "ü" ? "u" : "U")
    .replace(/[^\x20-\x7E]/g, "").replace(/([\\()])/g, "\\$1");
  const stream = ["BT", "/F1 11 Tf", "50 790 Td", ...lines.flatMap((line, index) => [
    index ? "0 -18 Td" : "",
    `(${clean(line)}) Tj`,
  ]).filter(Boolean), "ET"].join("\n");
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    `<< /Length ${Buffer.byteLength(stream)} >>\nstream\n${stream}\nendstream`,
  ];
  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  objects.forEach((object, index) => {
    offsets.push(Buffer.byteLength(pdf));
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });
  const xref = Buffer.byteLength(pdf);
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n${offsets.slice(1).map((offset) => `${String(offset).padStart(10, "0")} 00000 n `).join("\n")}\n`;
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return Buffer.from(pdf);
}

async function slotValidationError(input: { position: string; sourceType?: string; type?: string; desktopColumns?: number }) {
  const slot = await getAdSlot(input.position);
  if (!slot) return "Tanimli olmayan reklam slotu";
  if (!slot.isActive) return "Secilen reklam slotu satis ve yeni yayinlara kapali";
  const sourceType = input.sourceType ?? (input.type === "code" ? "code" : "custom");
  if (!slot.sourceTypes.includes(sourceType as "custom" | "listing" | "firm" | "code")) return "Bu slot secilen reklam kaynagini desteklemiyor";
  if ((input.desktopColumns ?? slot.desktopCapacity) > slot.desktopCapacity) return `Bu slot masaustunde en fazla ${slot.desktopCapacity} reklam destekliyor`;
  return null;
}

type QualityItem = { code: string; message: string; severity: "error" | "warning" };

function colorLuminance(hex: string) {
  const values = [1, 3, 5].map((index) => parseInt(hex.slice(index, index + 2), 16) / 255)
    .map((value) => value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
  return values[0] * 0.2126 + values[1] * 0.7152 + values[2] * 0.0722;
}

async function creativeQualityReport(input: {
  position: string; type?: string; sourceType?: string; imageUrl?: string | null; alt?: string | null;
  title?: string; caption?: string | null; ctaLabel?: string | null; linkUrl?: string | null; rel?: string;
  listingId?: number | null; firmId?: number | null; sponsorshipId?: number | null; endAt?: Date | string | null;
  creativeTemplate?: string; creativeConfig?: {
    backgroundColor?: string; textColor?: string; animation?: boolean;
    imageWidth?: number; imageHeight?: number; imageBytes?: number;
  } | null;
}) {
  const items: QualityItem[] = [];
  const config = input.creativeConfig ?? {};
  const slot = await getAdSlot(input.position);
  if (input.type !== "code" && input.sourceType === "custom" && !input.imageUrl && input.creativeTemplate === "image") {
    items.push({ code: "image_missing", message: "Standart görsel reklamda görsel zorunludur.", severity: "error" });
  }
  if (input.type !== "code" && !input.alt?.trim()) items.push({ code: "alt_missing", message: "Alternatif metin zorunludur.", severity: "error" });
  if (input.linkUrl) {
    try {
      const url = new URL(input.linkUrl);
      if (url.protocol !== "https:") items.push({ code: "link_https", message: "Hedef URL HTTPS kullanmalıdır.", severity: "error" });
    } catch {
      items.push({ code: "link_invalid", message: "Hedef URL geçerli değil.", severity: "error" });
    }
    if (input.linkUrl.startsWith("https://")) {
      try {
        const response = await fetch(input.linkUrl, { method: "HEAD", redirect: "follow", signal: AbortSignal.timeout(6000) });
        if (response.status >= 400) items.push({ code: "link_unreachable", message: `Hedef URL ${response.status} yanıtı verdi.`, severity: "warning" });
      } catch {
        items.push({ code: "link_unreachable", message: "Hedef URL erişim kontrolünde yanıt vermedi.", severity: "warning" });
      }
    }
  }
  if (input.linkUrl && input.rel !== "sponsored nofollow noopener") items.push({ code: "rel_invalid", message: "Sponsorlu link rel değeri eksik veya hatalı.", severity: "error" });
  if ((input.caption?.length ?? 0) > 90) items.push({ code: "headline_long", message: "Ana başlık mobil görünüm için fazla uzun.", severity: "warning" });
  if ((input.ctaLabel?.length ?? 0) > 28) items.push({ code: "cta_long", message: "CTA metni taşabilir.", severity: "warning" });
  if (config.imageBytes && config.imageBytes > 1_500_000) items.push({ code: "image_heavy", message: "Görsel 1,5 MB sınırını aşıyor.", severity: "warning" });
  const size = slot?.recommendedSize?.match(/(\d+)[x×](\d+)/i);
  if (size && config.imageWidth && config.imageHeight) {
    const recommendedWidth = Number(size[1]);
    const recommendedHeight = Number(size[2]);
    if (config.imageWidth < recommendedWidth || config.imageHeight < recommendedHeight) items.push({ code: "image_small", message: `Görsel önerilen ${recommendedWidth}×${recommendedHeight} ölçüsünden küçük.`, severity: "warning" });
    const ratioDiff = Math.abs(config.imageWidth / config.imageHeight - recommendedWidth / recommendedHeight) / (recommendedWidth / recommendedHeight);
    if (ratioDiff > 0.2) items.push({ code: "ratio_mismatch", message: "Görsel oranı slot oranıyla uyumlu değil.", severity: "warning" });
  }
  if (config.backgroundColor && config.textColor) {
    const left = colorLuminance(config.backgroundColor);
    const right = colorLuminance(config.textColor);
    const contrast = (Math.max(left, right) + 0.05) / (Math.min(left, right) + 0.05);
    if (contrast < 4.5) items.push({ code: "low_contrast", message: "Metin ve arka plan kontrastı okunabilirlik için düşük.", severity: "warning" });
  }
  if (input.creativeTemplate === "leaderboard" && slot?.mobileBehavior !== "hide") items.push({ code: "mobile_layout", message: "Leaderboard mobilde ayrıca kontrol edilmelidir.", severity: "warning" });
  if (config.animation) items.push({ code: "animation_review", message: "Animasyon reduced-motion modunda kapatılır; yayın öncesi hızı gözle kontrol edin.", severity: "warning" });
  items.push(...await validateBannerSource(input));
  return {
    status: items.some((item) => item.severity === "error") ? "error" : items.length ? "warning" : "passed",
    items,
  };
}

const listQuerySchema = z.object({
  position: positionSchema.optional(),
  is_active: z.enum(["0", "1"]).optional(),
  q: z.string().trim().min(1).max(128).optional(),
  limit: z.coerce.number().int().min(1).max(500).optional(),
  offset: z.coerce.number().int().min(0).optional(),
});

function publicBanner(row: NonNullable<Awaited<ReturnType<typeof pickActiveForPosition>>>) {
  return {
    id: row.id,
    position: row.position,
    type: row.type,
    sourceType: row.sourceType,
    listingId: row.listingId,
    firmId: row.firmId,
    title: row.title,
    advertiser: row.advertiser,
    imageUrl: row.imageUrl,
    alt: row.alt ?? row.title,
    linkUrl: row.linkUrl,
    linkTarget: row.linkTarget,
    rel: row.rel,
    code: row.code ? sanitizeAdHtml(row.code) : null,
    caption: row.caption,
    ctaLabel: row.ctaLabel,
    creativeTemplate: row.creativeTemplate,
    creativeConfig: row.creativeConfig,
    device: row.device,
    desktopRow: row.desktopRow,
    desktopColumns: row.desktopColumns,
  };
}

async function publicBannerWithSource(row: NonNullable<Awaited<ReturnType<typeof pickActiveForPosition>>>) {
  const base = publicBanner(row);
  if (row.sourceType !== "listing" || !row.listingId) return base;
  const listing = await getListingCreative(row.listingId);
  if (!listing || listing.status !== "approved" || listing.isSuspicious || listing.validUntil < new Date().toISOString().slice(0, 10)) return null;
  return {
    ...base,
    listing: {
      id: listing.id,
      slug: listing.slug,
      title: listing.title,
      productName: listing.productName,
      citySlug: listing.citySlug,
      priceMin: listing.priceMin,
      priceMax: listing.priceMax,
      priceUnit: listing.priceUnit,
      currency: listing.currency,
      imageUrl: listing.images[0] ?? null,
    },
  };
}

function anonymousVisitorHash(req: FastifyRequest): string {
  const forwarded = req.headers["x-forwarded-for"];
  const ip = (Array.isArray(forwarded) ? forwarded[0] : forwarded)?.split(",")[0]?.trim() || req.ip || "";
  const ua = req.headers["user-agent"] || "";
  return createHash("sha256").update(`${ip}|${ua}|${env.JWT_SECRET}|ads`).digest("hex");
}

function bannerPageHash(position: string, query: Record<string, unknown>): string {
  const page = Object.entries(query).sort(([a], [b]) => a.localeCompare(b)).map(([key, value]) => `${key}=${value ?? ""}`).join("&");
  return createHash("sha256").update(`${position}|${page}`).digest("hex");
}

export function adDeviceFromUserAgent(userAgent?: string): "desktop" | "mobile" {
  return /android|iphone|ipad|mobile/i.test(userAgent || "") ? "mobile" : "desktop";
}

function requestDevice(req: FastifyRequest): "desktop" | "mobile" {
  return adDeviceFromUserAgent(req.headers["user-agent"]);
}

export function isNonHumanAdTraffic(headers: Record<string, string | string[] | undefined>): boolean {
  const rawUserAgent = headers["user-agent"];
  const ua = Array.isArray(rawUserAgent) ? rawUserAgent[0] : rawUserAgent;
  if (!ua || isBotUserAgent(ua)) return true;
  const botScore = Number(headers["x-bot-score"] ?? headers["cf-bot-score"] ?? 100);
  return headers["cf-worker"] !== undefined || (Number.isFinite(botScore) && botScore < 30);
}

function isNonHumanTraffic(req: FastifyRequest): boolean {
  return isNonHumanAdTraffic(req.headers);
}

export function safeAdDestination(value: string): string | null {
  const destination = value.trim();
  if (destination.startsWith("/") && !destination.startsWith("//") && !destination.includes("\\")) return destination;
  try {
    const url = new URL(destination);
    if (!["http:", "https:"].includes(url.protocol) || url.username || url.password) return null;
    return url.toString();
  } catch {
    return null;
  }
}

export function adMetricScope(query: Record<string, unknown>): string {
  const preferred = ["listing", "firm", "market", "product", "category", "district", "city", "page_type"];
  const key = preferred.find((item) => query[item] !== undefined && query[item] !== "");
  return key ? `${key}:${String(query[key])}` : "global";
}

function auditSnapshot(value: unknown): Record<string, unknown> | null {
  if (!value) return null;
  return JSON.parse(JSON.stringify(value)) as Record<string, unknown>;
}

async function frequencyAwareRows(req: FastifyRequest, position: string, context: BannerContext) {
  const visitorHash = anonymousVisitorHash(req);
  const pageHash = bannerPageHash(position, (req.query ?? {}) as Record<string, unknown>);
  const candidates = await pickTargetedActiveRows(position, context);
  const blocked = await frequencyBlockedBannerIds(candidates, visitorHash, pageHash);
  const rows = await pickTargetedActiveRows(position, context, blocked);
  return { rows, visitorHash, pageHash };
}

export async function registerBanners(app: FastifyInstance) {
  app.get("/banners/self-service", { onRequest: [requireAuth] }, async (req, reply) => {
    const userId = getAuthUserId(req);
    const [campaignData, requests] = await Promise.all([
      listSelfServiceCampaigns(userId),
      listSelfServiceRequests(userId),
    ]);
    return reply.send({ ...campaignData, requests });
  });

  app.post("/banners/self-service/requests", { onRequest: [requireAuth] }, async (req, reply) => {
    const parsed = selfServiceRequestSchema.safeParse(req.body ?? {});
    if (!parsed.success) return reply.status(400).send({ error: "Gecersiz talep", issues: parsed.error.issues });
    const id = await createSelfServiceRequest(getAuthUserId(req), parsed.data);
    if (!id) return reply.status(403).send({ error: "Bu firma veya kampanya icin yetkiniz yok" });
    return reply.status(201).send({ id, status: "pending" });
  });

  app.get<{ Params: { id: string } }>("/banners/self-service/:id/report.pdf", { onRequest: [requireAuth] }, async (req, reply) => {
    const id = Number(req.params.id);
    const access = await firmAdAccess(getAuthUserId(req));
    const banner = await getBannerById(id);
    const report = await campaignPerformanceReport(id);
    if (!report || !banner || !access.some((item) => item.firm.id === banner.firmId)) {
      return reply.status(404).send({ error: "Kampanya bulunamadi" });
    }
    const t = report.totals;
    const pdf = asciiPdf([
      "HALDEFIYAT.COM REKLAM PERFORMANS RAPORU",
      `Kampanya: ${report.banner.title}`, `Donem: ${report.from} - ${report.to}`,
      `Gosterim: ${t.impressions}  Tekil: ${t.uniqueImpressions}`,
      `Tiklama: ${t.clicks}  CTR: %${(t.ctr * 100).toFixed(2)}`,
      `Donusum: ${t.conversions}`,
      `CPM: ${t.cpm?.toFixed(2) ?? "-"}  CPC: ${t.cpc?.toFixed(2) ?? "-"}  CPA: ${t.cpa?.toFixed(2) ?? "-"}`,
      "", "Bu rapor Haldefiyat.com reklam sistemi tarafindan olusturulmustur.",
    ]);
    reply.header("Content-Type", "application/pdf");
    reply.header("Content-Disposition", `attachment; filename="reklam-performans-${id}.pdf"`);
    return reply.send(pdf);
  });

  app.post("/banners/conversion", async (req, reply) => {
    const parsed = conversionSchema.safeParse(req.body ?? {});
    if (!parsed.success) return reply.status(400).send({ error: "Gecersiz donusum" });
    const signed = req.cookies.hf_ad_campaign;
    if (!signed) return reply.status(204).send();
    const unsigned = req.unsignCookie(signed);
    if (!unsigned.valid || !unsigned.value) return reply.status(204).send();
    try {
      const attribution = JSON.parse(unsigned.value) as { bannerId?: number; position?: string };
      if (!attribution.bannerId || !attribution.position) return reply.status(204).send();
      await recordBannerConversion({
        bannerId: attribution.bannerId,
        sourcePosition: attribution.position,
        visitorHash: anonymousVisitorHash(req),
        ...parsed.data,
      });
    } catch {
      return reply.status(204).send();
    }
    return reply.status(204).send();
  });
  // Slot için aktif banner döndürür; reklam kapalıysa veya banner yoksa null.
  app.get("/banners", async (req, reply) => {
    const parsed = bannerContextSchema.safeParse(req.query);
    if (!parsed.success) return reply.status(400).send({ error: "Gecersiz pozisyon" });
    if (!(await isAdsEnabled())) return reply.send({ data: null });
    const selection = await frequencyAwareRows(req, parsed.data.position, {
      page_type: parsed.data.page_type,
      city: parsed.data.city,
      district: parsed.data.district,
      product: parsed.data.product,
      category: parsed.data.category,
      market: parsed.data.market,
      firm: parsed.data.firm,
      listing: parsed.data.listing,
    });
    const [row] = selection.rows;
    if (!row) return reply.send({ data: null });
    if (!isNonHumanTraffic(req)) {
      void incImpression(row.id);
      void recordVisitorImpression(row.id, selection.visitorHash, selection.pageHash);
      void recordBannerMetric(row.id, "impression", selection.visitorHash, requestDevice(req), adMetricScope(parsed.data));
    }
    reply.header("Cache-Control", "private, no-store");
    return reply.send({ data: publicBanner(row) });
  });

  app.get("/banners/grid", async (req, reply) => {
    const parsed = bannerContextSchema.safeParse(req.query);
    if (!parsed.success) return reply.status(400).send({ error: "Gecersiz pozisyon" });
    if (!(await isAdsEnabled())) return reply.send({ data: [] });
    const selection = await frequencyAwareRows(req, parsed.data.position, {
      page_type: parsed.data.page_type,
      city: parsed.data.city,
      district: parsed.data.district,
      product: parsed.data.product,
      category: parsed.data.category,
      market: parsed.data.market,
      firm: parsed.data.firm,
      listing: parsed.data.listing,
    });
    const rows = selection.rows;
    const enriched = (await Promise.all(rows.map(publicBannerWithSource))).filter(Boolean);
    for (const row of isNonHumanTraffic(req) ? [] : rows) {
      void incImpression(row.id);
      void recordVisitorImpression(row.id, selection.visitorHash, selection.pageHash);
      void recordBannerMetric(row.id, "impression", selection.visitorHash, requestDevice(req), adMetricScope(parsed.data));
    }
    reply.header("Cache-Control", "private, no-store");
    return reply.send({ data: enriched });
  });

  // Tıklama sayar + hedefe 302 yönlendirir (görünür <a href> bu endpoint'e gider).
  app.get<{ Params: { id: string } }>("/banners/:id/click", {
    config: { rateLimit: { max: 30, timeWindow: "1 minute" } },
  }, async (req, reply) => {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return reply.status(400).send({ error: "Gecersiz id" });
    const row = await getBannerById(id);
    if (!row) return reply.status(404).send({ error: "Bulunamadi" });
    let destination = row.linkUrl;
    if (row.sourceType === "listing" && row.listingId) {
      const listing = await getListingCreative(row.listingId);
      if (listing?.status === "approved") destination = `/ilan/${listing.slug}`;
    }
    if (!destination) return reply.status(404).send({ error: "Bulunamadi" });
    destination = safeAdDestination(destination);
    if (!destination) return reply.status(400).send({ error: "Guvenli olmayan reklam hedefi" });
    const visitorHash = anonymousVisitorHash(req);
    if (!isNonHumanTraffic(req) && await acceptVisitorClick(id, visitorHash)) {
      void incClick(id);
      void recordBannerMetric(id, "click", visitorHash, requestDevice(req), `slot:${row.position}`);
    }
    reply.setCookie("hf_ad_campaign", JSON.stringify({ bannerId: row.id, position: row.position }), {
      signed: true, httpOnly: true, sameSite: "lax", secure: env.NODE_ENV === "production",
      path: "/", maxAge: 60 * 60 * 24 * 30,
    });
    return reply.redirect(destination, 302);
  });
}

export async function registerBannersAdmin(app: FastifyInstance) {
  app.get<{ Querystring: { status?: string } }>("/banners/self-service-requests", async (req, reply) => {
    return reply.send({ items: await listAdminSelfServiceRequests(req.query.status) });
  });

  app.patch<{ Params: { id: string } }>("/banners/self-service-requests/:id", async (req, reply) => {
    const parsed = z.object({
      status: z.enum(["approved", "rejected", "revision_requested"]),
      reviewNote: z.string().trim().min(2).max(2000),
    }).safeParse(req.body ?? {});
    if (!parsed.success) return reply.status(400).send({ error: "Karar ve inceleme notu zorunlu" });
    const requestBefore = (await listAdminSelfServiceRequests()).find((item) => item.id === Number(req.params.id)) ?? null;
    const result = await reviewSelfServiceRequest(Number(req.params.id), {
      ...parsed.data,
      reviewedBy: getAuthUserId(req),
    });
    if (!result) return reply.status(409).send({ error: "Talep bulunamadi veya daha once islendi" });
    await recordAdAudit({
      entityType: "request", entityId: result.id, action: `review_${parsed.data.status}`,
      actorUserId: getAuthUserId(req), beforeData: auditSnapshot(requestBefore),
      afterData: auditSnapshot({ ...result, status: parsed.data.status, reviewNote: parsed.data.reviewNote }),
      reason: parsed.data.reviewNote,
    });
    return reply.send({ item: result });
  });
  app.get("/banners/metrics", async (req, reply) => {
    const parsed = z.object({
      from: z.string().date().default(new Date(Date.now() - 29 * 86_400_000).toISOString().slice(0, 10)),
      to: z.string().date().default(new Date().toISOString().slice(0, 10)),
      bannerId: z.coerce.number().int().positive().optional(),
    }).safeParse(req.query);
    if (!parsed.success) return reply.status(400).send({ error: "Gecersiz tarih araligi" });
    return reply.send({ items: await bannerMetricsReport(parsed.data.from, parsed.data.to, parsed.data.bannerId) });
  });
  app.get("/banners/conversions", async (req, reply) => {
    const parsed = z.object({
      from: z.string().date().default(new Date(Date.now() - 29 * 86_400_000).toISOString().slice(0, 10)),
      to: z.string().date().default(new Date().toISOString().slice(0, 10)),
      bannerId: z.coerce.number().int().positive().optional(),
    }).safeParse(req.query);
    if (!parsed.success) return reply.status(400).send({ error: "Gecersiz tarih araligi" });
    return reply.send({ items: await bannerConversionReport(parsed.data.from, parsed.data.to, parsed.data.bannerId) });
  });
  app.get("/banners/revenue", async (req, reply) => {
    const parsed = z.object({
      from: z.string().date().default(new Date(Date.now() - 29 * 86_400_000).toISOString().slice(0, 10)),
      to: z.string().date().default(new Date().toISOString().slice(0, 10)),
    }).safeParse(req.query);
    if (!parsed.success) return reply.status(400).send({ error: "Gecersiz tarih araligi" });
    return reply.send({ data: await bannerRevenueReport(parsed.data.from, parsed.data.to) });
  });
  app.get("/banners/distribution", async (_req, reply) => reply.send({ items: await bannerDistributionReport() }));
  app.get("/banners", async (req, reply) => {
    const parsed = listQuerySchema.safeParse(req.query);
    if (!parsed.success) return reply.status(400).send({ error: "Gecersiz sorgu" });
    const { position, is_active, q, limit, offset } = parsed.data;
    const items = await listBanners({
      position,
      isActive: is_active === undefined ? undefined : is_active === "1",
      q,
      limit,
      offset,
    });
    return reply.send({ items, positions: BANNER_POSITIONS });
  });

  app.get("/banners/stats", async (_req, reply) => {
    return reply.send({ items: await bannerStats() });
  });

  app.get("/banners/inventory", async (req, reply) => {
    const parsed = z.object({ position: positionSchema.optional() }).safeParse(req.query);
    if (!parsed.success) return reply.status(400).send({ error: "Gecersiz sorgu" });
    return reply.send({ items: await layoutInventory(parsed.data.position) });
  });

  app.get("/banners/slots", async (_req, reply) => {
    return reply.send({ items: await listAdSlots() });
  });

  app.patch<{ Params: { slotKey: string } }>("/banners/slots/:slotKey", async (req, reply) => {
    const parsed = z.object({
      desktopCapacity: z.coerce.number().int().min(1).max(3).optional(),
      mobileCapacity: z.coerce.number().int().min(0).max(3).optional(),
      mobileBehavior: z.enum(["stack", "hide", "single", "scroll"]).optional(),
      deliveryMode: z.enum(["fixed", "rotation"]).optional(),
      baseDailyPrice: z.coerce.number().positive().max(100000).transform((value) => value.toFixed(2)).optional(),
      trafficMultiplier: z.coerce.number().min(0.1).max(10).transform((value) => value.toFixed(3)).optional(),
      visibilityMultiplier: z.coerce.number().min(0.1).max(10).transform((value) => value.toFixed(3)).optional(),
      desktopMultiplier: z.coerce.number().min(0.1).max(10).transform((value) => value.toFixed(3)).optional(),
      mobileMultiplier: z.coerce.number().min(0.1).max(10).transform((value) => value.toFixed(3)).optional(),
      isActive: z.boolean().optional(),
    }).safeParse(req.body ?? {});
    if (!parsed.success) return reply.status(400).send({ error: "Gecersiz slot ayarlari", issues: parsed.error.issues });
    const before = await getAdSlot(req.params.slotKey);
    if (!(await updateAdSlot(req.params.slotKey, parsed.data))) return reply.status(404).send({ error: "Slot bulunamadi" });
    const after = await getAdSlot(req.params.slotKey);
    await recordAdAudit({
      entityType: "slot", entityId: req.params.slotKey, action: "updated",
      actorUserId: getAuthUserId(req), beforeData: auditSnapshot(before), afterData: auditSnapshot(after),
      isFinancial: parsed.data.baseDailyPrice !== undefined,
    });
    return reply.send({ ok: true });
  });

  app.get("/banners/calendar", async (req, reply) => {
    const parsed = z.object({
      from: z.string().date(),
      to: z.string().date(),
    }).safeParse(req.query);
    if (!parsed.success) return reply.status(400).send({ error: "Gecersiz tarih araligi" });
    const from = new Date(`${parsed.data.from}T00:00:00.000Z`);
    const to = new Date(`${parsed.data.to}T23:59:59.999Z`);
    const days = Math.ceil((to.getTime() - from.getTime()) / 86400000);
    if (days < 0 || days > 93) return reply.status(400).send({ error: "Tarih araligi en fazla 93 gun olabilir" });
    return reply.send(await calendarInventory(from, to));
  });

  app.get("/banners/availability", async (req, reply) => {
    const parsed = z.object({
      at: z.string().date(),
      device: deviceSchema.optional(),
      horizonDays: z.coerce.number().int().min(1).max(365).optional(),
    }).safeParse(req.query);
    if (!parsed.success) return reply.status(400).send({ error: "Gecersiz uygunluk sorgusu" });
    const at = new Date(`${parsed.data.at}T00:00:00.000Z`);
    const items = await slotAvailability(at, parsed.data.device, parsed.data.horizonDays);
    return reply.send({ at: parsed.data.at, items });
  });

  app.get("/banners/target-options", async (req, reply) => {
    const parsed = z.object({
      type: scopeTypeSchema,
      q: z.string().trim().max(100).optional(),
    }).safeParse(req.query);
    if (!parsed.success) return reply.status(400).send({ error: "Gecersiz hedef aramasi" });
    return reply.send({ items: await searchBannerTargetOptions(parsed.data.type, parsed.data.q) });
  });

  app.get("/banners/packages", async (_req, reply) => reply.send({ items: await listAdPackages() }));

  app.post("/banners/packages", async (req, reply) => {
    const parsed = adPackageSchema.safeParse(req.body ?? {});
    if (!parsed.success) return reply.status(400).send({ error: "Gecersiz paket alanlari", issues: parsed.error.issues });
    const id = await createAdPackage({
      ...parsed.data,
      price: parsed.data.price.toFixed(2),
      discountPercent: parsed.data.discountPercent.toFixed(2),
    });
    await recordAdAudit({
      entityType: "package", entityId: id, action: "created", actorUserId: getAuthUserId(req),
      afterData: auditSnapshot(parsed.data), isFinancial: true,
    });
    return reply.status(201).send({ id });
  });

  app.patch<{ Params: { id: string } }>("/banners/packages/:id", async (req, reply) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) return reply.status(400).send({ error: "Gecersiz paket id" });
    const parsed = adPackageSchema.partial().safeParse(req.body ?? {});
    if (!parsed.success) return reply.status(400).send({ error: "Gecersiz paket alanlari", issues: parsed.error.issues });
    const before = (await listAdPackages()).find((item) => item.id === id) ?? null;
    const ok = await updateAdPackage(id, {
      ...parsed.data,
      price: parsed.data.price === undefined ? undefined : parsed.data.price.toFixed(2),
      discountPercent: parsed.data.discountPercent === undefined ? undefined : parsed.data.discountPercent.toFixed(2),
    });
    if (ok) {
      const after = (await listAdPackages()).find((item) => item.id === id) ?? null;
      await recordAdAudit({
        entityType: "package", entityId: id, action: "updated", actorUserId: getAuthUserId(req),
        beforeData: auditSnapshot(before), afterData: auditSnapshot(after),
        isFinancial: parsed.data.price !== undefined || parsed.data.discountPercent !== undefined,
      });
    }
    return reply.send({ ok });
  });

  app.post("/banners/pricing/quote", async (req, reply) => {
    const parsed = z.object({
      slotKey: positionSchema,
      device: deviceSchema.default("all"),
      durationDays: z.coerce.number().int().min(1).max(3650),
      startAt: z.string().date().nullable().optional(),
      targetTypes: z.array(scopeTypeSchema).max(9).default([]),
      manualPrice: z.coerce.number().nonnegative().optional(),
      manualDiscountPercent: z.coerce.number().min(0).max(100).optional(),
      overrideReason: z.string().trim().min(5).max(500).optional(),
      bannerId: z.coerce.number().int().positive().optional(),
    }).superRefine((value, ctx) => {
      if ((value.manualPrice !== undefined || value.manualDiscountPercent !== undefined) && !value.overrideReason) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["overrideReason"], message: "Manuel fiyat veya indirim gerekcesi zorunlu" });
      }
    }).safeParse(req.body ?? {});
    if (!parsed.success) return reply.status(400).send({ error: "Gecersiz fiyat hesaplama alanlari", issues: parsed.error.issues });
    const quote = await calculateAdPrice(parsed.data);
    if (!quote) return reply.status(404).send({ error: "Slot bulunamadi" });
    let overrideId: number | null = null;
    if (parsed.data.manualPrice !== undefined || parsed.data.manualDiscountPercent !== undefined) {
      overrideId = await recordAdPriceOverride(parsed.data, quote);
      await recordAdAudit({
        entityType: "pricing", entityId: parsed.data.bannerId ?? overrideId, action: "manual_override",
        actorUserId: getAuthUserId(req), afterData: auditSnapshot({ input: parsed.data, quote }),
        reason: parsed.data.overrideReason ?? null, isFinancial: true,
      });
    }
    return reply.send({ ...quote, overrideId });
  });

  app.get<{ Params: { id: string } }>("/banners/:id/payments", async (req, reply) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) return reply.status(400).send({ error: "Gecersiz banner id" });
    const summary = await getAdPaymentSummary(id);
    if (!summary) return reply.status(404).send({ error: "Banner bulunamadi" });
    return reply.send(summary);
  });

  app.post<{ Params: { id: string } }>("/banners/:id/payments", async (req, reply) => {
    const bannerId = Number(req.params.id);
    if (!Number.isInteger(bannerId) || bannerId <= 0) return reply.status(400).send({ error: "Gecersiz banner id" });
    const parsed = z.object({
      transactionType: z.enum(["payment", "refund"]).default("payment"),
      amount: z.coerce.number().positive(),
      currency: z.string().trim().min(3).max(8).default("TRY"),
      paymentMethod: z.enum(["cash", "bank_transfer", "card", "other"]),
      paidAt: z.string().datetime(),
      referenceNumber: z.string().trim().max(160).nullable().optional(),
      notes: z.string().trim().max(500).nullable().optional(),
    }).safeParse(req.body ?? {});
    if (!parsed.success) return reply.status(400).send({ error: "Gecersiz odeme alanlari", issues: parsed.error.issues });
    const current = await getAdPaymentSummary(bannerId);
    if (!current) return reply.status(404).send({ error: "Banner bulunamadi" });
    if (parsed.data.transactionType === "refund" && parsed.data.amount > current.collectedAmount) {
      return reply.status(409).send({ error: "Iade tutari net tahsilati asamaz" });
    }
    const id = await createAdPayment({
      ...parsed.data,
      bannerId,
      amount: parsed.data.amount.toFixed(2),
    });
    const summary = await getAdPaymentSummary(bannerId);
    await recordAdAudit({
      entityType: "payment", entityId: bannerId, action: `${parsed.data.transactionType}_${id}`,
      actorUserId: getAuthUserId(req), beforeData: auditSnapshot(current), afterData: auditSnapshot(summary),
      reason: parsed.data.notes ?? parsed.data.referenceNumber ?? null, isFinancial: true,
    });
    return reply.status(201).send({ id, summary });
  });

  app.get("/banners/payment-alerts", async (_req, reply) => {
    return reply.send({ items: await listOverdueAdPayments() });
  });

  app.get<{ Params: { id: string } }>("/banners/:id/documents/summary", async (req, reply) => {
    const id = Number(req.params.id);
    const banner = await getBannerById(id);
    if (!banner) return reply.status(404).send({ error: "Banner bulunamadi" });
    const payments = await getAdPaymentSummary(id);
    return reply.send({
      campaign: {
        id: banner.id, title: banner.title, advertiser: banner.advertiser, position: banner.position,
        device: banner.device, startAt: banner.startAt, endAt: banner.endAt, lifecycleStatus: banner.lifecycleStatus,
      },
      financial: payments,
      documents: {
        invoiceNumber: banner.invoiceNumber, invoiceUrl: banner.invoiceUrl,
        contractFileUrl: banner.contractFileUrl, creativeFileUrl: banner.creativeFileUrl,
      },
    });
  });

  app.get<{ Params: { id: string } }>("/banners/:id/documents/proposal.pdf", async (req, reply) => {
    const id = Number(req.params.id);
    const banner = await getBannerById(id);
    if (!banner) return reply.status(404).send({ error: "Banner bulunamadi" });
    const payments = await getAdPaymentSummary(id);
    const pdf = asciiPdf([
      "HALDEFIYAT.COM REKLAM TEKLIFI",
      `Teklif No: HF-REK-${String(id).padStart(6, "0")}`,
      `Reklam veren: ${banner.advertiser ?? "-"}`,
      `Kampanya: ${banner.title}`,
      `Slot: ${banner.position} / Cihaz: ${banner.device}`,
      `Yayin: ${banner.startAt?.toISOString().slice(0, 10) ?? "-"} - ${banner.endAt?.toISOString().slice(0, 10) ?? "-"}`,
      `Toplam: ${payments?.totalAmount.toFixed(2) ?? "0.00"} TRY`,
      `Tahsil edilen: ${payments?.collectedAmount.toFixed(2) ?? "0.00"} TRY`,
      `Kalan: ${payments?.remainingAmount.toFixed(2) ?? "0.00"} TRY`,
      `Olusturma tarihi: ${new Date().toISOString().slice(0, 10)}`,
      "",
      "Bu belge Haldefiyat.com reklam yonetim sistemi tarafindan olusturulmustur.",
    ]);
    reply.header("Content-Type", "application/pdf");
    reply.header("Content-Disposition", `attachment; filename="reklam-teklifi-${id}.pdf"`);
    return reply.send(pdf);
  });

  app.get<{ Params: { id: string }; Querystring: { from?: string; to?: string } }>("/banners/:id/performance", async (req, reply) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) return reply.status(400).send({ error: "Gecersiz banner id" });
    const report = await campaignPerformanceReport(id, req.query.from, req.query.to);
    if (!report) return reply.status(404).send({ error: "Banner bulunamadi" });
    return reply.send({ data: report });
  });

  app.get<{ Params: { id: string }; Querystring: { from?: string; to?: string } }>("/banners/:id/performance.csv", async (req, reply) => {
    const id = Number(req.params.id);
    const report = await campaignPerformanceReport(id, req.query.from, req.query.to);
    if (!report) return reply.status(404).send({ error: "Banner bulunamadi" });
    const csv = (value: unknown) => `"${String(value ?? "").replaceAll('"', '""')}"`;
    const rows = [
      ["Kampanya", report.banner.title],
      ["Reklam veren", report.banner.advertiser ?? ""],
      ["Tarih araligi", `${report.from} - ${report.to}`],
      ["Gosterim", report.totals.impressions],
      ["Tekil gosterim", report.totals.uniqueImpressions],
      ["Tiklama", report.totals.clicks],
      ["Tekil tiklama", report.totals.uniqueClicks],
      ["CTR", `${(report.totals.ctr * 100).toFixed(2)}%`],
      ["Donusum", report.totals.conversions],
      ["Kampanya bedeli", report.totals.revenue.toFixed(2)],
      ["Tahsilat", report.totals.collected.toFixed(2)],
      ["CPM", report.totals.cpm?.toFixed(2) ?? ""],
      ["CPC", report.totals.cpc?.toFixed(2) ?? ""],
      ["CPA", report.totals.cpa?.toFixed(2) ?? ""],
      [],
      ["Donusum turu", "Varlik turu", "Adet"],
      ...report.conversions.map((item) => [item.eventType, item.entityType, item.conversions]),
    ];
    reply.header("Content-Type", "text/csv; charset=utf-8");
    reply.header("Content-Disposition", `attachment; filename="kampanya-performans-${id}.csv"`);
    return reply.send(`\uFEFF${rows.map((row) => row.map(csv).join(",")).join("\n")}`);
  });

  app.get<{ Params: { id: string }; Querystring: { from?: string; to?: string } }>("/banners/:id/performance.pdf", async (req, reply) => {
    const id = Number(req.params.id);
    const report = await campaignPerformanceReport(id, req.query.from, req.query.to);
    if (!report) return reply.status(404).send({ error: "Banner bulunamadi" });
    const t = report.totals;
    const pdf = asciiPdf([
      "HALDEFIYAT.COM KAMPANYA PERFORMANS RAPORU",
      `Kampanya: ${report.banner.title}`,
      `Reklam veren: ${report.banner.advertiser ?? "-"}`,
      `Slot: ${report.banner.position}`,
      `Rapor donemi: ${report.from} - ${report.to}`,
      "",
      `Gosterim / tekil: ${t.impressions} / ${t.uniqueImpressions}`,
      `Tiklama / tekil: ${t.clicks} / ${t.uniqueClicks}`,
      `CTR: %${(t.ctr * 100).toFixed(2)}  Donusum: ${t.conversions}`,
      `Kampanya bedeli: ${t.revenue.toFixed(2)} TRY  Tahsilat: ${t.collected.toFixed(2)} TRY`,
      `CPM: ${t.cpm?.toFixed(2) ?? "-"}  CPC: ${t.cpc?.toFixed(2) ?? "-"}  CPA: ${t.cpa?.toFixed(2) ?? "-"}`,
      "",
      ...Object.entries(report.devices).map(([device, value]) => `${device}: ${value.impressions} gosterim / ${value.clicks} tiklama`),
      ...report.conversions.map((item) => `${item.eventType}: ${item.conversions} donusum`),
      "",
      `Olusturma tarihi: ${new Date().toISOString().slice(0, 10)}`,
    ]);
    reply.header("Content-Type", "application/pdf");
    reply.header("Content-Disposition", `attachment; filename="kampanya-performans-${id}.pdf"`);
    return reply.send(pdf);
  });

  app.get<{ Params: { id: string } }>("/banners/:id/quality", async (req, reply) => {
    const banner = await getBannerById(Number(req.params.id));
    if (!banner) return reply.status(404).send({ error: "Banner bulunamadi" });
    return reply.send(await creativeQualityReport(banner));
  });

  app.get<{ Params: { id: string } }>("/banners/:id/audit", async (req, reply) => {
    return reply.send({ items: await listAdAudit("banner", req.params.id) });
  });

  app.get<{ Params: { id: string } }>("/banners/:id", async (req, reply) => {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return reply.status(400).send({ error: "Gecersiz id" });
    const row = await getBannerById(id);
    if (!row) return reply.status(404).send({ error: "Bulunamadi" });
    const targets = (await listBannerTargets([id])).get(id) ?? [];
    return reply.send({ data: { ...row, targets } });
  });

  app.post("/banners", async (req, reply) => {
    const parsed = bannerUpsertSchema.safeParse(req.body ?? {});
    if (!parsed.success) return reply.status(400).send({ error: "Gecersiz alanlar", issues: parsed.error.issues });
    const normalized = applyReservationPaymentWindow(normalizeBannerLifecycle(parsed.data));
    const invalidTargets = parsed.data.targets ? await validateBannerTargets(parsed.data.targets) : [];
    if (invalidTargets.length) return reply.status(400).send({ error: "Gecersiz reklam hedefi", invalidTargets });
    const paymentError = bannerPaymentValidationError(normalized);
    if (paymentError) return reply.status(409).send({ error: paymentError });
    if (normalized.lifecycleStatus && liveStatuses.has(normalized.lifecycleStatus)) {
      const quality = await creativeQualityReport(normalized);
      if (quality.status === "error") return reply.status(409).send({ error: "Kritik kreatif kalite hatalari giderilmeden yayinlanamaz", quality });
      if (quality.status === "warning" && !normalized.qualityOverrideReason?.trim()) return reply.status(409).send({ error: "Kalite uyarilari icin gerekceli yayin izni zorunludur", quality });
    }
    const slotError = await slotValidationError(normalized);
    if (slotError) return reply.status(400).send({ error: slotError });
    if (normalized.sourceType === "listing") {
      const listing = normalized.listingId ? await getListingCreative(normalized.listingId) : null;
      if (!listing || listing.status !== "approved" || listing.isSuspicious) return reply.status(400).send({ error: "Yalnizca onayli ve guvenli ilan secilebilir" });
    }
    const conflicts = await findLayoutConflicts(normalized);
    if (conflicts.length) return reply.status(409).send({ error: "Secilen reklam satiri bu tarih/cihaz araliginda dolu", conflicts });
    const id = await createBanner(normalized);
    if (parsed.data.targets) await replaceBannerTargets(id, parsed.data.targets);
    const row = await getBannerById(id);
    await recordAdAudit({
      entityType: "banner", entityId: id, action: "created", actorUserId: getAuthUserId(req),
      afterData: auditSnapshot(row),
      reason: normalized.qualityOverrideReason ?? normalized.paymentOverrideReason ?? null,
      isFinancial: Number(normalized.totalAmount ?? 0) > 0,
    });
    return reply.status(201).send({ data: row });
  });

  app.patch<{ Params: { id: string } }>("/banners/:id", async (req, reply) => {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return reply.status(400).send({ error: "Gecersiz id" });
    const parsed = patchSchema.safeParse(req.body ?? {});
    if (!parsed.success) return reply.status(400).send({ error: "Gecersiz alanlar", issues: parsed.error.issues });
    const current = await getBannerById(id);
    if (!current) return reply.status(404).send({ error: "Bulunamadi" });
    const currentTargets = (await listBannerTargets([id])).get(id) ?? [];
    const normalizedPatch = applyReservationPaymentWindow(normalizeBannerLifecycle(parsed.data));
    const invalidTargets = parsed.data.targets ? await validateBannerTargets(parsed.data.targets) : [];
    if (invalidTargets.length) return reply.status(400).send({ error: "Gecersiz reklam hedefi", invalidTargets });
    const merged = {
      ...current,
      ...normalizedPatch,
      targets: parsed.data.targets ?? currentTargets,
      isActive: normalizedPatch.isActive ?? Boolean(current.isActive),
      paymentOverride: normalizedPatch.paymentOverride ?? Boolean(current.paymentOverride),
      autoOptimize: normalizedPatch.autoOptimize ?? Boolean(current.autoOptimize),
      weeklyReportEnabled: normalizedPatch.weeklyReportEnabled ?? Boolean(current.weeklyReportEnabled),
    };
    const paymentError = bannerPaymentValidationError(merged);
    if (paymentError) return reply.status(409).send({ error: paymentError });
    if (merged.lifecycleStatus && liveStatuses.has(merged.lifecycleStatus)) {
      const quality = await creativeQualityReport(merged);
      if (quality.status === "error") return reply.status(409).send({ error: "Kritik kreatif kalite hatalari giderilmeden yayinlanamaz", quality });
      if (quality.status === "warning" && !merged.qualityOverrideReason?.trim()) return reply.status(409).send({ error: "Kalite uyarilari icin gerekceli yayin izni zorunludur", quality });
    }
    if (normalizedPatch.lifecycleStatus && normalizedPatch.lifecycleStatus !== current.lifecycleStatus && !canTransitionBannerLifecycle(current.lifecycleStatus, normalizedPatch.lifecycleStatus)) {
      return reply.status(409).send({ error: `${current.lifecycleStatus} durumundan ${normalizedPatch.lifecycleStatus} durumuna gecilemez` });
    }
    const slotError = await slotValidationError(merged);
    if (slotError) return reply.status(400).send({ error: slotError });
    if (merged.sourceType === "listing") {
      const listing = merged.listingId ? await getListingCreative(merged.listingId) : null;
      if (!listing || listing.status !== "approved" || listing.isSuspicious) return reply.status(400).send({ error: "Yalnizca onayli ve guvenli ilan secilebilir" });
    }
    const conflicts = await findLayoutConflicts(merged, id);
    if (conflicts.length) return reply.status(409).send({ error: "Secilen reklam satiri bu tarih/cihaz araliginda dolu", conflicts });
    const ok = await updateBanner(id, normalizedPatch);
    if (parsed.data.targets) await replaceBannerTargets(id, parsed.data.targets);
    if (!ok && !parsed.data.targets) return reply.status(400).send({ error: "Guncellenecek alan yok" });
    const row = await getBannerById(id);
    if (!row) return reply.status(404).send({ error: "Bulunamadi" });
    const financialKeys = ["totalAmount", "paymentStatus", "paymentOverride", "paymentDueAt", "invoiceNumber", "invoiceUrl", "contractFileUrl"];
    const lifecycleChanged = current.lifecycleStatus !== row.lifecycleStatus;
    await recordAdAudit({
      entityType: "banner", entityId: id,
      action: lifecycleChanged ? `lifecycle_${current.lifecycleStatus}_to_${row.lifecycleStatus}` : "updated",
      actorUserId: getAuthUserId(req),
      beforeData: auditSnapshot({ ...current, targets: currentTargets }),
      afterData: auditSnapshot({ ...row, targets: parsed.data.targets ?? currentTargets }),
      reason: normalizedPatch.cancellationReason ?? normalizedPatch.qualityOverrideReason ?? normalizedPatch.paymentOverrideReason ?? normalizedPatch.notes ?? null,
      isFinancial: financialKeys.some((key) => key in parsed.data),
    });
    return reply.send({ data: row });
  });

  app.delete<{ Params: { id: string } }>("/banners/:id", async (req, reply) => {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return reply.status(400).send({ error: "Gecersiz id" });
    const current = await getBannerById(id);
    if (!current) return reply.status(404).send({ error: "Bulunamadi" });
    await deleteBanner(id);
    await recordAdAudit({
      entityType: "banner", entityId: id, action: "deleted", actorUserId: getAuthUserId(req),
      beforeData: auditSnapshot(current), reason: current.cancellationReason ?? current.notes ?? null,
      isFinancial: Number(current.totalAmount) > 0,
    });
    return reply.send({ ok: true });
  });

  app.post<{ Params: { id: string } }>("/banners/:id/duplicate", async (req, reply) => {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return reply.status(400).send({ error: "Gecersiz id" });
    const row = await duplicateBanner(id);
    if (!row) return reply.status(404).send({ error: "Bulunamadi" });
    return reply.status(201).send({ data: row });
  });

  const waitlistSchema = z.object({
    position: positionSchema,
    title: z.string().trim().min(2).max(190),
    advertiser: z.string().trim().max(160).nullable().optional(),
    sourceType: sourceTypeSchema.optional(),
    listingId: z.coerce.number().int().positive().nullable().optional(),
    firmId: z.coerce.number().int().positive().nullable().optional(),
    device: deviceSchema.optional(),
    preferredStartAt: z.string().datetime().nullable().optional(),
    preferredEndAt: z.string().datetime().nullable().optional(),
    priority: z.coerce.number().int().min(0).max(100).optional(),
    notes: z.string().trim().max(500).nullable().optional(),
  });
  app.get("/banners-waitlist", async (_req, reply) => reply.send({ items: await listWaitlist() }));
  app.post("/banners-waitlist", async (req, reply) => {
    const parsed = waitlistSchema.safeParse(req.body ?? {});
    if (!parsed.success) return reply.status(400).send({ error: "Gecersiz bekleme listesi kaydi", issues: parsed.error.issues });
    return reply.status(201).send({ id: await createWaitlistItem(parsed.data) });
  });
  app.get("/banners-waitlist/suggestions", async (req, reply) => {
    const parsed = z.object({ at: z.string().date().optional() }).safeParse(req.query);
    if (!parsed.success) return reply.status(400).send({ error: "Gecersiz tarih" });
    const [waitlist, slots] = await Promise.all([listWaitlist(), listAdSlots()]);
    const slotMap = new Map(slots.map((slot) => [slot.slotKey, slot]));
    const cache = new Map<string, Awaited<ReturnType<typeof slotAvailability>>>();
    const suggestions = [];
    for (const item of waitlist.filter((entry) => entry.status === "waiting" || entry.status === "offered")) {
      const dateKey = item.preferredStartAt
        ? item.preferredStartAt.toISOString().slice(0, 10)
        : parsed.data.at ?? new Date().toISOString().slice(0, 10);
      let availability = cache.get(`${dateKey}:${item.device}`);
      if (!availability) {
        availability = await slotAvailability(new Date(`${dateKey}T00:00:00.000Z`), item.device, 365);
        cache.set(`${dateKey}:${item.device}`, availability);
      }
      const requested = availability.find((entry) => entry.slotKey === item.position);
      const requestedSlot = slotMap.get(item.position);
      const alternatives = availability
        .filter((entry) =>
          entry.slotKey !== item.position &&
          entry.available > 0 &&
          slotMap.get(entry.slotKey)?.isActive &&
          slotMap.get(entry.slotKey)?.pageType === requestedSlot?.pageType
        )
        .map((entry) => ({
          slotKey: entry.slotKey,
          label: slotMap.get(entry.slotKey)?.label ?? entry.slotKey,
          available: entry.available,
          nextAvailableAt: entry.nextAvailableAt,
        }));
      suggestions.push({
        ...item,
        requestedDate: dateKey,
        requestedAvailable: requested?.available ?? 0,
        requestedNextAvailableAt: requested?.nextAvailableAt ?? null,
        alternatives,
      });
    }
    return reply.send({ items: suggestions });
  });
  app.patch<{ Params: { id: string } }>("/banners-waitlist/:id", async (req, reply) => {
    const id = Number(req.params.id);
    const parsed = waitlistSchema.pick({ priority: true, notes: true }).extend({
      status: z.enum(["waiting", "offered", "converted", "cancelled"]).optional(),
    }).partial().safeParse(req.body ?? {});
    if (!Number.isFinite(id) || !parsed.success) return reply.status(400).send({ error: "Gecersiz bekleme listesi guncellemesi" });
    if (!(await updateWaitlistItem(id, parsed.data))) return reply.status(404).send({ error: "Kayit bulunamadi" });
    return reply.send({ ok: true });
  });
}
