import fp from 'fastify-plugin';
import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import { env } from '../core/env';

export default fp(async (app) => {
  const pool = mysql.createPool({
    host: env.DB.host,
    port: env.DB.port,
    user: env.DB.user,
    password: env.DB.password,
    database: env.DB.name,
    connectionLimit: 10,
    timezone: 'Z',
    charset: 'utf8mb4_unicode_ci',
  });

  const db = drizzle(pool);
  app.decorate('db', db);

  const conn = await pool.getConnection();
  await conn.ping();
  conn.release();
  app.log.info('MySQL connected via Drizzle');

  app.addHook('onClose', async () => {
    await pool.end();
  });
});
