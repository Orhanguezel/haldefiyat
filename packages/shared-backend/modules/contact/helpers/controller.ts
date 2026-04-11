// src/modules/contact/helpers/controller.ts
import type { FastifyRequest } from "fastify";

type LocaleRequest = FastifyRequest & { locale?: string | null };
type SocketWithRemoteAddress = { remoteAddress?: string | null };
type ErrorLoggableRequest = FastifyRequest & {
  log?: {
    error?: (payload: { err: unknown }, message: string) => void;
  };
};

export function escapeContactHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function getContactRequestLocale(req: FastifyRequest): string | null {
  return (req as LocaleRequest).locale ?? null;
}

export function getContactRequestMeta(req: FastifyRequest) {
  const forwardedFor =
    typeof req.headers["x-forwarded-for"] === "string"
      ? req.headers["x-forwarded-for"]
      : null;
  const socket = req.socket as SocketWithRemoteAddress;
  const ip = forwardedFor?.split(",")[0]?.trim() || socket.remoteAddress || null;
  const userAgent = typeof req.headers["user-agent"] === "string"
    ? req.headers["user-agent"]
    : null;

  return { ip, userAgent };
}

export function logContactRequestError(req: FastifyRequest, err: unknown, message: string) {
  (req as ErrorLoggableRequest).log?.error?.({ err }, message);
}
