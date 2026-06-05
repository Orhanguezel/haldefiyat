import type { FastifyReply, FastifyRequest } from "fastify";
import { getAuthUserId, handleRouteError, parsePage, sendNotFound } from "@agro/shared-backend/modules/_shared";
import {
  closeOwnerListing,
  countListings,
  createInquiry,
  createListing,
  deleteListing,
  featureListing,
  getListingById,
  getListingBySlug,
  incrementListingView,
  listingSummary,
  listInquiries,
  listListings,
  moderateListing,
  updateOwnerListing,
} from "./repo";
import {
  adminCreateSchema,
  featureSchema,
  inquirySchema,
  listingCreateSchema,
  listingPatchSchema,
  listingQuerySchema,
  moderateSchema,
} from "./validation";
import { readFeaturedPricing } from "./settings";
import { verifyOtpToken } from "./otp";
import { notifyMatches, notifyAdminNewListing } from "./matching";
import { env } from "@/core/env";

function idParam(req: FastifyRequest<{ Params: { id: string } }>) {
  const id = Number(req.params.id);
  return Number.isFinite(id) && id > 0 ? id : 0;
}

function hidePhoneIfNeeded<T extends { hidePhone?: number | boolean; contactPhone?: string | null }>(item: T) {
  return item.hidePhone ? { ...item, contactPhone: null } : item;
}

export async function listPublicListings(req: FastifyRequest, reply: FastifyReply) {
  try {
    const parsed = listingQuerySchema.parse(req.query ?? {});
    const { limit, offset, page } = parsePage(parsed, { maxLimit: 100 });
    const filters = { ...parsed, publicOnly: true, limit, offset, type: parsed.type };
    const [items, total] = await Promise.all([listListings(filters), countListings(filters)]);
    return reply.send({ items: items.map(hidePhoneIfNeeded), meta: { total, limit, page } });
  } catch (err) {
    return handleRouteError(reply, req, err, "list_public_listings");
  }
}

export async function getPublicListing(req: FastifyRequest<{ Params: { slug: string } }>, reply: FastifyReply) {
  try {
    const item = await getListingBySlug(req.params.slug, true);
    if (!item) return sendNotFound(reply);
    await incrementListingView(item.id);
    return reply.send({ item: hidePhoneIfNeeded({ ...item, viewCount: item.viewCount + 1 }) });
  } catch (err) {
    return handleRouteError(reply, req, err, "get_public_listing");
  }
}

export async function createPublicInquiry(req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
  try {
    const id = idParam(req);
    if (!id || !(await getListingById(id))) return sendNotFound(reply);
    const parsed = inquirySchema.parse(req.body ?? {});
    const inquiryId = await createInquiry({ listingId: id, ...parsed });
    return reply.status(201).send({ ok: true, id: inquiryId });
  } catch (err) {
    return handleRouteError(reply, req, err, "create_listing_inquiry");
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

export async function createOwnerListing(req: FastifyRequest, reply: FastifyReply) {
  try {
    const userId = getAuthUserId(req);
    const parsed = listingCreateSchema.parse(req.body ?? {});
    const otpPhone = verifyOtpToken((req.body as { otpToken?: string } | undefined)?.otpToken);
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
