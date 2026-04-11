import type { MySql2Database } from 'drizzle-orm/mysql2';
import type Redis from 'ioredis';

declare module 'fastify' {
  interface FastifyInstance {
    db: MySql2Database<Record<string, never>>;
    redis: Redis;
    mysql: { pool: unknown };
  }
  interface FastifyContextConfig {
    rateLimit?: unknown;
    public?: boolean;
  }
}
