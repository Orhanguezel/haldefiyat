export const CALL_REQUEST_RETENTION_DAYS = 90;
export const OTP_AFTER_EXPIRY_RETENTION_DAYS = 1;

export function listingPrivacyRetentionCutoffs(now = new Date()) {
  return {
    callRequests: new Date(now.getTime() - CALL_REQUEST_RETENTION_DAYS * 86_400_000),
    otp: new Date(now.getTime() - OTP_AFTER_EXPIRY_RETENTION_DAYS * 86_400_000),
  };
}
