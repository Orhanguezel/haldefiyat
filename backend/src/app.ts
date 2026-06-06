import cors from "@fastify/cors";
import jwt from "@fastify/jwt";
import cookie from "@fastify/cookie";
import multipart from "@fastify/multipart";
import rateLimit from "@fastify/rate-limit";
import fastifyStatic from "@fastify/static";
import type { FastifyInstance } from "fastify";

import authPlugin from "./plugins/authPlugin";
import mysqlPlugin from "@/plugins/mysql";
import sentryPlugin from "@/plugins/sentry";
import swaggerPlugin from "@/plugins/swagger";
import { env } from "@/core/env";
import { registerErrorHandlers } from "@agro/shared-backend/core/error";
import { loggerConfig } from "@agro/shared-backend/core/logger";
import { getStorageSettings } from "@agro/shared-backend/modules/siteSettings";
import { auditRequestLoggerPlugin } from "@/plugins/auditRequestLogger";
import { registerAllRoutes } from "./routes";
import { parseCorsOrigins, pickUploadsRoot, pickUploadsPrefix } from "./app.helpers";

export async function createApp() {
  const { default: buildFastify } =
    (await import("fastify")) as unknown as { default: typeof import("fastify").default };

  const app = buildFastify({ logger: loggerConfig, bodyLimit: 10 * 1024 * 1024 }) as FastifyInstance;

  await app.register(cors, {
    origin: parseCorsOrigins(env.CORS_ORIGIN),
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "Prefer",
      "Accept",
      "Accept-Language",
      "x-skip-auth",
      "Range",
    ],
    exposedHeaders: [
      "x-total-count",
      "content-range",
      "range",
      "X-RateLimit-Limit",
      "X-RateLimit-Remaining",
      "X-RateLimit-Reset",
      "X-RateLimit-Tier",
    ],
  });

  await app.register(cookie, {
    secret: env.COOKIE_SECRET,
    hook: "onRequest",
    parseOptions: {
      httpOnly: true,
      path: "/",
      sameSite: "lax",
      secure: env.NODE_ENV === "production",
    },
  });

  await app.register(jwt, {
    secret: env.JWT_SECRET,
    cookie: { cookieName: "access_token", signed: false },
  });

  await app.register(rateLimit, {
    max: 600,
    timeWindow: "1 minute",
    // Localhost (Next.js SSG + gelistirme) rate-limit'ten muaf
    allowList: ["127.0.0.1", "::1", "::ffff:127.0.0.1"],
  });

  await app.register(authPlugin);
  await app.register(mysqlPlugin);
  await app.register(sentryPlugin);
  await app.register(swaggerPlugin);

  await app.register(multipart, {
    throwFileSizeLimit: true,
    limits: { fileSize: 10 * 1024 * 1024 },
  });

  let storageSettings: Awaited<ReturnType<typeof getStorageSettings>> | null = null;
  try {
    storageSettings = await getStorageSettings();
  } catch {
    /* ignore */
  }

  await app.register(fastifyStatic, {
    root: pickUploadsRoot(storageSettings?.localRoot),
    prefix: pickUploadsPrefix(storageSettings?.localBaseUrl),
    decorateReply: false,
  });

  app.addContentTypeParser(
    "application/x-www-form-urlencoded",
    { parseAs: "string" },
    (_req, body, done) => {
      try {
        done(null, Object.fromEntries(new URLSearchParams(body as string)));
      } catch {
        done(null, {});
      }
    },
  );

  await app.register(auditRequestLoggerPlugin);

  // X-API-Key header bazli rate limit (tier'a gore daily). Header yoksa default IP-rate-limit gecerli.
  const { apiKeyAuthHook } = await import("@/modules/api-keys/plugin");
  app.addHook("onRequest", apiKeyAuthHook);
  app.addHook("onRequest", async (_req, reply) => {
    reply.header("X-RateLimit-Limit", "600");
    reply.header("X-RateLimit-Remaining", "600");
    reply.header("X-RateLimit-Reset", "60");
  });
  app.addHook("onSend", async (req, reply, payload) => {
    if (reply.statusCode < 400 || payload == null) return payload;
    let body: unknown = payload;
    if (typeof payload === "string") {
      try { body = JSON.parse(payload); } catch { body = { error: { message: payload } }; }
    }
    const obj = typeof body === "object" && body !== null ? body as Record<string, unknown> : {};
    const rawError = obj.error;
    const errorObj: Record<string, unknown> = typeof rawError === "object" && rawError !== null
      ? rawError as Record<string, unknown>
      : { message: typeof rawError === "string" ? rawError : "Request failed" };
    const code = typeof errorObj.code === "string"
      ? errorObj.code
      : reply.statusCode === 401
        ? "UNAUTHORIZED"
        : reply.statusCode === 403
          ? "FORBIDDEN"
          : reply.statusCode === 404
            ? "NOT_FOUND"
            : reply.statusCode === 400
              ? "BAD_REQUEST"
              : "INTERNAL_SERVER_ERROR";
    const normalized = {
      error: {
        code,
        message: typeof errorObj.message === "string" ? errorObj.message : code,
        details: errorObj.details ?? obj.details ?? null,
        requestId: String(req.id),
      },
    };
    reply.header("Content-Type", "application/json; charset=utf-8");
    return JSON.stringify(normalized);
  });

  await registerAllRoutes(app);
  registerErrorHandlers(app);

  return app;
}
