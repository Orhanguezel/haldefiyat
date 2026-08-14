import { and, inArray, lt } from "drizzle-orm";
import { db } from "@/db/client";
import { hfListingCallRequests, hfPhoneVerifications } from "./schema";
import { listingPrivacyRetentionCutoffs } from "./retention-policy";

/**
 * Arama talebi is sonucu metadatasini 90 gun, OTP kaydini sona ermesinden sonra en
 * fazla bir gun tutar. Aktif pending/notified/accepted talepler bu temizlikte silinmez.
 */
export async function purgeListingPersonalData(now = new Date()) {
  const cutoffs = listingPrivacyRetentionCutoffs(now);
  const calls = await db.delete(hfListingCallRequests).where(and(
    inArray(hfListingCallRequests.status, ["declined", "expired", "cancelled", "completed"]),
    lt(hfListingCallRequests.updatedAt, cutoffs.callRequests),
  ));
  const otp = await db.delete(hfPhoneVerifications).where(
    lt(hfPhoneVerifications.expiresAt, cutoffs.otp),
  );
  return {
    callRequestsDeleted: Number(calls[0]?.affectedRows ?? 0),
    otpDeleted: Number(otp[0]?.affectedRows ?? 0),
  };
}
