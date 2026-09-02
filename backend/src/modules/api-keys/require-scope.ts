/**
 * API anahtariyla YAZMA erisimi.
 *
 * Tasarim karari: anahtar, JWT'nin yerine gecmez. `requireAuth` degistirilmedi;
 * bunun yerine yazma yapan rota ACIKCA bu kapiyi kullanir. Boylece:
 *   - Anahtarin yanlislikla tum auth'lu uclari acmasi IMKANSIZ (yeni bir uc
 *     eklendiginde varsayilan olarak anahtara kapalidir).
 *   - Hangi uclarin anahtarla yazilabildigi tek bakista gorulur.
 *
 * Kimlik anahtarin SAHIBIDIR: API'den acilan ilan, anahtar sahibinin ilanidir.
 */

import type { FastifyRequest, FastifyReply } from "fastify";
import { requireAuth } from "@agro/shared-backend/middleware/auth";
import type { ApiScope } from "./scopes";

export interface ApiKeyContext {
  id: number;
  userId: string;
  tier: string;
  scopes: string[];
}

export function apiKeyContext(req: FastifyRequest): ApiKeyContext | null {
  return (req as FastifyRequest & { apiKey?: ApiKeyContext }).apiKey ?? null;
}

/**
 * Rotanin JWT veya yetkili anahtar kabul etmesini saglar.
 * JWT varsa dokunmaz (mevcut davranis). Yoksa anahtara bakar.
 * Ikisi de yoksa 401, anahtar var ama yetki yoksa 403 doner — bu ayrim onemli:
 * entegrasyon gelistiricisi "yanlis anahtar" ile "eksik yetki"yi ayirt edebilmeli.
 */
export function requireAuthOrApiScope(scope: ApiScope) {
  return async function guard(req: FastifyRequest, reply: FastifyReply): Promise<void> {
    // Oturum bilgisi VARSA once o denenir ve requireAuth'un davranisi aynen
    // korunur (gecersiz token 401 firlatir — sessizce anahtara dusmez, aksi
    // halde suresi dolmus bir oturum fark edilmeden anahtar yetkisine gecerdi).
    const hasBearer = typeof req.headers.authorization === "string"
      && req.headers.authorization.startsWith("Bearer ");
    const cookies = (req as FastifyRequest & { cookies?: Record<string, string> }).cookies ?? {};
    const hasCookie = Boolean(cookies.access_token || cookies.accessToken);
    if (hasBearer || hasCookie) {
      await requireAuth(req, reply);
      return;
    }

    const key = apiKeyContext(req);
    if (!key) {
      return reply.status(401).send({
        error: { code: "auth_required", message: "Giriş yapın veya X-API-Key başlığı gönderin." },
      }) as unknown as void;
    }
    if (!key.scopes.includes(scope)) {
      return reply.status(403).send({
        error: {
          code: "scope_required",
          message: `Bu işlem için anahtarınızda '${scope}' yetkisi gerekiyor. Yetki talebi için iletişime geçin.`,
        },
      }) as unknown as void;
    }
  };
}

/** Istegi yapan kullanici — JWT varsa o, yoksa anahtarin sahibi. */
export function resolveActorId(req: FastifyRequest): string | null {
  const jwtUser = (req as FastifyRequest & { user?: { id?: string; sub?: string } }).user;
  if (jwtUser?.id) return jwtUser.id;
  if (jwtUser?.sub) return jwtUser.sub;
  return apiKeyContext(req)?.userId ?? null;
}
