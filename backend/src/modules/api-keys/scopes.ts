/**
 * API anahtari yetkileri.
 *
 * Anahtar VARSAYILAN OLARAK yalnizca okur. Yazma yetkisi acikca verilir; boylece
 * sizan bir anahtarin en kotu sonucu veri okunmasidir, musteri adina islem
 * yapilmasi degil. Yetkiler ayri tabloda (hf_api_key_scopes) tutulur.
 */

import { pool } from "@/db/client";
import type { RowDataPacket, ResultSetHeader } from "mysql2";

/** Tanimli yetkiler — bu listenin disindaki bir deger kabul edilmez. */
export const API_SCOPES = ["listings:write"] as const;
export type ApiScope = (typeof API_SCOPES)[number];

export function isApiScope(value: string): value is ApiScope {
  return (API_SCOPES as readonly string[]).includes(value);
}

interface ScopeRow extends RowDataPacket { scope: string }

export async function keyScopes(apiKeyId: number): Promise<string[]> {
  const [rows] = await pool.query<ScopeRow[]>(
    "SELECT scope FROM hf_api_key_scopes WHERE api_key_id = ?",
    [apiKeyId],
  );
  return rows.map((row) => row.scope);
}

export async function grantScope(apiKeyId: number, scope: ApiScope, grantedBy: string | null): Promise<void> {
  await pool.query(
    "INSERT IGNORE INTO hf_api_key_scopes (api_key_id, scope, granted_by) VALUES (?, ?, ?)",
    [apiKeyId, scope, grantedBy],
  );
}

export async function revokeScope(apiKeyId: number, scope: string): Promise<void> {
  await pool.query("DELETE FROM hf_api_key_scopes WHERE api_key_id = ? AND scope = ?", [apiKeyId, scope]);
}

/**
 * Idempotens: ayni anahtar + ayni Idempotency-Key ikinci kez geldiginde ILK
 * olusturulan kaydin kimligini doner. ERP entegrasyonlari basarisiz istegi
 * tekrar dener; bu olmadan ayni ihale iki kez acilir ve komisyoncular hangisine
 * teklif verecegini bilemez.
 *
 * Yaris kosulunda (ayni anda iki istek) UNIQUE anahtar ikincisini dusurur ve
 * kayitli deger okunur — yani "once yaz, sonra oku" sirasi bilincli.
 */
export async function rememberIdempotent(
  apiKeyId: number,
  idempotencyKey: string,
  endpoint: string,
  resourceId: string,
): Promise<{ stored: boolean; existingId: string | null }> {
  const [result] = await pool.query<ResultSetHeader>(
    "INSERT IGNORE INTO hf_api_idempotency (api_key_id, idempotency_key, endpoint, resource_id) VALUES (?, ?, ?, ?)",
    [apiKeyId, idempotencyKey, endpoint, resourceId],
  );
  if (result.affectedRows > 0) return { stored: true, existingId: null };
  return { stored: false, existingId: await lookupIdempotent(apiKeyId, idempotencyKey) };
}

export async function lookupIdempotent(apiKeyId: number, idempotencyKey: string): Promise<string | null> {
  const [rows] = await pool.query<(RowDataPacket & { resource_id: string })[]>(
    "SELECT resource_id FROM hf_api_idempotency WHERE api_key_id = ? AND idempotency_key = ? LIMIT 1",
    [apiKeyId, idempotencyKey],
  );
  return rows[0]?.resource_id ?? null;
}
