import type { FastifyInstance } from "fastify";
import { requireAuth } from "@agro/shared-backend/middleware/auth";
import {
  closeListing,
  createAdminListing,
  createOwnerListing,
  createPublicInquiry,
  createPublicCallRequest,
  deleteAdminListing,
  featureAdminListing,
  getPublicListing,
  getMyCallRequestContactSummary,
  listAdminInquiries,
  listAdminListings,
  listMyListings,
  listMyCallRequests,
  listPublicListings,
  moderateAdminListing,
  patchOwnerListing,
  patchMyCallRequest,
  patchMyListingCallSettings,
  updateAdminListing,
  unfeatureAdminListing,
  getMyListingOffers,
} from "./controller";
import { featureCallback, featureCheckout } from "./checkout";
import { getListingAnalytics } from "./analytics";
import { listingBoard, sendListingOtp, verifyListingOtp } from "./phase12.controller";
import { getFeaturedPricing, updateFeaturedPricing } from "./pricing";

export async function registerListingsPublic(app: FastifyInstance) {
  app.get("/listings", listPublicListings);
  app.get("/listings/board", listingBoard);
  app.post("/listings/otp/send", {
    onRequest: [requireAuth],
    config: { rateLimit: { max: 10, timeWindow: "1 hour" } },
  }, sendListingOtp);
  app.post("/listings/otp/verify", {
    onRequest: [requireAuth],
    config: { rateLimit: { max: 20, timeWindow: "1 hour" } },
  }, verifyListingOtp);
  app.get("/listings/me", { onRequest: [requireAuth] }, listMyListings);
  app.get("/listings/call-requests/me", { onRequest: [requireAuth] }, listMyCallRequests);
  app.get("/listings/call-requests/contact-summary", { onRequest: [requireAuth] }, getMyCallRequestContactSummary);
  app.patch<{ Params: { id: string } }>("/listings/call-requests/:id", { onRequest: [requireAuth] }, patchMyCallRequest);
  app.get("/listings/:slug", getPublicListing);
  app.post("/listings", { onRequest: [requireAuth] }, createOwnerListing);
  app.post("/listings/:id/inquiry", createPublicInquiry);
  app.post<{ Params: { id: string } }>("/listings/:id/call-requests", {
    onRequest: [requireAuth],
    config: {
      // Buyer/listing/seller quotas live in the repository. This short IP
      // window catches bursts without persisting raw IP addresses.
      rateLimit: { max: 10, timeWindow: "1 hour" },
    },
  }, createPublicCallRequest);
  app.post("/listings/feature/callback", featureCallback);
  app.patch<{ Params: { id: string } }>("/listings/:id", { onRequest: [requireAuth] }, patchOwnerListing);
  app.patch<{ Params: { id: string } }>("/listings/:id/call-settings", { onRequest: [requireAuth] }, patchMyListingCallSettings);
  // Ihale sahibinin kendi tekliflerini gormesi — kapali zarf kuralina tabi
  app.get<{ Params: { id: string } }>("/listings/:id/offers", { onRequest: [requireAuth] }, getMyListingOffers);
  app.post<{ Params: { id: string } }>("/listings/:id/close", { onRequest: [requireAuth] }, closeListing);
  app.post<{ Params: { id: string } }>("/listings/:id/feature-checkout", { onRequest: [requireAuth] }, featureCheckout);
}

export async function registerListingsAdmin(app: FastifyInstance) {
  app.get("/listings/featured-pricing", getFeaturedPricing);
  app.put("/listings/featured-pricing", updateFeaturedPricing);
  app.get("/listings", listAdminListings);
  app.post("/listings", createAdminListing);
  app.get("/listings/inquiries", listAdminInquiries);
  app.get("/listings/analytics", getListingAnalytics);
  app.patch<{ Params: { id: string } }>("/listings/:id", updateAdminListing);
  app.patch<{ Params: { id: string } }>("/listings/:id/moderate", moderateAdminListing);
  app.patch<{ Params: { id: string } }>("/listings/:id/feature", featureAdminListing);
  app.delete<{ Params: { id: string } }>("/listings/:id/feature", unfeatureAdminListing);
  app.delete<{ Params: { id: string } }>("/listings/:id", deleteAdminListing);
}
