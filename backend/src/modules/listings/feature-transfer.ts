import { randomUUID } from "node:crypto";
import { and, desc, eq, sql } from "drizzle-orm";
import { z } from "zod";
import type { FastifyInstance, FastifyRequest } from "fastify";
import { requireAuth } from "@agro/shared-backend/middleware/auth";
import { getAuthUserId, handleRouteError } from "@agro/shared-backend/modules/_shared";
import { orders } from "@agro/shared-backend/modules/orders/schema";
import { siteSettings } from "@agro/shared-backend/modules/siteSettings/schema";
import { db } from "@/db/client";
import { hfListings } from "./schema";
import { readFeaturedPricing } from "./settings";

const KIND = "listing_feature_transfer";
const BANK_KEY = "listing_feature_bank";
const bankSchema = z.object({ bankName: z.string().trim().min(2).max(120), accountHolder: z.string().trim().min(3).max(255), iban: z.string().transform(v => v.replace(/\s/g, "").toUpperCase()).refine(v => {
  if (!/^TR\d{24}$/.test(v)) return false;
  return BigInt(v.slice(4) + "2927" + v.slice(2,4)) % 97n === 1n;
}, "invalid_iban") });
const packageSchema = z.enum(["daily", "weekly", "monthly"]);
type Bank = z.infer<typeof bankSchema>;
type Notes = { kind: typeof KIND; listingId: number; title: string; package: string; days: number; bank: Bank; senderName?: string; transferDate?: string; note?: string; reportedAt?: string; reviewedBy?: string; reviewedAt?: string; reviewNote?: string; featuredUntil?: string };
const kindFilter = and(eq(orders.payment_method, "bank_transfer"), sql`JSON_UNQUOTE(JSON_EXTRACT(IF(JSON_VALID(${orders.notes}), ${orders.notes}, '{}'), '$.kind')) = ${KIND}`);
const listingFilter = (id: number) => sql`JSON_EXTRACT(IF(JSON_VALID(${orders.notes}), ${orders.notes}, '{}'), '$.listingId') = ${id}`;
function notes(row: typeof orders.$inferSelect): Notes { return JSON.parse(row.notes ?? "{}"); }
function dto(row: typeof orders.$inferSelect) {
  const n = notes(row);
  return { id: row.id, reference: row.payment_ref, amount: Number(row.total), status: row.payment_status, cancelled: row.status === "cancelled", createdAt: row.created_at, ...n };
}
function fail(message: string): never { throw Object.assign(new Error(message), { statusCode: 409 }); }
async function bankSettings(): Promise<Bank | null> {
  const [row] = await db.select().from(siteSettings).where(and(eq(siteSettings.key, BANK_KEY), eq(siteSettings.locale, "*"))).limit(1);
  try { const parsed = bankSchema.safeParse(JSON.parse(row?.value ?? "{}")); return parsed.success ? parsed.data : null; } catch { return null; }
}
export function featureEnd(listing: { status: string; validUntil: string | null; isFeatured: number; featuredUntil: Date | null }, days: number, now = new Date()) {
  if (listing.status !== "approved") fail("İlan önce yayın onayı almalıdır.");
  const start = listing.isFeatured && listing.featuredUntil && listing.featuredUntil > now ? listing.featuredUntil : now;
  const end = new Date(start.getTime() + days * 86400000);
  if (!listing.validUntil || end > new Date(`${listing.validUntil}T23:59:59.999Z`)) fail("İlanın son tarihi paket süresini karşılamıyor. Önce ilan süresini uzatın.");
  return end;
}
function route(handler: (req: FastifyRequest) => Promise<unknown>) {
  return async (req: FastifyRequest, reply: any) => {
    reply.header("Cache-Control", "no-store");
    try { return await handler(req); } catch (err: any) {
      if (err.statusCode === 409 || err.statusCode === 404) return reply.code(err.statusCode).send({ error: { message: err.message } });
      return handleRouteError(reply, req, err, "listing_feature_transfer");
    }
  };
}
function notFound(): never { throw Object.assign(new Error("Kayıt bulunamadı."), {statusCode:404}); }
function id(req: FastifyRequest) { return z.coerce.number().int().positive().parse((req.params as any).id); }

export function registerFeatureTransferPublic(app: FastifyInstance) {
  app.get("/listings/:id/feature-transfer", { onRequest: [requireAuth] }, route(async req => {
    const listingId = id(req); const userId = getAuthUserId(req);
    const [listing] = await db.select().from(hfListings).where(and(eq(hfListings.id, listingId), eq(hfListings.userId, userId))).limit(1);
    if (!listing) notFound();
    const [bank, pricing, rows] = await Promise.all([bankSettings(), readFeaturedPricing(), db.select().from(orders).where(and(kindFilter, listingFilter(listingId), eq(orders.dealer_id, userId))).orderBy(desc(orders.created_at)).limit(10)]);
    return { bank, pricing, items: rows.map(dto) };
  }));
  app.post("/listings/:id/feature-transfer", { onRequest: [requireAuth], config: {rateLimit:{max:20,timeWindow:"1 hour"}} }, route(async req => {
    const listingId = id(req); const userId = getAuthUserId(req);
    const selected = packageSchema.parse((req.body as any)?.package);
    const bank = await bankSettings(); const pricing = await readFeaturedPricing(); const pkg = pricing?.[selected];
    if (!bank || !pkg || !Number.isFinite(pkg.price) || pkg.price <= 0 || !Number.isInteger(pkg.days) || pkg.days < 1 || pkg.days > 365) fail("Ödeme bilgileri henüz hazır değil.");
    return db.transaction(async tx => {
      const [listing] = await tx.select().from(hfListings).where(and(eq(hfListings.id, listingId), eq(hfListings.userId, userId))).for("update");
      if (!listing) notFound();
      const [existing] = await tx.select().from(orders).where(and(kindFilter, listingFilter(listingId), eq(orders.dealer_id, userId), eq(orders.status,"pending"))).limit(1);
      if (existing) return dto(existing);
      featureEnd(listing, pkg.days);
      const orderId = randomUUID();
      const n: Notes = {kind:KIND, listingId, title:listing.title, package:selected, days:pkg.days, bank};
      await tx.insert(orders).values({id:orderId,dealer_id:userId,total:pkg.price.toFixed(2),status:"pending",payment_status:"unpaid",payment_method:"bank_transfer",payment_ref:`HF${orderId.replaceAll("-","")}`,notes:JSON.stringify(n)});
      const [row] = await tx.select().from(orders).where(eq(orders.id,orderId)); return dto(row);
    });
  }));
  app.post("/listings/feature-transfers/:orderId/report", {onRequest:[requireAuth]}, route(async req => {
    const orderId = z.string().uuid().parse((req.params as any).orderId);
    const body = z.object({action:z.enum(["report","cancel"]), senderName:z.string().trim().min(2).max(255).optional(),transferDate:z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),note:z.string().trim().max(500).optional()}).parse(req.body);
    if (body.action === "report" && !body.senderName) fail("Havaleyi gönderen kişinin adını yazın.");
    return db.transaction(async tx => {
      const [row] = await tx.select().from(orders).where(and(eq(orders.id,orderId),eq(orders.dealer_id,getAuthUserId(req)),kindFilter)).for("update");
      if (!row) notFound();
      if (row.status !== "pending" || row.payment_status !== "unpaid") return dto(row);
      const n = notes(row);
      if (body.action === "report") Object.assign(n,{senderName:body.senderName,transferDate:body.transferDate,note:body.note,reportedAt:new Date().toISOString()});
      await tx.update(orders).set({status:body.action === "cancel" ? "cancelled" : "pending",payment_status:body.action === "cancel" ? "failed" : "pending",notes:JSON.stringify(n)}).where(eq(orders.id,orderId));
      const [updated] = await tx.select().from(orders).where(eq(orders.id,orderId)); return dto(updated);
    });
  }));
}

export function registerFeatureTransferAdmin(app: FastifyInstance) {
  app.get("/listings/feature-bank",route(async () => ({bank:await bankSettings()})));
  app.put("/listings/feature-bank",route(async req => {
    const bank = bankSchema.parse(req.body);
    await db.insert(siteSettings).values({id:randomUUID(),key:BANK_KEY,locale:"*",value:JSON.stringify(bank)}).onDuplicateKeyUpdate({set:{value:JSON.stringify(bank)}});
    return {bank};
  }));
  app.get("/listings/feature-transfers",route(async () => ({items:(await db.select().from(orders).where(kindFilter).orderBy(desc(orders.created_at)).limit(200)).map(dto)})));
  app.post("/listings/feature-transfers/:orderId/review",route(async req => {
    const orderId = z.string().uuid().parse((req.params as any).orderId);
    const body = z.object({action:z.enum(["approve","reject"]),reviewNote:z.string().trim().min(3).max(500),paymentVerified:z.boolean().optional()}).parse(req.body);
    if (body.action === "approve" && !body.paymentVerified) fail("Banka hesabına gelen tutarı kontrol ettiğinizi onaylayın.");
    // Lock listing before order, matching checkout lock order. Approval is atomic and repeat-safe.
    const [initial] = await db.select().from(orders).where(and(eq(orders.id,orderId),kindFilter));
    if (!initial) notFound();
    return db.transaction(async tx => {
      const [listing] = await tx.select().from(hfListings).where(eq(hfListings.id,notes(initial).listingId)).for("update");
      const [row] = await tx.select().from(orders).where(and(eq(orders.id,orderId),kindFilter)).for("update");
      if (row.payment_status === "paid" || row.status === "cancelled") return dto(row);
      if (body.action === "approve" && row.payment_status !== "pending") fail("Önce üyenin ödeme bildirimi yapması gerekir.");
      const n = notes(row);
      if (body.action === "approve") {
        if (!listing || listing.userId !== row.dealer_id) fail("İlan veya ilan sahibi değişmiş. Talebi kontrol edin.");
        const end = featureEnd(listing,n.days);
        await tx.update(hfListings).set({isFeatured:1,featuredUntil:end}).where(eq(hfListings.id,listing.id));
        n.featuredUntil = end.toISOString();
      }
      Object.assign(n,{reviewedBy:getAuthUserId(req),reviewedAt:new Date().toISOString(),reviewNote:body.reviewNote});
      await tx.update(orders).set({status:body.action === "approve" ? "confirmed" : "cancelled",payment_status:body.action === "approve" ? "paid" : "failed",notes:JSON.stringify(n)}).where(eq(orders.id,orderId));
      const [updated] = await tx.select().from(orders).where(eq(orders.id,orderId)); return dto(updated);
    });
  }));
}
