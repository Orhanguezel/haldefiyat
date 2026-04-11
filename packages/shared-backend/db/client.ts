import { drizzle } from 'drizzle-orm/mysql2';
import type { MySql2Database } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';

let _db: MySql2Database<Record<string, never>> | null = null;
let _pool: mysql.Pool | null = null;
export const pool: mysql.Pool = new Proxy({} as mysql.Pool, {
  get(_target, prop) {
    return (getPool() as any)[prop];
  },
});

export function getPool(): mysql.Pool {
  if (!_pool) {
    _pool = mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      port: Number(process.env.DB_PORT) || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || '',
      connectionLimit: 10,
      timezone: 'Z',
    });
  }
  return _pool;
}

export const db: MySql2Database<Record<string, never>> = new Proxy({} as MySql2Database<Record<string, never>>, {
  get(_target, prop) {
    if (!_db) {
      _db = drizzle(getPool());
    }
    return (_db as any)[prop];
  },
});
