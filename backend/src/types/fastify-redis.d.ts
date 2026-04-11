/**
 * FastifyInstance.redis — opsiyonel Redis dekoratörü.
 * shared-backend/modules/health app.redis'e opsiyonel erişim yapar.
 * hal-fiyatlari Redis kullanmıyor; health check SKIP döner.
 */
import "fastify";
import type { Redis } from "ioredis";

declare module "fastify" {
  interface FastifyInstance {
    redis?: Redis;
  }
}
