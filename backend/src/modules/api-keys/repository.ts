/**
 * API anahtar yonetimi — hf_api_keys tablosu icin CRUD + dogrulama + sayac.
 *
 * Anahtar formati: `hf_<32-hex>` (toplam 35 char). Ornek: hf_a1b2c3d4e5f6...7890
 * - keyPrefix: ilk 11 char (`hf_<8-hex>`) — kullaniciya gosterilir.
 * - keyHash: SHA-256(full key) — DB'de saklanir, ham key sadece olusturma anida donulur.
 */

import { createHash, randomBytes } from "crypto";
import { db } from "@/db/client";
import { hfApiKeys } from "@/db/schema";
import { and, eq, isNull, sql } from "drizzle-orm";
import { env } from "@/core/env";
import { users } from "@agro/shared-backend/modules/auth/schema";

const KEY_PREFIX = "hf_";

export interface ApiKeyRecord {
  id: number;
  userId: string;
  userEmail?: string | null;
  userFullName?: string | null;
  keyPrefix: string;
  name: string;
  tier: "free" | "pro";
  dailyLimit: number;
  usedToday: number;
  lastUsedAt: string | null;
  createdAt: string | null;
  revoked: boolean;
}

export interface IssuedApiKey extends ApiKeyRecord {
  // Ham anahtar — yalnizca olusturma anida doner; bir daha gosterilemez.
  rawKey: string;
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function generateRawKey(): { raw: string; hash: string; prefix: string } {
  const random = randomBytes(16).toString("hex"); // 32 hex char
  const raw = `${KEY_PREFIX}${random}`;
  const hash = createHash("sha256").update(raw).digest("hex");
  const prefix = raw.slice(0, 11); // hf_xxxxxxxx
  return { raw, hash, prefix };
}

function hashKey(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}

function toRecord(row: typeof hfApiKeys.$inferSelect): ApiKeyRecord {
  return {
    id:          row.id,
    userId:      row.userId,
    keyPrefix:   row.keyPrefix,
    name:        row.name,
    tier:        row.tier as "free" | "pro",
    dailyLimit:  row.dailyLimit,
    usedToday:   row.usedToday,
    lastUsedAt:  row.lastUsedAt instanceof Date ? row.lastUsedAt.toISOString() : row.lastUsedAt,
    createdAt:   row.createdAt instanceof Date ? row.createdAt.toISOString() : row.createdAt,
    revoked:     row.revokedAt != null,
  };
}

function toAdminRecord(
  row: typeof hfApiKeys.$inferSelect & { userEmail?: string | null; userFullName?: string | null },
): ApiKeyRecord {
  return {
    ...toRecord(row),
    userEmail:    row.userEmail ?? null,
    userFullName: row.userFullName ?? null,
  };
}

export async function listUserKeys(userId: string): Promise<ApiKeyRecord[]> {
  const rows = await db
    .select()
    .from(hfApiKeys)
    .where(eq(hfApiKeys.userId, userId));
  return rows.map(toRecord);
}

export async function issueKey(userId: string, name?: string): Promise<IssuedApiKey> {
  const existing = await db
    .select({ id: hfApiKeys.id })
    .from(hfApiKeys)
    .where(and(eq(hfApiKeys.userId, userId), isNull(hfApiKeys.revokedAt)));
  if (existing.length >= 3) {
    throw new Error("Maksimum 3 aktif API anahtarina sahip olabilirsiniz.");
  }

  const { raw, hash, prefix } = generateRawKey();
  await db.insert(hfApiKeys).values({
    userId,
    keyHash:           hash,
    keyPrefix:         prefix,
    name:              (name ?? "My API Key").slice(0, 128),
    tier:              "free",
    dailyLimit:        env.API_KEY_FREE_DAILY_LIMIT,
    usedToday:         0,
    usageWindowStart:  todayIso(),
  });

  const [row] = await db
    .select()
    .from(hfApiKeys)
    .where(eq(hfApiKeys.keyHash, hash))
    .limit(1);
  return { ...toRecord(row!), rawKey: raw };
}

export async function revokeKey(userId: string, keyId: number): Promise<void> {
  await db
    .update(hfApiKeys)
    .set({ revokedAt: new Date() })
    .where(and(eq(hfApiKeys.userId, userId), eq(hfApiKeys.id, keyId), isNull(hfApiKeys.revokedAt)));
}

export async function revokeKeyAdmin(keyId: number): Promise<void> {
  await db
    .update(hfApiKeys)
    .set({ revokedAt: new Date() })
    .where(and(eq(hfApiKeys.id, keyId), isNull(hfApiKeys.revokedAt)));
}

export interface KeyValidation {
  ok: boolean;
  reason?: "not_found" | "revoked" | "limit_exceeded";
  record?: ApiKeyRecord;
}

/**
 * Header'dan gelen ham anahtari dogrula + tier limitini kontrol et.
 * Basariliysa usedToday'i 1 arttir (atomic, optimistik).
 */
export async function validateAndConsume(rawKey: string): Promise<KeyValidation> {
  if (!rawKey.startsWith(KEY_PREFIX) || rawKey.length !== KEY_PREFIX.length + 32) {
    return { ok: false, reason: "not_found" };
  }
  const hash = hashKey(rawKey);
  const [row] = await db
    .select()
    .from(hfApiKeys)
    .where(eq(hfApiKeys.keyHash, hash))
    .limit(1);

  if (!row) return { ok: false, reason: "not_found" };
  if (row.revokedAt) return { ok: false, reason: "revoked", record: toRecord(row) };

  const today = todayIso();
  const isNewWindow = String(row.usageWindowStart).slice(0, 10) !== today;
  const currentUsed = isNewWindow ? 0 : row.usedToday;

  if (currentUsed >= row.dailyLimit) {
    return { ok: false, reason: "limit_exceeded", record: toRecord(row) };
  }

  // Atomic increment (window kaymasi varsa reset)
  await db
    .update(hfApiKeys)
    .set({
      usedToday:         sql`CASE WHEN ${hfApiKeys.usageWindowStart} = ${today} THEN ${hfApiKeys.usedToday} + 1 ELSE 1 END`,
      usageWindowStart:  today,
      lastUsedAt:        new Date(),
    })
    .where(eq(hfApiKeys.id, row.id));

  return { ok: true, record: { ...toRecord(row), usedToday: currentUsed + 1 } };
}

/**
 * Admin: free → pro yukseltme (manuel — odeme entegrasyonu sonraki sprint).
 */
export async function upgradeTier(keyId: number, tier: "free" | "pro"): Promise<void> {
  const newLimit = tier === "pro" ? env.API_KEY_PRO_DAILY_LIMIT : env.API_KEY_FREE_DAILY_LIMIT;
  await db
    .update(hfApiKeys)
    .set({ tier, dailyLimit: newLimit })
    .where(eq(hfApiKeys.id, keyId));
}

export async function listAllKeysAdmin(limit = 100): Promise<ApiKeyRecord[]> {
  const rows = await db
    .select({
      id:               hfApiKeys.id,
      userId:           hfApiKeys.userId,
      keyHash:          hfApiKeys.keyHash,
      keyPrefix:        hfApiKeys.keyPrefix,
      name:             hfApiKeys.name,
      tier:             hfApiKeys.tier,
      dailyLimit:       hfApiKeys.dailyLimit,
      usedToday:        hfApiKeys.usedToday,
      usageWindowStart: hfApiKeys.usageWindowStart,
      lastUsedAt:       hfApiKeys.lastUsedAt,
      createdAt:        hfApiKeys.createdAt,
      revokedAt:        hfApiKeys.revokedAt,
      userEmail:        users.email,
      userFullName:     users.full_name,
    })
    .from(hfApiKeys)
    .leftJoin(users, eq(hfApiKeys.userId, users.id))
    .limit(limit);
  return rows.map(toAdminRecord);
}
