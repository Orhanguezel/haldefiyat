import { createHmac, randomInt, timingSafeEqual } from "node:crypto";
import { and, desc, eq, gte, isNull, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { env } from "@/core/env";
import { hfPhoneVerifications } from "./schema";
import { sendListingOtpSms } from "./sms";

const TTL_MS = 5 * 60_000;
const TOKEN_TTL_MS = 15 * 60_000;

export function normalizeTrPhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");
  const local = digits.startsWith("90") ? digits.slice(2) : digits.startsWith("0") ? digits.slice(1) : digits;
  return local.length === 10 && local.startsWith("5") ? `+90${local}` : null;
}

function otpDigest(phone: string, code: string) {
  return createHmac("sha256", env.JWT_SECRET).update(`${phone}:${code}`).digest("base64url").slice(0, 8);
}

function sign(payload: string) {
  return createHmac("sha256", env.JWT_SECRET).update(payload).digest("base64url");
}

export function makeOtpToken(phone: string) {
  const exp = Date.now() + TOKEN_TTL_MS;
  const payload = Buffer.from(JSON.stringify({ phone, exp })).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

export function verifyOtpToken(token?: string | null): string | null {
  if (!token) return null;
  const [payload, sig] = token.split(".");
  if (!payload || !sig || sig !== sign(payload)) return null;
  const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as { phone?: string; exp?: number };
  return data.phone && data.exp && data.exp > Date.now() ? data.phone : null;
}

export async function sendOtp(rawPhone: string) {
  const phone = normalizeTrPhone(rawPhone);
  if (!phone) return { ok: false as const, code: 400, error: "invalid_phone" };
  const [recent] = await db.select().from(hfPhoneVerifications)
    .where(and(eq(hfPhoneVerifications.phone, phone), eq(hfPhoneVerifications.purpose, "listing")))
    .orderBy(desc(hfPhoneVerifications.createdAt)).limit(1);
  if (recent?.createdAt && Date.now() - new Date(recent.createdAt).getTime() < 60_000) {
    return { ok: false as const, code: 429, error: "rate_limited" };
  }
  const [day] = await db.select({ count: sql<number>`count(*)` }).from(hfPhoneVerifications)
    .where(and(eq(hfPhoneVerifications.phone, phone), gte(hfPhoneVerifications.createdAt, sql`DATE_SUB(NOW(), INTERVAL 1 DAY)`)));
  if (Number(day?.count ?? 0) >= 5) return { ok: false as const, code: 429, error: "daily_limit" };
  const code = String(randomInt(100000, 999999));
  await db.insert(hfPhoneVerifications).values({
    phone, code: otpDigest(phone, code), purpose: "listing", expiresAt: new Date(Date.now() + TTL_MS),
  });
  await sendListingOtpSms(phone, code);
  return { ok: true as const, phone };
}

export async function verifyOtp(rawPhone: string, code: string) {
  const phone = normalizeTrPhone(rawPhone);
  if (!phone || !/^\d{6}$/.test(code)) return { ok: false as const, code: 400, error: "invalid_code" };
  const [row] = await db.select().from(hfPhoneVerifications).where(and(
    eq(hfPhoneVerifications.phone, phone),
    eq(hfPhoneVerifications.purpose, "listing"),
    isNull(hfPhoneVerifications.verifiedAt),
    gte(hfPhoneVerifications.expiresAt, sql`CURRENT_TIMESTAMP(3)`),
  )).orderBy(desc(hfPhoneVerifications.createdAt)).limit(1);
  if (!row || row.attempts >= 5) return { ok: false as const, code: 429, error: "locked_or_expired" };
  const got = Buffer.from(row.code);
  const expected = Buffer.from(otpDigest(phone, code));
  if (got.length !== expected.length || !timingSafeEqual(got, expected)) {
    await db.update(hfPhoneVerifications).set({ attempts: row.attempts + 1 }).where(eq(hfPhoneVerifications.id, row.id));
    return { ok: false as const, code: 400, error: "invalid_code" };
  }
  await db.update(hfPhoneVerifications).set({ verifiedAt: new Date() }).where(eq(hfPhoneVerifications.id, row.id));
  return { ok: true as const, token: makeOtpToken(phone), phone };
}

