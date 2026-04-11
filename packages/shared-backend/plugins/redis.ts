import fp from 'fastify-plugin';
import Redis from 'ioredis';
import { env } from '../core/env';

let redisClient: Redis | null = null;

export function getRedisClient() {
  return redisClient;
}

export default fp(async (app) => {
  const url = env.REDIS_URL;
  if (!url) {
    app.log.warn('REDIS_URL not set, skipping Redis');
    return;
  }

  const client = new Redis(url);
  redisClient = client;
  app.decorate('redis', client);

  const pong = await client.ping().catch(() => 'FAIL');
  app.log.info({ redisOk: pong === 'PONG' }, 'Redis connected');

  app.addHook('onClose', async () => {
    await client.quit();
    redisClient = null;
  });
});
