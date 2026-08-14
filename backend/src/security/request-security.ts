import type { FastifyRequest } from "fastify";

const MUTATING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

function normalizedOrigin(value: string): string | null {
  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}

/** Bearer istekleri CSRF taşımaz; cookie-auth mutasyonları cross-site ise kapanır. */
export function isCrossSiteCookieMutation(input: {
  method: string;
  authorization?: string;
  accessCookie?: string;
  secFetchSite?: string;
  origin?: string;
  allowedOrigins: string[];
}): boolean {
  if (!MUTATING_METHODS.has(input.method.toUpperCase())) return false;
  if (input.authorization) return false;
  if (!input.accessCookie) return false;
  if (input.secFetchSite?.toLowerCase() === "cross-site") return true;
  if (!input.origin) return false;
  const origin = normalizedOrigin(input.origin);
  if (!origin) return true;
  const allowed = new Set(input.allowedOrigins.map(normalizedOrigin).filter((item): item is string => Boolean(item)));
  return !allowed.has(origin);
}

export function requestUsesPrivateIdentity(req: FastifyRequest): boolean {
  return Boolean(req.headers.authorization || req.cookies?.access_token);
}

