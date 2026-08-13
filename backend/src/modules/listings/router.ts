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
  listAdminInquiries,
  listAdminListings,
  listMyListings,
  listPublicListings,
  moderateAdminListing,
  patchOwnerListing,
  updateAdminListing,
  unfeatureAdminListing,
} from "./controller";
import { featureCallback, featureCheckout } from "./checkout";
import { getListingAnalytics } from "./analytics";
import { listingBoard, sendListingOtp, verifyListingOtp } from "./phase12.controller";
import { getFeaturedPricing, updateFeaturedPricing } from "./pricing";

export async function registerListingsPublic(app: FastifyInstance) {
  app.get("/listings", listPublicListings);
  app.get("/listings/board", listingBoard);
  app.post("/listings/otp/send", sendListingOtp);
  app.post("/listings/otp/verify", verifyListingOtp);
  app.get("/listings/me", { onRequest: [requireAuth] }, listMyListings);
  app.get("/listings/:slug", getPublicListing);
  app.post("/listings", { onRequest: [requireAuth] }, createOwnerListing);
  app.post("/listings/:id/inquiry", createPublicInquiry);
  app.post<{ Params: { id: string } }>("/listings/:id/call-requests", { onRequest: [requireAuth] }, createPublicCallRequest);
  app.post("/listings/feature/callback", featureCallback);
  app.patch<{ Params: { id: string } }>("/listings/:id", { onRequest: [requireAuth] }, patchOwnerListing);
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
