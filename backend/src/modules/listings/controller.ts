import type { FastifyReply, FastifyRequest } from "fastify";
import { getAuthUserId, handleRouteError, parsePage, sendNotFound } from "@agro/shared-backend/modules/_shared";
import {
  closeOwnerListing,
  countListings,
  createCallRequest,
  createInquiry,
  createListing,
  deleteListing,
  featureListing,
  unfeatureListing,
  getListingById,
  getListingBySlug,
  getCallRequestContactSummary,
  incrementListingView,
  listingSummary,
  listInquiries,
  listListings,
  listCallRequestsForUser,
  markCallRequestNotified,
  moderateListing,
  updateListingAdmin,
  updateOwnerListing,
  updateCallRequestStatus,
} from "./repo";
import {
  adminCreateSchema,
  featureSchema,
  inquirySchema,
  callRequestSchema,
  callRequestStatusSchema,
  listingCreateSchema,
  listingPatchSchema,
  listingQuerySchema,
  moderateSchema,
} from "./validation";
import { readFeaturedPricing } from "./settings";
import { verifyOtpToken } from "./otp";
import { notifyMatches, notifyAdminNewListing } from "./matching";
import { telegramSendRaw } from "@agro/shared-backend/modules/telegram/helpers/telegram.notifier";
import { env } from "@/core/env";
import { parseCallAvailability, redactContactText, toPublicListing } from "./public";
import { hasVerifiedCallRequestIdentity } from "./call-request-auth";

function idParam(req: FastifyRequest<{ Params: { id: string } }>) {
  const id = Number(req.params.id);
  return Number.isFinite(id) && id > 0 ? id : 0;
}

export async function listPublicListings(req: FastifyRequest, reply: FastifyReply) {
  try {
    const parsed = listingQuerySchema.parse(req.query ?? {});
    const { limit, offset, page } = parsePage(parsed, { maxLimit: 100 });
    const filters = { ...parsed, publicOnly: true, limit, offset, type: parsed.type };
    const [items, total] = await Promise.all([listListings(filters), countListings(filters)]);
    return reply.send({ items: items.map(toPublicListing), meta: { total, limit, page } });
  } catch (err) {
    return handleRouteError(reply, req, err, "list_public_listings");
  }
}

export async function getPublicListing(req: FastifyRequest<{ Params: { slug: string } }>, reply: FastifyReply) {
  try {
    const item = await getListingBySlug(req.params.slug, true);
    if (!item) return sendNotFound(reply);
    await incrementListingView(item.id);
    return reply.send({ item: toPublicListing({ ...item, viewCount: item.viewCount + 1 }) });
  } catch (err) {
    return handleRouteError(reply, req, err, "get_public_listing");
  }
}

export async function createPublicInquiry(req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
  try {
    const id = idParam(req);
    const listing = id ? await getListingById(id) : null;
    if (!listing) return sendNotFound(reply);
    const parsed = inquirySchema.parse(req.body ?? {});
    const inquiryId = await createInquiry({ listingId: id, ...parsed });
    if (env.TELEGRAM_ADMIN_CHAT_ID) {
      const text =
        `💬 Yeni ilan mesajı\nİlan: ${listing.title}\nAd: ${parsed.name} · Tel: ${parsed.phone}\n` +
        (parsed.offerPrice != null ? `Teklif: ${parsed.offerPrice}\n` : "") +
        `Mesaj: ${parsed.message}`;
      void telegramSendRaw({ chatId: env.TELEGRAM_ADMIN_CHAT_ID, text }).catch(() => {});
    }
    return reply.status(201).send({ ok: true, id: inquiryId });
  } catch (err) {
    return handleRouteError(reply, req, err, "create_listing_inquiry");
  }
}

export async function createPublicCallRequest(req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
  try {
    const id = idParam(req);
    const listing = id ? await getListingById(id) : null;
    if (!listing || listing.status !== "approved") return sendNotFound(reply);
    if (!listing.callRequestsEnabled) {
      return reply.code(409).send({ error: { message: "call_requests_disabled" } });
    }
    const buyerUserId = getAuthUserId(req);
    if (listing.userId && listing.userId === buyerUserId) {
      return reply.code(400).send({ error: { message: "own_listing" } });
    }
    const parsed = callRequestSchema.parse(req.body ?? {});
    const contactSummary = await getCallRequestContactSummary(buyerUserId);
    const otpIdentity = verifyOtpToken(parsed.otpToken);
    const otpPhone = otpIdentity?.userId === buyerUserId ? otpIdentity.phone : null;
    if (!hasVerifiedCallRequestIdentity({ accountVerified: contactSummary.accountVerified, otpPhone })) {
      return reply.code(403).send({ error: { message: "account_verification_required" } });
    }
    if (!parseCallAvailability(listing.callAvailability).includes(parsed.preferredSlot)) {
      return reply.code(409).send({ error: { message: "slot_unavailable" } });
    }
    const safeNote = redactContactText(parsed.note)?.trim() || null;
    const result = await createCallRequest({
      listingId: id,
      buyerUserId,
      sellerUserId: listing.userId,
      preferredSlot: parsed.preferredSlot,
      note: safeNote,
    });
    if (!result.ok) {
      const status = result.reason === "duplicate" ? 409 : 429;
      return reply.code(status).send({ error: { message: result.reason } });
    }

    if (env.TELEGRAM_ADMIN_CHAT_ID) {
      const slotLabels = { asap: "En kısa sürede", morning: "09:00–12:00", afternoon: "12:00–17:00", evening: "17:00–20:00" };
      const text = [
        "📞 Yeni arama talebi",
        `İlan: ${listing.title}`,
        `Uygun zaman: ${slotLabels[parsed.preferredSlot]}`,
        safeNote ? `Not: ${safeNote}` : null,
        `Talep no: ${result.id}`,
      ].filter(Boolean).join("\n");
      const notified = await telegramSendRaw({ chatId: env.TELEGRAM_ADMIN_CHAT_ID, text }).then(() => true).catch(() => false);
      if (notified) await markCallRequestNotified(result.id);
    }
    return reply.code(201).send({ ok: true, id: result.id, status: "pending" });
  } catch (err) {
    return handleRouteError(reply, req, err, "create_listing_call_request");
  }
}

export async function listMyListings(req: FastifyRequest, reply: FastifyReply) {
  try {
    const userId = getAuthUserId(req);
    const items = await listListings({ userId, status: "all", limit: 100, offset: 0 });
    return reply.send({ items });
  } catch (err) {
    return handleRouteError(reply, req, err, "list_my_listings");
  }
}

export async function listMyCallRequests(req: FastifyRequest, reply: FastifyReply) {
  try {
    const userId = getAuthUserId(req);
    const items = await listCallRequestsForUser(userId);
    return reply.send({
      items: items.map((item) => ({
        ...item,
        role: item.sellerUserId === userId ? "seller" : "buyer",
        buyerUserId: undefined,
        sellerUserId: undefined,
      })),
    });
  } catch (err) {
    return handleRouteError(reply, req, err, "list_my_call_requests");
  }
}

export async function getMyCallRequestContactSummary(req: FastifyRequest, reply: FastifyReply) {
  try {
    return reply.send(await getCallRequestContactSummary(getAuthUserId(req)));
  } catch (err) {
    return handleRouteError(reply, req, err, "get_call_request_contact_summary");
  }
}

export async function patchMyCallRequest(
  req: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply,
) {
  try {
    const parsed = callRequestStatusSchema.parse(req.body ?? {});
    const affected = await updateCallRequestStatus(idParam(req), getAuthUserId(req), parsed.status);
    if (!affected) return reply.code(409).send({ error: { message: "invalid_transition" } });
    return reply.send({ ok: true, status: parsed.status });
  } catch (err) {
    return handleRouteError(reply, req, err, "patch_my_call_request");
  }
}

export async function createOwnerListing(req: FastifyRequest, reply: FastifyReply) {
  try {
    const userId = getAuthUserId(req);
    const parsed = listingCreateSchema.parse(req.body ?? {});
    const otpIdentity = verifyOtpToken((req.body as { otpToken?: string } | undefined)?.otpToken);
    const otpPhone = otpIdentity?.userId === userId ? otpIdentity.phone : null;
    // Telefon OTP zorunlulugu config'den (varsayilan kapali). Acilirsa dogrulanmamis telefon reddedilir.
    if (env.LISTING_REQUIRE_PHONE_OTP && !otpPhone) {
      return reply.status(400).send({ error: { message: "Telefon doğrulaması gerekli. Lütfen SMS kodunu doğrulayın." } });
    }
    const item = await createListing({ ...parsed, contactPhone: otpPhone ?? parsed.contactPhone }, userId, {
      source: "user",
      phoneVerified: otpPhone ? 1 : 0,
    });
    if (item) void notifyAdminNewListing(item);
    return reply.status(201).send({ item });
  } catch (err) {
    return handleRouteError(reply, req, err, "create_owner_listing");
  }
}

export async function patchOwnerListing(req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
  try {
    const id = idParam(req);
    const item = id ? await updateOwnerListing(id, getAuthUserId(req), listingPatchSchema.parse(req.body ?? {})) : null;
    if (!item) return sendNotFound(reply);
    return reply.send({ item });
  } catch (err) {
    return handleRouteError(reply, req, err, "patch_owner_listing");
  }
}

export async function closeListing(req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
  try {
    const affected = await closeOwnerListing(idParam(req), getAuthUserId(req));
    if (!affected) return sendNotFound(reply);
    return reply.send({ ok: true });
  } catch (err) {
    return handleRouteError(reply, req, err, "close_listing");
  }
}

export async function listAdminListings(req: FastifyRequest, reply: FastifyReply) {
  try {
    const parsed = listingQuerySchema.parse(req.query ?? {});
    const { limit, offset, page } = parsePage(parsed, { maxLimit: 100 });
    const [items, total, summary] = await Promise.all([
      listListings({ ...parsed, limit, offset }),
      countListings({ type: parsed.type, product: parsed.product, city: parsed.city, district: parsed.district, status: parsed.status }),
      listingSummary(),
    ]);
    return reply.send({ items, meta: { total, limit, page }, summary });
  } catch (err) {
    return handleRouteError(reply, req, err, "list_admin_listings");
  }
}

export async function createAdminListing(req: FastifyRequest, reply: FastifyReply) {
  try {
    const item = await createListing(adminCreateSchema.parse(req.body ?? {}), null, {
      source: "assisted",
      createdBy: getAuthUserId(req),
      status: (req.body as { status?: "pending" | "approved" | "rejected" } | null)?.status ?? "pending",
    });
    return reply.status(201).send({ item });
  } catch (err) {
    return handleRouteError(reply, req, err, "create_admin_listing");
  }
}

export async function moderateAdminListing(req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
  try {
    const body = moderateSchema.parse(req.body ?? {});
    const item = await moderateListing(idParam(req), body.status, body.moderationNote);
    if (!item) return sendNotFound(reply);
    if (body.status === "approved") void notifyMatches(item);
    return reply.send({ item });
  } catch (err) {
    return handleRouteError(reply, req, err, "moderate_listing");
  }
}

export async function updateAdminListing(req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
  try {
    const id = idParam(req);
    const item = id ? await updateListingAdmin(id, listingPatchSchema.parse(req.body ?? {})) : null;
    if (!item) return sendNotFound(reply);
    return reply.send({ item });
  } catch (err) {
    return handleRouteError(reply, req, err, "update_admin_listing");
  }
}

export async function featureAdminListing(req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
  try {
    const body = featureSchema.parse(req.body ?? {});
    const days = { daily: 1, weekly: 7, monthly: 30 }[body.package];
    const pricing = await readFeaturedPricing();
    const item = await featureListing(idParam(req), days);
    if (!item) return sendNotFound(reply);
    return reply.send({ item, pricing });
  } catch (err) {
    return handleRouteError(reply, req, err, "feature_listing");
  }
}

export async function unfeatureAdminListing(req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
  try {
    const item = await unfeatureListing(idParam(req));
    if (!item) return sendNotFound(reply);
    return reply.send({ item });
  } catch (err) {
    return handleRouteError(reply, req, err, "unfeature_listing");
  }
}

export async function listAdminInquiries(req: FastifyRequest, reply: FastifyReply) {
  try {
    return reply.send({ items: await listInquiries() });
  } catch (err) {
    return handleRouteError(reply, req, err, "list_listing_inquiries");
  }
}

export async function deleteAdminListing(req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
  try {
    if (!(await deleteListing(idParam(req)))) return sendNotFound(reply);
    return reply.send({ ok: true });
  } catch (err) {
    return handleRouteError(reply, req, err, "delete_listing");
  }
}
