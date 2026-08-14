import { createHmac, timingSafeEqual } from "node:crypto";

const TOKEN_TTL_MS = 15 * 60_000;

export type OtpIdentity = { phone: string; userId: string };

function sign(payload: string, secret: string) {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

export function createOtpIdentityToken(phone: string, userId: string, secret: string, now = Date.now()) {
  const payload = Buffer.from(JSON.stringify({ phone, userId, exp: now + TOKEN_TTL_MS })).toString("base64url");
  return `${payload}.${sign(payload, secret)}`;
}

export function readOtpIdentityToken(
  token: string | null | undefined,
  secret: string,
  now = Date.now(),
): OtpIdentity | null {
  if (!token || token.length > 2048) return null;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return null;
  const expected = Buffer.from(sign(payload, secret));
  const received = Buffer.from(sig);
  if (received.length !== expected.length || !timingSafeEqual(received, expected)) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as {
      phone?: string;
      userId?: string;
      exp?: number;
    };
    return data.phone && data.userId && data.exp && data.exp > now
      ? { phone: data.phone, userId: data.userId }
      : null;
  } catch {
    return null;
  }
}
