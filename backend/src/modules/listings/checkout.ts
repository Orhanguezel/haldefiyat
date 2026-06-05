import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import type { FastifyReply, FastifyRequest } from "fastify";
import { getAuthUserId, handleRouteError, sendNotFound } from "@agro/shared-backend/modules/_shared";
import { orders } from "@agro/shared-backend/modules/orders/schema";
import { createCheckoutForm, retrieveCheckoutForm, type IyzicoConfig } from "@agro/shared-backend/modules/payments";
import { env } from "@/core/env";
import { db } from "@/db/client";
import { getListingById, featureListing } from "./repo";
import { featureSchema } from "./validation";
import { readFeaturedPricing } from "./settings";

function iyzicoConfig(): IyzicoConfig {
  return { apiKey: env.IYZICO.apiKey, secretKey: env.IYZICO.secretKey, uri: env.IYZICO.baseUrl };
}

type FeatureNotes = { kind: "listing_feature"; listingId: number; package: string; days: number };

export async function featureCheckout(req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
  try {
    if (!env.FEATURE_IYZICO_PAYMENT || !env.IYZICO.apiKey || !env.IYZICO.secretKey) {
      return reply.status(503).send({ error: "payment_disabled" });
    }
    const userId = getAuthUserId(req);
    const id = Number(req.params.id);
    const listing = Number.isFinite(id) ? await getListingById(id) : null;
    if (!listing || listing.userId !== userId) return sendNotFound(reply);

    const body = featureSchema.parse(req.body ?? {});
    const pricing = await readFeaturedPricing();
    const days = { daily: 1, weekly: 7, monthly: 30 }[body.package];
    const price = Number(pricing?.[body.package]?.price ?? 0);
    if (price <= 0) return reply.status(409).send({ error: "pricing_not_set" });

    const orderId = randomUUID();
    const amount = price.toFixed(2);
    const notes: FeatureNotes = { kind: "listing_feature", listingId: id, package: body.package, days };
    await db.insert(orders).values({
      id: orderId,
      dealer_id: userId,
      status: "pending",
      total: amount,
      notes: JSON.stringify(notes),
      payment_method: "iyzico",
      payment_status: "unpaid",
      payment_ref: orderId,
    });

    const callbackUrl = `${env.PUBLIC_URL.replace(/\/$/, "")}/api/v1/listings/feature/callback?order=${orderId}`;
    const form = await createCheckoutForm(iyzicoConfig(), {
      locale: "tr",
      conversationId: orderId,
      price: amount,
      paidPrice: amount,
      currency: "TRY",
      basketId: orderId,
      paymentGroup: "PRODUCT",
      callbackUrl,
      enabledInstallments: [1],
      buyer: {
        id: userId,
        name: listing.contactName || "Ilan",
        surname: "Sahibi",
        email: env.SMTP_FROM,
        identityNumber: "11111111111",
        registrationAddress: listing.citySlug || "Turkiye",
        city: listing.citySlug || "Istanbul",
        country: "Turkey",
      },
      shippingAddress: { contactName: listing.contactName || "Ilan Sahibi", city: listing.citySlug || "Istanbul", country: "Turkey", address: listing.citySlug || "Turkiye" },
      billingAddress: { contactName: listing.contactName || "Ilan Sahibi", city: listing.citySlug || "Istanbul", country: "Turkey", address: listing.citySlug || "Turkiye" },
      basketItems: [{ id: String(id), name: `Ilan one cikarma (${body.package})`, category1: "Listing", itemType: "VIRTUAL", price: amount }],
    });

    if (form.status !== "success" || !form.token) {
      await db.update(orders).set({ status: "cancelled", payment_status: "failed" }).where(eq(orders.id, orderId));
      return reply.status(502).send({ error: "iyzico_init_failed", detail: form.errorMessage });
    }
    return reply.status(201).send({ orderId, token: form.token, checkoutFormContent: form.checkoutFormContent });
  } catch (err) {
    return handleRouteError(reply, req, err, "listing_feature_checkout");
  }
}

export async function featureCallback(req: FastifyRequest<{ Querystring: { order?: string }; Body: { token?: string } }>, reply: FastifyReply) {
  const resultUrl = `${env.FRONTEND_URL.replace(/\/$/, "")}/hesabim/ilanlarim`;
  try {
    const orderId = req.query.order;
    const token = (req.body as { token?: string } | null)?.token;
    if (!orderId || !token) return reply.redirect(`${resultUrl}?payment=failed`);

    const [order] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
    if (!order || order.payment_status === "paid") return reply.redirect(`${resultUrl}?payment=failed`);

    const detail = await retrieveCheckoutForm(iyzicoConfig(), token, orderId);
    if (detail.status !== "success" || detail.paymentStatus !== "SUCCESS") {
      await db.update(orders).set({ status: "cancelled", payment_status: "failed" }).where(eq(orders.id, orderId));
      return reply.redirect(`${resultUrl}?payment=failed`);
    }

    const notes = JSON.parse(order.notes ?? "{}") as Partial<FeatureNotes>;
    if (notes.kind === "listing_feature" && notes.listingId && notes.days) {
      await featureListing(notes.listingId, notes.days);
    }
    await db.update(orders).set({ status: "confirmed", payment_status: "paid" }).where(eq(orders.id, orderId));
    return reply.redirect(`${resultUrl}?payment=success`);
  } catch (err) {
    return handleRouteError(reply, req, err, "listing_feature_callback");
  }
}
