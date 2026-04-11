// src/modules/mail/helpers/controller.ts
import type { FastifyRequest } from "fastify";

export function getAuthUserEmail(req: FastifyRequest): string | undefined {
  const user = (req as FastifyRequest & { user?: unknown }).user;

  if (!user || typeof user !== "object" || Array.isArray(user)) {
    return undefined;
  }

  const record = user as Record<string, unknown>;
  return record.email != null ? String(record.email) : undefined;
}

export function resolveTestMailRecipient(req: FastifyRequest, body: { to?: string }): string | undefined {
  if (body.to && body.to.length > 0) {
    return body.to;
  }

  return getAuthUserEmail(req);
}
