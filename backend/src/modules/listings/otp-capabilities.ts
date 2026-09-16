import { env } from "@/core/env";

export function listingOtpCapabilities() {
  const sms = env.SMS;
  const enabled = sms.provider === "netgsm"
    ? Boolean(sms.netgsm.usercode && sms.netgsm.password && sms.netgsm.msgheader)
    : sms.provider === "none" && env.NODE_ENV !== "production";
  return { enabled, required: env.LISTING_REQUIRE_PHONE_OTP };
}
