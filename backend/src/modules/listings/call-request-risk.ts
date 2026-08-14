import { createHmac, randomInt, timingSafeEqual } from "node:crypto";

const CHALLENGE_TTL_MS = 5 * 60_000;
const FAST_SUBMIT_MS = 1_200;

export type CallRequestRiskReason = "honeypot" | "too_fast" | "missing_user_agent";

export type CallRequestChallenge = {
  token: string;
  prompt: string;
  expiresAt: string;
};

type ChallengePayload = {
  userId: string;
  listingId: number;
  a: number;
  b: number;
  exp: number;
};

function sign(payload: string, secret: string) {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

export function assessCallRequestRisk(input: {
  honeypot?: string | null;
  formElapsedMs?: number;
  userAgent?: string | null;
}): CallRequestRiskReason | null {
  if (input.honeypot?.trim()) return "honeypot";
  if (input.formElapsedMs !== undefined && input.formElapsedMs < FAST_SUBMIT_MS) return "too_fast";
  if (!input.userAgent || input.userAgent.trim().length < 8) return "missing_user_agent";
  return null;
}

export function createCallRequestChallenge(
  userId: string,
  listingId: number,
  secret: string,
  now = Date.now(),
  operands: [number, number] = [randomInt(2, 10), randomInt(2, 10)],
): CallRequestChallenge {
  const [a, b] = operands;
  const data: ChallengePayload = { userId, listingId, a, b, exp: now + CHALLENGE_TTL_MS };
  const payload = Buffer.from(JSON.stringify(data)).toString("base64url");
  return {
    token: `${payload}.${sign(payload, secret)}`,
    prompt: `${a} + ${b} kaç eder?`,
    expiresAt: new Date(data.exp).toISOString(),
  };
}

export function verifyCallRequestChallenge(input: {
  token?: string | null;
  answer?: string | null;
  userId: string;
  listingId: number;
  secret: string;
  now?: number;
}): boolean {
  if (!input.token || input.token.length > 2048 || !input.answer) return false;
  const [payload, signature] = input.token.split(".");
  if (!payload || !signature) return false;

  const expected = Buffer.from(sign(payload, input.secret));
  const received = Buffer.from(signature);
  if (received.length !== expected.length || !timingSafeEqual(received, expected)) return false;

  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as Partial<ChallengePayload>;
    const now = input.now ?? Date.now();
    return data.userId === input.userId
      && data.listingId === input.listingId
      && typeof data.a === "number"
      && typeof data.b === "number"
      && typeof data.exp === "number"
      && data.exp > now
      && Number(input.answer) === data.a + data.b;
  } catch {
    return false;
  }
}
